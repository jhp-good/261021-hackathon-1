// 샘플 DB 행 ↔ 화면용 Sample, 그리고 seed(처음 상태) — seed 스크립트와 '처음으로 되돌리기'가 같이 쓴다
import type { PrismaClient, Sample as Row } from "@prisma/client";
import seedData from "../data/samples.json";
import { STAGES, type Sample, type Stage } from "./samples";

const seed = seedData as Sample[];

export const toDate = (ymd: string) => new Date(`${ymd}T00:00:00Z`);

export function toSample(r: Row): Sample {
  return {
    id: r.id,
    productCode: r.productCode,
    customer: r.customer,
    sentDate: r.sentDate.toISOString().slice(0, 10),
    stage: (STAGES as readonly string[]).includes(r.stage) ? (r.stage as Stage) : "발송 준비",
    note: r.note ?? "",
    feedback: r.feedback ?? "",
  };
}

// 두 번 돌려도 15건 — seed에 없는 행은 지우고, 있는 행은 처음 값으로 덮어쓴다
export async function seedSamples(prisma: PrismaClient): Promise<number> {
  await prisma.$transaction([
    prisma.sample.deleteMany({ where: { id: { notIn: seed.map((s) => s.id) } } }),
    ...seed.map((s) => {
      const data = {
        productCode: s.productCode,
        customer: s.customer,
        sentDate: toDate(s.sentDate),
        stage: s.stage,
        note: s.note || null,
        feedback: s.feedback || null,
      };
      return prisma.sample.upsert({ where: { id: s.id }, create: { id: s.id, ...data }, update: data });
    }),
  ]);
  return seed.length;
}
