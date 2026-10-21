// 견적(장수) 계산 — 규칙은 spec/calc-rules.md 그대로. 금액은 다루지 않는다

export type Category = "tile" | "brick";

export type Product = {
  code: string;
  category: Category;
  name: string;
  size: string; // mm, 타일 "600x600" · 벽돌 "190x90x57"
  piecesPerSqm: number | null; // 직접 값이 있으면 우선, null이면 규격으로 계산
  packUnit: "박스" | "파렛트";
  piecesPerPack: number;
  stock: number;
  reorderPoint: number;
};

export type Quote = {
  perSqm: number; // ㎡당 장수
  required: number; // 필요 장수
  packs: number; // 포장 수 — 타일: 올림 박스 수, 벽돌: 꽉 찬 파렛트 수
  loose: number; // 벽돌: 파렛트에 못 채운 낱장 (타일은 0)
  orderPieces: number; // 주문 장수 — 타일: 박스 × 장수, 벽돌: 필요 장수 그대로
};

export type QuoteResult = { ok: true; quote: Quote } | { ok: false; error: string };

// 로스율 기본값(%)
export const DEFAULT_LOSS: Record<Category, number> = { tile: 10, brick: 5 };

// 면적 단위 — "평"은 건물 평수: 30평 1층 건물 ≈ 외벽 100㎡, 층수만큼 곱한다
export type AreaUnit = "sqm" | "pyeong";
export const toSqm = (value: number, unit: AreaUnit, floors = 1) =>
  unit === "pyeong" ? (value * 100 * floors) / 30 : value;

// 벽돌 줄눈(mm) — 가로·세로에 각각 더한다
export const BRICK_JOINT_MM = 12;

// 부동소수 오차로 110.00000000000001 같은 값이 111로 올림되지 않게 한다
const ceil = (x: number) => Math.ceil(Math.round(x * 1e6) / 1e6);

// ㎡당 장수 — 타일: 1,000,000 / (가로 × 세로), 벽돌: 올림(1,000,000 / ((길이+12) × (높이+12)))
export function piecesPerSqm(p: Product): number {
  if (p.piecesPerSqm) return p.piecesPerSqm;
  const dims = p.size.split("x").map(Number);
  if (p.category === "tile") return 1_000_000 / (dims[0] * dims[1]);
  const [length, , height] = dims; // 벽돌 "길이x폭x높이" — 보이는 면은 길이 × 높이
  return ceil(1_000_000 / ((length + BRICK_JOINT_MM) * (height + BRICK_JOINT_MM)));
}

export function calcQuote(p: Product, areaSqm: number, lossPct: number): QuoteResult {
  if (!Number.isFinite(areaSqm) || areaSqm <= 0) return { ok: false, error: "면적은 0보다 큰 숫자로 입력해 주세요." };
  if (!Number.isFinite(lossPct) || lossPct < 0) return { ok: false, error: "로스율은 0% 이상으로 입력해 주세요." };

  const perSqm = piecesPerSqm(p);
  const required = ceil(areaSqm * perSqm * (1 + lossPct / 100));
  if (p.category === "brick") {
    const packs = Math.floor(required / p.piecesPerPack);
    return { ok: true, quote: { perSqm, required, packs, loose: required - packs * p.piecesPerPack, orderPieces: required } };
  }
  const packs = Math.ceil(required / p.piecesPerPack);
  return { ok: true, quote: { perSqm, required, packs, loose: 0, orderPieces: packs * p.piecesPerPack } };
}

export const formatNumber = (n: number) => n.toLocaleString("ko-KR");
