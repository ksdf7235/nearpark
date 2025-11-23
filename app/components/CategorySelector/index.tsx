/**
 * 카테고리 선택 컴포넌트
 *
 * 공원/미술관/도서관/문화센터 등 카테고리를 선택할 수 있는 탭 형태 UI
 * 나중에 새로운 카테고리를 추가하려면 CATEGORY_LABELS에만 추가하면 됨
 */
import { CATEGORY_LABELS } from "../../types/place";
import type { PlaceCategory } from "../../types/place";

interface CategorySelectorProps {
  value: PlaceCategory;
  onChange: (category: PlaceCategory) => void;
}

export default function CategorySelector({
  value,
  onChange,
}: CategorySelectorProps) {
  // 현재 MVP에서는 "park"만 활성화되지만,
  // 나중에 미술관/도서관/문화센터를 활성화하려면
  // 이 배열에 추가하기만 하면 됨
  const availableCategories: PlaceCategory[] = ["park"]; // ["park", "museum", "library", "cultural_center"]

  return (
    <div className="flex gap-2 p-4 bg-gray-100 rounded-lg flex-wrap">
      {availableCategories.map((category) => (
        <button
          key={category}
          onClick={() => onChange(category)}
          className={`px-5 py-2.5 border rounded-md cursor-pointer text-sm font-medium transition-all duration-200 ${
            value === category
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-white border-gray-300 hover:border-gray-400"
          }`}
        >
          {CATEGORY_LABELS[category]}
        </button>
      ))}
      {/* 나중에 미술관/도서관/문화센터 버튼을 추가하려면
          availableCategories 배열에 추가하고 여기에 버튼만 추가하면 됨 */}
    </div>
  );
}
