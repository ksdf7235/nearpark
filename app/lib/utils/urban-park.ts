/**
 * 도시공원 데이터 변환 유틸리티
 * 
 * 원본 JSON 데이터를 DB 스키마에 맞게 변환하는 함수들을 제공합니다.
 */

import type {
  RawUrbanParkRecord,
  UrbanParkDbRow,
  FacilityFlags,
  FacilityCounts,
} from "../../types/urban_park";
import { parseFloatOrNull, parseDateOrNull, normalizeString } from "./parser";

/**
 * 공원구분을 정규화합니다.
 * 
 * 전략: 원본 문자열을 그대로 사용 (한글 유지)
 * 이유: 
 * - 공원구분 값이 다양하고 표준화되지 않음
 * - 나중에 Place 타입과 합칠 때 한글 카테고리로 매핑 가능
 * - 영어 변환 시 정보 손실 가능성
 */
export function normalizeParkType(raw: string | null | undefined): string {
  if (!raw) {
    return "기타";
  }

  const trimmed = raw.trim();
  return trimmed === "" ? "기타" : trimmed;
}

/**
 * 시설 텍스트에서 플래그를 계산합니다.
 * 
 * 정규표현식 기반으로 각 시설 유형의 존재 여부를 판단합니다.
 */
export function buildFacilityFlags(record: RawUrbanParkRecord): FacilityFlags {
  // 모든 시설 텍스트를 합침
  const allFacilities = [
    record["공원보유시설(운동시설)"],
    record["공원보유시설(유희시설)"],
    record["공원보유시설(편익시설)"],
    record["공원보유시설(교양시설)"],
    record["공원보유시설(기타시설)"],
  ]
    .filter((text) => text && text.trim() !== "")
    .join(" ");

  // 각 플래그에 대한 정규표현식 패턴
  const patterns = {
    has_playground: /놀이대|놀이터|그네|미끄럼틀|모래밭|조합놀이|놀이시설|유희시설|시소/i,
    has_gym: /운동시설|운동기구|체력단련|헬스|철봉|평행봉|운동장|야외체육|싸이클링/i,
    has_toilet: /화장실|변소|공중화장실/i,
    has_parking: /주차장|주차/i,
    has_bench: /벤치|의자|휴게/i,
    has_stage_or_culture: /야외무대|공연장|무대|전망대|문화시설|교양시설/i,
  };

  return {
    has_playground: patterns.has_playground.test(allFacilities),
    has_gym: patterns.has_gym.test(allFacilities),
    has_toilet: patterns.has_toilet.test(allFacilities),
    has_parking: patterns.has_parking.test(allFacilities),
    has_bench: patterns.has_bench.test(allFacilities),
    has_stage_or_culture: patterns.has_stage_or_culture.test(allFacilities),
  };
}

/**
 * 시설 텍스트에서 시설명과 개수를 파싱합니다.
 * 
 * 실제 데이터 예시:
 * - "체력단련시설 3점" → { "체력단련시설": 3 }
 * - "모래밭 1기+조합놀이 1기" → { "모래밭": 1, "조합놀이": 1 }
 * - "조합놀이대외 3종" → { "조합놀이대": 3 }
 * - "시소 외3종" → { "시소": 3 }
 * - "화장실 외1종" → { "화장실": 1 }
 * - "공원등22주 외5종" → { "공원등": 22, "기타": 5 }
 * - "볼라드5 외1종" → { "볼라드": 5, "기타": 1 }
 * - "야외체육시설3" → { "야외체육시설": 3 }
 */
export function parseFacilityCounts(text: string | null | undefined): FacilityCounts {
  if (!text || text.trim() === "") {
    return {};
  }

  const counts: FacilityCounts = {};

  // + 기준으로 분리
  const tokens = text
    .split("+")
    .map((t) => t.trim())
    .filter((t) => t !== "");

  for (const token of tokens) {
    // "외 N종" 패턴 처리 (예: "시소 외3종", "조합놀이대외 3종")
    const outerMatch = token.match(/^(.+?)\s*외\s*(\d+)\s*종$/);
    if (outerMatch) {
      const facilityName = outerMatch[1].trim();
      const count = parseInt(outerMatch[2], 10);
      if (facilityName && !isNaN(count) && count > 0) {
        counts[facilityName] = (counts[facilityName] || 0) + count;
      }
      continue;
    }

    // 일반 패턴: "시설명 숫자단위" 또는 "시설명숫자"
    const match = token.match(/^(.+?)\s*(\d+)\s*(점|기|개|종|대|주|시설)?$/);

    if (match) {
      const facilityName = match[1].trim();
      const count = parseInt(match[2], 10);

      if (facilityName && !isNaN(count) && count > 0) {
        counts[facilityName] = (counts[facilityName] || 0) + count;
      }
    } else {
      // 숫자를 못 찾으면 시설명만 추출 (1로 간주)
      const nameOnly = token
        .replace(/\s*\d+\s*(점|기|개|종|대|주|시설)$/i, "")
        .trim();
      if (nameOnly) {
        counts[nameOnly] = (counts[nameOnly] || 0) + 1;
      }
    }
  }

  return counts;
}

/**
 * 원본 레코드를 DB용 row로 변환합니다.
 */
export function convertUrbanParkRecord(record: RawUrbanParkRecord): UrbanParkDbRow {
  const flags = buildFacilityFlags(record);

  return {
    id: normalizeString(record.관리번호) || "",
    name: normalizeString(record.공원명) || "",
    park_type: normalizeParkType(record.공원구분),
    road_address: normalizeString(record.소재지도로명주소),
    jibun_address: normalizeString(record.소재지지번주소),
    lat: parseFloatOrNull(record.위도),
    lng: parseFloatOrNull(record.경도),
    area: parseFloatOrNull(record.공원면적),
    sports_facilities: normalizeString(record["공원보유시설(운동시설)"]),
    play_facilities: normalizeString(record["공원보유시설(유희시설)"]),
    convenience_facilities: normalizeString(record["공원보유시설(편익시설)"]),
    culture_facilities: normalizeString(record["공원보유시설(교양시설)"]),
    other_facilities: normalizeString(record["공원보유시설(기타시설)"]),
    has_playground: flags.has_playground,
    has_gym: flags.has_gym,
    has_toilet: flags.has_toilet,
    has_parking: flags.has_parking,
    has_bench: flags.has_bench,
    has_stage_or_culture: flags.has_stage_or_culture,
    established_at: parseDateOrNull(record.지정고시일),
    org_name: normalizeString(record.관리기관명),
    phone: normalizeString(record.전화번호),
    data_date: parseDateOrNull(record.데이터기준일자),
    provider_code: normalizeString(record.제공기관코드),
    provider_name: normalizeString(record.제공기관명),
  };
}

