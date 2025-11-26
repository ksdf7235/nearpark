/**
 * Drizzle ORM 스키마 정의
 * 
 * 이 파일은 TypeScript로 데이터베이스 스키마를 정의합니다.
 * drizzle-kit generate 명령으로 SQL 마이그레이션 파일을 생성할 수 있습니다.
 */

import { pgTable, text, doublePrecision, numeric, boolean, date, timestamp, index, unique } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * 통합 Place 테이블
 * 
 * 모든 소스(kakao, public_data, manual)를 하나의 테이블로 통합
 * 주소 + 좌표 기반 중복 제거
 */
export const places = pgTable(
  "places",
  {
    // 기본 정보
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    category: text("category").notNull(), // park, museum, library 등

    // 소스 정보
    source: text("source").notNull(), // "kakao" | "public_data" | "manual"
    sourceId: text("source_id").notNull(), // 원본 소스의 ID

    // 주소 정보 (중복 제거의 핵심)
    roadAddress: text("road_address"),
    jibunAddress: text("jibun_address"),
    normalizedAddress: text("normalized_address"), // 정규화된 주소 (동/번지 추출)

    // 위치 정보
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),

    // 추가 정보
    phone: text("phone"),
    url: text("url"),
    imageUrl: text("image_url"),
    tags: text("tags").array(),

    // 공원 전용 필드
    parkType: text("park_type"),
    area: text("area"),
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
    // 같은 정규화된 주소와 좌표면 같은 장소로 간주
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

/**
 * 전국 도시공원 공공데이터 테이블 (레거시 - 마이그레이션 후 제거 예정)
 */
export const urbanParks = pgTable(
  "urban_parks",
  {
    // 기본 정보
    id: text("id").primaryKey(), // 관리번호
    name: text("name").notNull(), // 공원명
    parkType: text("park_type").notNull(), // 공원구분

    // 주소 정보
    roadAddress: text("road_address"), // 소재지도로명주소
    jibunAddress: text("jibun_address"), // 소재지지번주소

    // 위치 정보
    lat: doublePrecision("lat"), // 위도
    lng: doublePrecision("lng"), // 경도
    // PostGIS geom 컬럼은 Drizzle에서 직접 지원하지 않으므로
    // 마이그레이션에서 수동으로 추가하거나 별도 SQL로 처리
    // geom: customType<{ data: string; driverData: string }>({
    //   dataType: () => "geometry(Point, 4326)",
    // }),

    // 면적
    area: numeric("area"), // 공원면적 (m²)

    // 시설 텍스트 원본
    sportsFacilities: text("sports_facilities"), // 공원보유시설(운동시설)
    playFacilities: text("play_facilities"), // 공원보유시설(유희시설)
    convenienceFacilities: text("convenience_facilities"), // 공원보유시설(편익시설)
    cultureFacilities: text("culture_facilities"), // 공원보유시설(교양시설)
    otherFacilities: text("other_facilities"), // 공원보유시설(기타시설)

    // 시설 플래그 (boolean)
    hasPlayground: boolean("has_playground").default(false), // 유희시설
    hasGym: boolean("has_gym").default(false), // 운동시설
    hasToilet: boolean("has_toilet").default(false), // 화장실
    hasParking: boolean("has_parking").default(false), // 주차장
    hasBench: boolean("has_bench").default(false), // 벤치
    hasStageOrCulture: boolean("has_stage_or_culture").default(false), // 무대/문화시설

    // 행정/관리 정보
    establishedAt: date("established_at"), // 지정고시일
    orgName: text("org_name"), // 관리기관명
    phone: text("phone"), // 전화번호
    dataDate: date("data_date"), // 데이터기준일자
    providerCode: text("provider_code"), // 제공기관코드
    providerName: text("provider_name"), // 제공기관명

    // 메타데이터
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    // 인덱스 정의
    parkTypeIdx: index("idx_urban_parks_park_type").on(table.parkType),
    latLngIdx: index("idx_urban_parks_lat_lng").on(table.lat, table.lng),
    facilitiesIdx: index("idx_urban_parks_facilities").on(
      table.hasPlayground,
      table.hasGym,
      table.hasToilet,
      table.hasParking
    ),
    // PostGIS geom 인덱스는 마이그레이션에서 수동으로 추가해야 함
    // GIST 인덱스는 Drizzle에서 직접 지원하지 않음
  })
);

// 타입 추출 (애플리케이션에서 사용)
export type UrbanPark = typeof urbanParks.$inferSelect;
export type NewUrbanPark = typeof urbanParks.$inferInsert;

