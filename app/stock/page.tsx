"use client";

import { useState, type FormEvent } from "react";
import data from "@/data/products.json";
import { face, formatNumber, type Category, type Product } from "@/lib/quote";
import { matchProduct, palletsOf, SIGNAL_LABEL, stockCheck, stockSignal, type NeedUnit, type SearchField, type Signal } from "@/lib/stock";

const products = data as Product[];
const FILTERS: { key: "all" | Category; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "brick", label: "벽돌" },
  { key: "tile", label: "타일" },
];

type Search = { field: SearchField; query: string; amount: number | null; unit: NeedUnit };

// 보기 전용 — 쓰기 없음
export default function StockPage() {
  const [filter, setFilter] = useState<"all" | Category>("all");
  const [field, setField] = useState<SearchField>("name");
  const [query, setQuery] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<NeedUnit>("pcs");
  const [search, setSearch] = useState<Search | null>(null);

  const inFilter = products.filter((p) => filter === "all" || p.category === filter);
  const count = (s: Signal) => inFilter.filter((p) => stockSignal(p) === s).length;
  const results = search ? inFilter.filter((p) => matchProduct(p, search.field, search.query)) : [];

  function submit(e: FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    setSearch({ field, query, amount: amount.trim() && n > 0 ? n : null, unit });
  }

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
        <p className="sub">노랑 {count("yellow")}개 · 초록 {count("green")}개 · 5파렛트 미만 빨강 · 10파렛트 미만 노랑 · 보기 전용</p>
      </section>

      <form className="stock-search" onSubmit={submit}>
        <div className="search-row">
          <div className="seg" role="group" aria-label="검색 기준">
            <button type="button" aria-pressed={field === "name"} onClick={() => setField("name")}>제품명</button>
            <button type="button" aria-pressed={field === "size"} onClick={() => setField("size")}>사이즈</button>
          </div>
          <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="검색어"
            placeholder={field === "name" ? "예: 코넬, 엔틱" : "예: 190*57, 230x90x76, 76"} />
        </div>
        <div className="search-row">
          <span className="need-label">필요 수량 (선택)</span>
          <input type="number" inputMode="decimal" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)}
            aria-label="필요 수량" placeholder={unit === "pcs" ? "예: 2,500" : "예: 30"} />
          <div className="seg" role="group" aria-label="수량 단위">
            <button type="button" aria-pressed={unit === "pcs"} onClick={() => setUnit("pcs")}>장</button>
            <button type="button" aria-pressed={unit === "sqm"} onClick={() => setUnit("sqm")}>㎡</button>
          </div>
        </div>
        <button type="submit" className="search-btn">검색</button>
      </form>

      {!search && <p className="hint">제품명이나 사이즈로 검색하세요. 비워 두고 검색하면 전체가 나옵니다.</p>}
      {search && (
        <p className="result-count">
          {results.length}건
          {search.amount !== null && ` · 필요 ${formatNumber(search.amount)}${search.unit === "pcs" ? "장" : "㎡"}${search.unit === "sqm" ? " (로스율 기본값 포함)" : ""}`}
        </p>
      )}

      <ul className="stock-list">
        {results.map((p) => {
          const s = stockSignal(p);
          const check = search?.amount != null ? stockCheck(p, search.amount, search.unit) : null;
          return (
            <li key={p.code} className={`stock-row ${s}`}>
              <span className={`dot ${s}`} aria-hidden />
              <strong className="name">{p.name} {face(p).length}×{face(p).height}</strong>
              <b className="qty">{formatNumber(p.stock)}장</b>
              <small className="meta">
                {SIGNAL_LABEL[s]} · {p.category === "brick" ? "벽돌" : "타일"} · {palletsOf(p).toFixed(1)}파렛트
                <span className="code"> · {p.code}</span>
              </small>
              {check ? (
                <small className={check.ok ? "ref ok" : "ref short"}>
                  필요 {formatNumber(check.required)}장 · {check.ok ? "가능" : `${formatNumber(check.short)}장 부족`}
                </small>
              ) : (
                <small className="ref">파렛트당 {formatNumber(p.piecesPerPack)}장</small>
              )}
            </li>
          );
        })}
      </ul>
      {search && results.length === 0 && <p className="hint">맞는 제품이 없습니다.</p>}
    </div>
  );
}
