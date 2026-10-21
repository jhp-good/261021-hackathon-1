"use client";

import { useState } from "react";
import data from "@/data/products.json";
import { calcQuote, DEFAULT_LOSS, face, formatNumber, toSqm, type AreaUnit, type Category, type Product } from "@/lib/quote";

const products = data as Product[];
const TABS: { key: Category; label: string }[] = [
  { key: "brick", label: "벽돌" },
  { key: "tile", label: "타일" },
];
const namesOf = (c: Category) => [...new Set(products.filter((p) => p.category === c).map((p) => p.name))];
const faceLabel = (p: Product) => `${face(p).length}×${face(p).height}`;

export default function QuotePage() {
  const [category, setCategory] = useState<Category>("brick");
  const [name, setName] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [area, setArea] = useState("");
  const [unit, setUnit] = useState<AreaUnit>("sqm");
  const [floors, setFloors] = useState("1");
  const [loss, setLoss] = useState(String(DEFAULT_LOSS.brick));

  const sizes = products.filter((p) => p.category === category && p.name === name);
  const product = sizes.find((p) => p.code === code);
  const floorsNum = Number(floors);
  const floorsBad = unit === "pyeong" && !(Number.isInteger(floorsNum) && floorsNum >= 1);
  const sqm = toSqm(Number(area), unit, floorsNum);
  const result = !product || area.trim() === "" ? null
    : floorsBad ? { ok: false as const, error: "층수는 1 이상의 정수로 입력해 주세요." }
    : calcQuote(product, sqm, loss.trim() === "" ? NaN : Number(loss));

  function switchTab(c: Category) {
    setCategory(c);
    setName(null);
    setCode(null);
    setLoss(String(DEFAULT_LOSS[c]));
  }

  function pickName(n: string) {
    setName(n);
    setCode(null);
  }

  return (
    <div className="narrow">
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={category === t.key} onClick={() => switchTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <section className="field">
        <h2>① 제품명</h2>
        <div className="chips">
          {namesOf(category).map((n) => (
            <button key={n} aria-pressed={n === name} onClick={() => pickName(n)}>{n}</button>
          ))}
        </div>
      </section>

      {name && (
        <section className="field">
          <h2>② 사이즈</h2>
          <div className="products">
            {sizes.map((p) => (
              <button key={p.code} aria-pressed={p.code === code} onClick={() => setCode(p.code)}>
                <strong>{faceLabel(p)}</strong>
                <span>{p.size}mm</span>
                <span>파렛트당 {formatNumber(p.piecesPerPack)}장</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {!product && <p className="hint">{name ? "사이즈를 고르면 계산창이 나옵니다." : "제품명을 고르세요."}</p>}

      {product && (
        <>
          <div className={unit === "pyeong" ? "inputs with-floors" : "inputs"}>
            <div className="field">
              <div className="label-row">
                <label className="label" htmlFor="area">{unit === "sqm" ? "③ 면적" : "③ 건물 평수"}</label>
                <div className="unit" role="group" aria-label="면적 단위">
                  <button aria-pressed={unit === "sqm"} onClick={() => setUnit("sqm")}>㎡</button>
                  <button aria-pressed={unit === "pyeong"} onClick={() => setUnit("pyeong")}>평</button>
                </div>
              </div>
              <input id="area" type="number" inputMode="decimal" min="0" step="any" placeholder="예: 30"
                value={area} onChange={(e) => setArea(e.target.value)} autoFocus />
            </div>
            {unit === "pyeong" && (
              <label className="field">
                <span className="label">층수</span>
                <input type="number" inputMode="numeric" min="1" step="1"
                  value={floors} onChange={(e) => setFloors(e.target.value)} />
              </label>
            )}
            <label className="field">
              <span className="label">로스율 (%)</span>
              <input type="number" inputMode="decimal" min="0" step="any"
                value={loss} onChange={(e) => setLoss(e.target.value)} />
            </label>
          </div>

          {unit === "pyeong" && <p className="hint small">건물 30평 1층 ≈ 외벽 100㎡ 기준으로 환산합니다.</p>}
          {result === null && <p className="hint">면적을 입력하면 바로 계산됩니다.</p>}
          {result && !result.ok && <p className="error" role="alert">{result.error}</p>}
          {result && result.ok && (
            <section className="result" aria-live="polite">
              <p className="result-head">
                {product.name} {faceLabel(product)} · ㎡당 {formatNumber(result.quote.perSqm)}장 ·{" "}
                {unit === "pyeong" ? `${area}평 ${floors}층 → 외벽 ${Number.isInteger(sqm) ? "" : "약 "}${formatNumber(Math.round(sqm))}㎡` : `${area}㎡`} · 로스 {loss}%
              </p>
              <div className="stats single">
                <div><span>필요 장수</span><b>{formatNumber(result.quote.required)}장</b></div>
                <div className="hero">
                  <span>파렛트</span>
                  <b>
                    {result.quote.packs > 0 && `${formatNumber(result.quote.packs)}파렛트`}
                    {result.quote.packs > 0 && result.quote.loose > 0 && " + "}
                    {(result.quote.loose > 0 || result.quote.packs === 0) && `${formatNumber(result.quote.loose)}장`}
                  </b>
                  <small>파렛트당 {formatNumber(product.piecesPerPack)}장</small>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
