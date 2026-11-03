import { useState, type Dispatch, type ReactNode } from "react";
import { ACUTE, COMMON, CONSULT, RECORD } from "../constants/labels";
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
}: {
  state: State;
  dispatch: Dispatch<Action>;
  title?: string;
  note?: string;
  publicWhenEmpty?: boolean;
  showNewLink?: boolean;
}) {
  const hasTickets = state.ticketsLeft > 0;
  const report = state.coordinatorReport;
  // 面談が済んだ・今回は難しいと連絡があったときは、また申し込める
  const open = state.coordinatorMeeting === null || report === "done" || report === "declined";
  const unread = state.coordInbox.length - state.coordSeen;
  // 見逃さないよう、新しいお知らせはホームからも相談タブに行けるようにする
  const newLink = showNewLink && unread > 0 && (
    <button className="new-link" onClick={() => dispatch({ type: "setTab", tab: "consult" })}>
      <span className="tab-badge">{unread}</span>
      {CONSULT.newLink(unread)}
    </button>
  );
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
      {!open && report === "notified" && <p className="done-note">{showNewLink ? CONSULT.notifiedNote : CONSULT.notifiedNoteHere}</p>}
      {!open && report === null && state.coordinatorMeeting === "applied" && <p className="done-note">{CONSULT.applied}</p>}
      {!open && report === null && state.coordinatorMeeting === "requested" && (
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

// 人事からの連絡は1行にたたむ。本文は、本人が開いたときだけ見える
export function HrNoticeFold({ messages }: { messages: HrMessage[] }) {
  const latest = messages[messages.length - 1];
  if (!latest) return null;
  return (
    <details className="card card-fold">
      <summary>
        {ACUTE.hrContactSummary(messages.length)}
        {latest.noReplyNeeded && <span className="tag-soft">{COMMON.noReplyNeeded}</span>}
      </summary>
      <p className="fold-body">{latest.body}</p>
    </details>
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
