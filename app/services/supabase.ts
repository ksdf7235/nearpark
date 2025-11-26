/**
 * Supabase 서비스 레이어
 * 
 * urban_parks 테이블에서 데이터를 조회하는 함수들을 제공합니다.
 */

import { supabase } from "../lib/supabase/client";
import type { UrbanParkDbRow } from "../types/urban_park";
import type { Place, PlaceCategory } from "../types/place";
import { calculateDistance } from "../lib/utils/distance";
import { compareAddresses } from "../lib/utils/address";

/**
 * 반경 내 공원 검색 옵션
 */
export interface SearchUrbanParksOptions {
  lat: number;
  lng: number;
  radius?: number; // 미터 단위, 기본값 2000m
  parkType?: string; // 공원구분 필터
  hasPlayground?: boolean;
  hasGym?: boolean;
  hasToilet?: boolean;
  hasParking?: boolean;
  limit?: number; // 최대 결과 수
}

/**
 * PostGIS를 사용하여 반경 내 공원을 검색합니다.
 * 
 * @param options - 검색 옵션
 * @returns 검색된 공원 배열 (거리순 정렬)
 */
export async function searchUrbanParks(
  options: SearchUrbanParksOptions
): Promise<Place[]> {
  const {
    lat,
    lng,
    radius = 2000,
    parkType,
    hasPlayground,
    hasGym,
    hasToilet,
    hasParking,
    limit = 50,
  } = options;

  let query = supabase
    .from("urban_parks")
    .select("*")
    .not("lat", "is", null)
    .not("lng", "is", null);

  // 공원구분 필터
  if (parkType) {
    query = query.eq("park_type", parkType);
  }

  // 시설 필터
  if (hasPlayground !== undefined) {
    query = query.eq("has_playground", hasPlayground);
  }
  if (hasGym !== undefined) {
    query = query.eq("has_gym", hasGym);
  }
  if (hasToilet !== undefined) {
    query = query.eq("has_toilet", hasToilet);
  }
  if (hasParking !== undefined) {
    query = query.eq("has_parking", hasParking);
  }

  // 모든 필터 조건을 적용한 후 클라이언트에서 거리 계산 및 필터링
  // PostGIS RPC 함수를 사용하려면 Supabase에서 함수를 생성해야 합니다.
  // 여기서는 일반 쿼리로 가져온 후 클라이언트에서 거리 계산

  const { data, error } = await query;

  if (error) {
    return [];
  }

  if (!data) {
    return [];
  }

  // 거리 계산 및 필터링
  const places: Place[] = data
    .map((row) => {
      if (!row.lat || !row.lng) return null;

      const distance = calculateDistance(lat, lng, row.lat, row.lng);

      if (distance > radius) {
        return null;
      }

      return convertUrbanParkToPlace(row, distance);
    })
    .filter((place): place is Place => place !== null)
    .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    .slice(0, limit);

  return places;
}

/**
 * UrbanParkDbRow를 Place 타입으로 변환
 */
function convertUrbanParkToPlace(
  row: UrbanParkDbRow,
  distance: number
): Place {
  return {
    id: row.id,
    name: row.name,
    lat: row.lat!,
    lng: row.lng!,
    address: row.road_address || row.jibun_address || "",
    distance,
    category: "park" as PlaceCategory,
    source: "public_data" as const,
    phone: row.phone || undefined,
    tags: buildTagsFromFacilities(row),
  };
}

/**
 * 시설 정보를 기반으로 태그 생성
 */
function buildTagsFromFacilities(row: UrbanParkDbRow): string[] {
  const tags: string[] = [];

  if (row.has_playground) tags.push("놀이시설");
  if (row.has_gym) tags.push("운동시설");
  if (row.has_toilet) tags.push("화장실");
  if (row.has_parking) tags.push("주차장");
  if (row.has_bench) tags.push("벤치");
  if (row.has_stage_or_culture) tags.push("문화시설");

  return tags;
}

/**
 * ID로 공원 조회
 */
