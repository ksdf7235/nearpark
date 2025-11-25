-- urban_parks 테이블의 geom 컬럼 업데이트
-- lat/lng가 있는 모든 레코드에 대해 PostGIS 포인트 생성
-- 
-- 사용법: Supabase SQL Editor에서 실행

UPDATE urban_parks
SET geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
WHERE lat IS NOT NULL 
  AND lng IS NOT NULL 
  AND (geom IS NULL OR ST_AsText(geom) != ST_AsText(ST_SetSRID(ST_MakePoint(lng, lat), 4326)));

-- 업데이트된 레코드 수 확인
SELECT COUNT(*) as updated_count
FROM urban_parks
WHERE geom IS NOT NULL;

