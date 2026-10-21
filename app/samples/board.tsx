"use client";

import { useEffect, useState, useTransition } from "react";
import productData from "@/data/products.json";
import { face, type Product } from "@/lib/quote";
import { daysSince, isDelayed, nextStage, STAGES, type Sample } from "@/lib/samples";
import { advanceSample, resetSamples, saveSampleText } from "./actions";

const products = productData as Product[];
const productOf = (code: string) => products.find((p) => p.code === code);
type TextField = "note" | "feedback";

// 단계마다 적을 수 있는 글: 발송 준비 = 메모, 확인완료 = 피드백, 발송 · 도착 = 없음
const EDITABLE: Partial<Record<Sample["stage"], { field: TextField; label: string }>> = {
  "발송 준비": { field: "note", label: "메모" },
  확인완료: { field: "feedback", label: "피드백" },
};

export default function Board({ samples }: { samples: Sample[] }) {
  const [today, setToday] = useState<Date | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  // 지연 판단은 보는 사람 기기의 오늘 날짜로
  useEffect(() => setToday(new Date()), []);

  if (!today) return <p className="hint">불러오는 중…</p>;

  const delayedCount = samples.filter((s) => isDelayed(s, today)).length;

  // 서버 액션 실행 — 끝나면 서버가 새 목록으로 다시 그린다
  function run(action: () => Promise<void>) {
    setFailed(false);
    startTransition(async () => {
      try {
        await action();
      } catch {
        setFailed(true);
      }
    });
  }

  function startEdit(s: Sample, field: TextField) {
    setEditing(s.id);
    setDraft(s[field]);
  }

  function saveText(id: string, field: TextField) {
    setEditing(null);
    run(() => saveSampleText(id, field, draft));
  }

  function reset() {
    if (!confirm("모든 샘플을 처음 상태로 되돌릴까요? 적은 메모 · 피드백도 지워지고, 모든 기기에 똑같이 적용됩니다.")) return;
    setEditing(null);
    run(() => resetSamples());
  }

  return (
    <>
      <div className="board-head">
        <p>
          샘플 {samples.length}건 · <span className={delayedCount ? "warn" : ""}>7일 넘게 도착 안 됨 {delayedCount}건</span>
          {pending && " · 저장 중…"}
          {failed && <span className="warn"> 저장하지 못했습니다. 다시 눌러 주세요.</span>}
        </p>
        <button className="ghost" onClick={reset} disabled={pending}>처음으로 되돌리기</button>
      </div>

      {samples.length === 0 && <p className="hint">DB에 샘플이 없습니다. <code>npm run db:seed</code> 또는 처음으로 되돌리기를 눌러 주세요.</p>}

      <div className="board">
        {STAGES.map((stage) => {
          const cards = samples.filter((s) => s.stage === stage);
          const edit = EDITABLE[stage];
          return (
            <section key={stage} className="column" aria-label={stage}>
              <h2>{stage} <span>{cards.length}</span></h2>
              {cards.map((s) => {
                const p = productOf(s.productCode);
                const delayed = isDelayed(s, today);
                const days = daysSince(s.sentDate, today);
                return (
                  <article key={s.id} className={delayed ? "card delayed" : "card"}>
                    <div className="card-top">
                      <div className="card-head">
                        <b className="company">{s.customer}</b>
                        {delayed && <span className="badge">지연</span>}
                      </div>
                      <strong className="product">{p?.name ?? s.productCode}</strong>
                      <div className="size-row">
                        <span>{p ? `${face(p).length}×${face(p).height}` : ""}</span>
                        {stage !== "발송 준비" && <span>발송 {s.sentDate.slice(5)} · {days}일 전</span>}
                      </div>
                    </div>

                    {/* 아래 칸: 메모(· 피드백) + 다음 단계 단추 */}
                    <div className="card-memo">
                      {edit && editing === s.id ? (
                        <div className="text-edit">
                          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2}
                            placeholder={`${edit.label}을 적어 주세요`} aria-label={`${s.id} ${edit.label}`} autoFocus />
                          <div className="actions">
                            <button className="small" onClick={() => saveText(s.id, edit.field)}>저장</button>
                            <button className="small plain" onClick={() => setEditing(null)}>취소</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="memo-lines">
                            {edit?.field === "note" ? (
                              <button className="memo-edit" onClick={() => startEdit(s, "note")} title="눌러서 메모 쓰기">
                                <span>메모</span>{s.note || "+ 메모 추가"}
                              </button>
                            ) : (
                              <p className="memo"><span>메모</span>{s.note || "없음"}</p>
                            )}
                            {edit?.field === "feedback" && (
                              <button className="memo-edit" onClick={() => startEdit(s, "feedback")} title="눌러서 피드백 쓰기">
                                <span>피드백</span>{s.feedback || "+ 피드백 추가"}
                              </button>
                            )}
                          </div>
                          {stage !== "확인완료" && (
                            <button className="small next" onClick={() => run(() => advanceSample(s.id))} disabled={pending}>
                              {nextStage(stage)} →
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
    </>
  );
}
