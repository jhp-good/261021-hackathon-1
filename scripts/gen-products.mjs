// data/products.json 생성 — 가상 제품 14종 (타일 8, 벽돌 6)
// 실행: npm run gen:data
// 규칙: spec/data-model.md · 재고 신호등은 spec/calc-rules.md (빨강 3, 노랑 3이 되게 맞춤)
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// [code, name, size, pricePerPiece, piecesPerSqm, piecesPerPack, stock, reorderPoint]
const tiles = [
  ["T-601", "라이트그레이 포세린", "600x600", 6800, null, 4, 1600, 400],
  ["T-602", "마블 화이트 폴리싱", "600x1200", 18500, null, 2, 30, 80],
  ["T-301", "샌드 베이지 벽타일", "300x600", 2900, null, 8, 900, 800],
  ["T-302", "무광 차콜 바닥타일", "300x300", 1200, null, 11, 2200, 600],
  ["T-801", "콘크리트룩 대형", "800x800", 13000, null, 3, 300, 150],
  ["T-401", "테라코타 데코", "400x400", 3200, null, 6, 120, 300],
  ["T-201", "유광 화이트 벽타일", "200x200", 900, null, 25, 5000, 1500],
  ["T-101", "서브웨이 화이트", "100x300", 650, null, 30, 1500, 1200],
];

// 벽돌: 규격 · 파렛트당 장수는 실제 업계 표 기준, 이름 · 단가 · 재고는 가상
// ㎡당 장수는 줄눈 10mm 포함 추정치: 1,000,000 / ((길이+10) × (높이+10)) 반올림 — 현장 값 확인 필요
const bricks = [
  ["B-201", "붉은 벽돌", "190x90x57", 420, 75, 1300, 13000, 3900],
  ["B-202", "고벽돌 브라운", "230x90x57", 680, 62, 1105, 6500, 2500],
  ["B-203", "백고벽돌", "190x90x57", 720, 75, 1300, 1200, 2000],
  ["B-211", "점토벽돌 다크그레이", "230x90x76", 850, 48, 680, 2800, 2400],
  ["B-221", "롱브릭 아이보리", "290x90x57", 1100, 50, 936, 2500, 1000],
  ["B-231", "와이드 브릭 그레이", "300x90x76", 1300, 38, 480, 2400, 960],
];

const toProduct = (category) => ([code, name, size, pricePerPiece, piecesPerSqm, piecesPerPack, stock, reorderPoint]) => ({
  code,
  category,
  name,
  size,
  pricePerPiece,
  piecesPerSqm,
  packUnit: category === "tile" ? "박스" : "파렛트",
  piecesPerPack,
  stock,
  reorderPoint,
});

const products = [...tiles.map(toProduct("tile")), ...bricks.map(toProduct("brick"))];

// 검증 — 어긋나면 파일을 쓰지 않고 멈춘다
const signal = (p) => (p.stock < p.reorderPoint ? "red" : p.stock < p.reorderPoint * 1.5 ? "yellow" : "green");
const count = (s) => products.filter((p) => signal(p) === s).length;
const errors = [];
if (tiles.length !== 8 || bricks.length !== 6) errors.push("타일 8 · 벽돌 6이어야 함");
if (new Set(products.map((p) => p.code)).size !== products.length) errors.push("품번 중복");
if (count("red") !== 3) errors.push(`빨강 ${count("red")}개 (3개여야 함)`);
if (count("yellow") !== 3) errors.push(`노랑 ${count("yellow")}개 (3개여야 함)`);
for (const p of products) {
  if (p.category === "tile" && p.piecesPerSqm !== null) errors.push(`${p.code}: 타일 piecesPerSqm은 null`);
  if (p.category === "brick" && !(p.piecesPerSqm > 0)) errors.push(`${p.code}: 벽돌 piecesPerSqm 필요`);
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "products.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(products, null, 2) + "\n");
console.log(`${products.length}종 → data/products.json (빨강 ${count("red")}, 노랑 ${count("yellow")}, 초록 ${count("green")})`);
