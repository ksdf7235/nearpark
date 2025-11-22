/**
 * 장소 이미지 가져오기 API Route
 *
 * 서버 사이드에서 카카오맵 장소 상세 페이지를 크롤링하여 이미지 URL을 추출합니다.
 * CORS 문제를 해결하기 위해 서버 사이드에서 처리합니다.
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get("placeId");

  console.log(`🖼️ [서버] 이미지 요청 받음: placeId=${placeId}`);

  if (!placeId) {
    console.warn(`⚠️ [서버] placeId 파라미터 없음`);
    return NextResponse.json(
      { error: "placeId 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    // 카카오맵 장소 상세 페이지 URL
    const placeUrl = `https://place.map.kakao.com/${placeId}`;
    console.log(`📡 [서버] 장소 페이지 요청: ${placeUrl}`);

    // 서버 사이드에서 페이지 가져오기
    const response = await fetch(placeUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    console.log(`📥 [서버] 응답 상태: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.warn(`⚠️ [서버] 장소 페이지 가져오기 실패: ${response.status}`);
      return NextResponse.json(
        { error: "장소 정보를 가져올 수 없습니다." },
        { status: response.status }
      );
    }

    const html = await response.text();
    console.log(`📄 [서버] HTML 길이: ${html.length} bytes`);

    // HTML에서 이미지 URL 추출
    // 카카오맵 페이지의 이미지 구조를 파싱
    // 예: <img src="//img1.kakaocdn.net/cthumb/local/C1104x408.q100/?fname=http%3A%2F%2Ft1.kakaocdn.net%2Ffiy_reboot%2Fplace%2F{이미지ID}" />
    
    // 정규식으로 이미지 URL 추출
    const imageUrlMatch = html.match(
      /img1\.kakaocdn\.net\/cthumb\/local\/[^"'\s]+/i
    );

    if (imageUrlMatch) {
      const imageUrl = `https://${imageUrlMatch[0]}`;
      console.log(`✅ [서버] 이미지 URL 찾음: ${imageUrl.substring(0, 100)}...`);
      return NextResponse.json({ imageUrl });
    }

    // 이미지를 찾지 못한 경우
    console.log(`ℹ️ [서버] 이미지 URL을 찾지 못함 (placeId: ${placeId})`);
    return NextResponse.json({ imageUrl: null });
  } catch (error) {
    console.error(`❌ [서버] 이미지 가져오기 오류:`, error);
    return NextResponse.json(
      { error: "이미지를 가져오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

