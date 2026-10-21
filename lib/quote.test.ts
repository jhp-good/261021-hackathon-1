import { describe, expect, it } from "vitest";
import { calcQuote, formatWon, piecesPerSqm, type Product } from "./quote";
import products from "../data/products.json";

const tile = (size: string, piecesPerPack: number, pricePerPiece = 1000): Product => ({
  code: "T-TEST", category: "tile", name: "테스트 타일", size, pricePerPiece,
  piecesPerSqm: null, packUnit: "박스", piecesPerPack, stock: 0, reorderPoint: 0,
});

const brick = (perSqm: number, piecesPerPack: number, pricePerPiece = 400): Product => ({
  code: "B-TEST", category: "brick", name: "테스트 벽돌", size: "190x90x57", pricePerPiece,
  piecesPerSqm: perSqm, packUnit: "파렛트", piecesPerPack, stock: 0, reorderPoint: 0,
});

describe("calc-rules.md 테스트", () => {
  it("타일 600x600, 20㎡, 로스 10%, 박스 4장 → 62장 · 16박스 · 64장", () => {
    const p = tile("600x600", 4);
    expect(piecesPerSqm(p)).toBeCloseTo(2.7778, 4);
    const r = calcQuote(p, 20, 10);
    expect(r).toEqual({ ok: true, quote: expect.objectContaining({ required: 62, packs: 16, orderPieces: 64, total: 64_000 }) });
  });

  it("벽돌 ㎡당 75장, 30㎡, 로스 5%, 파렛트 500장 → 2,363장 · 5파렛트 · 2,500장", () => {
    const r = calcQuote(brick(75, 500), 30, 5);
    expect(r).toEqual({ ok: true, quote: expect.objectContaining({ required: 2363, packs: 5, orderPieces: 2500, total: 1_000_000 }) });
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
  it("벽돌은 규격이 아니라 piecesPerSqm 값을 쓴다", () => {
    expect(piecesPerSqm(brick(75, 500))).toBe(75);
  });

  it("딱 떨어지는 값은 부동소수 오차로 한 장 더 올림하지 않는다 (100×1.1 = 110)", () => {
    const r = calcQuote(tile("100x100", 10), 1, 10);
    expect(r.ok && r.quote.required).toBe(110);
  });

  it("음수 로스율은 에러", () => {
    expect(calcQuote(brick(75, 500), 30, -5).ok).toBe(false);
  });

  it("금액은 천 단위 쉼표, 원 단위", () => {
    expect(formatWon(1_050_000)).toBe("1,050,000원");
  });

  it("데모 장면: products.json의 붉은 벽돌(파렛트 1,300장) 30㎡ → 2,363장 · 2파렛트 · 2,600장", () => {
    const red = (products as Product[]).find((p) => p.name === "붉은 벽돌")!;
    const r = calcQuote(red, 30, 5);
    expect(r.ok && [r.quote.required, r.quote.packs, r.quote.orderPieces]).toEqual([2363, 2, 2600]);
  });
});
