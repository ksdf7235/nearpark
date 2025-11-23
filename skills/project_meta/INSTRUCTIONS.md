# skill.project_meta

## ROLE

nearpark 프로젝트의 공통 개발 철학과 기술 규칙을 정의한다.

## SCOPE

- 프레임워크/언어 선택
- 코드 스타일/파일 구조
- Place 중심 아키텍처 철학
- Kakao Map/Local API 사용에 대한 전역 원칙

## RULES

1. 프레임워크 & 언어

   - Next.js 14 App Router를 사용한다. (`app/` 디렉터리 기준)
   - TypeScript만 사용한다. (`.js` 파일 신규 생성 금지)
   - React 함수형 컴포넌트를 기본으로 한다.

2. 도메인 철학 (Place 중심 설계)

   - `app/types/place.ts`의 주석에 있는 철학을 따른다.
   - 공원, 미술관, 도서관, 문화센터 등은 모두 **Place 엔티티**이며,
     구분은 `PlaceCategory`로만 한다.
   - 새로운 시설 종류를 추가할 때는:
     - `PlaceCategory` union 타입에 추가
     - `CATEGORY_LABELS`, `PLACE_CATEGORIES`를 업데이트
     - (필요시) Kakao 검색어 매핑은 `services/kakao.ts`에서 처리

3. 스타일

   - **Tailwind CSS를 기본 스타일링 방법으로 사용한다.**
   - 기존 inline style이 있더라도, 새로 추가하는 UI는 Tailwind CSS 클래스를 사용한다.
   - 기존 inline style을 Tailwind로 마이그레이션할 때는 점진적으로 진행하며,
     `ui_places` 스킬의 규칙을 참고한다.
   - Tailwind 설정 파일:
     - `tailwind.config.js`: Tailwind 설정
     - `postcss.config.js`: PostCSS 설정
     - `app/globals.css`: Tailwind 디렉티브 포함

4. 데이터 & API

   - Kakao Local API를 기본 검색 소스로 사용한다.
   - Kakao 관련 로직은 `kakao_map` 스킬이 담당하며,
     컴포넌트 안에 로직을 새로 만들지 말고 서비스/훅 레이어를 우선 고려한다.
   - 향후 Supabase/공공데이터를 붙일 경우,
     `persistence_supabase`, `api_public_data` 스킬 규칙을 따른다.

5. 파일 구조

   - 페이지/레이아웃:
     - `app/page.tsx`, `app/layout.tsx`
   - UI 컴포넌트:
     - `app/components/**`
   - 도메인 타입:
     - `app/types/place.ts`
   - Kakao 관련 로직:
     - `app/hooks/useKakaoLoader.ts`
     - `app/services/kakao.ts`
     - `types/kakao.d.ts`

6. 규칙 변경
   - 새로운 공통 규칙이 필요해지면,
     먼저 이 파일에 추가/수정한 뒤 LLM에게 작업을 요청한다.
