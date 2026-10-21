import { describe, expect, it } from "vitest";
import { calcQuote, formatNumber, piecesPerSqm, toSqm, type Product } from "./quote";
import products from "../data/products.json";

const tile = (size: string, piecesPerPack: number): Product => ({
  code: "T-TEST", category: "tile", name: "테스트 타일", size,
  piecesPerSqm: null, packUnit: "박스", piecesPerPack, stock: 0, reorderPoint: 0,
});

const brick = (perSqm: number | null, piecesPerPack: number, size = "190x90x57"): Product => ({
  code: "B-TEST", category: "brick", name: "테스트 벽돌", size,
  piecesPerSqm: perSqm, packUnit: "파렛트", piecesPerPack, stock: 0, reorderPoint: 0,
});

describe("calc-rules.md 테스트", () => {
  it("타일 600x600, 20㎡, 로스 10%, 박스 4장 → 62장 · 16박스 · 64장", () => {
    const p = tile("600x600", 4);
    expect(piecesPerSqm(p)).toBeCloseTo(2.7778, 4);
    expect(calcQuote(p, 20, 10)).toEqual({ ok: true, quote: expect.objectContaining({ required: 62, packs: 16, orderPieces: 64 }) });
  });

  it("벽돌 ㎡당 75장, 30㎡, 로스 5%, 파렛트 500장 → 2,363장 = 4파렛트 + 363장 (파렛트는 올림 안 함)", () => {
    expect(calcQuote(brick(75, 500), 30, 5)).toEqual({ ok: true, quote: expect.objectContaining({ required: 2363, packs: 4, loose: 363, orderPieces: 2363 }) });
  });

  it("벽돌 경계값: 면적 0 또는 음수는 에러 메시지", () => {
    for (const area of [0, -1, -30, NaN]) {
      const r = calcQuote(brick(75, 500), area, 5);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toMatch(/면적/);
    }
  });
});

describe("추가 확인", () => {
  it("벽돌 ㎡당 장수 = 올림(1,000,000 / ((길이+12) × (높이+12))) — 폭은 안 씀", () => {
    expect(piecesPerSqm(brick(null, 1300))).toBe(72); // 1,000,000 / (202 × 69) = 71.75 → 72
    expect(piecesPerSqm(brick(null, 680, "230x90x76"))).toBe(47); // 1,000,000 / (242 × 88) = 46.96 → 47
    expect(piecesPerSqm(brick(null, 680, "230x200x76"))).toBe(47); // 폭이 달라도 같다
  });

  it("piecesPerSqm 직접 값이 있으면 그 값을 우선한다", () => {
    expect(piecesPerSqm(brick(75, 500))).toBe(75);
  });

  it("딱 떨어지는 값은 부동소수 오차로 한 장 더 올림하지 않는다 (100×1.1 = 110)", () => {
    const r = calcQuote(tile("100x100", 10), 1, 10);
    expect(r.ok && r.quote.required).toBe(110);
  });

  it("평 → ㎡: 1평 = 3.3㎡", () => {
    expect(toSqm(10, "pyeong")).toBeCloseTo(33, 10);
    expect(toSqm(30, "sqm")).toBe(30);
    // 붉은 벽돌 10평 = 33㎡ → 33 × 72 × 1.05 = 2,494.8 → 2,495장
    const r = calcQuote(brick(null, 1300), toSqm(10, "pyeong"), 5);
    expect(r.ok && [r.quote.required, r.quote.packs, r.quote.loose]).toEqual([2495, 1, 1195]);
  });

  it("음수 로스율은 에러", () => {
    expect(calcQuote(brick(75, 500), 30, -5).ok).toBe(false);
  });

  it("장수는 천 단위 쉼표", () => {
    expect(formatNumber(2268)).toBe("2,268");
  });

  it("벽돌이 파렛트에 딱 맞으면 낱장 0", () => {
    expect(calcQuote(brick(100, 500), 10, 0)).toEqual({ ok: true, quote: expect.objectContaining({ required: 1000, packs: 2, loose: 0 }) });
  });

  it("데모 장면: products.json의 붉은 벽돌 190x90x57(파렛트 1,300장) 30㎡ → 2,268장 = 1파렛트 + 968장", () => {
    const red = (products as Product[]).find((p) => p.name === "붉은 벽돌")!;
    const r = calcQuote(red, 30, 5); // 30 × 72 × 1.05 = 2,268
    expect(r.ok && [r.quote.perSqm, r.quote.required, r.quote.packs, r.quote.loose]).toEqual([72, 2268, 1, 968]);
  });
});
