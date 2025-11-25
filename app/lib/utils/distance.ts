/**
 * 거리 계산 유틸리티
 *
 * 지리적 좌표 간 거리 계산 함수를 제공합니다.
 */

/**
 * 두 지점 간의 거리를 계산합니다 (Haversine 공식)
 *
 * @param lat1 - 첫 번째 지점 위도
 * @param lng1 - 첫 번째 지점 경도
 * @param lat2 - 두 번째 지점 위도
 * @param lng2 - 두 번째 지점 경도
 * @returns 거리 (미터 단위)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // 지구 반경 (미터)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 거리를 포맷팅합니다 (미터 → m/km)
 */
export function formatDistance(distanceInMeters: number): string {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)}m`;
  }
  return `${(distanceInMeters / 1000).toFixed(1)}km`;
}
