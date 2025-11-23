"use client";

/**
 * 로드뷰 컴포넌트
 *
 * 카카오맵 로드뷰(Street View)를 표시하는 컴포넌트
 *
 * 주요 책임:
 * 1. 로드뷰 표시/숨김 상태 관리
 * 2. 카카오맵 RoadviewClient를 사용하여 파노라마 ID 찾기
 * 3. 로드뷰 인스턴스 생성 및 관리
 * 4. 로드뷰 UI 렌더링
 */

import { useEffect, useRef, useState, useCallback } from "react";

interface RoadviewProps {
  kakaoLoaded: boolean;
}

export default function Roadview({ kakaoLoaded }: RoadviewProps) {
  const roadviewContainerRef = useRef<HTMLDivElement>(null);
  const roadviewRef = useRef<any>(null); // kakao.maps.Roadview
  const roadviewInitHandlerRef = useRef<(() => void) | null>(null); // 로드뷰 init 이벤트 핸들러
  const [showRoadview, setShowRoadview] = useState(false);
  const [roadviewLoading, setRoadviewLoading] = useState(false);
  const [roadviewPosition, setRoadviewPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // 로드뷰 표시 함수 (useCallback으로 메모이제이션)
  const showRoadviewAtPosition = useCallback(
    (lat: number, lng: number) => {
      if (
        !kakaoLoaded ||
        typeof window === "undefined" ||
        !window.kakao ||
        !window.kakao.maps
      ) {
        return;
      }

      const { kakao } = window;

      setRoadviewPosition({ lat, lng });
      setShowRoadview(true);
      setRoadviewLoading(true);

      // 컨테이너가 DOM에 나타날 때까지 약간의 지연
      // React가 DOM을 업데이트한 후에 로드뷰를 생성하기 위함
      setTimeout(() => {
        if (!roadviewContainerRef.current) {
          console.warn("로드뷰 컨테이너가 아직 DOM에 없습니다.");
          setRoadviewLoading(false);
          setShowRoadview(false);
          return;
        }

        // RoadviewClient를 사용하여 가장 가까운 파노라마 ID 가져오기
        const roadviewClient = new kakao.maps.RoadviewClient();
        const position = new kakao.maps.LatLng(lat, lng);

        // 반경을 점진적으로 늘려가며 로드뷰 찾기 (50m -> 100m -> 200m -> 500m)
        const tryGetRoadview = (radius: number, attempts: number) => {
          roadviewClient.getNearestPanoId(
            position,
            radius,
            (panoId: number | null) => {
              if (panoId !== null && roadviewContainerRef.current) {
                // 기존 로드뷰가 있으면 제거하고 새로 생성
                if (roadviewRef.current) {
                  // 이벤트 리스너 제거
                  if (roadviewInitHandlerRef.current) {
                    try {
                      kakao.maps.event.removeListener(
                        roadviewRef.current,
                        "init",
                        roadviewInitHandlerRef.current
                      );
                    } catch (e) {
                      // 이미 제거되었거나 없는 경우 무시
                      console.warn("이벤트 리스너 제거 실패:", e);
                    }
                    roadviewInitHandlerRef.current = null;
                  }
                  roadviewRef.current = null;
                }

                // 컨테이너가 DOM에 있는지 확인
                if (!roadviewContainerRef.current) {
                  console.warn("로드뷰 컨테이너가 DOM에 없습니다.");
                  setRoadviewLoading(false);
                  return;
                }

                // 로드뷰 새로 생성
                roadviewRef.current = new kakao.maps.Roadview(
                  roadviewContainerRef.current,
                  {
                    panoId: panoId,
                    panoX: lng,
                    panoY: lat,
                  }
                );

                // 로드뷰 초기화 완료 이벤트 리스너
                const initHandler = () => {
                  console.log("로드뷰 초기화 완료");
                  setRoadviewLoading(false);
                };
                roadviewInitHandlerRef.current = initHandler;
                kakao.maps.event.addListener(
                  roadviewRef.current,
                  "init",
                  initHandler
                );

                // 로드뷰 레이아웃 조정 (컨테이너 크기 변경 시 필요)
                setTimeout(() => {
                  if (roadviewRef.current) {
                    roadviewRef.current.relayout();
                  }
                }, 100);

                setRoadviewLoading(false);
              } else {
                // 반경을 늘려서 재시도
                if (attempts < 4) {
                  const nextRadius =
                    attempts === 1 ? 100 : attempts === 2 ? 200 : 500;
                  console.log(
                    `로드뷰를 찾지 못했습니다. 반경을 ${nextRadius}m로 늘려 재시도합니다... (시도 ${
                      attempts + 1
                    }/4)`
                  );
                  tryGetRoadview(nextRadius, attempts + 1);
                } else {
                  console.warn("로드뷰를 사용할 수 없는 위치입니다.");
                  setRoadviewLoading(false);
                  alert(
                    "이 위치 주변(500m 이내)에서는 로드뷰를 사용할 수 없습니다.\n\n" +
                      "로드뷰는 도로가 있는 지역에서만 사용 가능합니다.\n" +
                      "다른 위치를 선택해주세요."
                  );
                  setShowRoadview(false);
                }
              }
            }
          );
        };

        // 처음에는 50m 반경으로 시도
        tryGetRoadview(50, 1);
      }, 50); // DOM 업데이트를 위한 짧은 지연
    },
    [kakaoLoaded]
  );

  // 로드뷰 닫기 함수
  const closeRoadview = useCallback(() => {
    // 로드뷰 인스턴스 정리
    if (roadviewRef.current && roadviewInitHandlerRef.current) {
      // 이벤트 리스너 제거
      if (window.kakao && window.kakao.maps) {
        try {
          window.kakao.maps.event.removeListener(
            roadviewRef.current,
            "init",
            roadviewInitHandlerRef.current
          );
        } catch (e) {
          // 이미 제거되었거나 없는 경우 무시
          console.warn("이벤트 리스너 제거 실패:", e);
        }
      }
      roadviewInitHandlerRef.current = null;
    }
    roadviewRef.current = null;
    setShowRoadview(false);
    setRoadviewLoading(false);
    setRoadviewPosition(null);
  }, []);

  // 로드뷰 버튼 클릭 핸들러를 전역으로 등록 (HTML onclick에서 사용)
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).showRoadviewAtPosition = showRoadviewAtPosition;
    }
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).showRoadviewAtPosition;
      }
    };
  }, [showRoadviewAtPosition]);

  if (!showRoadview) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center p-5">
      <div className="w-full max-w-[1200px] h-[90vh] bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <h3 className="m-0 text-lg font-semibold text-gray-800">로드뷰</h3>
          <button
            onClick={closeRoadview}
            className="w-8 h-8 border-none bg-transparent cursor-pointer text-xl text-gray-600 flex items-center justify-center rounded transition-colors duration-200 hover:bg-gray-100"
            aria-label="로드뷰 닫기"
          >
            ✕
          </button>
        </div>
        {roadviewLoading && (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 text-gray-600 p-10">
            <p>로드뷰를 불러오는 중...</p>
            <p className="mt-2.5 text-sm text-gray-400">
              주변 로드뷰를 찾고 있습니다.
            </p>
          </div>
        )}
        <div
          ref={roadviewContainerRef}
          className={`flex-1 w-full min-h-0 ${
            roadviewLoading ? "hidden" : "block"
          }`}
          id="roadview"
        />
      </div>
    </div>
  );
}
