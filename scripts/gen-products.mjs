// data/products.json 생성 — 제품명 × 사이즈 한 줄씩 (벽돌 7종 23개, 타일 6종 12개)
// 실행: npm run gen:data
// 규칙: spec/data-model.md · 재고 신호등은 spec/calc-rules.md (빨강 3, 노랑 3이 되게 맞춤)
// 규격 · 파렛트당 장수는 업계 표 기준, 재고는 가상. 단가는 자주 바뀌므로 넣지 않는다
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// 규격 "길이x폭x높이"(mm) → 파렛트당 장수
const S190 = ["190x90x57", 1300];
const S230 = ["230x90x57", 1105];

// [제품명, [[규격, 파렛트당 장수], ...]]
const bricks = [
  ["적벽돌", [S190, S230, ["290x90x57", 884], ["300x90x76", 864]]],
  ["카멜러프", [["290x90x57", 884], ["300x90x76", 864]]],
  ["홍고벽돌", [S190, S230, ["290x90x57", 884]]],
  ["청고벽돌", [S190, S230, ["290x90x57", 884]]],
  ["화이트", [S190, S230, ["250x80x57", 1040], ["290x90x48", 1040], ["300x90x76", 480]]],
  ["전돌", [S190, S230, ["290x90x57", 936]]],
  ["회전돌", [S190, S230, ["290x90x57", 936]]],
];

const tiles = [
  ["화이트", [["230x20x76", 2873], ["290x25x57", 1980]]],
  ["화이트 투톤", [["230x20x76", 2873], ["290x25x57", 1980]]],
  ["레드", [["230x20x76", 2873], ["290x25x57", 1800]]],
  ["레드 투톤", [["230x20x76", 2873], ["290x25x57", 1980]]],
  ["그레이", [["230x20x76", 2873], ["290x25x57", 1800]]],
  ["브라운", [["230x20x76", 2873], ["290x25x57", 1980]]],
];

// 재고(파렛트 단위) — 기본은 넉넉(초록), 데모용으로 빨강 3 · 노랑 3을 지정
// [재고 파렛트, 기준 파렛트]
const stockOverrides = {
  "B05-300x76": [1, 2], // 빨강
  "B04-230x57": [1, 2], // 빨강
  "T04-290x57": [1, 2], // 빨강
  "B07-190x57": [2.5, 2], // 노랑
  "B02-300x76": [2.5, 2], // 노랑
  "T05-230x76": [2.5, 2], // 노랑
};

const products = [];
const add = (category, prefix, list) =>
  list.forEach(([name, sizes], i) => {
    for (const [size, piecesPerPack] of sizes) {
      const [length, , height] = size.split("x");
      const code = `${prefix}${String(i + 1).padStart(2, "0")}-${length}x${height}`;
      const [stockPallets, reorderPallets] = stockOverrides[code] ?? [6 + (products.length % 5), 2];
      products.push({
        code,
        category,
        name,
        size,
        piecesPerSqm: null, // lib/quote.ts가 규격 + 줄눈 12mm로 계산(올림)
        packUnit: "파렛트",
        piecesPerPack,
        stock: Math.round(stockPallets * piecesPerPack),
        reorderPoint: reorderPallets * piecesPerPack,
      });
    }
  });
add("brick", "B", bricks);
add("tile", "T", tiles);

// 검증 — 어긋나면 파일을 쓰지 않고 멈춘다
const signal = (p) => (p.stock < p.reorderPoint ? "red" : p.stock < p.reorderPoint * 1.5 ? "yellow" : "green");
const count = (s) => products.filter((p) => signal(p) === s).length;
const errors = [];
if (new Set(products.map((p) => p.code)).size !== products.length) errors.push("품번 중복");
for (const code of Object.keys(stockOverrides)) if (!products.some((p) => p.code === code)) errors.push(`없는 품번: ${code}`);
if (count("red") !== 3) errors.push(`빨강 ${count("red")}개 (3개여야 함)`);
if (count("yellow") !== 3) errors.push(`노랑 ${count("yellow")}개 (3개여야 함)`);
for (const p of products) {
  const dims = p.size.split("x").map(Number);
  if (dims.length !== 3 || !dims.every((d) => d > 0)) errors.push(`${p.code}: 규격 형식 오류 ${p.size}`);
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "products.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(products, null, 2) + "\n");
const n = (c) => products.filter((p) => p.category === c).length;
console.log(`벽돌 ${n("brick")} · 타일 ${n("tile")} → data/products.json (빨강 ${count("red")}, 노랑 ${count("yellow")}, 초록 ${count("green")})`);
