"use client";

/**
 * Kakao Map SDK를 동적으로 로딩하는 커스텀 훅
 *
 * 브라우저 환경에서만 동작하며, SDK 스크립트를 <head>에 주입하고
 * 로딩 완료 시 window.kakao.maps.load()를 호출합니다.
 *
 * @returns SDK 로딩 완료 여부
 */
import { useEffect, useState } from "react";

export default function useKakaoLoader(): boolean {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // 서버 사이드에서는 실행하지 않음
    if (typeof window === "undefined") return;

    // 이미 로딩되어 있으면 즉시 완료 처리
    if (window.kakao && window.kakao.maps) {
      setLoaded(true);
      return;
    }

    // 이미 스크립트가 추가되어 있으면 onload 이벤트만 등록
    const existingScript = document.getElementById(
      "kakao-map-sdk"
    ) as HTMLScriptElement | null;
    if (existingScript) {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => setLoaded(true));
      } else {
        existingScript.onload = () => {
          if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(() => setLoaded(true));
          }
        };
      }
      return;
    }

    // 새로운 스크립트 태그 생성 및 추가
    const apiKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

    if (!apiKey) {
      console.error(
        "❌ NEXT_PUBLIC_KAKAO_JS_KEY가 설정되지 않았습니다.\n" +
          "💡 .env.local 파일에 NEXT_PUBLIC_KAKAO_JS_KEY를 추가해주세요.\n" +
          "📖 카카오 개발자 콘솔: https://developers.kakao.com/"
      );
      return;
    }

    // API 키 형식 검증
    if (apiKey.length < 10 || apiKey === "your_kakao_javascript_key_here") {
      console.error(
        "❌ NEXT_PUBLIC_KAKAO_JS_KEY가 올바르지 않습니다.\n" +
          "💡 카카오 개발자 콘솔에서 JavaScript 키를 확인해주세요.\n" +
          "📖 https://developers.kakao.com/console/app"
      );
      return;
    }

    const scriptUrl = `https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${apiKey}`;

    const script = document.createElement("script");
    script.id = "kakao-map-sdk";
    script.src = scriptUrl;
    script.async = true;

    script.onload = () => {
      // SDK 로딩 후 kakao.maps.load() 호출
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          setLoaded(true);
        });
      } else {
        console.error(
          "❌ window.kakao.maps가 정의되지 않았습니다.\n" +
            "💡 카카오 개발자 콘솔에서 플랫폼 설정을 확인해주세요.\n" +
            "📖 Web 플랫폼에 http://localhost:3000이 등록되어 있는지 확인하세요."
        );
      }
    };

    script.onerror = () => {
      console.error(
        "❌ Kakao Map SDK 로딩 실패\n\n" +
          "가능한 원인:\n" +
          "1. 카카오맵 서비스가 비활성화되어 있음\n" +
          "2. JavaScript 키가 아닌 REST API 키를 사용 중\n" +
          "3. 플랫폼 설정이 안 되어 있음\n\n" +
          "🔧 해결 방법:\n" +
          "1. 카카오 개발자 콘솔: https://developers.kakao.com/console/app\n" +
          "2. 제품 설정 > 카카오맵 > 서비스 상태 'ON'\n" +
          "3. 앱 설정 > 플랫폼 설정 > Web 플랫폼에 http://localhost:3000 추가\n" +
          "4. 앱 키 > JavaScript 키 확인 및 .env.local 설정"
      );
    };

    document.head.appendChild(script);

    // cleanup: 컴포넌트 언마운트 시 스크립트 제거하지 않음
    // (다른 컴포넌트에서도 재사용 가능하도록)
  }, []);

  return loaded;
}
