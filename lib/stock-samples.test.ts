import { describe, expect, it } from "vitest";
import { sortBySignal, stockSignal } from "./stock";
import { daysSince, isDelayed, nextStage, STAGES, type Sample } from "./samples";
import products from "../data/products.json";
import samples from "../data/samples.json";

describe("재고 신호등", () => {
  it("빨강: stock < reorderPoint", () => {
    expect(stockSignal({ stock: 999, reorderPoint: 1000 })).toBe("red");
  });

  it("노랑: stock < reorderPoint × 1.5 (경계 1000 · 1499)", () => {
    expect(stockSignal({ stock: 1000, reorderPoint: 1000 })).toBe("yellow");
    expect(stockSignal({ stock: 1499, reorderPoint: 1000 })).toBe("yellow");
  });

  it("초록: 그 외 (1500부터)", () => {
    expect(stockSignal({ stock: 1500, reorderPoint: 1000 })).toBe("green");
  });

  it("정렬: 빨강이 위, 같은 색이면 기준 대비 적은 순", () => {
    const sorted = sortBySignal([
      { id: "g", stock: 5000, reorderPoint: 1000 },
      { id: "y", stock: 1200, reorderPoint: 1000 },
      { id: "r2", stock: 900, reorderPoint: 1000 },
      { id: "r1", stock: 100, reorderPoint: 1000 },
    ]);
    expect(sorted.map((s) => s.id)).toEqual(["r1", "r2", "y", "g"]);
  });

  it("products.json: 빨강 3 · 노랑 3", () => {
    const count = (s: string) => products.filter((p) => stockSignal(p) === s).length;
    expect([count("red"), count("yellow")]).toEqual([3, 3]);
  });
});

describe("샘플 단계", () => {
  it("포장 → 발송 → 도착 → 확인완료, 확인완료에서 더 안 감", () => {
    expect([nextStage("포장"), nextStage("발송"), nextStage("도착"), nextStage("확인완료")]).toEqual(["발송", "도착", "확인완료", "확인완료"]);
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
