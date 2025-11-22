# skill.kakao_map

## ROLE

Kakao Map SDK 및 Kakao Local API 연동을 담당한다.

## SCOPE

- Kakao Map JS SDK 동적 로딩 (`useKakaoLoader`)
- 지도 생성/마커 표시/지도 옵션 변경 (MapClient 내부 로직)
- Kakao Local API 검색 (`app/services/kakao.ts`)
- 거리 계산 유틸리티 (`calculateDistance`)

## INPUT FORMAT (예시)

- "카테고리별로 검색 반경을 다르게 설정해줘"
- "지도에 선택된 Place를 강조하도록 마커 이미지를 바꿔줘"
- "현재 위치 마커에 커스텀 이미지 적용해줘"

## OUTPUT FORMAT

- TypeScript 코드 (TS/TSX)
- 수정 대상 파일을 명시:
  - `app/hooks/useKakaoLoader.ts`
  - `app/services/kakao.ts`
  - `app/components/MapClient/index.tsx`
  - (필요시) Kakao 타입 정의는 `types/kakao.d.ts`를 사용/확장

## TARGET FILES

- `app/hooks/useKakaoLoader.ts`
- `app/services/kakao.ts`
- `app/components/MapClient/index.tsx`
- `types/kakao.d.ts`

## CONSTRAINTS

- Kakao SDK 관련 타입은 `types/kakao.d.ts`를 기준으로 확장한다.
- 네트워크 호출(Kakao Local API 요청)은 `services/kakao.ts`에 두고,
  컴포넌트에서는 이 서비스를 호출만 한다.
- Place/PlaceCategory 변환 로직은 `place_domain` 규칙에 맞춰 구현한다.
- 브라우저 전용 기능(geolocation 등)은 Client Component(`"use client"`) 안에서만 사용한다.
