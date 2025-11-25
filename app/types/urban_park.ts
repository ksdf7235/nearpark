/**
 * 전국 도시공원 공공데이터 타입 정의
 * 
 * 원본 JSON 구조와 DB 스키마를 매핑하는 타입들을 정의합니다.
 */

// 원본 JSON 파일 구조
export type RawUrbanParkRecord = {
  관리번호: string;
  공원명: string;
  공원구분: string;
  소재지도로명주소: string;
  소재지지번주소: string;
  위도: string;
  경도: string;
  공원면적: string;
  "공원보유시설(운동시설)": string;
  "공원보유시설(유희시설)": string;
  "공원보유시설(편익시설)": string;
  "공원보유시설(교양시설)": string;
  "공원보유시설(기타시설)": string;
  지정고시일: string;
  관리기관명: string;
  전화번호: string;
  데이터기준일자: string;
  제공기관코드: string;
  제공기관명: string;
};

export type RawUrbanParkFile = {
  fields: { id: string }[];
  records: RawUrbanParkRecord[];
};

// DB 삽입용 타입
export type UrbanParkDbRow = {
  id: string;
  name: string;
  park_type: string;
  road_address: string | null;
  jibun_address: string | null;
  lat: number | null;
  lng: number | null;
  area: number | null;
  sports_facilities: string | null;
  play_facilities: string | null;
  convenience_facilities: string | null;
  culture_facilities: string | null;
  other_facilities: string | null;
  has_playground: boolean;
  has_gym: boolean;
  has_toilet: boolean;
  has_parking: boolean;
  has_bench: boolean;
  has_stage_or_culture: boolean;
  established_at: string | null; // YYYY-MM-DD 형식
  org_name: string | null;
  phone: string | null;
  data_date: string | null; // YYYY-MM-DD 형식
  provider_code: string | null;
  provider_name: string | null;
};

// 시설 플래그 타입
export type FacilityFlags = {
  has_playground: boolean;
  has_gym: boolean;
  has_toilet: boolean;
  has_parking: boolean;
  has_bench: boolean;
  has_stage_or_culture: boolean;
};

// 시설 카운트 타입
export type FacilityCounts = Record<string, number>;

