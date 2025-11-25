/**
 * Supabase 타입 생성 스크립트
 * 
 * 사용법:
 *   npm run db:typegen
 * 
 * 환경변수:
 *   SUPABASE_PROJECT_ID - Supabase 프로젝트 ID
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { execSync } from "child_process";
import * as fs from "fs";

// .env 파일 로드
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const projectId = process.env.SUPABASE_PROJECT_ID;

if (!projectId) {
  console.error("❌ SUPABASE_PROJECT_ID 환경변수가 설정되지 않았습니다.");
  console.error("\n.env.local 파일에 다음을 추가하세요:");
  console.error("  SUPABASE_PROJECT_ID=your-project-id");
  console.error("\n프로젝트 ID는 Supabase Dashboard > Settings > General에서 확인할 수 있습니다.");
  process.exit(1);
}

try {
  console.log(`📝 Supabase 타입 생성 중... (Project ID: ${projectId})`);
  
  const command = `supabase gen types typescript --project-id ${projectId} --schema public`;
  const output = execSync(command, { encoding: "utf-8" });
  
  const outputPath = path.resolve(process.cwd(), "database.types.ts");
  fs.writeFileSync(outputPath, output, "utf-8");
  
  console.log(`✅ 타입 파일 생성 완료: ${outputPath}`);
} catch (err: any) {
  console.error("❌ 타입 생성 실패:", err.message);
  console.error("\nSupabase CLI가 설치되어 있는지 확인하세요:");
  console.error("  npm install -g supabase");
  process.exit(1);
}

