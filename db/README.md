# 데이터베이스 스키마 관리

이 프로젝트는 **Drizzle ORM**과 **Drizzle Kit**을 사용하여 데이터베이스 스키마를 관리합니다.

## 📁 파일 구조

```
db/
  schema.ts              # Drizzle ORM 스키마 정의 (TypeScript)
  schema_urban_parks.sql # 원본 SQL 스키마 (참고용)
  update_geom.sql        # PostGIS geom 업데이트 SQL

drizzle/
  migrations/            # 생성된 마이그레이션 파일들
```

## 🚀 사용 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.local` 파일에 다음을 추가하세요:

```env
# Supabase Database 연결 (Drizzle Kit용)
# 방법 1: 전체 연결 문자열 사용 (권장)
SUPABASE_DB_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres

# 방법 2: 비밀번호만 설정
SUPABASE_DB_PASSWORD=your_database_password_here

# Supabase Project ID (타입 생성용)
SUPABASE_PROJECT_ID=your-project-id
```

**연결 문자열 찾는 방법:**
1. Supabase Dashboard → Settings → Database
2. Connection string → Connection pooling → Session mode
3. URI 형식의 연결 문자열 복사

### 3. 스키마 변경 후 마이그레이션 생성

`db/schema.ts` 파일을 수정한 후:

```bash
npm run db:generate
```

이 명령은 `drizzle/migrations/` 폴더에 SQL 마이그레이션 파일을 생성합니다.

### 4. 마이그레이션 적용

생성된 마이그레이션을 데이터베이스에 적용:

```bash
npm run db:migrate
```

또는 Drizzle Kit의 push 기능 사용 (개발 환경):

```bash
npm run db:push
```

### 5. 데이터베이스 타입 생성

Supabase CLI를 사용하여 TypeScript 타입 생성:

```bash
npm run db:typegen
```

이 명령은 `database.types.ts` 파일을 생성합니다.

**참고:** Supabase CLI가 설치되어 있어야 합니다:
```bash
npm install -g supabase
```

### 6. Drizzle Studio (선택사항)

데이터베이스 브라우저 UI:

```bash
npm run db:studio
```

## 📝 주요 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run db:generate` | 스키마 변경사항을 기반으로 마이그레이션 파일 생성 |
| `npm run db:migrate` | 생성된 마이그레이션을 데이터베이스에 적용 |
| `npm run db:push` | 스키마를 직접 데이터베이스에 푸시 (개발용) |
| `npm run db:studio` | Drizzle Studio UI 실행 |
| `npm run db:typegen` | Supabase에서 TypeScript 타입 생성 |

## ⚠️ 주의사항

1. **PostGIS geom 컬럼**: Drizzle ORM은 PostGIS 타입을 직접 지원하지 않으므로, `geom` 컬럼은 마이그레이션에서 수동으로 추가해야 합니다.

2. **GIST 인덱스**: PostGIS의 GIST 인덱스도 마이그레이션에서 수동으로 추가해야 합니다.

3. **프로덕션 환경**: 프로덕션에서는 `db:push` 대신 `db:migrate`를 사용하세요.

## 🔄 기존 SQL 스키마와의 관계

- `db/schema_urban_parks.sql`: 원본 SQL 스키마 (참고용)
- `db/schema.ts`: Drizzle ORM 스키마 (실제 사용)
- `drizzle/migrations/`: 생성된 마이그레이션 파일들

스키마 변경은 `db/schema.ts`에서만 수행하고, `npm run db:generate`로 마이그레이션을 생성하세요.

