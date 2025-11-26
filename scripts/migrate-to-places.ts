/**
 * urban_parks 데이터를 places 테이블로 마이그레이션하는 스크립트
 *
 * 주소 기반으로 중복을 제거하면서 데이터를 통합합니다.
 *
 * 사용법:
 *   npm run migrate:to-places
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { normalizeAddress } from "../app/lib/utils/address";

// .env 파일 로드
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase 환경변수가 설정되지 않았습니다.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const BATCH_SIZE = 500;

async function migrateToPlaces() {
  console.log("🔄 urban_parks → places 마이그레이션 시작\n");

  // 1. urban_parks 데이터 조회
  console.log("📂 urban_parks 데이터 조회 중...");
  const { data: urbanParks, error: fetchError } = await supabase
    .from("urban_parks")
    .select("*")
    .not("lat", "is", null)
    .not("lng", "is", null);

  if (fetchError) {
    console.error("❌ 데이터 조회 실패:", fetchError);
    process.exit(1);
  }

  if (!urbanParks || urbanParks.length === 0) {
    console.log("❌ 마이그레이션할 데이터가 없습니다.");
    return;
  }

  console.log(`✅ ${urbanParks.length}개 레코드 발견\n`);

  // 2. Place 형식으로 변환
  console.log("🔄 Place 형식으로 변환 중...");
  const places = urbanParks.map((park) => {
    const address = park.road_address || park.jibun_address || "";
    const normalizedAddr = normalizeAddress(address);

    // ID 생성: source_prefix + 원본 ID
    const placeId = `public_data_${park.id}`;

    return {
      id: placeId,
      name: park.name,
      category: "park",
      source: "public_data",
      source_id: park.id,
      road_address: park.road_address,
      jibun_address: park.jibun_address,
      normalized_address: normalizedAddr,
      lat: park.lat!,
      lng: park.lng!,
      phone: park.phone,
      park_type: park.park_type,
      area: park.area?.toString() || null,
      has_playground: park.has_playground,
      has_gym: park.has_gym,
      has_toilet: park.has_toilet,
      has_parking: park.has_parking,
      has_bench: park.has_bench,
      has_stage_or_culture: park.has_stage_or_culture,
    };
  });

  console.log(`✅ 변환 완료: ${places.length}개\n`);

  // 3. 배치 단위로 삽입 (UPSERT - 주소+좌표 기반 중복 제거)
  console.log(`📦 배치 단위로 삽입 시작 (배치 크기: ${BATCH_SIZE})...\n`);

  let totalSuccess = 0;
  let totalFailed = 0;
  let totalDuplicates = 0;
  const totalBatches = Math.ceil(places.length / BATCH_SIZE);

  for (let i = 0; i < places.length; i += BATCH_SIZE) {
    const batch = places.slice(i, i + BATCH_SIZE);
    const batchIndex = Math.floor(i / BATCH_SIZE) + 1;

    try {
      // UPSERT: normalized_address + lat + lng이 같으면 업데이트
      const { data, error } = await supabase
        .from("places")
        .upsert(batch, {
          onConflict: "normalized_address,lat,lng",
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        // unique 제약조건 위반은 중복으로 간주
        if (
          error.message.includes("duplicate") ||
          error.message.includes("unique")
        ) {
          totalDuplicates += batch.length;
          console.log(
            `⚠️  Batch ${batchIndex}: ${batch.length}개 중복 (이미 존재)`
          );
        } else {
          console.error(`❌ Batch ${batchIndex} 삽입 실패:`, error.message);
          totalFailed += batch.length;
        }
      } else {
        const inserted = data?.length || 0;
        totalSuccess += inserted;
        console.log(`✅ Batch ${batchIndex}: ${inserted}개 레코드 처리 완료`);
      }
    } catch (err) {
      console.error(`❌ Batch ${batchIndex} 예외 발생:`, err);
      totalFailed += batch.length;
    }

    const progress = ((batchIndex / totalBatches) * 100).toFixed(1);
    console.log(`진행률: ${progress}% (${batchIndex}/${totalBatches} 배치)\n`);

    if (batchIndex < totalBatches) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // 4. geom 업데이트
  console.log("\n📍 PostGIS geom 컬럼 업데이트 중...");
  const { error: geomError } = await supabase.rpc("update_places_geom");

  if (geomError) {
    console.log("⚠️  geom 업데이트는 수동으로 실행하세요:");
    console.log(`
UPDATE places
SET geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
WHERE lat IS NOT NULL AND lng IS NOT NULL AND geom IS NULL;
    `);
  } else {
    console.log("✅ geom 업데이트 완료");
  }

  // 5. 결과 요약
  console.log("\n" + "=".repeat(50));
  console.log("📊 마이그레이션 완료 요약");
  console.log("=".repeat(50));
  console.log(`전체 레코드: ${urbanParks.length.toLocaleString()}개`);
  console.log(`✅ 성공: ${totalSuccess.toLocaleString()}개`);
  console.log(`⚠️  중복: ${totalDuplicates.toLocaleString()}개`);
  console.log(`❌ 실패: ${totalFailed.toLocaleString()}개`);
  console.log("=".repeat(50));
}

migrateToPlaces().catch((error) => {
  console.error("❌ 예상치 못한 오류:", error);
  process.exit(1);
});
