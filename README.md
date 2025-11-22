# 내 주변 문화지도 (NearPark)

카카오맵 기반의 "내 주변 공원 찾기" Next.js 앱입니다.

## 🎯 프로젝트 철학

**"문화란 사람이 찾아가는 장소다."**

공원, 미술관, 도서관, 문화센터 등은 모두 **Place(장소)** 엔티티이며, `category`로만 구분합니다.

## 🏗️ 아키텍처

- **Place 중심 설계**: 모든 문화시설을 단일 `Place` 엔티티로 관리
- **확장 가능**: 새로운 카테고리(미술관, 도서관 등)는 `category`만 추가하면 됨
- **Next.js App Router**: 최신 App Router 기반 구조
- **TypeScript**: 타입 안전성을 위한 TypeScript 사용
- **Client/Server 분리**: 브라우저 전용 기능은 Client Component로 분리

## 📁 프로젝트 구조

```
app/
  page.tsx                # 메인 페이지
  layout.tsx              # 루트 레이아웃
  globals.css             # 전역 스타일
  components/
    CategorySelector.tsx  # 카테고리 선택 버튼
    PlaceList.tsx         # 장소 리스트
    MapClient.tsx         # 지도 + 마커 (Client Component)
  hooks/
    useKakaoLoader.ts     # Kakao Map SDK 로더
  services/
    kakao.ts              # Kakao Local API 호출
  types/
    place.ts              # Place 타입 정의
types/
  kakao.d.ts              # Kakao Map SDK 타입 선언
```

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.local` 파일을 생성하고 다음 내용을 입력하세요:

```env
NEXT_PUBLIC_KAKAO_JS_KEY=your_kakao_javascript_key_here
NEXT_PUBLIC_KAKAO_REST_KEY=your_kakao_rest_api_key_here
```

**카카오 개발자 콘솔에서 키 발급:**
1. https://developers.kakao.com/ 접속
2. 내 애플리케이션 > 애플리케이션 추가하기
3. 앱 키 > JavaScript 키 복사 → `NEXT_PUBLIC_KAKAO_JS_KEY`
4. REST API 키 복사 → `NEXT_PUBLIC_KAKAO_REST_KEY`
5. 플랫폼 설정 > Web 플랫폼 등록 (로컬: `http://localhost:3000`)

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 을 열어주세요.

## 📝 주요 기능

- ✅ 현재 위치 기반 검색 (Geolocation API)
- ✅ 카카오맵 지도 표시
- ✅ 반경 2km 내 공원 검색
- ✅ 지도에 마커 표시
- ✅ 장소 리스트 표시 (거리순 정렬)
- ✅ 확장 가능한 카테고리 구조

## 🔮 확장 방법

### 새로운 카테고리 추가하기

예: 미술관 추가

1. **`app/types/place.ts`** - `PlaceCategory` 타입과 `CATEGORY_LABELS`에 추가:
```typescript
export type PlaceCategory =
  | "park"
  | "museum"  // 추가
  | "library"
  | "cultural_center"
  | "etc";

export const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  park: "공원",
  museum: "미술관",  // 추가
  // ...
};
```

2. **`app/services/kakao.ts`** - `CATEGORY_QUERY_MAP`에 추가:
```typescript
const CATEGORY_QUERY_MAP: Record<PlaceCategory, string> = {
  park: "공원",
  museum: "미술관",  // 추가
  // ...
};
```

3. **`app/components/CategorySelector.tsx`** - `availableCategories` 배열에 추가:
```typescript
const availableCategories: PlaceCategory[] = ["park", "museum"];  // "museum" 추가
```

이제 미술관 검색이 가능합니다!

### 공공데이터 병합하기

`app/services/kakao.ts`의 `searchPlaces` 함수에서 여러 소스의 데이터를 병합할 수 있습니다:

```typescript
const kakaoPlaces = await searchKakaoPlaces(category, lat, lng);
const publicDataPlaces = await searchPublicData(category, lat, lng);
return [...kakaoPlaces, ...publicDataPlaces];
```

## 🛠️ 기술 스택

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Kakao Map JS SDK**
- **Kakao Local API**

## 📄 라이선스

MIT

