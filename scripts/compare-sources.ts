/**
 * 카카오 맵 검색 결과와 Supabase 공원 데이터 비교 스크립트
 * 
 * 두 소스의 데이터를 비교하고, 연결할 수 있는 외래키 후보를 분석합니다.
 * 
 * 사용법:
 *   npm run compare:sources "면목동"
 *   또는
 *   tsx scripts/compare-sources.ts "면목동"
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { searchPlaces } from "../app/services/kakao";
import { calculateDistance } from "../app/lib/utils/distance";

// .env 파일 로드
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Supabase 클라이언트
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

/**
 * 두 장소가 같은 장소인지 판단하는 함수
 * 
 * 우선순위:
 * 1. 좌표 거리 (가장 중요) - 50m 이내면 거의 확실
 * 2. 주소 유사성 (중요) - 동/번지 일치
 * 3. 이름 유사도 (보조) - 참고용
 */
function isSamePlace(
  kakaoPlace: { name: string; lat: number; lng: number; address: string },
  supabasePlace: { name: string; lat: number | null; lng: number | null; road_address: string | null; jibun_address: string | null }
): {
  isMatch: boolean;
  confidence: number; // 0-100, 매칭 신뢰도
  reasons: string[];
} {
  const reasons: string[] = [];
  let score = 0;

  // 1. 좌표 거리 (가장 중요) - 50점 만점
  if (supabasePlace.lat && supabasePlace.lng) {
    const distance = calculateDistance(
      kakaoPlace.lat,
      kakaoPlace.lng,
      supabasePlace.lat,
      supabasePlace.lng
    );
    
    if (distance < 10) {
      score += 50; // 10m 이내면 거의 확실
      reasons.push(`좌표 거리: ${distance.toFixed(1)}m (매우 가까움 - 거의 확실)`);
    } else if (distance < 30) {
      score += 45; // 30m 이내면 매우 높은 신뢰도
      reasons.push(`좌표 거리: ${distance.toFixed(1)}m (매우 가까움)`);
    } else if (distance < 50) {
      score += 40; // 50m 이내면 높은 신뢰도
      reasons.push(`좌표 거리: ${distance.toFixed(1)}m (가까움)`);
    } else if (distance < 100) {
      score += 30; // 100m 이내면 보통 신뢰도
      reasons.push(`좌표 거리: ${distance.toFixed(1)}m (보통)`);
    } else if (distance < 200) {
      score += 15; // 200m 이내면 낮은 신뢰도
      reasons.push(`좌표 거리: ${distance.toFixed(1)}m (멀음)`);
    } else {
      reasons.push(`좌표 거리: ${distance.toFixed(1)}m (매우 멀음 - 매칭 불가)`);
    }
  } else {
    reasons.push("좌표 없음 (Supabase)");
  }

  // 2. 주소 유사성 (중요) - 40점 만점
  const supabaseAddress = supabasePlace.road_address || supabasePlace.jibun_address || "";
  if (supabaseAddress && kakaoPlace.address) {
    // 주소를 공백으로 분리하여 비교
    const kakaoParts = kakaoPlace.address.split(/\s+/);
    const supabaseParts = supabaseAddress.split(/\s+/);
    
    // 동/번지 일치 확인
    let matchingParts = 0;
    for (const kakaoPart of kakaoParts) {
      if (supabaseParts.some(sbPart => sbPart.includes(kakaoPart) || kakaoPart.includes(sbPart))) {
        matchingParts++;
      }
    }
    
    const addressSimilarity = matchingParts / Math.max(kakaoParts.length, supabaseParts.length);
    
    if (addressSimilarity >= 0.8) {
      score += 40; // 80% 이상 일치
      reasons.push(`주소 유사도: ${(addressSimilarity * 100).toFixed(1)}% (매우 높음)`);
    } else if (addressSimilarity >= 0.6) {
      score += 30; // 60% 이상 일치
      reasons.push(`주소 유사도: ${(addressSimilarity * 100).toFixed(1)}% (높음)`);
    } else if (addressSimilarity >= 0.4) {
      score += 20; // 40% 이상 일치
      reasons.push(`주소 유사도: ${(addressSimilarity * 100).toFixed(1)}% (보통)`);
    } else if (addressSimilarity > 0) {
      score += 10; // 일부 일치
      reasons.push(`주소 유사도: ${(addressSimilarity * 100).toFixed(1)}% (낮음)`);
    } else {
      reasons.push(`주소 유사도: 0% (일치 없음)`);
    }
  } else {
    reasons.push("주소 정보 부족");
  }

  // 3. 이름 유사도 (보조) - 10점 만점
  const nameSimilarity = calculateNameSimilarity(kakaoPlace.name, supabasePlace.name);
  if (nameSimilarity > 0.9) {
    score += 10;
    reasons.push(`이름 유사도: ${(nameSimilarity * 100).toFixed(1)}% (거의 동일)`);
  } else if (nameSimilarity > 0.7) {
    score += 7;
    reasons.push(`이름 유사도: ${(nameSimilarity * 100).toFixed(1)}% (높음)`);
  } else if (nameSimilarity > 0.5) {
    score += 5;
    reasons.push(`이름 유사도: ${(nameSimilarity * 100).toFixed(1)}% (보통)`);
  } else if (nameSimilarity > 0) {
    score += 2;
    reasons.push(`이름 유사도: ${(nameSimilarity * 100).toFixed(1)}% (낮음)`);
  }

  // 매칭 기준: 좌표가 50m 이내이거나, (좌표 100m 이내 + 주소 60% 이상 일치)
  const isMatch = 
    (supabasePlace.lat && supabasePlace.lng && 
     calculateDistance(kakaoPlace.lat, kakaoPlace.lng, supabasePlace.lat, supabasePlace.lng) < 50) ||
    (score >= 70); // 총점 70점 이상

  return {
    isMatch,
    confidence: Math.min(score, 100),
    reasons,
  };
}

