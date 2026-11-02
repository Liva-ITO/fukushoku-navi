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
        {state.coordinatorRequested ? (
          <p className="done-note">{CONSULT.requested}</p>
        ) : (
          <>
            <p className="muted">{CONSULT.coordinatorNote}</p>
            <div className="stack">
              <ConfirmButton
                quiet
                label={CONSULT.request}
                confirm={CONSULT.confirm}
                yes={CONSULT.yes}
                no={CONSULT.no}
                onConfirm={() => dispatch({ type: "requestCoordinator" })}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
