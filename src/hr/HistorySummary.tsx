import { useState } from "react";
import { AI_SUMMARY } from "../constants/labels";
import { SUMMARY_URL } from "../constants/ai";
import type { HrEvent } from "../data/demo";

type Item = { text: string; refs: number[] };
type Summary = { flow: Item[]; fromPerson: Item[]; fromCompany: Item[]; open: Item[] };
type Audience = "hr" | "boss";
type Props = { events: HrEvent[]; audience: Audience; rowId: string };

const MAX_EVENTS = 200;
const MAX_BODY = 600;
const SECTIONS = ["flow", "fromPerson", "fromCompany", "open"] as const;

// 同じ経緯なら、作り直さずに使い回す（新しいやり取りが届いたら作り直せる）
const cache = new Map<string, Summary>();

export const tlId = (audience: Audience, index: number) => `tl-${audience}-${index}`;

// 経緯のまとめ（AI）。見ている人が、もうこの画面で見られる経緯だけを送る。
// 本人の日記や、上司に見せないもの（体調の報告など）は、もとの一覧に入っていないので送られない
export default function HistorySummary(props: Props) {
  const last = props.events[props.events.length - 1];
  const key = `${props.audience}:${props.rowId}:${props.events.length}:${last?.date ?? ""}:${last?.body ?? ""}`;
  return <Inner key={key} cacheKey={key} {...props} />;
}

function Inner({ events, audience, cacheKey }: Props & { cacheKey: string }) {
  const [summary, setSummary] = useState<Summary | null>(() => cache.get(cacheKey) ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (events.length === 0) return null;

  // 多すぎるときは新しいほうから送る。番号は、もとの一覧の番号に戻して使う
  const offset = Math.max(0, events.length - MAX_EVENTS);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${SUMMARY_URL}/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience,
          // 人の名前は送らない（上司が送った連絡は「上司」とだけ送る）
          events: events.slice(offset).map((e) => ({
            date: e.date,
            kind: e.kind,
            body: (e.by ? e.body.replace(`（${e.by}）`, "") : e.body).slice(0, MAX_BODY),
            ...(e.status ? { status: e.status.slice(0, 40) } : {}),
            ...(e.by ? { by: AI_SUMMARY.bossSender } : {}),
          })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { summary?: Summary; error?: string };
      if (!res.ok || !data.summary) {
        setError(AI_SUMMARY.errors[data.error as keyof typeof AI_SUMMARY.errors] ?? AI_SUMMARY.errors.failed);
        return;
      }
      cache.set(cacheKey, data.summary);
      setSummary(data.summary);
    } catch {
      setError(AI_SUMMARY.errors.failed);
    } finally {
      setLoading(false);
    }
  };

  const jump = (ref: number) => {
    const el = document.getElementById(tlId(audience, ref + offset));
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("tl-flash");
    setTimeout(() => el.classList.remove("tl-flash"), 1600);
  };

  const ready = SUMMARY_URL !== "";

  return (
    <div className="ai-summary">
      {!summary && (
        <>
          <button className="btn-outline btn-small" onClick={run} disabled={!ready || loading}>
            {loading ? AI_SUMMARY.loading : AI_SUMMARY.button}
          </button>
          <p className="muted ai-note">{ready ? AI_SUMMARY.before : AI_SUMMARY.notReady}</p>
        </>
      )}
      {error && <p className="ai-error">{error}</p>}
      {summary && (
        <div className="ai-box">
          <p className="ai-title">{AI_SUMMARY.title}</p>
          {SECTIONS.map((s) => (
            <div key={s} className="ai-sec">
              <p className="ai-sec-title">{AI_SUMMARY.sections[s]}</p>
              {summary[s].length === 0 ? (
                <p className="muted">{AI_SUMMARY.none}</p>
              ) : (
                <ul>
                  {summary[s].map((it, i) => (
                    <li key={i}>
                      {it.text}
                      {it.refs.map((r) => {
                        const e = events[r + offset];
                        return e ? (
                          <button key={r} className="ai-ref" onClick={() => jump(r)} aria-label={AI_SUMMARY.refLabel(e.date)}>
                            {Number(e.date.slice(5, 7))}/{Number(e.date.slice(8, 10))}
                          </button>
                        ) : null;
                      })}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <p className="muted ai-note">{AI_SUMMARY.after}</p>
          <button className="btn-quiet btn-small" onClick={run} disabled={loading}>
            {loading ? AI_SUMMARY.loading : AI_SUMMARY.redo}
          </button>
        </div>
      )}
    </div>
  );
}
