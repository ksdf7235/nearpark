/**
 * 루트 레이아웃
 */
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 주변 문화지도",
  description: "카카오맵 기반 내 주변 공원 찾기",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

