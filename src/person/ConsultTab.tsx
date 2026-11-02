import type { Dispatch } from "react";
import { CONSULT } from "../constants/labels";
import type { Action, State } from "../state/store";
import { ConfirmButton } from "./parts";

type Props = { state: State; dispatch: Dispatch<Action> };

// 相談：リヴァとの面談は、段階に関係なく、相談したいときに本人が選ぶ
export default function ConsultTab({ state, dispatch }: Props) {
  return (
    <div>
      <h1 className="page-title">{CONSULT.title}</h1>

      <section className="card">
        <h2>{CONSULT.coordinatorTitle}</h2>
        {state.coordinatorMeeting === "applied" && <p className="done-note">{CONSULT.applied}</p>}
        {state.coordinatorMeeting === "requested" && (
          <div className="confirm">
            <p className="done-note">{CONSULT.requestedTitle}</p>
            {CONSULT.requestedLines.map((l) => (
              <p key={l} className="muted">
                {l}
              </p>
            ))}
          </div>
        )}
        {state.coordinatorMeeting === null && (
          <>
            <p className="muted">{CONSULT.coordinatorNote}</p>
            <div className="stack">
              <ConfirmButton
                quiet
                label={state.ticketsLeft ? CONSULT.apply : CONSULT.request}
                confirm={state.ticketsLeft ? CONSULT.applyConfirm : CONSULT.requestConfirm}
                yes={state.ticketsLeft ? CONSULT.applyYes : CONSULT.requestYes}
                no={CONSULT.no}
                onConfirm={() => dispatch({ type: "askCoordinator" })}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
