/**
 * 전국 도시공원 공공데이터 JSON → Supabase import 스크립트
 * 
 * 사용법:
 *   npm run import:parks [json-file-path]
 *   또는
 *   npx tsx scripts/import_urban_parks.ts [json-file-path]
 * 
 * 예시:
 *   npm run import:parks ./parkdata/koreapark.json
 *   npx tsx scripts/import_urban_parks.ts ./parkdata/koreapark.json
 * 
 * 환경변수:
 *   SUPABASE_URL - Supabase 프로젝트 URL
 *   SUPABASE_SERVICE_ROLE_KEY - Supabase Service Role Key (서버 사이드 전용)
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import type { RawUrbanParkFile, UrbanParkDbRow } from "../app/types/urban_park";
import { convertUrbanParkRecord } from "../app/lib/utils/urban-park";

// .env 파일 로드
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// 환경변수 확인
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ 환경변수가 설정되지 않았습니다.");
  console.error("필요한 환경변수:");
  console.error("  - SUPABASE_URL");
  console.error("  - SUPABASE_SERVICE_ROLE_KEY");
  console.error("\n.env.local 파일에 다음을 추가하세요:");
  console.error("  SUPABASE_URL=https://your-project.supabase.co");
  console.error("  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key");
  process.exit(1);
}

// Supabase 클라이언트 생성 (Service Role Key 사용)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 배치 크기
const BATCH_SIZE = 500;

// PostGIS geom은 별도 SQL 스크립트로 업데이트합니다.
// db/update_geom.sql 파일을 Supabase SQL Editor에서 실행하세요.

/**
 * 배치 단위로 데이터 삽입
 */
async function insertBatch(
  rows: UrbanParkDbRow[],
  batchIndex: number
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  try {
    // geom 컬럼은 별도 SQL 스크립트(db/update_geom.sql)로 업데이트합니다.
    // 여기서는 기본 데이터만 삽입합니다.

    const { data, error } = await supabase
      .from("urban_parks")
      .insert(rows)
      .select();

    if (error) {
      console.error(`❌ Batch ${batchIndex} 삽입 실패:`, error.message);
      
      // 테이블이 없는 경우 명확한 안내
      if (error.message.includes("Could not find the table") || error.message.includes("relation") || error.message.includes("does not exist")) {
        console.error("\n⚠️  테이블이 존재하지 않습니다!");
        console.error("다음 단계를 수행하세요:");
        console.error("1. Supabase Dashboard → SQL Editor로 이동");
        console.error("2. db/schema_urban_parks.sql 파일의 내용을 복사하여 실행");
        console.error("3. 테이블 생성 후 다시 이 스크립트를 실행하세요.\n");
      }
      
      failed = rows.length;
    } else {
      success = data?.length || 0;
      console.log(`✅ Batch ${batchIndex}: ${success}개 레코드 삽입 완료`);
    }
  } catch (err) {
    console.error(`❌ Batch ${batchIndex} 예외 발생:`, err);
    failed = rows.length;
  }

  return { success, failed };
}

/**
 * geom 컬럼 업데이트 안내
 */
function showGeomUpdateInstructions(): void {
  console.log("\n📍 PostGIS geom 컬럼 업데이트 안내:");
  console.log("   db/update_geom.sql 파일을 Supabase SQL Editor에서 실행하세요.");
  console.log("   또는 다음 SQL을 직접 실행:");
  console.log(`
   UPDATE urban_parks
   SET geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
   WHERE lat IS NOT NULL AND lng IS NOT NULL AND geom IS NULL;
  `);
}

/**
 * 메인 함수
 */
async function main() {
  const jsonFilePath = process.argv[2];

  if (!jsonFilePath) {
    console.error("❌ JSON 파일 경로를 지정해주세요.");
    console.error("사용법: npx ts-node scripts/import_urban_parks.ts <json-file-path>");
    process.exit(1);
  }

  const absolutePath = path.resolve(process.cwd(), jsonFilePath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ 파일을 찾을 수 없습니다: ${absolutePath}`);
    process.exit(1);
  }

  console.log(`📂 JSON 파일 읽는 중: ${absolutePath}`);

  // JSON 파일 읽기
  let rawData: RawUrbanParkFile;
  try {
    const fileContent = fs.readFileSync(absolutePath, "utf-8");
    rawData = JSON.parse(fileContent);
  } catch (err) {
    console.error("❌ JSON 파일 읽기/파싱 실패:", err);
    process.exit(1);
  }

  const totalRecords = rawData.records.length;
  console.log(`📊 총 레코드 수: ${totalRecords.toLocaleString()}개\n`);

  // 레코드 변환
  console.log("🔄 레코드 변환 중...");
  const dbRows: UrbanParkDbRow[] = rawData.records.map((rec) =>
    convertUrbanParkRecord(rec)
  );
  console.log(`✅ 변환 완료: ${dbRows.length}개\n`);

  // 배치 단위로 삽입
  console.log(`📦 배치 단위로 삽입 시작 (배치 크기: ${BATCH_SIZE})...\n`);

  let totalSuccess = 0;
  let totalFailed = 0;
  const totalBatches = Math.ceil(dbRows.length / BATCH_SIZE);

  for (let i = 0; i < dbRows.length; i += BATCH_SIZE) {
    const batch = dbRows.slice(i, i + BATCH_SIZE);
    const batchIndex = Math.floor(i / BATCH_SIZE) + 1;

    const { success, failed } = await insertBatch(batch, batchIndex);
    totalSuccess += success;
    totalFailed += failed;

    // 진행률 표시
    const progress = ((batchIndex / totalBatches) * 100).toFixed(1);
    console.log(`진행률: ${progress}% (${batchIndex}/${totalBatches} 배치)\n`);

    // API rate limit 방지를 위한 짧은 대기
    if (batchIndex < totalBatches) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // 결과 요약
  console.log("\n" + "=".repeat(50));
  console.log("📊 Import 완료 요약");
  console.log("=".repeat(50));
  console.log(`전체 레코드: ${totalRecords.toLocaleString()}개`);
  console.log(`✅ 성공: ${totalSuccess.toLocaleString()}개`);
  console.log(`❌ 실패: ${totalFailed.toLocaleString()}개`);
  console.log("=".repeat(50));

  // geom 업데이트 안내
  if (totalSuccess > 0) {
    showGeomUpdateInstructions();
  }

  if (totalFailed > 0) {
    console.log("\n⚠️  일부 레코드 삽입에 실패했습니다. 로그를 확인하세요.");
    process.exit(1);
  } else {
    console.log("\n🎉 모든 레코드가 성공적으로 삽입되었습니다!");
  }
}

// 스크립트 실행
main().catch((err) => {
  console.error("❌ 예상치 못한 오류:", err);
  process.exit(1);
});

