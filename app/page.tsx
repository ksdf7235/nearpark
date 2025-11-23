/**
 * 메인 페이지
 *
 * Server Component로 구성되며, 브라우저 전용 기능은 MapClient 컴포넌트로 분리
 * 전체 레이아웃과 카테고리 선택 UI를 담당
 */
"use client";

import { useState } from "react";
import CategorySelector from "./components/CategorySelector";
import PlaceList from "./components/PlaceList";
import MapClient from "./components/MapClient";
import type { Place, PlaceCategory } from "./types/place";

export default function Home() {
  const [category, setCategory] = useState<PlaceCategory>("park");
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50">
      {/* 헤더 */}
      <header className="p-6 bg-white border-b border-gray-200">
        <h1 className="m-0 mb-2 text-3xl font-bold text-gray-800">
          내 주변 문화지도
        </h1>
        <p className="m-0 text-sm text-gray-600">
          공원부터 시작하여 미술관, 도서관, 문화센터까지 확장 예정
        </p>
      </header>

      {/* 카테고리 선택 */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <CategorySelector
          value={category}
          onChange={(newCategory) => {
            setCategory(newCategory);
            setSelectedPlaceId(null); // 카테고리 변경 시 선택된 장소 초기화
          }}
        />
      </div>

      {/* 메인 영역: 지도 + 리스트 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 왼쪽: 지도 */}
        <div className="flex-1 min-w-0">
          <MapClient
            category={category}
            onPlacesChange={setPlaces}
            selectedPlaceId={selectedPlaceId}
          />
        </div>

        {/* 오른쪽: 장소 리스트 */}
        <div className="w-[400px] border-l border-gray-200 bg-white overflow-hidden">
          <PlaceList
            places={places}
            onPlaceClick={(place) => setSelectedPlaceId(place.id)}
          />
        </div>
      </div>
    </div>
  );
}
