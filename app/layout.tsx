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
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
