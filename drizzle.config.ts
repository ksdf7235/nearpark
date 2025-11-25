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
const dbUrl = process.env.SUPABASE_DB_URL || 
  (supabaseDbPassword 
    ? `postgresql://postgres.${projectRef}:${encodeURIComponent(supabaseDbPassword)}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`
    : undefined);

if (!dbUrl) {
  console.warn("⚠️  SUPABASE_DB_URL 또는 SUPABASE_DB_PASSWORD가 설정되지 않았습니다.");
  console.warn("   drizzle-kit push/migrate를 사용하려면 데이터베이스 연결 정보가 필요합니다.");
  console.warn("   .env.local에 다음 중 하나를 추가하세요:");
  console.warn("   - SUPABASE_DB_URL=postgresql://postgres:[password]@[host]:[port]/postgres");
  console.warn("   - SUPABASE_DB_PASSWORD=[your-db-password]");
}

export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl || "",
  },
} satisfies Config;

