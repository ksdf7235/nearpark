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
    <div style={styles.container}>
      {availableCategories.map((category) => (
        <button
          key={category}
          onClick={() => onChange(category)}
          style={{
            ...styles.button,
            ...(value === category ? styles.buttonActive : {}),
          }}
        >
          {CATEGORY_LABELS[category]}
        </button>
      ))}
      {/* 나중에 미술관/도서관/문화센터 버튼을 추가하려면
          availableCategories 배열에 추가하고 여기에 버튼만 추가하면 됨 */}
    </div>
  );
}

const styles: {
  container: React.CSSProperties;
  button: React.CSSProperties;
  buttonActive: React.CSSProperties;
} = {
  container: {
    display: "flex",
    gap: "8px",
    padding: "16px",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
    flexWrap: "wrap",
  },
  button: {
    padding: "10px 20px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  buttonActive: {
    backgroundColor: "#3182f6",
    color: "#fff",
    borderColor: "#3182f6",
  },
};

