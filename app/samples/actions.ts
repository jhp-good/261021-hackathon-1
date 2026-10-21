"use server";

// 샘플 보드의 쓰기 — 다음 단계 · 메모/피드백 · 처음으로 되돌리기 (모두 DB에)
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { nextStage, STAGES, type Stage } from "@/lib/samples";
import { seedSamples, toDate } from "@/lib/samples-db";

// 서버(Vercel)는 UTC라서 발송일은 한국 날짜로
const todayKST = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());

export async function advanceSample(id: string) {
  const s = await db().sample.findUnique({ where: { id: String(id) } });
  if (!s || !(STAGES as readonly string[]).includes(s.stage)) return;
  const stage = s.stage as Stage;
  await db().sample.update({
    where: { id: s.id },
    // 발송 준비 → 발송으로 넘길 때 발송일을 오늘로
    data: { stage: nextStage(stage), ...(stage === "발송 준비" ? { sentDate: toDate(todayKST()) } : {}) },
  });
  revalidatePath("/samples");
}

export async function saveSampleText(id: string, field: "note" | "feedback", text: string) {
  if (field !== "note" && field !== "feedback") return;
  const value = String(text).trim().slice(0, 500);
  await db().sample.update({ where: { id: String(id) }, data: { [field]: value || null } });
  revalidatePath("/samples");
}

export async function resetSamples() {
  await seedSamples(db());
  revalidatePath("/samples");
}
