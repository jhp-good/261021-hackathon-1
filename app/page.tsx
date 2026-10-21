"use client";

import { useEffect, useRef, useState } from "react";
import data from "@/data/products.json";
import { calcQuote, DEFAULT_LOSS, face, formatNumber, formatPacks, toSqm, type AreaUnit, type Category, type Product } from "@/lib/quote";
import { toDateString } from "@/lib/samples";
import { glideTo } from "@/lib/glide";
import { savePdf, saveXlsx, type SheetRow } from "@/lib/export";

const products = data as Product[];
const TABS: { key: Category; label: string }[] = [
  { key: "brick", label: "벽돌" },
  { key: "tile", label: "타일" },
];
const namesOf = (c: Category) => [...new Set(products.filter((p) => p.category === c).map((p) => p.name))];
const faceLabel = (p: Product) => `${face(p).length}×${face(p).height}`;
const imageOf = (c: Category, n: string) => products.find((p) => p.category === c && p.name === n)?.image;

export default function QuotePage() {
  const [category, setCategory] = useState<Category>("brick");
  const [name, setName] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [area, setArea] = useState("");
  const [unit, setUnit] = useState<AreaUnit>("sqm");
  const [floors, setFloors] = useState("1");
  const [loss, setLoss] = useState(String(DEFAULT_LOSS.brick));
  const [glide, setGlide] = useState<"sizes" | "calc" | null>(null);
  const [saving, setSaving] = useState<"pdf" | "xlsx" | null>(null);
  const sizesRef = useRef<HTMLElement>(null);
  const calcRef = useRef<HTMLElement>(null);
  const areaRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLElement>(null);

  // 고른 다음 단계로 스르륵 — 화면이 그려진 뒤에 움직인다
  useEffect(() => {
    if (!glide) return;
    glideTo(glide === "sizes" ? sizesRef.current : calcRef.current, () => {
      if (glide === "calc") areaRef.current?.focus({ preventScroll: true });
    });
    setGlide(null);
  }, [glide]);

  const sizes = products.filter((p) => p.category === category && p.name === name);
  const product = sizes.find((p) => p.code === code);
  const floorsNum = Number(floors);
  const floorsBad = unit === "pyeong" && !(Number.isInteger(floorsNum) && floorsNum >= 1);
  const sqm = toSqm(Number(area), unit, floorsNum);
  const result = !product || area.trim() === "" ? null
    : floorsBad ? { ok: false as const, error: "층수는 1 이상의 정수로 입력해 주세요." }
    : calcQuote(product, sqm, loss.trim() === "" ? NaN : Number(loss));

  const areaText = unit === "pyeong"
    ? `${area}평 ${floors}층 → 외벽 ${Number.isInteger(sqm) ? "" : "약 "}${formatNumber(Math.round(sqm))}㎡`
    : `${area}㎡`;

  // 견적서 한 장 — 인쇄 · PDF · 엑셀이 같은 내용을 쓴다
  const today = toDateString(new Date());
  const rows: SheetRow[] = product && result?.ok ? [
    ["품목", `${product.name} (${product.category === "brick" ? "벽돌" : "타일"})`],
    ["규격", `${product.size}mm (보이는 면 ${faceLabel(product)})`],
    ["면적", areaText],
    ["로스율", `${loss}%`],
    ["㎡당 장수", `${formatNumber(result.quote.perSqm)}장 (줄눈 12mm 기준)`],
    ["필요 장수", `${formatNumber(result.quote.required)}장`],
    ["포장 수", `${formatPacks(result.quote)} (파렛트당 ${formatNumber(product.piecesPerPack)}장)`],
  ] : [];
  const filename = product ? `견적서_${product.name}_${faceLabel(product).replace("×", "x")}_${today}` : "견적서";

  function switchTab(c: Category) {
    setCategory(c);
    setName(null);
    setCode(null);
    setLoss(String(DEFAULT_LOSS[c]));
  }

  function pickName(n: string) {
    setName(n);
    setCode(null);
    setGlide("sizes");
  }

  function pickSize(c: string) {
    setCode(c);
    setGlide("calc");
  }

  async function save(kind: "pdf" | "xlsx") {
    setSaving(kind);
    try {
      if (kind === "pdf" && sheetRef.current) await savePdf(sheetRef.current, `${filename}.pdf`);
      if (kind === "xlsx") await saveXlsx(today, rows, `${filename}.xlsx`);
    } catch {
      alert("저장하지 못했습니다. 인쇄 단추로 PDF 저장을 해 주세요.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <div className="quote no-print">
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={category === t.key} onClick={() => switchTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        <section className="step">
          <h2><em>01</em> 제품 선택</h2>
          <div className="card-grid">
            {namesOf(category).map((n) => {
              const image = imageOf(category, n);
              return (
                <button key={n} className={image ? "product-card" : "product-card text-only"} aria-pressed={n === name} onClick={() => pickName(n)}>
                  {image && <img src={image} alt="" loading="lazy" />}
                  <span>{n}</span>
                </button>
              );
            })}
          </div>
        </section>

        {name && (
          <section className="step fill" ref={sizesRef}>
            <h2><em>02</em> 사이즈 <small>{name}</small></h2>
            <div className="card-grid">
              {sizes.map((p) => (
                <button key={p.code} className="size-card" aria-pressed={p.code === code} onClick={() => pickSize(p.code)}>
                  <strong>{faceLabel(p)}</strong>
                  <span>{p.size}mm</span>
                  <span>파렛트당 {formatNumber(p.piecesPerPack)}장</span>
                </button>
              ))}
            </div>
            {!product && <p className="hint">사이즈를 고르면 면적 입력으로 넘어갑니다.</p>}
          </section>
        )}

        {product && (
          <section className="step fill" ref={calcRef}>
            <h2><em>03</em> 면적 <small>{product.name} {faceLabel(product)}</small></h2>
            <div className={unit === "pyeong" ? "inputs with-floors" : "inputs"}>
              <div className="field">
                <div className="label-row">
                  <label className="label" htmlFor="area">{unit === "sqm" ? "면적" : "건물 평수"}</label>
                  <div className="unit" role="group" aria-label="면적 단위">
                    <button aria-pressed={unit === "sqm"} onClick={() => setUnit("sqm")}>㎡</button>
                    <button aria-pressed={unit === "pyeong"} onClick={() => setUnit("pyeong")}>평</button>
                  </div>
                </div>
                <input id="area" ref={areaRef} type="number" inputMode="decimal" min="0" step="any" placeholder="예: 30"
                  value={area} onChange={(e) => setArea(e.target.value)} />
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
                  {product.name} {faceLabel(product)} · ㎡당 {formatNumber(result.quote.perSqm)}장 · {areaText} · 로스 {loss}%
                </p>
                <div className="stats">
                  <div><span>필요 장수</span><b>{formatNumber(result.quote.required)}장</b></div>
                  <div className="hero">
                    <span>파렛트</span>
                    <b>{formatPacks(result.quote)}</b>
                    <small>파렛트당 {formatNumber(product.piecesPerPack)}장</small>
                  </div>
                </div>
                <div className="export">
                  <button onClick={() => save("pdf")} disabled={saving !== null}>{saving === "pdf" ? "저장 중…" : "PDF 저장"}</button>
                  <button onClick={() => save("xlsx")} disabled={saving !== null}>{saving === "xlsx" ? "저장 중…" : "엑셀 저장"}</button>
                  <button onClick={() => window.print()} disabled={saving !== null}>인쇄</button>
                </div>
              </section>
            )}
          </section>
        )}
      </div>

      {/* 인쇄 · PDF용 A4 한 장 (화면에서는 숨김) */}
      {rows.length > 0 && (
        <article className="print-only print-sheet" ref={sheetRef}>
          <header>
            <h1>견적서</h1>
            <p>{today} · 로켓견적</p>
          </header>
          <table>
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label} className={label === "필요 장수" || label === "포장 수" ? "em" : undefined}>
                  <th>{label}</th><td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <footer>가상 데이터 · 참고용 견적</footer>
        </article>
      )}
    </>
  );
}
