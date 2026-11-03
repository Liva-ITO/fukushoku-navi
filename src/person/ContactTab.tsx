import { useEffect, useState, type Dispatch } from "react";
import { COMMON, CONSULT, CONTACT, WATCH } from "../constants/labels";
import type { Action, State } from "../state/store";
import { SlotPicker, WishCard } from "./parts";

type Props = { state: State; dispatch: Dispatch<Action> };

const shortDate = (d: string) => d.slice(5).replace("-", "/");

// 例文を足すときは、文の終わりに「。」を付けてつなぐ（書きかけの文が句読点で終わっていなければ、先に「。」を付ける）
function addSentence(text: string, ex: string): string {
  const head = text.trimEnd();
  const sep = head === "" || /[。．！？!?]$/.test(head) ? "" : "。";
  return `${head}${sep}${ex}。`;
}

// 連絡：やり取りは全部ここ。人事とのやり取りと、コーディネーター・専門家からのお知らせを分けて並べる
// 会社に届くのは、ここで本人が送ったものだけ。コーディネーター・専門家からのお知らせは会社には見えない
export default function ContactTab({ state, dispatch }: Props) {
  const messages = [...state.hrMessages].reverse();
  // 開く前に見ていた件数。新しいお知らせがあれば、その枠を上に出す
  const [seenBefore] = useState(state.coordSeen);
  const hasNew = state.coordInbox.length > seenBefore;
  const support = <SupportInbox state={state} dispatch={dispatch} seenBefore={seenBefore} />;
  if (state.stage === "afterReturn")
    return (
      <div className="home">
        <h1 className="page-title">{CONTACT.title}</h1>
        <p className="muted">{WATCH.contactNote}</p>
        {support}
      </div>
    );

  return (
    <div className="home">
      <h1 className="page-title">{CONTACT.title}</h1>
      {hasNew && support}

      {/* 件名の一覧。押すと本文が開き、返信はその下で書く（返信欄をいつも開いておかない） */}
      <section className="card">
        <h2>{CONTACT.inboxTitle}</h2>
        <ul className="notice-list">
          {messages.map((m) => {
            const open = state.contactOpen === m.id;
            return (
              <li key={m.id} className={open ? "notice-open" : undefined}>
                <button
                  className="notice-row notice-toggle"
                  aria-expanded={open}
                  onClick={() => dispatch({ type: "openHrMessage", id: open ? null : m.id })}
                >
                  <span className="notice-title">{m.title}</span>
                  <span className="notice-meta">
                    {shortDate(m.date)}
                    {m.noReplyNeeded && <span className="tag-soft">{COMMON.noReplyNeeded}</span>}
                  </span>
                </button>
                {open && (
                  <div className="notice-body">
                    <p>{m.body}</p>
                    <ReplyArea key={m.id} stage={state.stage} dispatch={dispatch} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {!hasNew && support}

      <NewToHr stage={state.stage} dispatch={dispatch} />

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

// コーディネーター・専門家からのお知らせ。日程の候補は、届いたお知らせのすぐ下で選ぶ。
// 回復期に進む前の面談が済んだお知らせの下では、これからの希望を会社に送れる
function SupportInbox({ state, dispatch, seenBefore }: { state: State; dispatch: Dispatch<Action>; seenBefore: number }) {
  const count = state.coordInbox.length;
  useEffect(() => {
    dispatch({ type: "markCoordSeen" });
  }, [count, dispatch]);
  if (count === 0) return null;
  const lastGate = state.coordInbox.map((m) => m.from).lastIndexOf("psych");
  const showWish = state.stage === "acute" && state.psychMeetingDone;

  return (
    <section className="card">
      <h2>{CONTACT.supportTitle}</h2>
      <p className="muted">{CONTACT.supportNote}</p>
      <ul className="inbox">
        {state.coordInbox
          .map((m, i) => ({ m, i }))
          .reverse()
          .map(({ m, i }) => (
            <li key={m.id} className={i >= seenBefore ? "inbox-new" : undefined}>
              <p className="inbox-head">
                {CONSULT.who[m.who ?? "coord"]}
                {i >= seenBefore && <span className="new-tag">{CONSULT.newTag}</span>}
              </p>
              <p>{m.body}</p>
              {m.id === state.psychSchedule?.offerId && <SlotPicker kind="psych" state={state} dispatch={dispatch} />}
              {m.id === state.coordSchedule?.offerId && <SlotPicker kind="coordinator" state={state} dispatch={dispatch} />}
              {showWish && i === lastGate && <WishCard state={state} dispatch={dispatch} inline />}
            </li>
          ))}
      </ul>
    </section>
  );
}

// 返信は［返信する］を押してから書く
function ReplyArea({ stage, dispatch }: { stage: State["stage"]; dispatch: Dispatch<Action> }) {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <button className="btn-outline btn-reply" onClick={() => setOpen(true)}>
        {CONTACT.replyOpen}
      </button>
    );
  return <div className="reply-area">{stage === "acute" ? <PickReply dispatch={dispatch} /> : <WriteReply dispatch={dispatch} />}</div>;
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
        {/* 押すと文が足される。「＋」で足すことが分かるようにし、もう入っている文は二重に入れない */}
        {CONTACT.examples.map((ex) => {
          const used = text.includes(ex);
          return (
            <button
              key={ex}
              className="chip chip-add"
              disabled={used}
              onClick={() => setText(addSentence(text, ex))}
            >
              ＋ {ex}
            </button>
          );
        })}
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

type Topic = keyof typeof CONTACT.topics;

// 本人から会社に連絡する。用件を選ぶ → 書く（急性期は例文を選ぶだけ）→ 届く文を見る → 送る
function NewToHr({ stage, dispatch }: { stage: State["stage"]; dispatch: Dispatch<Action> }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState("");
  const [preview, setPreview] = useState(false);
  const pickOnly = stage === "acute";
  const reset = () => {
    setTopic(null);
    setText("");
    setFile("");
    setPreview(false);
  };
  const t = topic ? CONTACT.topics[topic] : null;
  const ready = t !== null && text.trim() !== "" && (topic !== "file" || file !== "");
  const body = t ? CONTACT.newBody(t.name, text.trim(), file) : "";

  return (
    <section className="card">
      <h2>{CONTACT.newTitle}</h2>
      {sent ? (
        <>
          <p className="done-note">{CONTACT.newSent}</p>
          <button
            className="btn-quiet"
            onClick={() => {
              setSent(false);
              setOpen(true);
            }}
          >
            {CONTACT.newAgain}
          </button>
        </>
      ) : !open ? (
        <>
          <p className="muted">{CONTACT.newNote}</p>
          <button className="btn-outline" onClick={() => setOpen(true)}>
            {CONTACT.newOpen}
          </button>
        </>
      ) : preview ? (
        <div className="preview">
          <p className="muted">{CONTACT.newPreview}</p>
          <p>{body}</p>
          <div className="confirm-actions">
            <button
              className="btn-primary"
              onClick={() => {
                dispatch({ type: "sendToHr", kind: "new", body });
                reset();
                setOpen(false);
                setSent(true);
              }}
            >
              {CONTACT.send}
            </button>
            <button className="btn-quiet" onClick={() => setPreview(false)}>
              {CONTACT.cancel}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="muted examples-label">{CONTACT.topicLabel}</p>
          <div className="chips">
            {(Object.keys(CONTACT.topics) as Topic[]).map((k) => (
              <button
                key={k}
                className="chip"
                aria-pressed={topic === k}
                onClick={() => {
                  setTopic(k);
                  setText("");
                }}
              >
                {CONTACT.topics[k].name}
              </button>
            ))}
          </div>
          {t && topic === "file" && (
            <label className="field field-tight">
              {CONTACT.fileLabel}
              {/* 名前だけを読む。中身は読まず、どこにも送らない */}
              <input type="file" onChange={(e) => setFile(e.target.files?.[0]?.name ?? "")} />
              <span className="muted">{CONTACT.fileNote}</span>
            </label>
          )}
          {t &&
            (pickOnly ? (
              <>
                <p className="muted examples-label">{CONTACT.replyPickNote}</p>
                <div className="chips chips-stack">
                  {t.examples.map((ex) => (
                    <button key={ex} className="chip" aria-pressed={text === ex} onClick={() => setText(text === ex ? "" : ex)}>
                      {ex}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <label className="field field-tight">
                  {CONTACT.replyWriteNote}
                  <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
                </label>
                <p className="muted examples-label">{CONTACT.replyExamplesLabel}</p>
                <div className="chips">
                  {t.examples.map((ex) => (
                    <button key={ex} className="chip chip-add" disabled={text.includes(ex)} onClick={() => setText(addSentence(text, ex))}>
                      ＋ {ex}
                    </button>
                  ))}
                </div>
              </>
            ))}
          <div className="confirm-actions">
            <button className="btn-primary" disabled={!ready} onClick={() => setPreview(true)}>
              {CONTACT.newPreview}
            </button>
            <button
              className="btn-quiet"
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              {CONTACT.cancel}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

// 通院のあとの報告：「会社に何と連絡すればいいか」で悩まないよう、選ぶだけにする
function VisitReport({ dispatch }: { dispatch: Dispatch<Action> }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  // 選んだだけでは送らない（選ぶ → 届く文を見る → 送る）
  const [picked, setPicked] = useState<string | null>(null);

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
          <div className="chips chips-stack">
            {CONTACT.visitOptions.map((opt) => (
              <button key={opt} className="chip" aria-pressed={picked === opt} onClick={() => setPicked(opt)}>
                {opt}
              </button>
            ))}
          </div>
          {picked && (
            <div className="preview">
              <p className="muted">{CONTACT.visitPreview}</p>
              <p>{CONTACT.visitBody(picked)}</p>
            </div>
          )}
          <div className="confirm-actions">
            <button
              className="btn-primary"
              disabled={!picked}
              onClick={() => {
                if (!picked) return;
                dispatch({ type: "sendToHr", kind: "visit", body: CONTACT.visitBody(picked) });
                setSent(true);
              }}
            >
              {CONTACT.send}
            </button>
            <button
              className="btn-quiet"
              onClick={() => {
                setOpen(false);
                setPicked(null);
              }}
            >
              {CONTACT.cancel}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
