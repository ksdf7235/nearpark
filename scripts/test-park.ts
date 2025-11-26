/**
 * 공원 데이터 테스트 스크립트
 * 
 * 사용법:
 *   npm run test:park "햇살어린이공원"
 *   또는
 *   tsx scripts/test-park.ts "햇살어린이공원"
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// .env 파일 로드
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// 스크립트용 Supabase 클라이언트 (Node.js 환경)
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase 환경변수가 설정되지 않았습니다.");
  console.error("   .env.local에 다음을 추가하세요:");
  console.error("   SUPABASE_URL=https://your-project.supabase.co");
  console.error("   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testPark() {
  const searchTerm = process.argv[2] || "";

  if (!searchTerm) {
    console.error("❌ 검색어를 입력하세요.");
    console.error("   사용법: npm run test:park <검색어>");
    console.error("   예시: npm run test:park \"햇살어린이공원\"");
    console.error("   예시: npm run test:park \"면목동\"");
    process.exit(1);
  }

  console.log(`🔍 "${searchTerm}" 검색 중...\n`);

  // 이름 또는 주소로 검색
  const { data, error } = await supabase
    .from("urban_parks")
    .select("*")
    .or(`name.ilike.%${searchTerm}%,road_address.ilike.%${searchTerm}%,jibun_address.ilike.%${searchTerm}%`)
    .limit(20);

  if (error) {
    console.error("❌ 오류:", error);
    return;
  }

  if (!data || data.length === 0) {
    console.log(`❌ "${parkName}" 이름의 공원을 찾을 수 없습니다.`);
    return;
  }

  console.log(`✅ ${data.length}개 공원을 찾았습니다:\n`);

  data.forEach((park, index) => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`[${index + 1}] ${park.name}`);
    console.log(`${"=".repeat(60)}`);
    console.log(JSON.stringify(park, null, 2));
  });

  // 첫 번째 결과 상세 출력
  if (data.length > 0) {
    const firstPark = data[0];
    console.log(`\n\n📊 첫 번째 결과 상세 정보:`);
    console.log(`   ID: ${firstPark.id}`);
    console.log(`   이름: ${firstPark.name}`);
    console.log(`   공원구분: ${firstPark.park_type}`);
    console.log(`   주소: ${firstPark.road_address || firstPark.jibun_address || "없음"}`);
    console.log(`   위치: ${firstPark.lat}, ${firstPark.lng}`);
    console.log(`   면적: ${firstPark.area ? `${firstPark.area}m²` : "없음"}`);
    console.log(`   전화번호: ${firstPark.phone || "없음"}`);
    console.log(`   시설:`);
    console.log(`     - 놀이시설: ${firstPark.has_playground ? "✅" : "❌"}`);
    console.log(`     - 운동시설: ${firstPark.has_gym ? "✅" : "❌"}`);
    console.log(`     - 화장실: ${firstPark.has_toilet ? "✅" : "❌"}`);
    console.log(`     - 주차장: ${firstPark.has_parking ? "✅" : "❌"}`);
    console.log(`   시설 상세:`);
    if (firstPark.play_facilities) {
      console.log(`     유희시설: ${firstPark.play_facilities}`);
    }
    if (firstPark.sports_facilities) {
      console.log(`     운동시설: ${firstPark.sports_facilities}`);
    }
  }
}

testPark().catch((error) => {
  console.error("❌ 예상치 못한 오류:", error);
  process.exit(1);
});

