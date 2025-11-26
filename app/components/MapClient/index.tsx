"use client";

/**
 * 지도 클라이언트 컴포넌트
 *
 * 브라우저 전용 기능(Geolocation, Kakao Map SDK)을 사용하는 Client Component
 *
 * 주요 책임:
 * 1. Kakao Map SDK 로딩 대기
 * 2. 사용자 위치 획득 (Geolocation API)
 * 3. 지도 생성 및 표시
 * 4. 현재 위치 마커 표시
 * 5. 카테고리 변경 시 주변 장소 검색 및 마커 표시
 */
import { useEffect, useRef, useState, useCallback } from "react";
import useKakaoLoader from "../../hooks/useKakaoLoader";
import { searchPlaces } from "../../services/kakao";
import { findMatchingUrbanPark } from "../../services/supabase";
import { calculateDistance, formatDistance } from "../../lib/utils/distance";
import type { Place, PlaceCategory } from "../../types/place";
import { CATEGORY_LABELS } from "../../types/place";
import Roadview from "../Roadview";

interface MapClientProps {
  category: PlaceCategory;
  onPlacesChange: (places: Place[]) => void;
  selectedPlaceId?: string | null; // 선택된 장소 ID
}

interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number; // 위치 정확도 (미터)
}

export default function MapClient({
  category,
  onPlacesChange,
  selectedPlaceId,
}: MapClientProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null); // kakao.maps.Map
  const markersRef = useRef<any[]>([]); // kakao.maps.Marker[]
  const markersMapRef = useRef<Map<string, any>>(new Map()); // place.id -> marker Map
  const currentMarkerRef = useRef<any>(null); // kakao.maps.Marker
  const placesCacheRef = useRef<Map<string, Place[]>>(new Map()); // category -> places 캐시
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const kakaoLoaded = useKakaoLoader();

  // 카테고리별 아이콘 SVG 생성
  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case "park":
        return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
          <path d="M2 17L12 22L22 17"/>
          <path d="M2 12L12 17L22 12"/>
        </svg>`;
      case "museum":
        return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M9 3V21M15 3V21"/>
        </svg>`;
      case "library":
        return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20V20H6.5A2.5 2.5 0 0 1 4 17.5V4.5A2.5 2.5 0 0 1 6.5 2Z"/>
        </svg>`;
      default:
        return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6V12L16 14"/>
        </svg>`;
    }
  };

  // 카테고리별 그라데이션 색상
  const getCategoryGradient = (category: string): string => {
    switch (category) {
      case "park":
        return "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
      case "museum":
        return "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)";
      case "library":
        return "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)";
      case "cultural_center":
        return "linear-gradient(135deg, #fa709a 0%, #fee140 100%)";
      default:
        return "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    }
  };

  // 카카오맵 스타일의 상세 정보 HTML 생성 함수
  const createPlaceDetailContent = (place: Place, facilities?: {
    sports: string | null;
    play: string | null;
    convenience: string | null;
    culture: string | null;
    other: string | null;
  }): string => {
    const distanceText = place.distance ? formatDistance(place.distance) : "";

    // 카카오맵 URL 생성
    const kakaoMapUrl = place.url || `https://place.map.kakao.com/${place.id}`;

    // 카카오맵 이미지 URL
    // 이미지가 없으면 카테고리 아이콘과 그라데이션 배경을 표시합니다.
    const imageUrl = place.imageUrl;

    // 미리보기 이미지 영역 (이미지가 있으면 표시, 없으면 카테고리 아이콘)
    const hasImage = imageUrl && imageUrl.trim() !== "";
    const gradient = getCategoryGradient(place.category);
    const categoryIcon = getCategoryIcon(place.category);

    return `
      <div style="width:340px;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.15);overflow:hidden;">
        <!-- 미리보기 이미지 -->
        <div style="width:100%;height:180px;background:${gradient};position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;">
          ${
            hasImage
              ? `<img src="${imageUrl}" 
                   alt="${place.name}" 
                   style="width:100%;height:100%;object-fit:cover;"
                   onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
                   onload="this.nextElementSibling.style.display='none';"
                 />
                 <div style="display:none;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#fff;gap:8px;">
                   ${categoryIcon}
                   <span style="font-size:14px;font-weight:500;text-align:center;padding:0 16px;">${place.name}</span>
                 </div>`
              : `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#fff;gap:8px;">
                   ${categoryIcon}
                   <span style="font-size:14px;font-weight:500;text-align:center;padding:0 16px;">${place.name}</span>
                 </div>`
          }
        </div>
        
        <!-- 헤더 -->
        <div style="position:relative;padding:16px 16px 12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <h3 style="margin:0;font-size:18px;font-weight:700;color:#333;flex:1;">
              ${place.name}
            </h3>
            <a href="${kakaoMapUrl}" target="_blank" rel="noopener noreferrer" 
               style="display:inline-flex;align-items:center;color:#3182f6;text-decoration:none;font-size:12px;margin-left:8px;">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="margin-left:4px;">
                <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
          </div>
          
          <!-- 주소 -->
          <div style="font-size:13px;color:#666;line-height:1.5;margin-bottom:8px;">
            ${place.address}
          </div>
          
          <!-- 전화번호 -->
          ${
            place.phone
              ? `<div style="font-size:13px;color:#2db400;margin-bottom:8px;">
                  <a href="tel:${place.phone}" style="color:#2db400;text-decoration:none;">
                    ${place.phone}
                  </a>
                </div>`
              : ""
          }
          
          <!-- 거리 -->
          ${
            distanceText
              ? `<div style="font-size:12px;color:#3182f6;font-weight:500;margin-bottom:8px;">
                  거리: ${distanceText}
                </div>`
              : ""
          }
          
          <!-- 공원보유시설 -->
          ${
            facilities && (facilities.sports || facilities.play || facilities.convenience || facilities.culture || facilities.other)
              ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #f0f0f0;">
                  <div style="font-size:13px;font-weight:600;color:#333;margin-bottom:10px;display:flex;align-items:center;gap:4px;">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;">
                      <path d="M8 2L2 6L8 10L14 6L8 2Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                      <path d="M2 10L8 14L14 10" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    </svg>
                    공원보유시설
                  </div>
                  <div style="display:flex;flex-direction:column;gap:6px;">
                    ${
                      facilities.sports
                        ? `<div style="display:flex;align-items:flex-start;gap:8px;padding:8px;background:#f8f9fa;border-radius:6px;">
                            <div style="flex-shrink:0;width:60px;font-size:11px;font-weight:600;color:#3182f6;text-align:right;padding-top:2px;">운동시설</div>
                            <div style="flex:1;font-size:12px;color:#333;line-height:1.5;">${(facilities.sports || "").replace(/\+/g, ", ")}</div>
                          </div>`
                        : ""
                    }
                    ${
                      facilities.play
                        ? `<div style="display:flex;align-items:flex-start;gap:8px;padding:8px;background:#f8f9fa;border-radius:6px;">
                            <div style="flex-shrink:0;width:60px;font-size:11px;font-weight:600;color:#10b981;text-align:right;padding-top:2px;">유희시설</div>
                            <div style="flex:1;font-size:12px;color:#333;line-height:1.5;">${(facilities.play || "").replace(/\+/g, ", ")}</div>
                          </div>`
                        : ""
                    }
                    ${
                      facilities.convenience
                        ? `<div style="display:flex;align-items:flex-start;gap:8px;padding:8px;background:#f8f9fa;border-radius:6px;">
                            <div style="flex-shrink:0;width:60px;font-size:11px;font-weight:600;color:#f59e0b;text-align:right;padding-top:2px;">편익시설</div>
                            <div style="flex:1;font-size:12px;color:#333;line-height:1.5;">${(facilities.convenience || "").replace(/\+/g, ", ")}</div>
                          </div>`
                        : ""
                    }
                    ${
                      facilities.culture
                        ? `<div style="display:flex;align-items:flex-start;gap:8px;padding:8px;background:#f8f9fa;border-radius:6px;">
                            <div style="flex-shrink:0;width:60px;font-size:11px;font-weight:600;color:#8b5cf6;text-align:right;padding-top:2px;">교양시설</div>
                            <div style="flex:1;font-size:12px;color:#333;line-height:1.5;">${(facilities.culture || "").replace(/\+/g, ", ")}</div>
                          </div>`
                        : ""
                    }
                    ${
                      facilities.other
                        ? `<div style="display:flex;align-items:flex-start;gap:8px;padding:8px;background:#f8f9fa;border-radius:6px;">
                            <div style="flex-shrink:0;width:60px;font-size:11px;font-weight:600;color:#6b7280;text-align:right;padding-top:2px;">기타시설</div>
                            <div style="flex:1;font-size:12px;color:#333;line-height:1.5;">${(facilities.other || "").replace(/\+/g, ", ")}</div>
                          </div>`
                        : ""
                    }
                  </div>
                </div>`
              : ""
          }
          
          <!-- 링크 -->
          <div style="display:flex;gap:12px;margin-top:8px;padding-top:8px;border-top:1px solid #f0f0f0;">
            <a href="${kakaoMapUrl}" target="_blank" rel="noopener noreferrer" 
               style="font-size:12px;color:#666;text-decoration:none;">
              상세보기
            </a>
            <a href="https://map.kakao.com/link/to/${
              place.id
            }" target="_blank" rel="noopener noreferrer"
               style="font-size:12px;color:#666;text-decoration:none;">
              길찾기
            </a>
          </div>
          
          <!-- 로드뷰 버튼 -->
          <button onclick="window.showRoadviewAtPosition(${place.lat}, ${
      place.lng
    })" 
                  style="width:100%;margin-top:8px;padding:8px;background:#f0f0f0;border:none;border-radius:6px;cursor:pointer;font-size:12px;color:#333;display:flex;align-items:center;justify-content:center;gap:4px;">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L2 6L8 10L14 6L8 2Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
              <path d="M2 10L8 14L14 10" stroke="currentColor" stroke-width="1.5" fill="none"/>
            </svg>
            로드뷰
          </button>
        </div>
        
        <!-- 하단 버튼 영역 -->
        <div style="display:flex;border-top:1px solid #f0f0f0;background:#fafafa;">
          <button onclick="window.open('${kakaoMapUrl}', '_blank')" 
                  style="flex:1;padding:12px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;font-size:12px;color:#666;">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L9.5 6.5L14 8L9.5 9.5L8 14L6.5 9.5L2 8L6.5 6.5L8 2Z" fill="currentColor" opacity="0.3"/>
            </svg>
            저장
          </button>
          <button onclick="navigator.share ? navigator.share({title:'${
            place.name
          }',url:'${kakaoMapUrl}'}) : navigator.clipboard.writeText('${kakaoMapUrl}')" 
                  style="flex:1;padding:12px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;font-size:12px;color:#666;border-left:1px solid #f0f0f0;">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 8L8 4M12 8L8 12M12 8H4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            공유
          </button>
          <a href="https://map.kakao.com/link/to/${
            place.id
          }" target="_blank" rel="noopener noreferrer"
             style="flex:1;padding:12px;border:none;background:#3182f6;color:#fff;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:4px;font-size:12px;font-weight:500;border-left:1px solid #f0f0f0;">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L2 8L8 14M14 2L8 8L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            길찾기
          </a>
        </div>
      </div>
    `;
  };

  // SDK 로딩 실패 감지 (일정 시간 후에도 로드되지 않으면 에러 처리)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const timeout = setTimeout(() => {
      if (!kakaoLoaded && !window.kakao) {
        const apiKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
        if (!apiKey || apiKey === "your_kakao_javascript_key_here") {
          setSdkError(
            "Kakao Map SDK를 로드할 수 없습니다.\n\n" +
              "환경변수가 설정되지 않았습니다.\n" +
              ".env.local 파일에 NEXT_PUBLIC_KAKAO_JS_KEY를 추가해주세요."
          );
        } else {
          setSdkError(
            "Kakao Map SDK를 로드할 수 없습니다.\n\n" +
              "가능한 원인:\n" +
              "1. API 키가 잘못되었거나 만료됨\n" +
              "2. 카카오 개발자 콘솔에서 플랫폼 설정이 안 되어 있음\n" +
              "   → 플랫폼 설정 > Web 플랫폼에 http://localhost:3000 추가\n" +
              "3. 네트워크 연결 문제\n\n" +
              "브라우저 콘솔을 확인해주세요."
          );
        }
      }
    }, 10000); // 10초 후 타임아웃

    return () => clearTimeout(timeout);
  }, [kakaoLoaded]);

  // Cursor 브라우저용 임시 위치 (권한 문제 우회)
  const FALLBACK_LOCATION: UserLocation = {
    lat: 37.5881728,
    lng: 127.0775808,
    accuracy: 10,
  };

  // 사용자 위치 획득 (정확도 개선) - useEffect로 지속 모니터링
  useEffect(() => {
    if (!kakaoLoaded) return;

    // Cursor 브라우저에서 위치 권한이 없는 경우를 대비해 fallback 위치 사용
    if (!navigator.geolocation) {
      setUserLocation(FALLBACK_LOCATION);
      setLoading(false);
      return;
    }

    const targetAccuracy = 10; // 목표 정확도: 10m
    const maxAttempts = 20; // 최대 시도 횟수
    const maxWaitTime = 60000; // 최대 대기 시간: 60초

    let watchId: number | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let attempts = 0;
    let bestAccuracy = Infinity;
    let lastUpdateTime = Date.now();
    let noImprovementCount = 0; // 정확도 개선이 없는 연속 횟수

    const options: PositionOptions = {
      enableHighAccuracy: true, // GPS 사용
      timeout: 20000, // 20초
      maximumAge: 0, // 캐시 사용 안 함
    };

    const updateLocation = (
      latitude: number,
      longitude: number,
      accuracy: number
    ) => {
      // 더 정확한 위치 정보인 경우에만 업데이트
      if (accuracy < bestAccuracy) {
        bestAccuracy = accuracy;
        noImprovementCount = 0; // 개선되었으므로 카운터 리셋

        setUserLocation({
          lat: latitude,
          lng: longitude,
          accuracy: accuracy,
        });
        setLoading(false);

        // 지도가 이미 생성되어 있으면 중심점 업데이트
        if (mapRef.current && window.kakao) {
          const { kakao } = window;
          const newPosition = new kakao.maps.LatLng(latitude, longitude);
          mapRef.current.setCenter(newPosition);

          // 현재 위치 마커 업데이트
          if (currentMarkerRef.current) {
            currentMarkerRef.current.setPosition(newPosition);
          }
        }
      } else {
        // 정확도가 개선되지 않음
        noImprovementCount++;
      }

      lastUpdateTime = Date.now();
    };

    const handleSuccess = (position: GeolocationPosition) => {
      attempts++;
      const { latitude, longitude, accuracy } = position.coords;

      updateLocation(latitude, longitude, accuracy);

      // 정확도가 목표치에 도달했는지 확인
      const shouldStop =
        accuracy <= targetAccuracy ||
        attempts >= maxAttempts ||
        (noImprovementCount >= 5 && attempts >= 10); // 10회 이상 시도 후 5회 연속 개선 없으면 중지

      if (shouldStop) {
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
          watchId = null;
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        const finalAccuracy = Math.round(bestAccuracy);
      }
    };

    const handleError = (err: GeolocationPositionError) => {
      attempts++;

      let errorMessage = "위치 정보를 가져올 수 없습니다.";

      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage =
            "위치 정보 접근 권한이 거부되었습니다.\n" +
            "브라우저 설정에서 위치 정보 권한을 허용해주세요.";
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage =
            "위치 정보를 사용할 수 없습니다.\n" +
            "GPS 또는 네트워크 위치 서비스를 확인해주세요.";
          break;
        case err.TIMEOUT:
          // 타임아웃은 계속 시도 (watchPosition이 자동으로 재시도)
          return;
        default:
          errorMessage = `위치 정보 오류: ${err.message}`;
      }

      // 권한 거부인 경우 fallback 위치 사용
      if (err.code === err.PERMISSION_DENIED) {
        setUserLocation(FALLBACK_LOCATION);
        setLoading(false);

        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
          watchId = null;
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }
    };

    // 최대 대기 시간 설정
    timeoutId = setTimeout(() => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }

      if (bestAccuracy === Infinity) {
        // 위치를 가져오지 못한 경우 fallback 위치 사용
        setUserLocation(FALLBACK_LOCATION);
        setLoading(false);
      }
    }, maxWaitTime);

    // watchPosition을 사용하여 지속적으로 위치 업데이트
    // 정확도가 개선되면 자동으로 업데이트됨
    watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );

    // cleanup
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [kakaoLoaded]);

  // 지도 초기화
  useEffect(() => {
    if (!kakaoLoaded || !userLocation || !mapContainerRef.current) return;
    if (mapRef.current) return; // 이미 지도가 생성되어 있으면 스킵
    if (typeof window === "undefined" || !window.kakao || !window.kakao.maps)
      return;

    const { kakao } = window;

    // 지도 생성
    const mapOption = {
      center: new kakao.maps.LatLng(userLocation.lat, userLocation.lng),
      level: 5, // 확대 레벨 (1~14, 숫자가 작을수록 확대)
    };

    const map = new kakao.maps.Map(mapContainerRef.current, mapOption);
    mapRef.current = map;

    // 현재 위치 마커 생성
    const currentPosition = new kakao.maps.LatLng(
      userLocation.lat,
      userLocation.lng
    );
    const currentMarker = new kakao.maps.Marker({
      position: currentPosition,
      map: map,
    });

    // 현재 위치 마커 커스텀 이미지 (선택사항)
    // const imageSrc = '/current-location.png';
    // const imageSize = new kakao.maps.Size(24, 24);
    // const imageOption = { offset: new kakao.maps.Point(12, 12) };
    // const currentImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
    // currentMarker.setImage(currentImage);

    currentMarkerRef.current = currentMarker;

    // 현재 위치에 인포윈도우 표시 (정확도 정보 포함)
    const accuracyText = userLocation.accuracy
      ? `정확도: ${Math.round(userLocation.accuracy)}m`
      : "";
    const infoWindow = new kakao.maps.InfoWindow({
      content: `<div style="padding:5px;">
        <div style="font-weight:bold;">현재 위치</div>
        ${
          accuracyText
            ? `<div style="font-size:11px;color:#666;margin-top:2px;">${accuracyText}</div>`
            : ""
        }
      </div>`,
    });
    infoWindow.open(map, currentMarker);
  }, [kakaoLoaded, userLocation]);

  // 마커 생성 헬퍼 함수
  const createMarkersFromPlaces = (
    placesWithDistance: Place[],
    userLocation: UserLocation,
    kakao: any
  ) => {
    // 기존 마커 제거
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current = [];
    markersMapRef.current.clear();

    // 마커 생성
    const bounds = new kakao.maps.LatLngBounds();
    bounds.extend(new kakao.maps.LatLng(userLocation.lat, userLocation.lng));

    placesWithDistance.forEach((place) => {
      const position = new kakao.maps.LatLng(place.lat, place.lng);
      bounds.extend(position);

      const marker = new kakao.maps.Marker({
        position: position,
        map: mapRef.current,
      });

      // 호버 시 간단한 이름만 표시
      const hoverInfoWindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:5px;font-weight:bold;">${place.name}</div>`,
      });

      // 클릭 시 상세 정보 표시
      const detailInfoWindow = new kakao.maps.InfoWindow({
        content: createPlaceDetailContent(place, place.facilities),
        removable: true, // 닫기 버튼 표시
      });

      // 마커에 상세 정보창 참조 저장
      (marker as any).detailInfoWindow = detailInfoWindow;
      (marker as any).detailInfoOpen = false;

      // 마우스오버 시 간단한 정보 표시
      kakao.maps.event.addListener(marker, "mouseover", () => {
        // 클릭된 상세 정보창이 열려있지 않을 때만 호버 정보 표시
        if (!(marker as any).detailInfoOpen) {
          hoverInfoWindow.open(mapRef.current, marker);
        }
      });

      kakao.maps.event.addListener(marker, "mouseout", () => {
        hoverInfoWindow.close();
      });

      // 클릭 시 상세 정보 표시
      kakao.maps.event.addListener(marker, "click", () => {
        // 호버 정보창 닫기
        hoverInfoWindow.close();

        // 기존에 열려있는 상세 정보창 닫기
        markersRef.current.forEach((m) => {
          const existingInfo = (m as any).detailInfoWindow;
          const isOpen = (m as any).detailInfoOpen;
          if (existingInfo && isOpen) {
            existingInfo.close();
            (m as any).detailInfoOpen = false;
          }
        });

        // 현재 마커의 상세 정보 표시
        detailInfoWindow.open(mapRef.current, marker);
        (marker as any).detailInfoOpen = true;

        // 지도 클릭 시 상세 정보창 닫기
        const closeDetailOnMapClick = () => {
          detailInfoWindow.close();
          (marker as any).detailInfoOpen = false;
          kakao.maps.event.removeListener(
            mapRef.current,
            "click",
            closeDetailOnMapClick
          );
        };
        kakao.maps.event.addListener(
          mapRef.current,
          "click",
          closeDetailOnMapClick
        );
      });

      markersRef.current.push(marker);
      // place.id로 마커를 찾을 수 있도록 Map에 저장
      markersMapRef.current.set(place.id, marker);
    });

    // 지도 범위 조정 (모든 마커가 보이도록)
    if (placesWithDistance.length > 0) {
      mapRef.current.setBounds(bounds);
    }
  };

  // 카테고리 변경 시 장소 검색 및 마커 표시
  useEffect(() => {
    if (!mapRef.current || !userLocation || !category) return;
    if (typeof window === "undefined" || !window.kakao || !window.kakao.maps)
      return;

    const { kakao } = window;

    // 캐시 키 생성 (카테고리 + 사용자 위치 기반)
    const cacheKey = `${category}_${userLocation.lat.toFixed(
      4
    )}_${userLocation.lng.toFixed(4)}`;

    // 캐시된 결과가 있으면 사용
    const cachedPlaces = placesCacheRef.current.get(cacheKey);
    if (cachedPlaces) {
      // 캐시된 결과로 마커 생성
      const placesWithDistance: Place[] = cachedPlaces.map((place) => ({
        ...place,
        distance: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          place.lat,
          place.lng
        ),
      }));

      // 부모 컴포넌트에 전달
      onPlacesChange(placesWithDistance);

      // 마커 생성 로직 재사용
      createMarkersFromPlaces(placesWithDistance, userLocation, kakao);
      return;
    }

    // 장소 검색
    searchPlaces(category, userLocation.lat, userLocation.lng)
      .then(async (places) => {
        // 카테고리가 park인 경우, 각 place에 대해 urban_parks 매칭 시도
        if (category === "park") {
          const placesWithMatching = await Promise.all(
            places.map(async (place) => {
              // urban_parks에서 매칭되는 데이터 찾기
              const match = await findMatchingUrbanPark(
                place,
                userLocation.lat,
                userLocation.lng
              );

              if (match) {
                // 매칭된 경우, 시설 정보만 추가하고 거리는 카카오 장소 기준으로 유지
                return {
                  ...place,
                  distance: calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    place.lat,
                    place.lng
                  ),
                  facilities: match.facilities,
                };
              } else {
                // 매칭되지 않은 경우, 기존 거리 사용
                return {
                  ...place,
                  distance: calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    place.lat,
                    place.lng
                  ),
                };
              }
            })
          );

          // 검색 결과 캐시에 저장
          placesCacheRef.current.set(cacheKey, placesWithMatching);

          // 부모 컴포넌트에 전달
          onPlacesChange(placesWithMatching);

          // 마커 생성 로직 재사용
          createMarkersFromPlaces(placesWithMatching, userLocation, kakao);
        } else {
          // park가 아닌 경우 기존 로직 사용
          const placesWithDistance: Place[] = places.map((place) => ({
            ...place,
            distance: calculateDistance(
              userLocation.lat,
              userLocation.lng,
              place.lat,
              place.lng
            ),
          }));

          // 검색 결과 캐시에 저장
          placesCacheRef.current.set(cacheKey, placesWithDistance);

          // 부모 컴포넌트에 전달
          onPlacesChange(placesWithDistance);

          // 마커 생성 로직 재사용
          createMarkersFromPlaces(placesWithDistance, userLocation, kakao);
        }
      })
      .catch((err) => {
        setError(`장소 검색 중 오류 발생: ${err.message}`);
      });
  }, [category, userLocation, onPlacesChange]);

  // 선택된 장소로 지도 이동 및 팝업 열기
  useEffect(() => {
    if (!selectedPlaceId || !mapRef.current || !userLocation) return;
    if (typeof window === "undefined" || !window.kakao || !window.kakao.maps)
      return;

    const marker = markersMapRef.current.get(selectedPlaceId);
    if (!marker) return;

    const { kakao } = window;
    const placePosition = marker.getPosition();

    // 팝업 열기 함수
    const openPlacePopup = () => {
      // 기존에 열려있는 상세 정보창 닫기
      markersRef.current.forEach((m) => {
        const existingInfo = (m as any).detailInfoWindow;
        const isOpen = (m as any).detailInfoOpen;
        if (existingInfo && isOpen) {
          existingInfo.close();
          (m as any).detailInfoOpen = false;
        }
      });

      // 선택된 마커의 상세 정보 표시
      const detailInfoWindow = (marker as any).detailInfoWindow;
      if (detailInfoWindow) {
        detailInfoWindow.open(mapRef.current, marker);
        (marker as any).detailInfoOpen = true;

        // 지도 클릭 시 상세 정보창 닫기
        const closeDetailOnMapClick = () => {
          detailInfoWindow.close();
          (marker as any).detailInfoOpen = false;
          kakao.maps.event.removeListener(
            mapRef.current,
            "click",
            closeDetailOnMapClick
          );
        };
        kakao.maps.event.addListener(
          mapRef.current,
          "click",
          closeDetailOnMapClick
        );
      }
    };

    // 이전 idle 리스너 참조 저장
    let idleListener: any = null;
    let isActive = true; // 현재 useEffect가 활성화되어 있는지 확인
    let popupOpened = false; // 팝업이 이미 열렸는지 확인

    // panTo는 항상 즉시 호출 (지도가 이동 중이거나 줌 중이어도 호출)
    mapRef.current.panTo(placePosition);

    // 이동이 완료된 후 팝업 열기
    const handleIdle = () => {
      // useEffect가 비활성화되었거나 다른 장소가 선택되었으면 실행하지 않음
      if (!isActive || popupOpened) return;

      // 실제로 panTo가 호출된 후에 발생한 idle인지 확인
      const currentCenter = mapRef.current.getCenter();
      const distance = Math.sqrt(
        Math.pow(currentCenter.getLat() - placePosition.getLat(), 2) +
          Math.pow(currentCenter.getLng() - placePosition.getLng(), 2)
      );

      // 중심점이 목표 위치와 충분히 가까우면 이동 완료로 간주
      if (distance < 0.0001) {
        openPlacePopup();
        popupOpened = true;
        // idle 이벤트 리스너 제거 (한 번만 실행)
        if (idleListener) {
          kakao.maps.event.removeListener(mapRef.current, "idle", idleListener);
          idleListener = null;
        }
      }
    };

    idleListener = handleIdle;

    // idle 이벤트 리스너 추가 (panTo 호출 후 이동이 완료될 때까지 대기)
    kakao.maps.event.addListener(mapRef.current, "idle", handleIdle);

    // cleanup: useEffect가 언마운트되거나 selectedPlaceId가 변경될 때
    return () => {
      isActive = false;
      popupOpened = false;
      // 이전 idle 리스너 제거
      if (idleListener) {
        kakao.maps.event.removeListener(mapRef.current, "idle", idleListener);
      }
    };
  }, [selectedPlaceId, userLocation]);

  // 조건부 렌더링 (모든 Hooks 호출 이후)
  if (sdkError) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-red-50 text-red-700 p-5 overflow-y-auto">
        <div className="max-w-[600px] w-full">
          <h3 className="m-0 mb-4 text-xl font-semibold">⚠️ 지도 로딩 실패</h3>
          <pre className="m-0 mb-5 p-3 bg-white rounded text-sm leading-relaxed whitespace-pre-wrap font-mono">
            {sdkError}
          </pre>
          <div className="mt-5 p-4 bg-white rounded text-sm leading-relaxed">
            <p>
              <strong>해결 방법:</strong>
            </p>
            <ol className="my-3 ml-0 pl-5 list-decimal">
              <li>
                카카오 개발자 콘솔 확인:{" "}
                <a
                  href="https://developers.kakao.com/console/app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  https://developers.kakao.com/console/app
                </a>
              </li>
              <li>JavaScript 키 확인 및 복사</li>
              <li>
                플랫폼 설정 → Web 플랫폼에 <code>http://localhost:3000</code>{" "}
                추가
              </li>
              <li>.env.local 파일에 NEXT_PUBLIC_KAKAO_JS_KEY 설정</li>
              <li>개발 서버 재시작 (npm run dev)</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (!kakaoLoaded) {
    return (
      <div className="w-full h-[500px] flex flex-col items-center justify-center bg-gray-100 text-gray-600 p-5">
        <p>지도 로딩 중...</p>
        <p className="mt-2.5 text-sm text-gray-400">
          카카오맵 SDK를 불러오는 중입니다. 잠시만 기다려주세요.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-[500px] flex flex-col items-center justify-center bg-gray-100 text-gray-600 p-5">
        <p>위치 정보를 가져오는 중...</p>
        <p className="mt-2.5 text-sm text-gray-400">
          GPS를 사용하여 정확한 위치를 찾는 중입니다.
          <br />
          실외에서 더 정확한 위치 정보를 얻을 수 있습니다.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-red-50 text-red-700 p-5 overflow-y-auto">
        <div className="max-w-[600px] w-full">
          <h3 className="m-0 mb-4 text-xl font-semibold">⚠️ 오류 발생</h3>
          <p className="m-0 mb-5 p-3 bg-white rounded text-sm leading-relaxed whitespace-pre-wrap font-mono">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-[500px]"
        id="map"
      />
      <Roadview kakaoLoaded={kakaoLoaded} />
    </>
  );
}
