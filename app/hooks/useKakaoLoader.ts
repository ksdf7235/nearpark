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

    // 디버깅: API 키 확인 (보안을 위해 마스킹)
    if (apiKey) {
      const maskedKey =
        apiKey.length > 8
          ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
          : "***";
      console.log("🔑 API Key 확인:", maskedKey, `(길이: ${apiKey.length})`);
    } else {
      console.log("🔑 API Key: undefined 또는 null");
    }

    if (!apiKey) {
      console.error(
        "❌ NEXT_PUBLIC_KAKAO_JS_KEY가 설정되지 않았습니다.\n" +
          "💡 .env.local 파일에 NEXT_PUBLIC_KAKAO_JS_KEY를 추가해주세요.\n" +
          "📖 카카오 개발자 콘솔: https://developers.kakao.com/"
      );
      return;
    }

    // API 키 형식 검증 (일반적으로 32자리 문자열)
    if (apiKey.length < 10 || apiKey === "your_kakao_javascript_key_here") {
      console.error(
        "❌ NEXT_PUBLIC_KAKAO_JS_KEY가 올바르지 않습니다.\n" +
          "💡 카카오 개발자 콘솔에서 JavaScript 키를 확인해주세요.\n" +
          "📖 https://developers.kakao.com/console/app"
      );
      return;
    }

    // 중요: JavaScript 키인지 확인 안내
    console.log(
      "⚠️ 중요: NEXT_PUBLIC_KAKAO_JS_KEY는 반드시 JavaScript 키여야 합니다!\n" +
        "   REST API 키를 사용하면 'AccessDeniedError'가 발생합니다.\n" +
        "   카카오 개발자 콘솔 > 앱 키 > JavaScript 키를 사용하세요."
    );

    const scriptUrl = `https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${apiKey}`;

    console.log("🔄 Kakao Map SDK 로딩 시작...");
    console.log("📍 스크립트 URL:", scriptUrl.replace(apiKey, "***"));
    console.log(
      "💡 참고: <script> 태그는 CORS 정책의 영향을 받지 않습니다.\n" +
        "   fetch 테스트는 CORS로 인해 실패할 수 있지만, 실제 스크립트 로딩은 정상 작동합니다."
    );

    const script = document.createElement("script");
    script.id = "kakao-map-sdk";
    script.src = scriptUrl;
    script.async = true;

    // 스크립트 상태 추적
    console.log("📝 스크립트 태그 생성 완료");
    console.log("📝 스크립트 속성:", {
      id: script.id,
      src: script.src.replace(apiKey, "***"),
      async: script.async,
    });

    script.onload = () => {
      console.log("✅ Kakao Map SDK 스크립트 로드 완료");
      console.log("🔍 window.kakao 확인:", !!window.kakao);
      console.log(
        "🔍 window.kakao.maps 확인:",
        !!(window.kakao && window.kakao.maps)
      );

      // SDK 로딩 후 kakao.maps.load() 호출
      if (window.kakao && window.kakao.maps) {
        console.log("🔄 kakao.maps.load() 호출 중...");
        window.kakao.maps.load(() => {
          console.log("✅ Kakao Map SDK 초기화 완료");
          setLoaded(true);
        });
      } else {
        console.error(
          "❌ window.kakao.maps가 정의되지 않았습니다.\n" +
            "💡 카카오 개발자 콘솔에서 플랫폼 설정을 확인해주세요.\n" +
            "📖 Web 플랫폼에 http://localhost:3000이 등록되어 있는지 확인하세요."
        );
        console.error("🔍 디버깅 정보:", {
          "window.kakao 존재": !!window.kakao,
          "window.kakao.maps 존재": !!(window.kakao && window.kakao.maps),
          "스크립트 src": script.src.replace(apiKey, "***"),
        });
      }
    };

    // 스크립트가 로드되었지만 서비스가 비활성화된 경우를 감지
    // 스크립트가 JSON 에러를 반환하는 경우를 처리
    script.addEventListener("error", () => {
      // 스크립트가 로드되었지만 에러가 발생한 경우
      // (예: 서비스 비활성화, API 키 문제 등)
      setTimeout(() => {
        if (!loaded && !window.kakao) {
          console.error(
            "❌ Kakao Map SDK 초기화 실패\n\n" +
              "가능한 원인:\n" +
              "1. 카카오맵 서비스가 비활성화되어 있음\n" +
              "   → 제품 설정 > 카카오맵 > 서비스 상태를 'ON'으로 변경\n" +
              "2. JavaScript 키가 아닌 REST API 키를 사용 중\n" +
              "   → 앱 키에서 JavaScript 키 확인\n" +
              "3. 플랫폼 설정이 안 되어 있음\n" +
              "   → 앱 설정 > 플랫폼 설정 > Web 플랫폼에 http://localhost:3000 추가\n\n" +
              "🔧 해결 방법:\n" +
              "1. 카카오 개발자 콘솔: https://developers.kakao.com/console/app\n" +
              "2. 내 애플리케이션 선택\n" +
              "3. 제품 설정 > 카카오맵 > 서비스 상태 'ON'\n" +
              "4. 앱 설정 > 플랫폼 설정 > Web 플랫폼 확인\n" +
              "5. 앱 키 > JavaScript 키 확인 및 .env.local 설정\n" +
              "6. 개발 서버 재시작 및 브라우저 캐시 클리어"
          );
        }
      }, 2000);
    });

    script.onerror = (error: Event | string) => {
      console.error(
        "❌ Kakao Map SDK 스크립트 로딩 실패 (onerror 이벤트 발생)"
      );
      console.error("🔍 에러 상세:", error);

      // 실제 스크립트 URL 출력 (디버깅용 - 브라우저에서 직접 테스트 가능)
      console.error("🔍 실제 스크립트 URL (디버깅용):", scriptUrl);
      console.error(
        "💡 이 URL을 브라우저 주소창에 붙여넣어서 직접 접근해보세요.\n" +
          "   정상이면 JavaScript 코드가 보여야 합니다.\n" +
          "   403 Forbidden이면 플랫폼 설정 문제입니다.\n" +
          "   JSON 에러 (AccessDeniedError)가 나오면 API 키 타입 문제입니다."
      );

      // 스크립트 URL을 직접 열어서 에러 메시지 확인
      console.error(
        "🔍 스크립트 URL을 브라우저에서 열어보면 더 자세한 에러 메시지를 볼 수 있습니다."
      );

      console.error("🔍 스크립트 정보:", {
        id: script.id,
        src: script.src.replace(apiKey, "***"),
      });

      // 네트워크 탭에서 확인할 수 있도록 상세 안내
      console.error(
        "❌ Kakao Map SDK 로딩 실패\n\n" +
          "📋 체크리스트:\n" +
          "1. 브라우저 개발자 도구(F12) → Network 탭 열기\n" +
          "2. 'sdk.js' 파일 찾기\n" +
          "3. 상태 코드 확인:\n" +
          "   - 200: 정상 (하지만 여전히 에러면 다른 문제)\n" +
          "   - 403: 플랫폼 설정 문제\n" +
          "   - 401: API 키 문제\n" +
          "   - 404: URL 문제\n\n" +
          "🔧 해결 방법:\n" +
          "1. 카카오 개발자 콘솔 접속: https://developers.kakao.com/console/app\n" +
          "2. 내 애플리케이션 선택\n" +
          "3. 제품 설정 > 카카오맵 > 서비스 상태를 'ON'으로 변경 (중요!)\n" +
          "4. 앱 설정 > 플랫폼 설정\n" +
          "   - Web 플랫폼 추가: http://localhost:3000\n" +
          "5. 앱 키에서 JavaScript 키 확인 (REST API 키가 아님!)\n" +
          "6. .env.local 파일에 NEXT_PUBLIC_KAKAO_JS_KEY 설정\n" +
          "7. 개발 서버 재시작 (npm run dev)\n\n" +
          "⚠️ 자주 발생하는 에러:\n" +
          "- 'AccessDeniedError: appKeyType is REST_API_KEY': JavaScript 키를 사용하세요\n" +
          "- 'NotAuthorizedError: disabled OPEN_MAP_AND_LOCAL service': 카카오맵 서비스를 활성화하세요"
      );
    };

    // 스크립트가 DOM에 추가되기 전 상태 확인
    console.log("📝 DOM에 스크립트 추가 중...");
    document.head.appendChild(script);
    console.log("✅ 스크립트가 DOM에 추가됨");
    console.log(
      "🔍 추가된 스크립트 확인:",
      document.getElementById("kakao-map-sdk") ? "존재함" : "없음"
    );

    // 일정 시간 후에도 로드되지 않으면 상태 확인
    setTimeout(() => {
      if (!loaded && !window.kakao) {
        console.warn("⚠️ 스크립트 로딩이 지연되고 있습니다...");
        console.warn("🔍 현재 상태:", {
          loaded,
          "window.kakao": !!window.kakao,
          "스크립트 src": script.src.replace(apiKey, "***"),
          "스크립트 DOM 존재": !!document.getElementById("kakao-map-sdk"),
        });
        console.warn(
          "💡 브라우저 개발자 도구의 네트워크 탭에서 스크립트 요청 상태를 확인해주세요."
        );
      }
    }, 5000);

    // cleanup: 컴포넌트 언마운트 시 스크립트 제거하지 않음
    // (다른 컴포넌트에서도 재사용 가능하도록)
  }, []);

  return loaded;
}
