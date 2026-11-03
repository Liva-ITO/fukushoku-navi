import { useEffect, useState, type Dispatch } from "react";
import { CONSULT } from "../constants/labels";
import type { Action, State } from "../state/store";
import { CoordinatorCard, PublicLines } from "./parts";

type Props = { state: State; dispatch: Dispatch<Action> };

// 相談：復職コーディネーターとの面談は、段階に関係なく、相談したいときに本人が選ぶ
export default function ConsultTab({ state, dispatch }: Props) {
  // 開く前に見ていた件数。これより後のものに「新しい」をつける
  const [seenBefore] = useState(state.coordSeen);
  const count = state.coordInbox.length;
  useEffect(() => {
    dispatch({ type: "markCoordSeen" });
  }, [count, dispatch]);

  return (
    <div>
      <h1 className="page-title">{CONSULT.title}</h1>
      <CoordinatorCard state={state} dispatch={dispatch} showNewLink={false} />

      {/* 支援機関からのお知らせ。人事とのやり取り（連絡タブ）とは場所を分ける */}
      {count > 0 && (
        <section className="card">
          <h2>{CONSULT.inboxTitle}</h2>
          <p className="muted">{CONSULT.inboxNote}</p>
          <ul className="inbox">
            {state.coordInbox
              .map((m, i) => ({ m, isNew: i >= seenBefore }))
              .reverse()
              .map(({ m, isNew }) => (
                <li key={m.id} className={isNew ? "inbox-new" : undefined}>
                  <p className="inbox-head">
                    {CONSULT.from[m.from]}
                    {isNew && <span className="new-tag">{CONSULT.newTag}</span>}
                  </p>
                  <p>{m.body}</p>
                </li>
              ))}
          </ul>
        </section>
      )}

      {/* つらいときの連絡先は、チケットとは切り離して、いつでもたどれるようにする */}
      <section className="other-places">
        <h2>{CONSULT.otherTitle}</h2>
        <PublicLines />
      </section>
    </div>
  );
}
