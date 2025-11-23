# skill.ui_tailwind_refactor

## ROLE

nearpark의 기존 UI를 Tailwind 기반 레이아웃/스타일로
**점진적으로 리팩터링**한다.

- 기능/동작은 그대로 유지하고,
- className / 구조 / globals.css 의존성을 줄여나간다.

## SCOPE

이 스킬이 하는 일:

- `app/layout.tsx`, `app/page.tsx`의 전체 레이아웃을 Tailwind로 정리
- `app/components/*` 컴포넌트의 레이아웃/스타일을 Tailwind로 변환
- 필요한 경우, `app/globals.css`에 있던 공통 스타일을 Tailwind 유틸/extend로 옮기는 제안

이 스킬이 **하지 않는 일**:

- Kakao API 호출 로직 변경 (→ `kakao_map`)
- Place 타입/카테고리 구조 변경 (→ `place_domain`)
- 새 기능/버튼/로직 추가 (→ `ui_places`)

즉, 이 스킬은 **"보이는 것만 바꾸고, 하는 일은 그대로 두는 리팩터링"** 전용이다.

---

## PHASES (리팩터링 단계)

이 스킬은 작업을 다음 3단계로 나눈다.

### Phase 0 — Tailwind 설치/환경 정리 (한 번만)

Tailwind가 아직 설치되어 있지 않다면, 다음을 제안한다:

1. 설치 명령어 (설치만 제안, 실제 실행은 사용자가 직접)

   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```
