/**
 * 파싱 유틸리티 함수
 * 
 * 문자열 파싱, 변환 등 범용적인 파싱 함수들을 제공합니다.
 */

/**
 * 문자열을 실수로 변환합니다. 실패 시 null 반환.
 */
export function parseFloatOrNull(value: string | null | undefined): number | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }

  const parsed = parseFloat(trimmed);
  if (isNaN(parsed)) {
    return null;
  }

  return parsed;
}

/**
 * 날짜 문자열을 YYYY-MM-DD 형식으로 검증하고 반환합니다.
 * 실패 시 null 반환.
 */
export function parseDateOrNull(value: string | null | undefined): string | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }

  // YYYY-MM-DD 형식 검증
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(trimmed)) {
    return null;
  }

  // 유효한 날짜인지 확인
  const date = new Date(trimmed);
  if (isNaN(date.getTime())) {
    return null;
  }

  return trimmed;
}

/**
 * 문자열을 정수로 변환합니다. 실패 시 null 반환.
 */
export function parseIntOrNull(value: string | null | undefined): number | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }

  const parsed = parseInt(trimmed, 10);
  if (isNaN(parsed)) {
    return null;
  }

  return parsed;
}

/**
 * 문자열을 정규화합니다 (trim + 빈 문자열 처리).
 */
export function normalizeString(value: string | null | undefined): string | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

