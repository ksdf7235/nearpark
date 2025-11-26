# 통합 Place 테이블 설계

## 개요

모든 소스(kakao, public_data, manual)를 하나의 `places` 테이블로 통합하여 관리합니다.

## 중복 제거 전략

**주소 + 좌표 기반 매칭**

- 같은 정규화된 주소(`normalized_address`)와 좌표(`lat`, `lng`)를 가진 레코드는 같은 장소로 간주
- 이름이 달라도 주소와 좌표가 같으면 중복으로 처리

### 주소 정규화

`app/lib/utils/address.ts`의 `normalizeAddress()` 함수가 주소를 정규화합니다:

- 시/도 제거 (서울특별시, 서울시, 서울 등)
- 공백 정리
- 동/번지 추출

예시:
- `"서울특별시 중랑구 면목동 137-14"` → `"중랑구 면목동 137-14"`
- `"서울 중랑구 면목동 137-14"` → `"중랑구 면목동 137-14"`

## 스키마 구조

```typescript
places {
  id: string (PK)
  name: string
  category: "park" | "museum" | "library" | ...
  source: "kakao" | "public_data" | "manual"
  source_id: string (원본 소스의 ID)
  
  // 주소 (중복 제거 핵심)
  road_address: string?
  jibun_address: string?
  normalized_address: string? (정규화된 주소)
  
  // 위치
  lat: number (NOT NULL)
  lng: number (NOT NULL)
  geom: geometry(Point, 4326)? (PostGIS)
  
  // 추가 정보
  phone: string?
  url: string?
  image_url: string?
  tags: string[]?
  
  // 공원 전용 필드
  park_type: string?
  area: string?
  has_playground: boolean
  has_gym: boolean
  has_toilet: boolean
  has_parking: boolean
  has_bench: boolean
  has_stage_or_culture: boolean
  
  // 메타데이터
  created_at: timestamp
  updated_at: timestamp
}
```

## Unique 제약조건

```sql
CREATE UNIQUE INDEX places_address_location_unique 
ON places(normalized_address, lat, lng) 
WHERE normalized_address IS NOT NULL;
```

## 마이그레이션 방법

### 1. 테이블 생성

Supabase SQL Editor에서 `db/migrations/create_places_table.sql` 실행:

```sql
-- PostGIS 확장 활성화
CREATE EXTENSION IF NOT EXISTS postgis;

-- places 테이블 생성
-- (스크립트 내용 참조)
```

### 2. 기존 데이터 마이그레이션

`urban_parks` 데이터를 `places`로 마이그레이션:

```bash
npm run migrate:to-places
```

이 스크립트는:
- `urban_parks`의 모든 레코드를 조회
- 주소 정규화 후 `places`로 변환
- 주소+좌표 기반으로 중복 제거 (UPSERT)
- PostGIS `geom` 컬럼 업데이트

### 3. Drizzle 스키마 업데이트

Drizzle 스키마에 `places` 테이블이 추가되었습니다:

```typescript
// db/schema.ts
export const places = pgTable("places", { ... });
```

새로운 마이그레이션 생성:

```bash
npm run db:generate
npm run db:push
```

## 사용 예시

### 주소 정규화

```typescript
import { normalizeAddress } from "@/app/lib/utils/address";

const address = "서울특별시 중랑구 면목동 137-14";
const normalized = normalizeAddress(address);
// → "중랑구 면목동 137-14"
```

### 주소 비교

```typescript
import { compareAddresses } from "@/app/lib/utils/address";

const similarity = compareAddresses(
  "서울 중랑구 면목동 137-14",
  "중랑구 면목동 137-14"
);
// → 0.9 (높은 유사도)
```

### 데이터 삽입 (UPSERT)

```typescript
import { createClient } from "@supabase/supabase-js";
import { normalizeAddress } from "@/app/lib/utils/address";

const place = {
  id: "kakao_123456",
  name: "햇살어린이공원",
  category: "park",
  source: "kakao",
  source_id: "123456",
  road_address: "서울 중랑구 면목동 137-14",
  normalized_address: normalizeAddress("서울 중랑구 면목동 137-14"),
  lat: 37.588,
  lng: 127.088,
};

// 주소+좌표가 같으면 업데이트, 다르면 삽입
await supabase
  .from("places")
  .upsert(place, {
    onConflict: "normalized_address,lat,lng",
  });
```

## 장점

1. **단일 소스**: 모든 장소 데이터를 하나의 테이블에서 관리
2. **중복 제거**: 주소+좌표 기반으로 자동 중복 제거
3. **확장성**: 새로운 소스(kakao, public_data, manual) 추가 용이
4. **일관성**: 모든 장소가 동일한 스키마로 관리

## 주의사항

- `normalized_address`가 NULL인 경우 unique 제약조건에서 제외됨
- 좌표가 정확하지 않으면 중복 제거가 제대로 동작하지 않을 수 있음
- 주소 정규화 로직이 완벽하지 않을 수 있으므로, 필요시 수동 검토 필요

