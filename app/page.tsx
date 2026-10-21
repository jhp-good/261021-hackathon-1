"use client";

import { useState } from "react";
import data from "@/data/products.json";
import { calcQuote, DEFAULT_LOSS, formatNumber, type Category, type Product } from "@/lib/quote";

const products = data as Product[];
const TABS: { key: Category; label: string }[] = [
  { key: "tile", label: "타일" },
  { key: "brick", label: "벽돌" },
];
const firstOf = (c: Category) => products.find((p) => p.category === c)!.code;

export default function QuotePage() {
  const [category, setCategory] = useState<Category>("tile");
  const [code, setCode] = useState(firstOf("tile"));
  const [area, setArea] = useState("");
  const [loss, setLoss] = useState(String(DEFAULT_LOSS.tile));

  const list = products.filter((p) => p.category === category);
  const product = list.find((p) => p.code === code) ?? list[0];
  const result = area.trim() === "" ? null : calcQuote(product, Number(area), loss.trim() === "" ? NaN : Number(loss));

  function switchTab(c: Category) {
    setCategory(c);
    setCode(firstOf(c));
    setLoss(String(DEFAULT_LOSS[c]));
  }

  return (
    <>
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={category === t.key} onClick={() => switchTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <section className="field">
        <h2>품목</h2>
        <div className="products">
          {list.map((p) => (
            <button key={p.code} aria-pressed={p.code === product.code} onClick={() => setCode(p.code)}>
              <strong>{p.name}</strong>
              <span>{p.code} · {p.size}mm</span>
              <span>{p.packUnit}당 {formatNumber(p.piecesPerPack)}장</span>
            </button>
          ))}
        </div>
      </section>

      <div className="inputs">
        <label className="field">
          <span className="label">면적 (㎡)</span>
          <input type="number" inputMode="decimal" min="0" step="any" placeholder="예: 30"
            value={area} onChange={(e) => setArea(e.target.value)} autoFocus />
        </label>
        <label className="field">
          <span className="label">로스율 (%)</span>
          <input type="number" inputMode="decimal" min="0" step="any"
            value={loss} onChange={(e) => setLoss(e.target.value)} />
        </label>
      </div>

      {result === null && <p className="hint">면적을 입력하면 바로 계산됩니다.</p>}
      {result && !result.ok && <p className="error" role="alert">{result.error}</p>}
      {result && result.ok && (
        <section className="result" aria-live="polite">
          <p className="result-head">
            {product.name} {product.size}mm · ㎡당 {Number.isInteger(result.quote.perSqm) ? "" : "약 "}
            {formatNumber(Math.round(result.quote.perSqm))}장 · {area}㎡ · 로스 {loss}%
          </p>
          <div className="stats">
            <div><span>필요 장수</span><b>{formatNumber(result.quote.required)}장</b></div>
            <div>
              <span>포장 수</span>
              <b>{formatNumber(result.quote.packs)}{product.packUnit}</b>
              <small>{product.packUnit}당 {formatNumber(product.piecesPerPack)}장</small>
            </div>
            <div className="hero">
              <span>주문 장수</span>
              <b>{formatNumber(result.quote.orderPieces)}장</b>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
