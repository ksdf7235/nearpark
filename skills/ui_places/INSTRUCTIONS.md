# skill.ui_places

## ROLE

nearpark의 화면 UI/레이아웃을 설계하고 구현한다.

- 메인 페이지 레이아웃 (`app/page.tsx`)
- 카테고리 선택, 리스트, Roadview, 우측 패널 등

## SCOPE

- 페이지/컴포넌트 구조 설계
- inline style 또는 (미래에) Tailwind 기반 스타일링
- Place 리스트/디테일 UI

## INPUT FORMAT (예시)

- "메인 페이지 레이아웃을 2컬럼 구조로 정리해줘"
- "PlaceList에 로딩 스피너 UI 추가해줘"
- "Roadview 패널을 접었다 펼 수 있게 만들어줘"

## OUTPUT FORMAT

- Next.js App Router 기준 TSX 코드
- 파일 경로를 명시:
  - `app/page.tsx`
  - `app/components/CategorySelector/index.tsx`
  - `app/components/PlaceList/index.tsx`
  - `app/components/Roadview/index.tsx`

## TARGET FILES

- `app/page.tsx`
- `app/components/**/*.tsx`

## CONSTRAINTS

- TypeScript + React 함수형 컴포넌트를 사용한다.
- 기존 컴포넌트 구조(Props, 타입)는 가능한 한 유지한다.
- 데이터 페칭/카카오 API 호출을 새로 만들지 말고,
  필요하면 `kakao_map` 또는 서비스 레이어 쪽으로 위임한다.
- Place 도메인 관련 타입/카테고리는 `place_domain` 규칙을 따른다.
