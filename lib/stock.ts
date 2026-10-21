// 재고 신호등 · 재고 검색 — 규칙은 spec/calc-rules.md
import { calcQuote, DEFAULT_LOSS, type Product } from "./quote";

export type Signal = "red" | "yellow" | "green";

export const SIGNAL_LABEL: Record<Signal, string> = { red: "빨강", yellow: "노랑", green: "초록" };

// 파렛트 기준: 5파렛트 미만 빨강, 10파렛트 미만 노랑, 그 외 초록
export const RED_UNDER_PALLETS = 5;
export const YELLOW_UNDER_PALLETS = 10;

export const palletsOf = (p: Pick<Product, "stock" | "piecesPerPack">) => p.stock / p.piecesPerPack;

export function stockSignal(p: Pick<Product, "stock" | "piecesPerPack">): Signal {
  const pallets = palletsOf(p);
  if (pallets < RED_UNDER_PALLETS) return "red";
  if (pallets < YELLOW_UNDER_PALLETS) return "yellow";
  return "green";
}

// 검색 결과 묶기 — 제품명별 또는 사이즈(전체 규격)별, 데이터 순서 유지
export type GroupBy = "name" | "size";

export function groupProducts<T extends Pick<Product, "name" | "size">>(list: T[], by: GroupBy): [key: string, items: T[]][] {
  const groups = new Map<string, T[]>();
  for (const p of list) {
    const key = by === "name" ? p.name : p.size;
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  return [...groups];
}

// 필요한 양(장 또는 ㎡)을 재고로 댈 수 있는지 — ㎡는 견적과 같은 계산(기본 로스율 포함)
export type NeedUnit = "pcs" | "sqm";

export function stockCheck(p: Product, amount: number, unit: NeedUnit) {
  let required = Math.ceil(amount);
  if (unit === "sqm") {
    const r = calcQuote(p, amount, DEFAULT_LOSS[p.category]);
    if (!r.ok) return null;
    required = r.quote.required;
  }
  if (!(required > 0)) return null;
  return { required, ok: p.stock >= required, short: Math.max(required - p.stock, 0) };
}
