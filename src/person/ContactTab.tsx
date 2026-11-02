import { useState, type Dispatch } from "react";
import { COMMON, CONTACT } from "../constants/labels";
import type { Action, State } from "../state/store";

type Props = { state: State; dispatch: Dispatch<Action> };

const shortDate = (d: string) => d.slice(5).replace("-", "/");

// 人事との連絡。会社に届くのは、ここで本人が送ったものだけ
export default function ContactTab({ state, dispatch }: Props) {
  const messages = [...state.hrMessages].reverse();

  return (
    <div className="home">
      <h1 className="page-title">{CONTACT.title}</h1>

      {messages.map((m) => (
        <section key={m.id} className="card">
          <h2>
            {CONTACT.fromHr}　<span className="muted">{shortDate(m.date)}</span>
          </h2>
          <p>{m.body}</p>
          {m.noReplyNeeded && <span className="tag-soft">{COMMON.noReplyNeeded}</span>}
        </section>
      ))}

      <section className="card">
        <h2>{CONTACT.replyTitle}</h2>
        {state.stage === "acute" ? (
          <PickReply dispatch={dispatch} />
        ) : (
          <WriteReply dispatch={dispatch} />
        )}
      </section>

      <VisitReport dispatch={dispatch} />

      <section className="card card-quiet-box">
        <h2>{CONTACT.historyTitle}</h2>
        {state.sentToHr.length === 0 ? (
          <p className="muted">{CONTACT.historyEmpty}</p>
        ) : (
          <ul className="list-plain">
            {[...state.sentToHr].reverse().map((s) => (
              <li key={s.id}>
                <span className="muted">{shortDate(s.date)}　</span>
                {s.body}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// 急性期：例文を選ぶだけ。入力欄は出さない
function PickReply({ dispatch }: { dispatch: Dispatch<Action> }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (sent) return <p className="done-note">{CONTACT.sent}</p>;
  return (
    <>
      <p className="muted">{CONTACT.replyPickNote}</p>
      <div className="chips">
        {CONTACT.examples.map((ex) => (
          <button key={ex} className="chip" aria-pressed={picked === ex} onClick={() => setPicked(picked === ex ? null : ex)}>
            {ex}
          </button>
        ))}
      </div>
      {picked && (
        <div className="confirm-actions send-row">
          <button
            className="btn-primary"
            onClick={() => {
              dispatch({ type: "sendToHr", kind: "reply", body: picked });
              setSent(true);
            }}
          >
            {CONTACT.send}
          </button>
          <button className="btn-quiet" onClick={() => setPicked(null)}>
            {CONTACT.cancel}
          </button>
        </div>
      )}
    </>
  );
}

// 回復期・準備期：自分の言葉で書く。例文は書き出しの助けとして下に置く
function WriteReply({ dispatch }: { dispatch: Dispatch<Action> }) {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) return <p className="done-note">{CONTACT.sent}</p>;
  return (
    <>
      <label className="field field-tight">
        {CONTACT.replyWriteNote}
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <p className="muted examples-label">{CONTACT.replyExamplesLabel}</p>
      <div className="chips">
        {CONTACT.examples.map((ex) => (
          <button key={ex} className="chip" aria-pressed={false} onClick={() => setText(text ? `${text}${ex}` : ex)}>
            {ex}
          </button>
        ))}
      </div>
      <button
        className="btn-primary btn-wide"
        disabled={!text.trim()}
        onClick={() => {
          dispatch({ type: "sendToHr", kind: "reply", body: text.trim() });
          setSent(true);
        }}
      >
        {CONTACT.send}
      </button>
    </>
  );
}

// 通院のあとの報告：「会社に何と連絡すればいいか」で悩まないよう、選ぶだけにする
function VisitReport({ dispatch }: { dispatch: Dispatch<Action> }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <section className="card">
      <h2>{CONTACT.visitTitle}</h2>
      {sent ? (
        <p className="done-note">{CONTACT.visitSent}</p>
      ) : !open ? (
        <button className="btn-outline" onClick={() => setOpen(true)}>
          {CONTACT.visitButton}
        </button>
      ) : (
        <>
          <p className="muted">{CONTACT.visitNote}</p>
          <div className="stack">
            {CONTACT.visitOptions.map((opt) => (
              <button
                key={opt}
                className="path-option"
                onClick={() => {
                  dispatch({ type: "sendToHr", kind: "visit", body: CONTACT.visitBody(opt) });
                  setSent(true);
                }}
              >
                {opt}
              </button>
            ))}
          </div>
          <button className="btn-quiet" onClick={() => setOpen(false)}>
            {CONTACT.cancel}
          </button>
        </>
      )}
    </section>
  );
}
