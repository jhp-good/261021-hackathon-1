"use client";

import { useEffect, useState } from "react";
import productData from "@/data/products.json";
import sampleData from "@/data/samples.json";
import { face, type Product } from "@/lib/quote";
import { daysSince, isDelayed, nextStage, STAGES, toDateString, type Sample, type Stage } from "@/lib/samples";

const products = productData as Product[];
const initial = sampleData as Sample[];
const productOf = (code: string) => products.find((p) => p.code === code);

// localStorage에는 바뀐 카드만: { id: { stage, sentDate } }
const KEY = "rocket-quote:samples:v1";
type Saved = Record<string, Pick<Sample, "stage" | "sentDate">>;

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

  // 날짜 · localStorage는 브라우저에서만 읽는다
  useEffect(() => {
    setSaved(load());
    setToday(new Date());
  }, []);

  if (!today) return <p className="hint">불러오는 중…</p>;

  const samples = initial.map((s) => ({ ...s, ...saved[s.id] }));
  const delayedCount = samples.filter((s) => isDelayed(s, today)).length;

  function advance(s: Sample) {
    // 포장 → 발송으로 넘길 때 발송일을 오늘로
    const sentDate = s.stage === "포장" ? toDateString(new Date()) : s.sentDate;
    const next = { ...saved, [s.id]: { stage: nextStage(s.stage), sentDate } };
    setSaved(next);
    store(next);
  }

  function reset() {
    if (!confirm("모든 샘플을 처음 상태로 되돌릴까요?")) return;
    setSaved({});
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
        {STAGES.map((stage: Stage) => {
          const cards = samples.filter((s) => s.stage === stage);
          return (
            <section key={stage} className="column" aria-label={stage}>
              <h2>{stage} <span>{cards.length}</span></h2>
              {cards.map((s) => {
                const p = productOf(s.productCode);
                const delayed = isDelayed(s, today);
                const days = daysSince(s.sentDate, today);
                return (
                  <article key={s.id} className={delayed ? "card delayed" : "card"}>
                    <header>
                      <span>{s.id}</span>
                      {delayed && <span className="badge">발송 {days}일째</span>}
                    </header>
                    <strong>{p ? `${p.name} ${face(p).length}×${face(p).height}` : s.productCode}</strong>
                    <p>{s.customer}</p>
                    <p className="meta">{s.stage === "포장" ? "포장 중" : `발송 ${s.sentDate.slice(5)} · ${days}일 전`}</p>
                    {s.note && <p className="note">{s.note}</p>}
                    {s.stage !== "피드백" && (
                      <button onClick={() => advance(s)}>다음 단계 → {nextStage(s.stage)}</button>
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
