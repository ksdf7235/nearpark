import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
import * as path from "path";

// .env 파일 로드
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseDbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL 환경변수가 설정되지 않았습니다.");
}

// Supabase 연결 문자열 생성
// 형식: postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres
// SUPABASE_URL에서 프로젝트 참조 추출
const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  throw new Error("SUPABASE_URL에서 프로젝트 참조를 추출할 수 없습니다.");
}

// DB 비밀번호는 환경변수에서 가져오거나, Supabase Dashboard > Settings > Database에서 확인
// 또는 연결 문자열 전체를 SUPABASE_DB_URL 환경변수로 제공할 수도 있습니다
// 
// Supabase 연결 문자열 형식:
// - Pooler (권장): postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
// - Direct: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
//
// 중요: Supabase Dashboard > Settings > Database > Connection string에서 정확한 연결 문자열을 복사하세요.
// Pooler 모드의 Session mode URI를 사용하는 것을 권장합니다.

let dbUrl = process.env.SUPABASE_DB_URL;

if (!dbUrl && supabaseDbPassword) {
  // 자동 생성 시도 (지역은 ap-northeast-2로 가정)
  // 정확한 지역은 Supabase Dashboard에서 확인하세요
  dbUrl = `postgresql://postgres.${projectRef}:${encodeURIComponent(supabaseDbPassword)}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`;
}

if (!dbUrl) {
  console.error("❌ SUPABASE_DB_URL 또는 SUPABASE_DB_PASSWORD가 설정되지 않았습니다.");
  console.error("\n📋 해결 방법:");
  console.error("1. Supabase Dashboard > Settings > Database로 이동");
  console.error("2. Connection string > Connection pooling > Session mode URI 복사");
  console.error("3. .env.local에 다음 형식으로 추가:");
  console.error("   SUPABASE_DB_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres");
  console.error("\n또는 비밀번호만 설정:");
  console.error("   SUPABASE_DB_PASSWORD=your_database_password_here");
  throw new Error("데이터베이스 연결 정보가 필요합니다.");
}

export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl || "",
  },
  // 주의: unique 제약조건이 있는 경우 충돌 가능
  // 마이그레이션 전에 테이블이 비어있어야 함
} satisfies Config;

