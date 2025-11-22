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
      <div style={styles.empty}>
        <p>검색된 장소가 없습니다.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>검색 결과 ({sortedPlaces.length}개)</h3>
      </div>
      <div style={styles.list}>
        {sortedPlaces.map((place) => (
          <div
            key={place.id}
            style={styles.item}
            onClick={() => onPlaceClick && onPlaceClick(place)}
          >
            <div style={styles.itemHeader}>
              <h4 style={styles.itemName}>{place.name}</h4>
              {place.distance && (
                <span style={styles.distance}>
                  {place.distance < 1000
                    ? `${Math.round(place.distance)}m`
                    : `${(place.distance / 1000).toFixed(1)}km`}
                </span>
              )}
            </div>
            <p style={styles.address}>{place.address}</p>
            {place.tags && place.tags.length > 0 && (
              <div style={styles.tags}>
                {place.tags.map((tag, idx) => (
                  <span key={idx} style={styles.tag}>
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

const styles: {
  container: React.CSSProperties;
  header: React.CSSProperties;
  title: React.CSSProperties;
  list: React.CSSProperties;
  empty: React.CSSProperties;
  item: React.CSSProperties;
  itemHeader: React.CSSProperties;
  itemName: React.CSSProperties;
  distance: React.CSSProperties;
  address: React.CSSProperties;
  tags: React.CSSProperties;
  tag: React.CSSProperties;
} = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#fff",
  },
  header: {
    padding: "16px",
    borderBottom: "1px solid #e5e5e5",
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "600",
    color: "#333",
  },
  list: {
    flex: 1,
    overflowY: "auto",
    padding: "8px",
  },
  empty: {
    padding: "40px 20px",
    textAlign: "center",
    color: "#999",
  },
  item: {
    padding: "16px",
    marginBottom: "8px",
    border: "1px solid #e5e5e5",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  itemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "8px",
  },
  itemName: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  distance: {
    fontSize: "14px",
    color: "#3182f6",
    fontWeight: "500",
    marginLeft: "8px",
  },
  address: {
    margin: "4px 0",
    fontSize: "14px",
    color: "#666",
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    marginTop: "8px",
  },
  tag: {
    fontSize: "12px",
    padding: "2px 8px",
    backgroundColor: "#f0f0f0",
    borderRadius: "4px",
    color: "#666",
  },
};

