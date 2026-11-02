import { useState, type ReactNode } from "react";
import { ACUTE, COMMON } from "../constants/labels";
import type { HrMessage } from "../data/demo";

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
            <span className="muted">（{r.minutes}分）</span>
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
