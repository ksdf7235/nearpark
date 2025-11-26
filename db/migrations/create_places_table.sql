-- 통합 Place 테이블 생성
-- 주소 + 좌표 기반 중복 제거

-- PostGIS 확장 활성화
CREATE EXTENSION IF NOT EXISTS postgis;

-- places 테이블 생성
CREATE TABLE IF NOT EXISTS places (
  -- 기본 정보
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- park, museum, library 등

  -- 소스 정보
  source TEXT NOT NULL, -- "kakao" | "public_data" | "manual"
  source_id TEXT NOT NULL, -- 원본 소스의 ID

  -- 주소 정보 (중복 제거의 핵심)
  road_address TEXT,
  jibun_address TEXT,
  normalized_address TEXT, -- 정규화된 주소 (동/번지 추출)

  -- 위치 정보
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  geom GEOMETRY(Point, 4326), -- PostGIS 포인트

  -- 추가 정보
  phone TEXT,
  url TEXT,
  image_url TEXT,
  tags TEXT[],

  -- 공원 전용 필드
  park_type TEXT,
  area TEXT,
  has_playground BOOLEAN DEFAULT FALSE,
  has_gym BOOLEAN DEFAULT FALSE,
  has_toilet BOOLEAN DEFAULT FALSE,
  has_parking BOOLEAN DEFAULT FALSE,
  has_bench BOOLEAN DEFAULT FALSE,
  has_stage_or_culture BOOLEAN DEFAULT FALSE,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 주소 + 좌표 기반 unique 제약조건 (중복 제거)
-- 같은 정규화된 주소와 좌표면 같은 장소로 간주
-- NULL 값은 제외 (NULL은 unique 제약조건에서 무시됨)
CREATE UNIQUE INDEX IF NOT EXISTS places_address_location_unique 
ON places(normalized_address, lat, lng) 
WHERE normalized_address IS NOT NULL;

-- 또는 UNIQUE CONSTRAINT로 생성 (Supabase upsert에서 더 명확하게 동작)
-- ALTER TABLE places ADD CONSTRAINT places_address_location_unique 
-- UNIQUE (normalized_address, lat, lng);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);
CREATE INDEX IF NOT EXISTS idx_places_source ON places(source);
CREATE INDEX IF NOT EXISTS idx_places_source_id ON places(source, source_id);
CREATE INDEX IF NOT EXISTS idx_places_lat_lng ON places(lat, lng);
CREATE INDEX IF NOT EXISTS idx_places_normalized_address ON places(normalized_address);
CREATE INDEX IF NOT EXISTS idx_places_geom ON places USING GIST(geom);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_places_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_places_updated_at
  BEFORE UPDATE ON places
  FOR EACH ROW
  EXECUTE FUNCTION update_places_updated_at();

-- 주석
COMMENT ON TABLE places IS '통합 Place 테이블 - 모든 소스(kakao, public_data, manual) 통합';
COMMENT ON COLUMN places.normalized_address IS '정규화된 주소 (중복 제거용) - 동/번지 추출';
COMMENT ON COLUMN places.source IS '데이터 소스: kakao, public_data, manual';
COMMENT ON COLUMN places.source_id IS '원본 소스의 ID (kakao ID, 관리번호 등)';

