// 견적(장수) 계산 — 규칙은 spec/calc-rules.md 그대로. 금액은 다루지 않는다

export type Category = "tile" | "brick";

export type Product = {
  code: string;
  category: Category;
  name: string;
  size: string; // mm "길이x폭x높이" — 벽돌 "190x90x57", 벽돌 타일 "230x20x76"
  piecesPerSqm: number | null; // 직접 값이 있으면 우선, null이면 규격으로 계산
  packUnit: "파렛트";
  piecesPerPack: number;
  stock: number;
  reorderPoint: number;
};

export type Quote = {
  perSqm: number; // ㎡당 장수
  required: number; // 필요 장수
  packs: number; // 꽉 찬 파렛트 수 (올림 안 함)
  loose: number; // 파렛트에 못 채운 낱장
};

export type QuoteResult = { ok: true; quote: Quote } | { ok: false; error: string };

// 로스율 기본값(%)
export const DEFAULT_LOSS: Record<Category, number> = { tile: 10, brick: 5 };

// 면적 단위 — "평"은 건물 평수: 30평 1층 건물 ≈ 외벽 100㎡, 층수만큼 곱한다
export type AreaUnit = "sqm" | "pyeong";
export const toSqm = (value: number, unit: AreaUnit, floors = 1) =>
  unit === "pyeong" ? (value * 100 * floors) / 30 : value;

// 줄눈(mm) — 길이·높이에 각각 더한다
export const JOINT_MM = 12;

// 부동소수 오차로 110.00000000000001 같은 값이 111로 올림되지 않게 한다
const ceil = (x: number) => Math.ceil(Math.round(x * 1e6) / 1e6);

// 보이는 면 = 길이 × 높이 (가운데 폭·두께는 안 씀)
export function face(p: Product) {
  const [length, , height] = p.size.split("x").map(Number);
  return { length, height };
}

// ㎡당 장수 = 올림(1,000,000 / ((길이+12) × (높이+12)))
export function piecesPerSqm(p: Product): number {
  if (p.piecesPerSqm) return p.piecesPerSqm;
  const { length, height } = face(p);
  return ceil(1_000_000 / ((length + JOINT_MM) * (height + JOINT_MM)));
}

export function calcQuote(p: Product, areaSqm: number, lossPct: number): QuoteResult {
  if (!Number.isFinite(areaSqm) || areaSqm <= 0) return { ok: false, error: "면적은 0보다 큰 숫자로 입력해 주세요." };
  if (!Number.isFinite(lossPct) || lossPct < 0) return { ok: false, error: "로스율은 0% 이상으로 입력해 주세요." };

  const perSqm = piecesPerSqm(p);
  const required = ceil(areaSqm * perSqm * (1 + lossPct / 100));
  const packs = Math.floor(required / p.piecesPerPack);
  return { ok: true, quote: { perSqm, required, packs, loose: required - packs * p.piecesPerPack } };
}

export const formatNumber = (n: number) => n.toLocaleString("ko-KR");

// "5파렛트 + 1,060장" · "2파렛트" · "968장"
export function formatPacks({ packs, loose }: Pick<Quote, "packs" | "loose">): string {
  if (packs === 0) return `${formatNumber(loose)}장`;
  return loose === 0 ? `${formatNumber(packs)}파렛트` : `${formatNumber(packs)}파렛트 + ${formatNumber(loose)}장`;
}
