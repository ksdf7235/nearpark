-- PostGIS 확장 활성화 (공간 검색용)
CREATE EXTENSION IF NOT EXISTS postgis;

-- urban_parks 테이블 생성
CREATE TABLE IF NOT EXISTS "urban_parks" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "park_type" text NOT NULL,
  "road_address" text,
  "jibun_address" text,
  "lat" double precision,
  "lng" double precision,
  "area" numeric,
  "sports_facilities" text,
  "play_facilities" text,
  "convenience_facilities" text,
  "culture_facilities" text,
  "other_facilities" text,
  "has_playground" boolean DEFAULT false,
  "has_gym" boolean DEFAULT false,
  "has_toilet" boolean DEFAULT false,
  "has_parking" boolean DEFAULT false,
  "has_bench" boolean DEFAULT false,
  "has_stage_or_culture" boolean DEFAULT false,
  "established_at" date,
  "org_name" text,
  "phone" text,
  "data_date" date,
  "provider_code" text,
  "provider_name" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

-- PostGIS geom 컬럼 추가 (Drizzle에서 직접 지원하지 않으므로 수동 추가)
ALTER TABLE "urban_parks" ADD COLUMN IF NOT EXISTS "geom" geometry(Point, 4326);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS "idx_urban_parks_park_type" ON "urban_parks"("park_type");
CREATE INDEX IF NOT EXISTS "idx_urban_parks_lat_lng" ON "urban_parks"("lat", "lng");
CREATE INDEX IF NOT EXISTS "idx_urban_parks_facilities" ON "urban_parks"("has_playground", "has_gym", "has_toilet", "has_parking");
CREATE INDEX IF NOT EXISTS "idx_urban_parks_geom" ON "urban_parks" USING GIST("geom");

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_urban_parks_updated_at ON "urban_parks";
CREATE TRIGGER update_urban_parks_updated_at
  BEFORE UPDATE ON "urban_parks"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 주석 추가
COMMENT ON TABLE "urban_parks" IS '전국 도시공원 공공데이터';
COMMENT ON COLUMN "urban_parks"."id" IS '관리번호 (PK)';
COMMENT ON COLUMN "urban_parks"."geom" IS 'PostGIS 포인트 (WGS84, 4326) - 반경 검색용';
COMMENT ON COLUMN "urban_parks"."has_playground" IS '유희시설 존재 여부 (모래밭/조합놀이/놀이대 등)';
COMMENT ON COLUMN "urban_parks"."has_gym" IS '운동시설 존재 여부 (체력단련시설/운동기구/철봉 등)';

