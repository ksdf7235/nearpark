/**
 * 장소 리스트 컴포넌트
 *
 * 검색된 Place 배열을 받아서 리스트 형태로 표시
 * 거리순으로 정렬하여 표시
 */

import type { Place } from "../../types/place";

interface PlaceListProps {
  places: Place[];
  onPlaceClick?: (place: Place) => void;
}

export default function PlaceList({ places, onPlaceClick }: PlaceListProps) {
  // 거리순으로 정렬 (거리가 있는 경우)
  const sortedPlaces = [...places].sort((a, b) => {
    if (a.distance && b.distance) {
      return a.distance - b.distance;
    }
    return 0;
  });

  if (sortedPlaces.length === 0) {
    return (
      <div className="py-10 px-5 text-center text-gray-400">
        <p>검색된 장소가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        <h3 className="m-0 text-lg font-semibold text-gray-800">
          검색 결과 ({sortedPlaces.length}개)
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {sortedPlaces.map((place) => (
          <div
            key={place.id}
            className="p-4 mb-2 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
            onClick={() => onPlaceClick && onPlaceClick(place)}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="m-0 text-base font-semibold text-gray-800 flex-1">
                {place.name}
              </h4>
              {place.distance && (
                <span className="text-sm text-blue-500 font-medium ml-2">
                  {place.distance < 1000
                    ? `${Math.round(place.distance)}m`
                    : `${(place.distance / 1000).toFixed(1)}km`}
                </span>
              )}
            </div>
            <p className="my-1 text-sm text-gray-600">{place.address}</p>
            {place.tags && place.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {place.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs py-0.5 px-2 bg-gray-100 rounded text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
