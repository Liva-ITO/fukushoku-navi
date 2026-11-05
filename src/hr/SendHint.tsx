import { useState } from "react";
import { AI_HINT, type Stage } from "../constants/labels";
import { SUMMARY_URL } from "../constants/ai";
import { DEMO_TODAY, type HrEvent } from "../data/demo";

type Scene = keyof typeof AI_HINT.scenes;
type Hint = { hints: string[]; example: string };

// 連絡を送る前に、伝え方のヒントをAIに出してもらう（会社の画面）。
// AIに送るのは、段階・場面・返信がない日数・書きかけの件名と本文だけ。本人の名前や、本人から届いた文・レポートの中身は送らない。
// AIは代わりに書かない。ヒントと、言い換えの例を1文だけ返す
export function SendHint({
  stage,
  boss,
  events,
  title,
  text,
}: {
  stage: Stage;
  boss: boolean;
  events: HrEvent[];
  title: string;
  text: string;
}) {
  const [scene, setScene] = useState<Scene>("none");
  const [hint, setHint] = useState<Hint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (stage === "afterReturn" || SUMMARY_URL === "") return null;

  // 上司はレポートを見られないので、レポートの場面は出さない
  const scenes = (Object.keys(AI_HINT.scenes) as Scene[]).filter((s) => !(boss && s === "report"));

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${SUMMARY_URL}/hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience: boss ? "boss" : "hr",
          stage,
          scene,
          noReplyDays: noReplyDays(events),
          title: title.slice(0, 100),
          draft: text.slice(0, 1000),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { hint?: Hint; error?: string };
      if (!res.ok || !data.hint) {
        setError(AI_HINT.errors[data.error as keyof typeof AI_HINT.errors] ?? AI_HINT.errors.failed);
        return;
      }
      setHint(data.hint);
    } catch {
      setError(AI_HINT.errors.failed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="send-hint">
      <p className="send-hint-title">{AI_HINT.title}</p>
      <div className="chips">
        {scenes.map((s) => (
          <button key={s} className="chip" aria-pressed={scene === s} onClick={() => setScene(s)}>
            {AI_HINT.scenes[s]}
          </button>
        ))}
      </div>
      <button className="btn-outline btn-small" onClick={run} disabled={loading}>
        {loading ? AI_HINT.loading : hint ? AI_HINT.again : AI_HINT.button}
      </button>
      <p className="muted ai-note">{AI_HINT.note}</p>
      {error && <p className="ai-error">{error}</p>}
      {hint && (
        <div className="ai-box">
          <ul className="ai-todo">
            {hint.hints.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          {hint.example && (
            <p className="send-hint-example">
              <span className="muted">{AI_HINT.example}</span>
              {hint.example}
            </p>
          )}
          <p className="muted ai-note">{AI_HINT.after}</p>
        </div>
      )}
    </div>
  );
}

// 会社から最後に送った連絡のあと、本人から何も届いていなければ、その日数。届いていれば null
function noReplyDays(events: HrEvent[]): number | null {
  const lastHr = [...events].reverse().find((e) => e.kind === "fromHr");
  if (!lastHr) return null;
  // 本人からの連絡や提出物があれば、返信があったものとして扱う
  const after = events.slice(events.lastIndexOf(lastHr) + 1).some((e) => e.kind === "fromPerson" || (e.kind === "submit" && !e.byHr));
  if (after) return null;
  const d = Math.round((Date.parse(`${DEMO_TODAY}T00:00:00`) - Date.parse(`${lastHr.date}T00:00:00`)) / 86_400_000);
  return Math.max(0, d);
}
