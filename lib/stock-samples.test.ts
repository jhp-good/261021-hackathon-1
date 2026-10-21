import { describe, expect, it } from "vitest";
import { groupProducts, stockCheck, stockSignal } from "./stock";
import { daysSince, isDelayed, nextStage, STAGES, type Sample } from "./samples";
import type { Product } from "./quote";
import data from "../data/products.json";
import samples from "../data/samples.json";
import { toDate, toSample } from "./samples-db";

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
  it("묶기: 제품명별 · 사이즈별, 데이터 순서 유지", () => {
    const list = products.filter((p) => p.name === "코넬" || p.name === "변색");
    const byName = groupProducts(list, "name");
    expect(byName.map(([k, items]) => [k, items.length])).toEqual([["코넬", 5], ["변색", 1]]);
    const bySize = groupProducts(list, "size");
    expect(bySize[0]).toEqual(["190x90x57", [find("코넬", "190x90x57"), find("변색", "190x90x57")]]);
    expect(bySize).toHaveLength(5);
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

describe("샘플 DB 행 → 화면용", () => {
  it("날짜는 YYYY-MM-DD, 빈 메모 · 피드백은 빈 글, 모르는 단계는 발송 준비", () => {
    const row = { id: "S-99", productCode: "B01-190x57", customer: "○○건설", sentDate: toDate("2026-10-12"), stage: "엉뚱", note: null, feedback: "좋음", updatedAt: new Date() };
    expect(toSample(row)).toEqual({ id: "S-99", productCode: "B01-190x57", customer: "○○건설", sentDate: "2026-10-12", stage: "발송 준비", note: "", feedback: "좋음" });
  });
});
