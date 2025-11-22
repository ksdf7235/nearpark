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

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <header style={styles.header}>
        <h1 style={styles.title}>내 주변 문화지도</h1>
        <p style={styles.subtitle}>
          공원부터 시작하여 미술관, 도서관, 문화센터까지 확장 예정
        </p>
      </header>

      {/* 카테고리 선택 */}
      <div style={styles.categorySection}>
        <CategorySelector value={category} onChange={setCategory} />
      </div>

      {/* 메인 영역: 지도 + 리스트 */}
      <div style={styles.main}>
        {/* 왼쪽: 지도 */}
        <div style={styles.mapSection}>
          <MapClient category={category} onPlacesChange={setPlaces} />
        </div>

        {/* 오른쪽: 장소 리스트 */}
        <div style={styles.listSection}>
          <PlaceList places={places} />
        </div>
      </div>
    </div>
  );
}

const styles: {
  container: React.CSSProperties;
  header: React.CSSProperties;
  title: React.CSSProperties;
  subtitle: React.CSSProperties;
  categorySection: React.CSSProperties;
  main: React.CSSProperties;
  mapSection: React.CSSProperties;
  listSection: React.CSSProperties;
} = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100%",
    backgroundColor: "#fafafa",
  },
  header: {
    padding: "24px",
    backgroundColor: "#fff",
    borderBottom: "1px solid #e5e5e5",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "28px",
    fontWeight: "700",
    color: "#333",
  },
  subtitle: {
    margin: 0,
    fontSize: "14px",
    color: "#666",
  },
  categorySection: {
    padding: "16px 24px",
    backgroundColor: "#fff",
    borderBottom: "1px solid #e5e5e5",
  },
  main: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
  },
  mapSection: {
    flex: 1,
    minWidth: 0, // flexbox에서 overflow 방지
  },
  listSection: {
    width: "400px",
    borderLeft: "1px solid #e5e5e5",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
};

