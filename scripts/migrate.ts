/**
 * Drizzle 마이그레이션 실행 스크립트
 *
 * 생성된 마이그레이션 파일을 데이터베이스에 적용합니다.
 *
 * 사용법:
 *   npm run db:migrate
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { migrate } from "drizzle-orm/postgres-js/migrator";

// .env 파일 로드
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseDbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!supabaseUrl) {
  console.error("❌ SUPABASE_URL 환경변수가 설정되지 않았습니다.");
  process.exit(1);
}

// Supabase 연결 문자열 생성
const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error("❌ SUPABASE_URL에서 프로젝트 참조를 추출할 수 없습니다.");
  process.exit(1);
}

const dbUrl =
  process.env.SUPABASE_DB_URL ||
  (supabaseDbPassword
    ? `postgresql://postgres.${projectRef}:${encodeURIComponent(
        supabaseDbPassword
      )}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`
    : undefined);

if (!dbUrl) {
  console.error(
    "❌ SUPABASE_DB_URL 또는 SUPABASE_DB_PASSWORD가 설정되지 않았습니다."
  );
  console.error("   .env.local에 다음 중 하나를 추가하세요:");
  console.error(
    "   - SUPABASE_DB_URL=postgresql://postgres:[password]@[host]:[port]/postgres"
  );
  console.error("   - SUPABASE_DB_PASSWORD=[your-db-password]");
  process.exit(1);
}

// 마이그레이션 폴더 확인 (drizzle.config.ts의 out 설정에 맞춤)
const migrationsFolder = path.resolve(process.cwd(), "drizzle");
if (!fs.existsSync(migrationsFolder)) {
  console.error(`❌ 마이그레이션 폴더를 찾을 수 없습니다: ${migrationsFolder}`);
  console.error(
    "   먼저 'npm run db:generate'를 실행하여 마이그레이션 파일을 생성하세요."
  );
  process.exit(1);
}

// meta/_journal.json 확인
const journalPath = path.resolve(migrationsFolder, "meta/_journal.json");
if (!fs.existsSync(journalPath)) {
  console.error(
    `❌ meta/_journal.json 파일을 찾을 수 없습니다: ${journalPath}`
  );
  console.error(
    "   먼저 'npm run db:generate'를 실행하여 마이그레이션 파일을 생성하세요."
  );
  process.exit(1);
}

const migrationFiles = fs
  .readdirSync(migrationsFolder)
  .filter((file) => file.endsWith(".sql") && !file.startsWith("."));

if (migrationFiles.length === 0) {
  console.error("❌ 마이그레이션 파일이 없습니다.");
  console.error(
    "   먼저 'npm run db:generate'를 실행하여 마이그레이션 파일을 생성하세요."
  );
  process.exit(1);
}

async function runMigrations() {
  console.log("🔄 마이그레이션 실행 중...");
  console.log(`📁 마이그레이션 폴더: ${migrationsFolder}`);
  console.log(`📄 마이그레이션 파일: ${migrationFiles.length}개\n`);

  const client = postgres(dbUrl, { max: 1 });
  const db = drizzle(client);

  try {
    await migrate(db, { migrationsFolder });
    console.log("✅ 마이그레이션 완료!");
  } catch (error) {
    console.error("❌ 마이그레이션 실패:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations().catch((error) => {
  console.error("❌ 예상치 못한 오류:", error);
  process.exit(1);
});
