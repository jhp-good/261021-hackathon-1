// 재고 신호등 — 규칙은 spec/calc-rules.md
import type { Product } from "./quote";

export type Signal = "red" | "yellow" | "green";

export const SIGNAL_LABEL: Record<Signal, string> = { red: "빨강", yellow: "노랑", green: "초록" };
const ORDER: Record<Signal, number> = { red: 0, yellow: 1, green: 2 };

export function stockSignal(p: Pick<Product, "stock" | "reorderPoint">): Signal {
  if (p.stock < p.reorderPoint) return "red";
  if (p.stock < p.reorderPoint * 1.5) return "yellow";
  return "green";
}

// 빨강 → 노랑 → 초록, 같은 색이면 기준 대비 재고가 적은 순
export function sortBySignal<T extends Pick<Product, "stock" | "reorderPoint">>(list: T[]): T[] {
  return [...list].sort(
    (a, b) => ORDER[stockSignal(a)] - ORDER[stockSignal(b)] || a.stock / a.reorderPoint - b.stock / b.reorderPoint,
  );
}
