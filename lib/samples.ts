// 샘플 단계 — 규칙은 spec/calc-rules.md

export const STAGES = ["포장", "발송", "도착", "확인완료"] as const;
export type Stage = (typeof STAGES)[number];

export type Sample = {
  id: string;
  productCode: string;
  customer: string;
  sentDate: string; // YYYY-MM-DD
  stage: Stage;
  note: string;
  feedback: string; // 거래처 피드백 — 화면에서 직접 적는다
};

export const DELAY_DAYS = 7;

// 다음 단계 — 확인완료에서 더 안 감
export function nextStage(stage: Stage): Stage {
  return STAGES[Math.min(STAGES.indexOf(stage) + 1, STAGES.length - 1)];
}

const DAY_MS = 86_400_000;
const localMidnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export function daysSince(date: string, today: Date): number {
  const [y, m, d] = date.split("-").map(Number);
  return Math.round((localMidnight(today) - new Date(y, m - 1, d).getTime()) / DAY_MS);
}

// 발송 단계에서 sentDate로부터 7일 초과면 지연
export const isDelayed = (s: Pick<Sample, "stage" | "sentDate">, today: Date) =>
  s.stage === "발송" && daysSince(s.sentDate, today) > DELAY_DAYS;

export function toDateString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
