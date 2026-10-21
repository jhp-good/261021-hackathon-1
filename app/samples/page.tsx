"use client";

import { useEffect, useState } from "react";
import productData from "@/data/products.json";
import sampleData from "@/data/samples.json";
import { face, type Product } from "@/lib/quote";
import { daysSince, isDelayed, nextStage, STAGES, toDateString, type Sample } from "@/lib/samples";

const products = productData as Product[];
const initial = sampleData as Sample[];
const productOf = (code: string) => products.find((p) => p.code === code);

// localStorage에는 바뀐 값만: { id: { stage?, sentDate?, note?, feedback? } }
const KEY = "rocket-quote:samples:v3";
type Saved = Record<string, Partial<Pick<Sample, "stage" | "sentDate" | "note" | "feedback">>>;
type TextField = "note" | "feedback";

// 단계마다 적을 수 있는 글: 발송 준비 = 메모, 확인완료 = 피드백, 발송 · 도착 = 없음
const EDITABLE: Partial<Record<Sample["stage"], { field: TextField; label: string }>> = {
  "발송 준비": { field: "note", label: "메모" },
  확인완료: { field: "feedback", label: "피드백" },
};

function load(): Saved {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

function store(saved: Saved) {
  try {
    if (Object.keys(saved).length) localStorage.setItem(KEY, JSON.stringify(saved));
    else localStorage.removeItem(KEY);
  } catch {
    // 저장 못 해도 화면은 동작
  }
}

export default function SamplesPage() {
  const [saved, setSaved] = useState<Saved>({});
  const [today, setToday] = useState<Date | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  // 날짜 · localStorage는 브라우저에서만 읽는다
  useEffect(() => {
    setSaved(load());
    setToday(new Date());
  }, []);

  if (!today) return <p className="hint">불러오는 중…</p>;

  const samples = initial.map((s) => ({ ...s, ...saved[s.id] }));
  const delayedCount = samples.filter((s) => isDelayed(s, today)).length;

  function update(id: string, change: Saved[string]) {
    const next = { ...saved, [id]: { ...saved[id], ...change } };
    setSaved(next);
    store(next);
  }

  function advance(s: Sample) {
    // 발송 준비 → 발송으로 넘길 때 발송일을 오늘로
    update(s.id, { stage: nextStage(s.stage), sentDate: s.stage === "발송 준비" ? toDateString(new Date()) : s.sentDate });
    if (editing === s.id) setEditing(null);
  }

  function startEdit(s: Sample, field: TextField) {
    setEditing(s.id);
    setDraft(s[field]);
  }

  function saveText(id: string, field: TextField) {
    update(id, { [field]: draft.trim() });
    setEditing(null);
  }

  function reset() {
    if (!confirm("모든 샘플을 처음 상태로 되돌릴까요? 적은 메모 · 피드백도 지워집니다.")) return;
    setSaved({});
    setEditing(null);
    store({});
  }

  return (
    <>
      <div className="board-head">
        <p>
          샘플 {samples.length}건 · <span className={delayedCount ? "warn" : ""}>7일 넘게 도착 안 됨 {delayedCount}건</span>
        </p>
        <button className="ghost" onClick={reset}>처음으로 되돌리기</button>
      </div>

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
                    <strong>{p ? `${p.name} ${face(p).length}×${face(p).height}` : s.productCode}</strong>
                    <p>{s.customer}</p>
                    {stage !== "발송 준비" && (
                      <p className="meta">
                        발송 {s.sentDate.slice(5)} · {days}일 전
                        {delayed && <span className="badge">지연</span>}
                      </p>
                    )}
                    {s.note && <p className="note">{s.note}</p>}
                    {s.feedback && stage === "확인완료" && <p className="feedback-text"><span>피드백</span> {s.feedback}</p>}

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
                      <div className="actions">
                        {edit && (
                          <button className="small plain" onClick={() => startEdit(s, edit.field)}>
                            {s[edit.field] ? `${edit.label} 수정` : `+ ${edit.label} 추가`}
                          </button>
                        )}
                        {stage !== "확인완료" && (
                          <button className="small next" onClick={() => advance(s)}>{nextStage(stage)} →</button>
                        )}
                      </div>
                    )}
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
