/**
 * Kakao Local API 서비스 레이어
 *
 * Place 중심 아키텍처를 지원하는 범용 검색 함수 제공
 * category에 따라 적절한 검색어로 변환하여 Kakao Local API 호출
 */

import type { Place, PlaceCategory } from "../types/place";

/**
 * 카테고리별 검색어 매핑
 * 나중에 미술관/도서관/문화센터를 추가할 때 여기에만 추가하면 됨
 */
const CATEGORY_QUERY_MAP: Record<PlaceCategory, string> = {
  park: "공원",
  museum: "미술관",
  library: "도서관",
  cultural_center: "문화센터",
  etc: "",
};

interface KakaoLocalApiResponse {
  documents: Array<{
    id: string;
    place_name: string;
    x: string; // 경도
    y: string; // 위도
    address_name: string;
    road_address_name?: string;
    category_name?: string;
    phone?: string;
    place_url?: string;
    distance?: string;
  }>;
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
}

/**
 * 장소 상세 정보 인터페이스
 */
export interface PlaceDetail {
  id: string;
  name: string;
  address: string;
  roadAddress?: string;
  phone?: string;
  url?: string;
  category?: string;
  lat: number;
  lng: number;
}

/**
 * Kakao Local API를 사용하여 주변 장소를 검색합니다.
 *
 * @param category - 검색할 장소 카테고리
 * @param lat - 현재 위치 위도
 * @param lng - 현재 위치 경도
 * @param radius - 검색 반경 (미터 단위, 기본값 2000m)
 * @returns 검색된 장소 배열
 *
 * @example
 * const places = await searchPlaces("park", 37.5665, 126.9780);
 */
export async function searchPlaces(
  category: PlaceCategory,
  lat: number,
  lng: number,
  radius: number = 2000
): Promise<Place[]> {
  const apiKey = process.env.NEXT_PUBLIC_KAKAO_REST_KEY;

  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_KAKAO_REST_KEY가 설정되지 않았습니다.");
  }

  const query = CATEGORY_QUERY_MAP[category];

  if (!query) {
    console.warn(`카테고리 "${category}"에 대한 검색어가 정의되지 않았습니다.`);
    return [];
  }

  try {
    // Kakao Local API: 키워드로 장소 검색
    // https://developers.kakao.com/docs/latest/ko/local/dev-guide#search-by-keyword
    const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
    url.searchParams.set("query", query);
    url.searchParams.set("x", lng.toString()); // 경도
    url.searchParams.set("y", lat.toString()); // 위도
    url.searchParams.set("radius", radius.toString());

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `KakaoAK ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Kakao API 호출 실패: ${response.status}`);
    }

    const data: KakaoLocalApiResponse = await response.json();

    // Kakao API 응답을 Place 배열로 변환
    // 나중에 공공데이터(도서관, 문화센터 등)를 병합하려면
    // 이 레벨에서 Place 배열을 merge하면 됨
    return data.documents.map((doc) => {
      return {
        id: doc.id,
        name: doc.place_name,
        lat: parseFloat(doc.y),
        lng: parseFloat(doc.x),
        address: doc.address_name || doc.road_address_name || "",
        category: category,
        source: "kakao" as const,
        tags: doc.category_name ? doc.category_name.split(" > ") : [],
        phone: doc.phone,
        url: doc.place_url,
        // imageUrl은 클라이언트에서 API Route를 통해 동적으로 로드
        // /api/place-image?placeId={doc.id} 엔드포인트 사용
        imageUrl: undefined,
      };
    });
  } catch (error) {
    console.error("장소 검색 중 오류 발생:", error);
    throw error;
  }
}

/**
 * 장소 ID를 사용하여 카카오맵 썸네일 이미지 URL을 생성합니다.
 *
 * 카카오맵의 이미지 URL 패턴:
 * - 썸네일: https://img1.kakaocdn.net/cthumb/local/C1104x408.q100/?fname={이미지URL}
 * - 실제 이미지: http://t1.kakaocdn.net/fiy_reboot/place/{이미지ID}
 *
 * 장소 상세 페이지에서 이미지를 가져오기 위해 장소 ID를 사용합니다.
 *
 * @param placeId - 카카오맵 장소 ID
 * @returns 썸네일 이미지 URL (없으면 null)
 */
export async function getPlaceImageUrl(
  placeId: string
): Promise<string | null> {
  try {
    // 카카오맵 장소 상세 페이지 URL
    const placeUrl = `https://place.map.kakao.com/${placeId}`;

    // CORS 문제로 인해 직접 fetch는 불가능하므로,
    // 클라이언트 사이드에서 이미지 URL 패턴을 시도합니다.
    // 실제로는 Places API를 사용하거나 서버 사이드에서 크롤링해야 합니다.

    // 대안: 카카오맵 썸네일 이미지 URL 패턴 시도
    // 참고: https://place.map.kakao.com/{placeId} 페이지의 이미지 구조를 기반으로 함
    const thumbnailUrl = `https://img1.kakaocdn.net/cthumb/local/C1104x408.q100/?fname=http%3A%2F%2Ft1.kakaocdn.net%2Ffiy_reboot%2Fplace%2F${placeId}`;

    // 이미지 존재 여부 확인 (HEAD 요청)
    try {
      const response = await fetch(thumbnailUrl, {
        method: "HEAD",
        mode: "no-cors",
      });
      // no-cors 모드에서는 응답을 확인할 수 없지만, 브라우저에서 이미지 로드 시도
      return thumbnailUrl;
    } catch (e) {
      // 이미지가 없을 수 있음
      return null;
    }
  } catch (error) {
    console.warn(`장소 ${placeId}의 이미지 URL을 가져오는 중 오류:`, error);
    return null;
  }
}

// 거리 계산 함수는 app/lib/utils/distance.ts로 이동했습니다.
// 하위 호환성을 위해 re-export
export { calculateDistance } from "../lib/utils/distance";
