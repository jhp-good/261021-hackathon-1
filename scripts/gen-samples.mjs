// data/samples.json 생성 — 가상 샘플 15건
// 실행: npm run gen:data (products.json 다음에 실행)
// 규칙: spec/data-model.md — 거래처는 ○○건설 같은 가상 이름만, 연락처 없음
// 날짜는 실행한 날 기준 "며칠 전"으로 만든다. 발송 후 7일 넘은 카드 2건
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const products = JSON.parse(readFileSync(join(dataDir, "products.json"), "utf8"));

// [productCode, customer, stage, 며칠 전, note]
const rows = [
  ["B01-190x57", "○○건설", "피드백", 20, "색감 좋음, 본 발주 검토"],
  ["B05-190x57", "△△인테리어", "피드백", 18, "줄눈은 회색으로 결정"],
  ["T02-230x76", "□□건축", "피드백", 15, "투톤 비율 다른 것도 보고 싶다고 함"],
  ["B03-230x57", "◇◇종합건설", "도착", 9, "현장 소장 확인 대기"],
  ["B07-190x57", "○○건설", "도착", 6, "전돌과 질감 비교용"],
  ["T03-290x57", "☆☆리모델링", "도착", 5, "외벽 일부 시공 샘플"],
  ["B02-300x76", "△△인테리어", "발송", 12, "도착 연락 없음 — 배송 조회 필요"],
  ["B04-190x57", "□□건축", "발송", 9, "현장 주소 변경 여부 확인"],
  ["B06-230x57", "◇◇종합건설", "발송", 3, "화물 발송"],
  ["T05-230x76", "☆☆리모델링", "발송", 2, "그레이 두 가지 비교"],
  ["B05-290x48", "○○건설", "발송", 1, "얇은 규격 문의"],
  ["B01-300x76", "△△인테리어", "포장", 0, "2장씩 포장"],
  ["T01-290x57", "□□건축", "포장", 0, "화이트 타일 비교용"],
  ["B03-190x57", "◇◇종합건설", "포장", 1, ""],
  ["T06-230x76", "☆☆리모델링", "포장", 0, "레드와 함께 발송 예정"],
];

const pad = (n) => String(n).padStart(2, "0");
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const samples = rows.map(([productCode, customer, stage, ago, note], i) => ({
  id: `S-${pad(i + 1)}`,
  productCode,
  customer,
  sentDate: daysAgo(ago),
  stage,
  note,
}));

// 검증 — 어긋나면 파일을 쓰지 않고 멈춘다
const codes = new Set(products.map((p) => p.code));
const errors = [];
if (samples.length !== 15) errors.push(`${samples.length}건 (15건이어야 함)`);
for (const s of samples) {
  if (!codes.has(s.productCode)) errors.push(`${s.id}: 없는 품번 ${s.productCode}`);
  if (!["포장", "발송", "도착", "피드백"].includes(s.stage)) errors.push(`${s.id}: 단계 오류 ${s.stage}`);
}
const delayed = rows.filter(([, , stage, ago]) => stage === "발송" && ago > 7).length;
if (delayed !== 2) errors.push(`7일 지연 ${delayed}건 (2건이어야 함)`);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

writeFileSync(join(dataDir, "samples.json"), JSON.stringify(samples, null, 2) + "\n");
console.log(`샘플 ${samples.length}건 → data/samples.json (7일 지연 ${delayed}건)`);
