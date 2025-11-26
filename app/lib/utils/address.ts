/**
 * 주소 정규화 유틸리티
 * 
 * 주소를 정규화하여 중복 제거에 사용합니다.
 */

/**
 * 주소를 정규화합니다.
 * 
 * 예시:
 * - "서울특별시 중랑구 면목동 137-14" → "중랑구 면목동 137-14"
 * - "서울 중랑구 면목동 137-14" → "중랑구 면목동 137-14"
 * - "서울시 중랑구 면목동 137-14" → "중랑구 면목동 137-14"
 * 
 * @param address - 원본 주소
 * @returns 정규화된 주소 (시/도 제거, 공백 정리)
 */
export function normalizeAddress(address: string | null | undefined): string | null {
  if (!address || typeof address !== "string") {
    return null;
  }

  let normalized = address.trim();

  // 시/도 제거 (서울특별시, 서울시, 서울 등)
  normalized = normalized.replace(/^서울(특별시|시)?\s*/i, "");
  normalized = normalized.replace(/^경기(도|남도|북도)?\s*/i, "");
  normalized = normalized.replace(/^인천(광역시|시)?\s*/i, "");
  normalized = normalized.replace(/^부산(광역시|시)?\s*/i, "");
  normalized = normalized.replace(/^대구(광역시|시)?\s*/i, "");
  normalized = normalized.replace(/^광주(광역시|시)?\s*/i, "");
  normalized = normalized.replace(/^대전(광역시|시)?\s*/i, "");
  normalized = normalized.replace(/^울산(광역시|시)?\s*/i, "");
  normalized = normalized.replace(/^세종(특별자치시|시)?\s*/i, "");
  normalized = normalized.replace(/^강원(도|특별자치도)?\s*/i, "");
  normalized = normalized.replace(/^충청(남도|북도)?\s*/i, "");
  normalized = normalized.replace(/^전라(남도|북도)?\s*/i, "");
  normalized = normalized.replace(/^경상(남도|북도)?\s*/i, "");
  normalized = normalized.replace(/^제주(특별자치도|도)?\s*/i, "");

  // 공백 정리
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized || null;
}

/**
 * 주소에서 동/번지를 추출합니다.
 * 
 * 예시:
 * - "중랑구 면목동 137-14" → "면목동 137-14"
 * - "서울 중랑구 면목동 137-14" → "면목동 137-14"
 * 
 * @param address - 원본 주소
 * @returns 동/번지 부분만 추출
 */
export function extractDongBunji(address: string | null | undefined): string | null {
  if (!address || typeof address !== "string") {
    return null;
  }

  // 동 + 번지 패턴 찾기 (예: "면목동 137-14", "관저동 1996")
  const match = address.match(/(\S+동)\s*(\d+(?:-\d+)?)/);
  if (match) {
    return `${match[1]} ${match[2]}`;
  }

  // 동만 있는 경우
  const dongMatch = address.match(/(\S+동)/);
  if (dongMatch) {
    return dongMatch[1];
  }

  // 번지만 있는 경우
  const bunjiMatch = address.match(/(\d+(?:-\d+)?)/);
  if (bunjiMatch) {
    return bunjiMatch[1];
  }

  return normalizeAddress(address);
}

/**
 * 두 주소가 같은 장소를 가리키는지 판단합니다.
 * 
 * @param addr1 - 첫 번째 주소
 * @param addr2 - 두 번째 주소
 * @returns 유사도 (0-1)
 */
export function compareAddresses(
  addr1: string | null | undefined,
  addr2: string | null | undefined
): number {
  if (!addr1 || !addr2) {
    return 0;
  }

  const norm1 = normalizeAddress(addr1);
  const norm2 = normalizeAddress(addr2);

  if (!norm1 || !norm2) {
    return 0;
  }

  // 완전 일치
  if (norm1 === norm2) {
    return 1.0;
  }

  // 한쪽이 다른 쪽을 포함
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return 0.9;
  }

  // 동/번지 추출하여 비교
  const dongBunji1 = extractDongBunji(norm1);
  const dongBunji2 = extractDongBunji(norm2);

  if (dongBunji1 && dongBunji2) {
    if (dongBunji1 === dongBunji2) {
      return 0.8;
    }
    if (dongBunji1.includes(dongBunji2) || dongBunji2.includes(dongBunji1)) {
      return 0.7;
    }
  }

  // 공통 단어 개수로 유사도 계산
  const words1 = norm1.split(/\s+/);
  const words2 = norm2.split(/\s+/);
  const commonWords = words1.filter((w) => words2.includes(w));
  const similarity = commonWords.length / Math.max(words1.length, words2.length);

  return similarity;
}

