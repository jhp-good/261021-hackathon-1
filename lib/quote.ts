// 견적 계산 — 규칙은 spec/calc-rules.md 그대로

export type Category = "tile" | "brick";

export type Product = {
  code: string;
  category: Category;
  name: string;
  size: string; // mm, 타일 "600x600" · 벽돌 "190x90x57"
  pricePerPiece: number; // 원, VAT 포함
  piecesPerSqm: number | null; // 벽돌만 직접 값, 타일은 null
  packUnit: "박스" | "파렛트";
  piecesPerPack: number;
  stock: number;
  reorderPoint: number;
};

export type Quote = {
  perSqm: number; // ㎡당 장수
  required: number; // 필요 장수
  packs: number; // 포장 수
  orderPieces: number; // 주문 장수
  total: number; // 합계(원, VAT 포함)
};

export type QuoteResult = { ok: true; quote: Quote } | { ok: false; error: string };

// 로스율 기본값(%)
export const DEFAULT_LOSS: Record<Category, number> = { tile: 10, brick: 5 };

export function piecesPerSqm(p: Product): number {
  if (p.category === "brick") {
    if (!p.piecesPerSqm) throw new Error(`${p.code}: 벽돌은 piecesPerSqm 값이 필요합니다`);
    return p.piecesPerSqm;
  }
  const [w, h] = p.size.split("x").map(Number);
  return 1_000_000 / (w * h);
}

// 부동소수 오차로 110.00000000000001 같은 값이 111로 올림되지 않게 한다
const ceil = (x: number) => Math.ceil(Math.round(x * 1e6) / 1e6);

export function calcQuote(p: Product, areaSqm: number, lossPct: number): QuoteResult {
  if (!Number.isFinite(areaSqm) || areaSqm <= 0) return { ok: false, error: "면적은 0보다 큰 숫자로 입력해 주세요." };
  if (!Number.isFinite(lossPct) || lossPct < 0) return { ok: false, error: "로스율은 0% 이상으로 입력해 주세요." };

  const perSqm = piecesPerSqm(p);
  const required = ceil(areaSqm * perSqm * (1 + lossPct / 100));
  const packs = Math.ceil(required / p.piecesPerPack);
  const orderPieces = packs * p.piecesPerPack;
  return { ok: true, quote: { perSqm, required, packs, orderPieces, total: orderPieces * p.pricePerPiece } };
}

export const formatNumber = (n: number) => n.toLocaleString("ko-KR");
export const formatWon = (n: number) => `${formatNumber(n)}원`;
