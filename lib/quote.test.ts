import { describe, expect, it } from "vitest";
import { calcQuote, formatNumber, formatPacks, piecesPerSqm, toSqm, type Product } from "./quote";
import data from "../data/products.json";

const products = data as Product[];

const item = (size: string, piecesPerPack: number, perSqm: number | null = null): Product => ({
  code: "X-TEST", category: "brick", name: "테스트", image: null, size,
  piecesPerSqm: perSqm, packUnit: "파렛트", piecesPerPack, stock: 0, reorderPoint: 0,
});

describe("calc-rules.md 테스트", () => {
  it("벽돌 190x90x57 → ㎡당 올림(1,000,000 / (202 × 69)) = 72장, 30㎡ 로스 5% → 2,268장 = 1파렛트 + 968장", () => {
    expect(calcQuote(item("190x90x57", 1300), 30, 5)).toEqual({ ok: true, quote: { perSqm: 72, required: 2268, packs: 1, loose: 968 } });
  });

  it("벽돌 ㎡당 75장(직접 값), 30㎡, 로스 5%, 파렛트 500장 → 2,363장 = 4파렛트 + 363장", () => {
    expect(calcQuote(item("190x90x57", 500, 75), 30, 5)).toEqual({ ok: true, quote: { perSqm: 75, required: 2363, packs: 4, loose: 363 } });
  });

  it("경계값: 면적 0 또는 음수는 에러 메시지", () => {
    for (const area of [0, -1, -30, NaN]) {
      const r = calcQuote(item("190x90x57", 1300), area, 5);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toMatch(/면적/);
    }
  });
});

describe("추가 확인", () => {
  it("㎡당 장수는 길이 × 높이만 쓰고 올림 — 폭·두께는 안 씀", () => {
    expect(piecesPerSqm(item("230x90x76", 680))).toBe(47); // 1,000,000 / (242 × 88) = 46.96 → 47
    expect(piecesPerSqm(item("230x20x76", 2873))).toBe(47); // 벽돌 타일도 같은 공식
    expect(piecesPerSqm(item("290x90x48", 1040))).toBe(56); // 1,000,000 / (302 × 60) = 55.19 → 56
  });

  it("파렛트에 딱 맞으면 낱장 0, 1파렛트가 안 되면 낱장만", () => {
    expect(calcQuote(item("190x90x57", 500, 100), 10, 0)).toEqual({ ok: true, quote: expect.objectContaining({ packs: 2, loose: 0 }) });
    expect(calcQuote(item("190x90x57", 1300), 1, 0)).toEqual({ ok: true, quote: expect.objectContaining({ packs: 0, loose: 72 }) });
  });

  it("딱 떨어지는 값은 부동소수 오차로 한 장 더 올림하지 않는다 (100×1.1 = 110)", () => {
    const r = calcQuote(item("190x90x57", 1300, 100), 1, 10);
    expect(r.ok && r.quote.required).toBe(110);
  });

  it("건물 평 → 외벽 ㎡: 30평 1층 = 100㎡, 층수만큼 곱한다", () => {
    expect(toSqm(30, "pyeong")).toBe(100);
    expect(toSqm(30, "pyeong", 2)).toBe(200);
    expect(toSqm(30, "sqm", 2)).toBe(30); // ㎡ 입력은 층수 무시
  });

  it("음수 로스율은 에러", () => {
    expect(calcQuote(item("190x90x57", 1300), 30, -5).ok).toBe(false);
  });

  it("장수는 천 단위 쉼표", () => {
    expect(formatNumber(7560)).toBe("7,560");
  });

  it("파렛트 표시: N파렛트 + M장 / 낱장 0이면 파렛트만 / 1파렛트 미만이면 장만", () => {
    expect(formatPacks({ packs: 5, loose: 1060 })).toBe("5파렛트 + 1,060장");
    expect(formatPacks({ packs: 2, loose: 0 })).toBe("2파렛트");
    expect(formatPacks({ packs: 0, loose: 968 })).toBe("968장");
  });

  it("products.json: 점토벽돌 22종 98개 · 타일 6종 12개, 품번 중복 없음, 벽돌은 모두 사진 있음", () => {
    const names = (c: string) => new Set(products.filter((p) => p.category === c).map((p) => p.name)).size;
    expect([names("brick"), products.filter((p) => p.category === "brick").length]).toEqual([22, 98]);
    expect([names("tile"), products.filter((p) => p.category === "tile").length]).toEqual([6, 12]);
    expect(new Set(products.map((p) => p.code)).size).toBe(products.length);
    expect(products.filter((p) => p.category === "brick" && !p.image)).toEqual([]);
  });

  it("사이즈: 변색 · 환원(진/연)은 190×57만, 나머지는 5가지 · 화이트 계열 300×76은 480장", () => {
    const sizesOf = (n: string) => products.filter((p) => p.name === n).map((p) => p.size);
    for (const n of ["변색", "환원(진)", "환원(연)"]) expect(sizesOf(n)).toEqual(["190x90x57"]);
    expect(sizesOf("코넬")).toEqual(["190x90x57", "230x90x57", "290x90x57", "230x90x76", "300x90x76"]);
    const pack = (n: string) => products.find((p) => p.name === n && p.size === "300x90x76")!.piecesPerPack;
    expect([pack("코넬"), pack("엔젤화이트"), pack("블랑쉬100")]).toEqual([612, 480, 480]);
  });

  it("데모 장면: 코넬 190×57 30평 1층(100㎡) 로스 5% → 7,560장 = 5파렛트 + 1,060장", () => {
    const red = products.find((p) => p.name === "코넬" && p.size === "190x90x57")!;
    const r = calcQuote(red, toSqm(30, "pyeong"), 5);
    expect(r).toEqual({ ok: true, quote: { perSqm: 72, required: 7560, packs: 5, loose: 1060 } });
  });
});
