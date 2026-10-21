"use client";

import { useState } from "react";
import data from "@/data/products.json";
import { face, formatNumber, type Category, type Product } from "@/lib/quote";
import { SIGNAL_LABEL, sortBySignal, stockSignal, type Signal } from "@/lib/stock";

const products = data as Product[];
const FILTERS: { key: "all" | Category; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "brick", label: "벽돌" },
  { key: "tile", label: "타일" },
];

// 보기 전용 — 쓰기 없음
export default function StockPage() {
  const [filter, setFilter] = useState<"all" | Category>("all");
  const list = sortBySignal(products.filter((p) => filter === "all" || p.category === filter));
  const count = (s: Signal) => list.filter((p) => stockSignal(p) === s).length;

  return (
    <div className="narrow">
      <div className="tabs" role="tablist">
        {FILTERS.map((f) => (
          <button key={f.key} role="tab" aria-selected={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      <section className="signal-summary">
        <p className="red-count"><span className="dot red" aria-hidden />빨강 <b>{count("red")}개</b></p>
        <p className="sub">노랑 {count("yellow")}개 · 초록 {count("green")}개 · 보기 전용</p>
      </section>

      <ul className="stock-list">
        {list.map((p) => {
          const s = stockSignal(p);
          return (
            <li key={p.code} className={`stock-row ${s}`}>
              <span className={`dot ${s}`} aria-hidden />
              <strong className="name">{p.name} {face(p).length}×{face(p).height}</strong>
              <b className="qty">{formatNumber(p.stock)}장</b>
              <small className="meta">
                {SIGNAL_LABEL[s]} · {p.category === "brick" ? "벽돌" : "타일"} · {(p.stock / p.piecesPerPack).toFixed(1)}파렛트
                <span className="code"> · {p.code}</span>
              </small>
              <small className="ref">기준 {formatNumber(p.reorderPoint)}장</small>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
