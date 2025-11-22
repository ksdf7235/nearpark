# skill.place_domain

## ROLE

Place 및 관련 타입/상수의 도메인 규칙을 정의하고 유지한다.

## SCOPE

- `app/types/place.ts` 안의 타입/상수/헬퍼 함수
- 새로운 PlaceCategory 추가/삭제/변경
- 카테고리 라벨, 카테고리 리스트, 소스 구분 등

## INPUT FORMAT (예시)

- "새로운 카테고리 'performance_hall'을 추가해줘"
- "기타(etc)를 제외하고 사용 가능한 카테고리만 반환하는 헬퍼를 만들어줘"

## OUTPUT FORMAT

- `app/types/place.ts` 전체 또는 일부 수정 코드
- 필요한 경우, `services/kakao.ts`의 CATEGORY_QUERY_MAP 수정 제안

## TARGET FILES

- `app/types/place.ts`
- (필요시) `app/services/kakao.ts` 내 카테고리 → 검색어 매핑

## CONSTRAINTS

- Place 관련 로직은 가능한 한 `place.ts`에 집중시킨다.
- 카테고리 추가/변경 시:
  - 타입, 라벨, 카테고리 리스트, 검색어 매핑이 서로 일관되게 유지되도록 한다.
- 다른 스킬(UI, Kakao Map, API 등)은 이 도메인 규칙을 신뢰하고 사용한다.