export async function getUrbanParkById(id: string): Promise<Place | null> {
  const { data, error } = await supabase
    .from("urban_parks")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  if (!data.lat || !data.lng) {
    return null;
  }

  return convertUrbanParkToPlace(data, 0);
}

/**
 * 카카오 검색 결과와 매칭되는 urban_parks 데이터를 찾습니다.
 * 주소와 위치 기반으로 매칭합니다.
 * 
 * @param kakaoPlace - 카카오 검색 결과 Place
 * @param userLat - 사용자 위치 위도
 * @param userLng - 사용자 위치 경도
 * @returns 매칭된 urban_parks 데이터와 시설 정보, 없으면 null
 */
export async function findMatchingUrbanPark(
  kakaoPlace: Place,
  userLat: number,
  userLng: number
): Promise<{
  park: UrbanParkDbRow;
  facilities: {
    sports: string | null;
    play: string | null;
    convenience: string | null;
    culture: string | null;
    other: string | null;
  };
} | null> {
  // 1단계: 주소 기반 매칭 시도
  if (kakaoPlace.address) {
    // urban_parks 전체 조회 (주소 필터링은 클라이언트에서)
    const { data: allParks, error } = await supabase
      .from("urban_parks")
      .select("*")
      .not("lat", "is", null)
      .not("lng", "is", null);

    if (error) {
      return null;
    }

    if (allParks && allParks.length > 0) {
      // 주소 유사도로 매칭 시도
      const addressMatches = allParks
        .map((park) => {
          const parkAddress = park.road_address || park.jibun_address || "";
          if (!parkAddress) return null;

          const similarity = compareAddresses(kakaoPlace.address, parkAddress);
          
          return {
            park,
            similarity,
            distance: park.lat && park.lng && kakaoPlace.lat && kakaoPlace.lng
              ? calculateDistance(kakaoPlace.lat, kakaoPlace.lng, park.lat, park.lng)
              : Infinity,
          };
        })
        .filter((match): match is { park: UrbanParkDbRow; similarity: number; distance: number } => 
          match !== null && match.similarity > 0.5 // 50% 이상 유사도
        )
        .sort((a, b) => {
          // 유사도 우선, 같으면 거리순
          if (Math.abs(a.similarity - b.similarity) > 0.1) {
            return b.similarity - a.similarity;
          }
          return a.distance - b.distance;
        });

      if (addressMatches.length > 0) {
        const bestMatch = addressMatches[0];

        return {
          park: bestMatch.park,
          facilities: {
            sports: bestMatch.park.sports_facilities,
            play: bestMatch.park.play_facilities,
            convenience: bestMatch.park.convenience_facilities,
            culture: bestMatch.park.culture_facilities,
            other: bestMatch.park.other_facilities,
          },
        };
      }
    }
  }

  // 2단계: 좌표 기반 매칭 시도
  if (kakaoPlace.lat && kakaoPlace.lng) {
    const radius = 500; // 500m 반경 (주소 매칭 실패 시 더 넓게)
    const { data: allParks, error } = await supabase
      .from("urban_parks")
      .select("*")
      .not("lat", "is", null)
      .not("lng", "is", null);

    if (error) {
      return null;
    }

    if (!allParks || allParks.length === 0) {
      return null;
    }

    // 거리 계산 및 필터링
    const locationMatches = allParks
      .map((park) => {
        if (!park.lat || !park.lng) return null;

        const distance = calculateDistance(
          kakaoPlace.lat,
          kakaoPlace.lng,
          park.lat,
          park.lng
        );

        if (distance > radius) {
          return null;
        }

        return { park, distance };
      })
      .filter((match): match is { park: UrbanParkDbRow; distance: number } => match !== null)
      .sort((a, b) => a.distance - b.distance); // 거리순 정렬

    if (locationMatches.length > 0) {
      const bestMatch = locationMatches[0];

      return {
        park: bestMatch.park,
        facilities: {
          sports: bestMatch.park.sports_facilities,
          play: bestMatch.park.play_facilities,
          convenience: bestMatch.park.convenience_facilities,
          culture: bestMatch.park.culture_facilities,
          other: bestMatch.park.other_facilities,
        },
      };
    }
  }

  return null;
}

