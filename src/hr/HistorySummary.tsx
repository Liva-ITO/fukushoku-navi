import { useState } from "react";
import { AI_SUMMARY, STAGE_LABELS, type Stage } from "../constants/labels";
import { SUMMARY_URL } from "../constants/ai";
import { DEMO_TODAY, type HrEvent } from "../data/demo";

type Item = { text: string; refs: number[] };
type Summary = { summary: string; todo: Item[] };
type Audience = "hr" | "boss";
// reveal(n)：経緯の一覧で、新しいほうから n 件を出す（まとめの日付から、隠れている経緯に移るため）
type Props = { events: HrEvent[]; audience: Audience; rowId: string; reveal?: (n: number) => void };

const MAX_EVENTS = 200;
const MAX_BODY = 600;

// 同じ経緯なら、作り直さずに使い回す（新しいやり取りが届いたら作り直せる）
const cache = new Map<string, Summary>();

export const tlId = (audience: Audience, index: number) => `tl-${audience}-${index}`;

// 経緯の要約。段階の流れと期間はデータから計算し（AIは使わない）、要約といま会社がすることだけをAIに頼む。
// AIに送るのは、見ている人が、もうこの画面で見られる経緯だけ。本人の日記や、上司に見せないものは、もとの一覧に入っていないので送られない
export default function HistorySummary(props: Props) {
  const last = props.events[props.events.length - 1];
  const key = `${props.audience}:${props.rowId}:${props.events.length}:${last?.date ?? ""}:${last?.body ?? ""}:${last?.status ?? ""}`;
  return <Inner key={key} cacheKey={key} {...props} />;
}

function Inner({ events, audience, cacheKey, reveal }: Props & { cacheKey: string }) {
  const [summary, setSummary] = useState<Summary | null>(() => cache.get(cacheKey) ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (events.length === 0) return null;

  // 会社が「確認した」を押した記録は、要約には要らないので送らない。
  // 登録内容の変更（氏名・メールアドレス・上司の名前が入る）も、AIには送らない。番号は、もとの一覧の番号に戻して使う
  const sent = events
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => e.kind !== "done" && e.kind !== "edit")
    .slice(-MAX_EVENTS);

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
          events: sent.map(({ e }) => ({
            date: e.date,
            kind: e.kind,
            body: (e.by ? e.body.replace(`（${e.by}）`, "") : e.body).slice(0, MAX_BODY),
            ...(e.status ? { status: e.status.slice(0, 40) } : {}),
            ...(e.by ? { by: AI_SUMMARY.bossSender } : {}),
          })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { summary?: Summary; error?: string };
      if (!res.ok || !data.summary || typeof data.summary.summary !== "string") {
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

  const jump = (index: number, retried = false) => {
    // 隠れている（前の経緯の）ときは、そこまで出してから移る
    if (!retried && !document.getElementById(tlId(audience, index))) {
      reveal?.(events.length - index);
      setTimeout(() => jump(index, true), 50);
      return;
    }
    const el = document.getElementById(tlId(audience, index));
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("tl-flash");
    setTimeout(() => el.classList.remove("tl-flash"), 1600);
  };

  const ready = SUMMARY_URL !== "";

  return (
    <div className="ai-summary">
      <StageLine events={events} />
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
          <p className="ai-lead">{summary.summary}</p>
          <p className="ai-sec-title">{AI_SUMMARY.todoTitle}</p>
          {summary.todo.length === 0 ? (
            <p className="muted">{AI_SUMMARY.none}</p>
          ) : (
            <ul className="ai-todo">
              {summary.todo.map((it, i) => {
                // 根拠は、いちばん新しいものを1つだけ出す（日付が並ぶと読みにくいため）
                const ref = it.refs
                  .map((r) => sent[r]?.i)
                  .filter((x): x is number => x !== undefined)
                  .sort((a, b) => b - a)[0];
                const e = ref === undefined ? undefined : events[ref];
                return (
                  <li key={i}>
                    {it.text}
                    {e && ref !== undefined && (
                      <button className="ai-ref" onClick={() => jump(ref)} aria-label={AI_SUMMARY.refLabel(e.date)}>
                        {Number(e.date.slice(5, 7))}/{Number(e.date.slice(8, 10))}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="muted ai-note">{AI_SUMMARY.after}</p>
          <button className="btn-quiet btn-small" onClick={run} disabled={loading}>
            {loading ? AI_SUMMARY.loading : AI_SUMMARY.redo}
          </button>
        </div>
      )}
    </div>
  );
}

// 段階の流れと、それぞれの期間（データから計算する）。戻ったときは「戻り」と出す
const ORDER: Stage[] = ["acute", "recovery", "preReturn", "afterReturn"];
const stageOf = (label: string): Stage | undefined => ORDER.find((s) => STAGE_LABELS[s] === label);
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00`) - Date.parse(`${a}T00:00:00`)) / 86_400_000);

function StageLine({ events }: { events: HrEvent[] }) {
  // 同じ日に切り替えた段階も、通った段階として残す（期間は「1日未満」）
  const list = events.filter((e) => e.kind === "stage" && stageOf(e.body));
  if (list.length === 0) return null;
  return (
    <p className="stage-line">
      <span className="ai-sec-title">{AI_SUMMARY.stageTitle}</span>
      {list.map((e, i) => {
        const now = i === list.length - 1;
        const end = now ? DEMO_TODAY : list[i + 1].date;
        const d = Math.max(now ? 1 : 0, daysBetween(e.date, end));
        const back = i > 0 && ORDER.indexOf(stageOf(e.body) as Stage) < ORDER.indexOf(stageOf(list[i - 1].body) as Stage);
        return (
          <span key={i} className={now ? "stage-seg stage-seg-now" : "stage-seg"}>
            {i > 0 && (
              <span className="stage-arrow" aria-hidden="true">
                →
              </span>
            )}
            {e.body}
            {back && <span className="stage-back">{AI_SUMMARY.back}</span>}
            <span className="muted">（{now ? AI_SUMMARY.elapsed(d) : AI_SUMMARY.span(d)}）</span>
          </span>
        );
      })}
    </p>
  );
}
