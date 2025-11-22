# Skill System for nearpark

이 레포는 "스킬 기반"으로 개발을 진행한다.

## 1. 스킬 구조

- 모든 스킬은 `skills/<skill_name>/INSTRUCTIONS.md` 파일로 정의된다.
- 스킬들은 서로 책임이 **겹치지 않도록** 설계되어 있다.
- 공통 규칙(Next.js, TypeScript, Place 철학 등)은
  `skills/project_meta/INSTRUCTIONS.md`에 정의되어 있으며,
  모든 스킬은 이 규칙을 **공유**한다.

## 2. 너(LLM)의 기본 원칙

1. 어떤 작업이든 시작할 때 **반드시** 다음 두 파일의 규칙을 우선 적용한다.

   - `skills/00_SKILL_SYSTEM.md`
   - `skills/project_meta/INSTRUCTIONS.md`

2. 내가 `skill: <name>` 이라고 지시하면,
   너는 **반드시** `skills/<name>/INSTRUCTIONS.md`를 참고해 작업해야 한다.

   - 필요한 경우 관련된 다른 스킬(예: `ui_places` + `kakao_map`)을 함께 사용할 수 있다.

3. 여러 스킬이 필요한 작업일 경우, 답변은 다음 형식을 따른다.

   **PLAN**

   - 사용할 스킬 이름과 순서, 각 역할을 3~6줄로 요약

   **CODE**

   - 실제 코드/파일 변경 제안 (TSX/TS/SQL 등)

   **NEXT**

   - 사용자가 직접 수행하면 좋은 후속 액션 (예: "이 파일을 생성 후 dev 서버를 재시작 하세요")

   **USED SKILLS**

   - 사용한 스킬 이름 목록

4. 스킬 INSTRUCTIONS에 있는 규칙은
   네 일반적인 코딩 습관보다 **우선 순위가 더 높다.**

   - 스킬 규칙과 충돌하는 코드는 만들지 않는다.

5. 대화가 길어져서 컨텍스트가 요약되더라도,
   중요한 규칙은 항상 `skills/**/*.md`에 있으므로,
   새 작업을 할 때마다 필요한 스킬 md를 다시 참고한다.

## 3. 스킬 목록

- `project_meta` : nearpark 전체 공통 규칙
- `ui_places` : 공원/문화시설 관련 페이지 & 컴포넌트 UI
- `kakao_map` : Kakao Map SDK & Kakao Local API & 거리 계산
- `place_domain` : Place/PlaceCategory 도메인 모델 규칙
- `api_public_data` : 공공데이터/향후 API 라우트 설계
- `persistence_supabase` : (미래) 즐겨찾기/메모 저장용 Supabase 연동

## 4. 답변 형식

모든 답변은 가능한 한 다음 네 섹션을 포함한다.

1. PLAN
2. CODE
3. NEXT
4. USED SKILLS
