/**
 * Place 중심 아키텍처의 핵심 타입 정의
 * 
 * 철학: "문화란 사람이 찾아가는 장소다"
 * 공원, 미술관, 도서관, 문화센터 등은 모두 Place 엔티티이며,
 * category로만 구분한다.
 */

export type PlaceCategory =
  | "park"
  | "museum"
  | "library"
  | "cultural_center"
  | "etc";

export type PlaceSource = "kakao" | "public_data" | "manual";

export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  distance?: number; // meter
  category: PlaceCategory;
  source: PlaceSource;
  tags?: string[];
  phone?: string; // 전화번호
  url?: string; // 카카오맵 URL
  imageUrl?: string; // 미리보기 이미지 URL
}

/**
 * 카테고리별 한글 이름 매핑
 * 나중에 미술관/도서관/문화센터를 추가할 때 여기에만 추가하면 됨
 */
export const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  park: "공원",
  museum: "미술관",
  library: "도서관",
  cultural_center: "문화센터",
  etc: "기타",
};

/**
 * 사용 가능한 모든 카테고리 목록
 * 나중에 새로운 카테고리를 추가하려면 이 배열에만 추가하면 됨
 */
export const PLACE_CATEGORIES = Object.keys(
  CATEGORY_LABELS
) as PlaceCategory[];

