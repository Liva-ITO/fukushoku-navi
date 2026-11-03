import { useState, type Dispatch, type ReactNode } from "react";
import { ACUTE, COMMON, CONSULT, CONTACT, RECORD } from "../constants/labels";
import type { HrMessage } from "../data/demo";
import type { Action, State } from "../state/store";

// 復職コーディネーターへの相談。チケットが残っていれば申し込み、なければリクエスト。
// 休息モードでは、チケットがないときはリクエストの代わりに公的な相談窓口を出す
export function CoordinatorCard({
  state,
  dispatch,
  title = CONSULT.coordinatorTitle,
  note = CONSULT.coordinatorNote,
  publicWhenEmpty = false,
  showNewLink = true,
  inConsult = false,
}: {
  state: State;
  dispatch: Dispatch<Action>;
  title?: string;
  note?: string;
  publicWhenEmpty?: boolean;
  showNewLink?: boolean;
  inConsult?: boolean; // 相談タブの中なら「下の『お知らせ』」と案内する
}) {
  const hasTickets = state.ticketsLeft > 0;
  const report = state.coordinatorReport;
  const cs = state.coordSchedule;
  // 面談が済んだ・今回は難しいと連絡があったときは、また申し込める
  const open = state.coordinatorMeeting === null || report === "done" || report === "declined";
  const newLink = showNewLink && <NewNoticeLink state={state} dispatch={dispatch} />;
  if (publicWhenEmpty && !hasTickets && open) {
    return (
      <section className="card">
        <h2>{title}</h2>
        {newLink}
        <PublicLines />
      </section>
    );
  }
  return (
    <section className="card">
      <h2>{title}</h2>
      {newLink}
      {!open && cs?.chosen && <p className="done-note">{CONSULT.decidedNote(cs.chosen)}</p>}
      {!open && cs?.offerId && <p className="done-note">{inConsult ? CONSULT.offeredNoteHere : CONSULT.offeredNote}</p>}
      {!open && !cs?.chosen && !cs?.offerId && state.coordinatorMeeting === "applied" && <p className="done-note">{CONSULT.applied}</p>}
      {!open && !cs && state.coordinatorMeeting === "requested" && (
        <div className="confirm">
          <p className="done-note">{CONSULT.requestedTitle}</p>
          {CONSULT.requestedLines.map((l) => (
            <p key={l} className="muted">
              {l}
            </p>
          ))}
        </div>
      )}
      {open && (
        <>
          <p className="muted">{note}</p>
          <div className="stack">
            <ConfirmButton
              quiet
              label={hasTickets ? CONSULT.apply : CONSULT.request}
              confirm={hasTickets ? CONSULT.applyConfirm : CONSULT.requestConfirm}
              yes={hasTickets ? CONSULT.applyYes : CONSULT.requestYes}
              no={CONSULT.no}
              onConfirm={() => dispatch({ type: "askCoordinator" })}
            />
          </div>
        </>
      )}
    </section>
  );
}

// 支援機関からの新しいお知らせ。見逃さないよう、ホームからも相談タブに行けるようにする
export function NewNoticeLink({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const unread = state.coordInbox.length - state.coordSeen;
  if (unread <= 0) return null;
  return (
    <button className="new-link" onClick={() => dispatch({ type: "setTab", tab: "consult" })}>
      <span className="tab-badge">{unread}</span>
      {CONSULT.newLink(unread)}
    </button>
  );
}

export function PublicLines() {
  return (
    <ul className="list-plain">
      {CONSULT.publicPlaces.map((p) => (
        <li key={p.name}>
          {p.name}
          {p.tel && (
            <>
              {" "}
              <a href={`tel:${p.tel}`}>{p.tel}</a>
            </>
          )}
          <br />
          <span className="muted">{p.note}</span>
        </li>
      ))}
    </ul>
  );
}

// 人事からの連絡は、ホームには件名だけを出す。押すと連絡タブで本文を読む
export function HrNoticeList({ messages, max, dispatch }: { messages: HrMessage[]; max: number; dispatch: Dispatch<Action> }) {
  if (messages.length === 0) return null;
  const latest = [...messages].reverse();
  const shown = latest.slice(0, max);
  const rest = latest.length - shown.length;
  return (
    <section className="card">
      <h2>{CONTACT.inboxTitle}</h2>
      <ul className="notice-list">
        {shown.map((m) => (
          <li key={m.id}>
            <button className="notice-row" onClick={() => dispatch({ type: "openHrMessage", id: m.id, goContact: true })}>
              <span className="notice-title">{m.title}</span>
              <span className="notice-meta">
                {m.date.slice(5).replace("-", "/")}
                {m.noReplyNeeded && <span className="tag-soft">{COMMON.noReplyNeeded}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {rest > 0 && (
        <button className="notice-more" onClick={() => dispatch({ type: "openHrMessage", id: null, goContact: true })}>
          {CONTACT.more(rest)}
        </button>
      )}
    </section>
  );
}

export function ReadingsCard() {
  return (
    <section className="card">
      <h2>{ACUTE.readingsTitle}</h2>
      <ul className="list-plain">
        {ACUTE.readings.map((r) => (
          <li key={r.title}>
            {r.title}
            <span className="muted">（{RECORD.minutes(r.minutes)}）</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// いきなり申し込みにせず、何が起きるかを見せてから申し込む
export function ConfirmButton(props: {
  label: string;
  note?: string;
  confirm: string;
  yes: string;
  no: string;
  onConfirm: () => void;
  quiet?: boolean;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (open) {
    return (
      <div className="confirm">
        <p>{props.confirm}</p>
        <div className="confirm-actions">
          <button
            className="btn-primary"
            onClick={() => {
              props.onConfirm();
              setOpen(false);
            }}
          >
            {props.yes}
          </button>
          <button className="btn-quiet" onClick={() => setOpen(false)}>
            {props.no}
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="confirm-entry">
      <button className={props.quiet ? "btn-outline" : "btn-primary"} onClick={() => setOpen(true)}>
        {props.label}
      </button>
      {props.note && <p className="muted">{props.note}</p>}
    </div>
  );
}