/**
 * 이름 유사도 계산 (간단한 Levenshtein 거리 기반)
 */
function calculateNameSimilarity(str1: string, str2: string): number {
  const s1 = str1.replace(/\s+/g, "").toLowerCase();
  const s2 = str2.replace(/\s+/g, "").toLowerCase();

  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  // 간단한 부분 일치
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.includes(shorter)) return 0.8;

  // Levenshtein 거리 기반 유사도
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(s1, s2);
  return 1 - distance / maxLen;
}

/**
 * Levenshtein 거리 계산
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

async function compareSources() {
  const searchTerm = process.argv[2] || "면목동";

  console.log(`🔍 "${searchTerm}" 검색 결과 비교\n`);
  console.log("=".repeat(80));

  // 1. 카카오 맵 검색
  console.log("\n📱 [1] 카카오 맵 검색 결과");
  console.log("-".repeat(80));
  
  let kakaoPlaces: any[] = [];
  try {
    // 면목동 좌표 (서울 중랑구 면목동)
    const testLat = 37.5889;
    const testLng = 127.0833;
    kakaoPlaces = await searchPlaces("park", testLat, testLng, 2000);
    console.log(`✅ ${kakaoPlaces.length}개 공원 발견 (반경 2km)\n`);
    
    if (kakaoPlaces.length > 0) {
      console.log("카카오 맵 검색 결과 샘플 (최대 10개):\n");
      kakaoPlaces.slice(0, 10).forEach((place, index) => {
        console.log(`  [${index + 1}] ${place.name}`);
        console.log(`      주소: ${place.address}`);
        console.log(`      위치: ${place.lat}, ${place.lng}`);
        console.log(`      카카오 ID: ${place.id}`);
        console.log();
      });
    } else {
      console.log("⚠️  카카오 맵에서 공원을 찾을 수 없습니다.\n");
    }
  } catch (error) {
    console.error("❌ 카카오 맵 검색 실패:", error);
    console.error("   NEXT_PUBLIC_KAKAO_REST_KEY가 설정되어 있는지 확인하세요.\n");
  }

  // 2. Supabase 검색
  console.log("\n🗄️  [2] Supabase 공원 데이터");
  console.log("-".repeat(80));
  
  const { data: supabaseParks, error: supabaseError } = await supabase
    .from("urban_parks")
    .select("*")
    .or(`name.ilike.%${searchTerm}%,road_address.ilike.%${searchTerm}%,jibun_address.ilike.%${searchTerm}%`)
    .not("lat", "is", null)
    .not("lng", "is", null)
    .limit(10);

  if (supabaseError) {
    console.error("❌ Supabase 검색 실패:", supabaseError);
    return;
  }

  if (!supabaseParks || supabaseParks.length === 0) {
    console.log(`❌ "${searchTerm}" 검색 결과가 없습니다.`);
    return;
  }

  console.log(`✅ ${supabaseParks.length}개 공원 발견\n`);
  
  supabaseParks.slice(0, 5).forEach((park, index) => {
    console.log(`  [${index + 1}] ${park.name}`);
    console.log(`      주소: ${park.road_address || park.jibun_address || "없음"}`);
    console.log(`      위치: ${park.lat}, ${park.lng}`);
    console.log(`      ID: ${park.id}`);
    console.log();
  });

  // 3. 매칭 분석
  console.log("\n🔗 [3] 매칭 분석");
  console.log("=".repeat(80));

  const matches: Array<{
    kakao: any;
    supabase: any;
    confidence: number;
    reasons: string[];
  }> = [];

  for (const kakaoPlace of kakaoPlaces.slice(0, 10)) {
    for (const supabasePark of supabaseParks.slice(0, 10)) {
      const match = isSamePlace(kakaoPlace, supabasePark);
      if (match.isMatch) {
        matches.push({
          kakao: kakaoPlace,
          supabase: supabasePark,
          confidence: match.confidence,
          reasons: match.reasons,
        });
      }
    }
  }

  // 신뢰도 순으로 정렬
  matches.sort((a, b) => b.confidence - a.confidence);

  if (matches.length === 0) {
    console.log("❌ 매칭되는 공원을 찾을 수 없습니다.\n");
  } else {
    console.log(`✅ ${matches.length}개 매칭 발견:\n`);
    
    matches.forEach((match, index) => {
      console.log(`\n[매칭 ${index + 1}] 신뢰도: ${match.confidence.toFixed(1)}%`);
      console.log(`  카카오: ${match.kakao.name} (ID: ${match.kakao.id})`);
      console.log(`  Supabase: ${match.supabase.name} (ID: ${match.supabase.id})`);
      console.log(`  매칭 이유: ${match.reasons.join(", ")}`);
    });
  }

  // 4. 외래키 후보 분석
  console.log("\n\n📋 [4] 외래키 후보 분석");
  console.log("=".repeat(80));

  console.log("\n🔑 가능한 연결 방법:\n");

  console.log("1️⃣  이름 + 위치 기반 매칭 (추천)");
  console.log("   - 장점: 가장 정확한 매칭");
  console.log("   - 단점: 이름이 다르거나 위치가 약간 다를 수 있음");
  console.log("   - 구현: 이름 유사도 + 거리 계산");
  console.log("   - 예시: '햇살어린이공원' (카카오) ↔ '햇살아래' (Supabase)");

  console.log("\n2️⃣  주소 기반 매칭");
  console.log("   - 장점: 주소가 정확하면 매칭 가능");
  console.log("   - 단점: 주소 형식이 다를 수 있음 (도로명 vs 지번)");
  console.log("   - 구현: 주소 문자열 매칭");

  console.log("\n3️⃣  좌표 기반 매칭");
  console.log("   - 장점: 가장 정확한 위치 매칭");
  console.log("   - 단점: 좌표가 약간 다를 수 있음");
  console.log("   - 구현: 거리 계산 (50m 이내)");

  console.log("\n4️⃣  복합 매칭 (이름 + 위치 + 주소)");
  console.log("   - 장점: 가장 신뢰도 높은 매칭");
  console.log("   - 단점: 복잡도 증가");
  console.log("   - 구현: 가중치 기반 점수 계산");

  console.log("\n\n💡 추천 외래키 전략:\n");
  console.log("옵션 A: 별도 매칭 테이블 생성");
  console.log("   CREATE TABLE place_matches (");
  console.log("     kakao_place_id TEXT, -- 카카오 장소 ID");
  console.log("     supabase_park_id TEXT, -- Supabase 공원 ID");
  console.log("     confidence NUMERIC, -- 매칭 신뢰도 (0-100)");
  console.log("     match_type TEXT, -- 'name_location', 'address', 'coordinate'");
  console.log("     created_at TIMESTAMPTZ DEFAULT NOW()");
  console.log("   );");

  console.log("\n옵션 B: Place 테이블에 source_id 필드 추가");
  console.log("   ALTER TABLE urban_parks ADD COLUMN kakao_place_id TEXT;");
  console.log("   CREATE INDEX idx_urban_parks_kakao_id ON urban_parks(kakao_place_id);");

  console.log("\n옵션 C: 통합 Place 테이블 (권장)");
  console.log("   - 모든 소스(kakao, public_data, manual)를 하나의 places 테이블로 통합");
  console.log("   - source 필드로 구분");
  console.log("   - source_id 필드로 원본 ID 저장");
  console.log("   - 중복 제거를 위한 unique 제약조건 (name + lat + lng)");

  console.log("\n\n📊 실제 매칭 예시:\n");
  if (matches.length > 0) {
    const bestMatch = matches[0];
    console.log(`카카오 ID: ${bestMatch.kakao.id}`);
    console.log(`Supabase ID: ${bestMatch.supabase.id}`);
    console.log(`신뢰도: ${bestMatch.confidence.toFixed(1)}%`);
    console.log(`\n이 두 ID를 연결하면 됩니다.`);
  }
}

compareSources().catch((error) => {
  console.error("❌ 예상치 못한 오류:", error);
  process.exit(1);
});

