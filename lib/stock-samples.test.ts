import { describe, expect, it } from "vitest";
import { matchProduct, stockCheck, stockSignal } from "./stock";
import { daysSince, isDelayed, nextStage, STAGES, type Sample } from "./samples";
import type { Product } from "./quote";
import data from "../data/products.json";
import samples from "../data/samples.json";

const products = data as Product[];
const find = (name: string, size: string) => products.find((p) => p.name === name && p.size === size)!;

describe("재고 신호등 (파렛트 기준)", () => {
  it("5파렛트 미만 빨강 · 10파렛트 미만 노랑 · 그 외 초록 (경계값)", () => {
    const at = (pallets: number) => stockSignal({ stock: pallets * 1000, piecesPerPack: 1000 });
    expect([at(4.999), at(5), at(9.999), at(10)]).toEqual(["red", "yellow", "yellow", "green"]);
  });

  it("products.json: 빨강 3 · 노랑 3", () => {
    const count = (s: string) => products.filter((p) => stockSignal(p) === s).length;
    expect([count("red"), count("yellow")]).toEqual([3, 3]);
  });
});

describe("재고 검색", () => {
  const names = (field: "name" | "size", q: string) => products.filter((p) => matchProduct(p, field, q)).map((p) => `${p.name} ${p.size}`);

  it("제품명: 띄어쓰기 무시, 포함 검색", () => {
    expect(names("name", "펄토스카나")).toHaveLength(5);
    expect(names("name", "토스카나")).toHaveLength(10); // 토스카나 + 펄 토스카나
  });

  it("사이즈: 190*57 = 길이×높이, 190x90x57 = 전체 규격, 76 = 어느 치수든", () => {
    const n = (q: string) => names("size", q).length;
    expect(n("190*57")).toBe(22); // 벽돌 22종 모두 190×57 있음
    expect(n("190x90x57")).toBe(22);
    expect(n("230×76")).toBe(19 + 6); // 벽돌 19종 + 타일 6종(230x20x76)
    expect(n("76")).toBe(19 * 2 + 6);
    expect(n("abc")).toBe(0);
  });

  it("필요 수량: 장은 그대로, ㎡는 견적 계산(기본 로스율)으로 비교", () => {
    const p = { ...find("코넬", "190x90x57"), stock: 2000 };
    expect(stockCheck(p, 1500, "pcs")).toEqual({ required: 1500, ok: true, short: 0 });
    expect(stockCheck(p, 30, "sqm")).toEqual({ required: 2268, ok: false, short: 268 }); // 30㎡ × 72 × 1.05
    expect(stockCheck(p, 0, "sqm")).toBeNull();
  });
});

describe("샘플 단계", () => {
  it("발송 준비 → 발송 → 도착 → 확인완료, 확인완료에서 더 안 감", () => {
    expect([nextStage("발송 준비"), nextStage("발송"), nextStage("도착"), nextStage("확인완료")]).toEqual(["발송", "도착", "확인완료", "확인완료"]);
  });

  it("발송 단계에서 7일 초과면 지연 (7일은 아님)", () => {
    const today = new Date(2026, 9, 21);
    expect(daysSince("2026-10-14", today)).toBe(7);
    expect(isDelayed({ stage: "발송", sentDate: "2026-10-14" }, today)).toBe(false);
    expect(isDelayed({ stage: "발송", sentDate: "2026-10-13" }, today)).toBe(true);
    expect(isDelayed({ stage: "도착", sentDate: "2026-10-01" }, today)).toBe(false);
  });

  it("samples.json: 15건, 품번은 products.json에 있음, 단계 값 정상", () => {
    const list = samples as Sample[];
    expect(list).toHaveLength(15);
    const codes = new Set(products.map((p) => p.code));
    for (const s of list) {
      expect(codes.has(s.productCode)).toBe(true);
      expect(STAGES).toContain(s.stage);
      expect(typeof s.feedback).toBe("string");
    }
  });
});
