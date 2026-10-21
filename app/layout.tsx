import type { Metadata } from "next";
import type { ReactNode } from "react";
import Nav from "./nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "로켓견적",
  description: "타일·벽돌 매장 도우미 — 견적 · 재고 · 샘플",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* 본문 Pretendard, 제목 Noto Serif KR — 못 불러오면 시스템 글꼴로 */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;600;700&display=swap" />
      </head>
      <body>
        <div className="no-print"><Nav /></div>
        <main>{children}</main>
      </body>
    </html>
  );
}
