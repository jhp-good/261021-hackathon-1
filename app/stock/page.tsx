"use client";

import { useState, type FormEvent } from "react";
import data from "@/data/products.json";
import { face, formatNumber, type Category, type Product } from "@/lib/quote";
import { groupProducts, palletsOf, SIGNAL_LABEL, stockCheck, stockSignal, type GroupBy, type NeedUnit } from "@/lib/stock";

const products = data as Product[];
const FILTERS: { key: "all" | Category; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "brick", label: "벽돌" },
  { key: "tile", label: "타일" },
];
const CATEGORY_LABEL: Record<Category, string> = { brick: "벽돌", tile: "타일" };
const ALL = "";

const unique = <T,>(list: T[]) => [...new Set(list)];
const faceLabel = (p: Product) => `${face(p).length}×${face(p).height}`;
const sizeLabel = (size: string) => {
  const [l, w, h] = size.split("x");
  return `${l}×${h} (${l}×${w}×${h}mm)`;
};

type Search = { name: string; size: string; groupBy: GroupBy; amount: number | null; unit: NeedUnit };

// 보기 전용 — 쓰기 없음
export default function StockPage() {
  const [filter, setFilter] = useState<"all" | Category>("all");
  const [name, setName] = useState(ALL);
  const [size, setSize] = useState(ALL);
  const [groupBy, setGroupBy] = useState<GroupBy>("name");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<NeedUnit>("pcs");
  const [search, setSearch] = useState<Search | null>(null);

  const inFilter = products.filter((p) => filter === "all" || p.category === filter);
  const categories = unique(inFilter.map((p) => p.category));
  // 사이즈 목록은 고른 제품에 있는 것만
  const sizeOptions = (cat: Category) => unique(inFilter.filter((p) => p.category === cat && (name === ALL || p.name === name)).map((p) => p.size));

  function changeFilter(f: "all" | Category) {
    setFilter(f);
    setName(ALL);
    setSize(ALL);
    setSearch(null);
  }

  function changeName(n: string) {
    setName(n);
    if (n !== ALL && !inFilter.some((p) => p.name === n && p.size === size)) setSize(ALL);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    setSearch({ name, size, groupBy, amount: amount.trim() && n > 0 ? n : null, unit });
  }

  // 결과: 고른 제품명 · 사이즈, 필요 수량이 있으면 댈 수 있는 것만
  const matched = search ? inFilter.filter((p) => (search.name === ALL || p.name === search.name) && (search.size === ALL || p.size === search.size)) : [];
  const checks = new Map(matched.map((p) => [p.code, search?.amount != null ? stockCheck(p, search.amount, search.unit) : null]));
  const results = search?.amount != null ? matched.filter((p) => checks.get(p.code)?.ok) : matched;
  const hidden = matched.length - results.length;
  const groups = search ? groupProducts(results, search.groupBy) : [];

  return (
    <div className="narrow">
      <div className="tabs" role="tablist">
        {FILTERS.map((f) => (
          <button key={f.key} role="tab" aria-selected={filter === f.key} onClick={() => changeFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      <form className="stock-search" onSubmit={submit}>
        <div className="pick-row">
          <label>
            <span className="need-label">제품명</span>
            <select value={name} onChange={(e) => changeName(e.target.value)}>
              <option value={ALL}>전체</option>
              {categories.map((cat) => (
                <optgroup key={cat} label={CATEGORY_LABEL[cat]}>
                  {unique(inFilter.filter((p) => p.category === cat).map((p) => p.name)).map((n) => <option key={n} value={n}>{n}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <label>
            <span className="need-label">사이즈</span>
            <select value={size} onChange={(e) => setSize(e.target.value)}>
              <option value={ALL}>전체</option>
              {categories.map((cat) => sizeOptions(cat).length > 0 && (
                <optgroup key={cat} label={CATEGORY_LABEL[cat]}>
                  {sizeOptions(cat).map((s) => <option key={s} value={s}>{sizeLabel(s)}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
        </div>

        <div className="pick-row">
          <div>
            <span className="need-label">필요 수량 (선택)</span>
            <div className="need-input">
              <input type="number" inputMode="decimal" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)}
                aria-label="필요 수량" placeholder={unit === "pcs" ? "예: 2500" : "예: 30"} />
              <div className="seg" role="group" aria-label="수량 단위">
                <button type="button" aria-pressed={unit === "pcs"} onClick={() => setUnit("pcs")}>장</button>
                <button type="button" aria-pressed={unit === "sqm"} onClick={() => setUnit("sqm")}>㎡</button>
              </div>
            </div>
          </div>
          <div>
            <span className="need-label">묶어 보기</span>
            <div className="seg" role="group" aria-label="묶어 보기">
              <button type="button" aria-pressed={groupBy === "name"} onClick={() => setGroupBy("name")}>제품명별</button>
              <button type="button" aria-pressed={groupBy === "size"} onClick={() => setGroupBy("size")}>사이즈별</button>
            </div>
          </div>
        </div>

        <button type="submit" className="search-btn">검색</button>
      </form>

      {!search && <p className="hint">제품명 · 사이즈를 고르고 검색하세요. 전체로 검색하면 제품명별 또는 사이즈별로 묶어 보여 줍니다.</p>}
      {search && (
        <p className="result-count">
          {results.length}건
          {search.amount !== null && ` · 필요 ${formatNumber(search.amount)}${search.unit === "pcs" ? "장" : "㎡ (로스율 기본값 포함)"}을 댈 수 있는 것만`}
          {hidden > 0 && ` · 부족한 ${hidden}건 숨김`}
        </p>
      )}

      {groups.map(([key, items]) => (
        <section key={key} className="stock-group">
          <h3>{search?.groupBy === "name" ? key : sizeLabel(key)} <span>{items.length}</span></h3>
          <ul className="stock-list">
            {items.map((p) => {
              const s = stockSignal(p);
              const check = checks.get(p.code);
              return (
                <li key={p.code} className={`stock-row ${s}`}>
                  <span className={`dot ${s}`} aria-hidden />
                  <strong className="name">{p.name} {faceLabel(p)}</strong>
                  <b className="qty">{formatNumber(p.stock)}장</b>
                  <small className="meta">
                    {SIGNAL_LABEL[s]} · {CATEGORY_LABEL[p.category]} · {palletsOf(p).toFixed(1)}파렛트
                    <span className="code"> · {p.code}</span>
                  </small>
                  {check ? (
                    <small className="ref ok">필요 {formatNumber(check.required)}장 · 남음 {formatNumber(p.stock - check.required)}장</small>
                  ) : (
                    <small className="ref">파렛트당 {formatNumber(p.piecesPerPack)}장</small>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {search && results.length === 0 && <p className="hint">{hidden > 0 ? "필요 수량을 댈 수 있는 재고가 없습니다." : "맞는 제품이 없습니다."}</p>}
    </div>
  );
}
