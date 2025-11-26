/**
 * 통합 Place 테이블 스키마
 * 
 * 모든 소스(kakao, public_data, manual)를 하나의 places 테이블로 통합
 * 주소 기반 중복 제거
 */

import { pgTable, text, doublePrecision, boolean, timestamp, index, unique } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * 통합 Place 테이블
 * 
 * 중복 제거 전략:
 * - 주소(road_address 또는 jibun_address) + 좌표(lat, lng) 기반 unique 제약조건
 * - 같은 주소와 좌표면 같은 장소로 간주
 */
export const places = pgTable(
  "places",
  {
    // 기본 정보
    id: text("id").primaryKey(), // UUID 또는 소스별 ID 조합
    name: text("name").notNull(), // 장소명
    category: text("category").notNull(), // park, museum, library 등

    // 소스 정보
    source: text("source").notNull(), // "kakao" | "public_data" | "manual"
    sourceId: text("source_id").notNull(), // 원본 소스의 ID (kakao ID, 관리번호 등)

    // 주소 정보 (중복 제거의 핵심)
    roadAddress: text("road_address"), // 도로명주소
    jibunAddress: text("jibun_address"), // 지번주소
    // 주소 정규화 버전 (중복 제거용)
    normalizedAddress: text("normalized_address"), // 정규화된 주소 (동/번지 추출)

    // 위치 정보
    lat: doublePrecision("lat").notNull(), // 위도
    lng: doublePrecision("lng").notNull(), // 경도
    // PostGIS geom은 별도로 추가

    // 추가 정보
    phone: text("phone"), // 전화번호
    url: text("url"), // 카카오맵 URL 등
    imageUrl: text("image_url"), // 이미지 URL
    tags: text("tags").array(), // 태그 배열

    // 공원 전용 필드 (category가 'park'일 때만 사용)
    parkType: text("park_type"), // 공원구분
    area: text("area"), // 공원면적
    hasPlayground: boolean("has_playground").default(false),
    hasGym: boolean("has_gym").default(false),
    hasToilet: boolean("has_toilet").default(false),
    hasParking: boolean("has_parking").default(false),
    hasBench: boolean("has_bench").default(false),
    hasStageOrCulture: boolean("has_stage_or_culture").default(false),

    // 메타데이터
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    // 주소 + 좌표 기반 unique 제약조건 (중복 제거)
    // 같은 주소와 좌표면 같은 장소로 간주
    addressLocationUnique: unique("places_address_location_unique").on(
      table.normalizedAddress,
      table.lat,
      table.lng
    ),
    
    // 인덱스
    categoryIdx: index("idx_places_category").on(table.category),
    sourceIdx: index("idx_places_source").on(table.source),
    sourceIdIdx: index("idx_places_source_id").on(table.source, table.sourceId),
    latLngIdx: index("idx_places_lat_lng").on(table.lat, table.lng),
    normalizedAddressIdx: index("idx_places_normalized_address").on(table.normalizedAddress),
  })
);

// 타입 추출
export type Place = typeof places.$inferSelect;
export type NewPlace = typeof places.$inferInsert;

