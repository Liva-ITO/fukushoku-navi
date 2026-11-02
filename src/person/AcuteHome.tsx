import type { Dispatch } from "react";
import { ACUTE, greeting } from "../constants/labels";
import { PERSON } from "../data/demo";
import type { Action, State } from "../state/store";
import { ConfirmButton, HrNoticeFold, ReadingsCard } from "./parts";

type Props = { state: State; dispatch: Dispatch<Action> };

// 急性期：やることを求めない、静かなホーム。赤いバッジや数字は出さない
export default function AcuteHome({ state, dispatch }: Props) {
  const allChecked = state.acuteChecks.every(Boolean);

  return (
    <div className="home home-acute">
      <p className="greeting">{greeting(PERSON.name, new Date().getHours())}</p>
      <p className="lead">{ACUTE.message}</p>

      <HrNoticeFold messages={state.hrMessages} />

      <ReadingsCard />

      <button className="link-soft" onClick={() => dispatch({ type: "setTab", tab: "record" })}>
        {ACUTE.recordEntry}
      </button>

      <section className="card">
        <h2>{ACUTE.todoTitle}</h2>
        <p>{ACUTE.todo}</p>
      </section>

      <details className="card card-quiet">
        <summary>{ACUTE.checkTitle}</summary>
        <p className="muted">{ACUTE.checkNote}</p>
        <ul className="list-plain">
          {ACUTE.checkItems.map((item, i) => (
            <li key={item}>
              <label className="check">
                <input
                  type="checkbox"
                  checked={state.acuteChecks[i]}
                  onChange={() => dispatch({ type: "toggleAcuteCheck", index: i })}
                />
                {item}
              </label>
            </li>
          ))}
        </ul>
        {allChecked && (
          <div className="next-step">
            <p>{ACUTE.checkAllDone}</p>
            {state.rivaMeetingApplied ? (
              <p className="done-note">{ACUTE.checkApplied}</p>
            ) : (
              <ConfirmButton
                label={ACUTE.checkButton}
                note={ACUTE.checkButtonNote}
                confirm={ACUTE.checkConfirm}
                yes={ACUTE.checkConfirmYes}
                no={ACUTE.checkConfirmNo}
                onConfirm={() => dispatch({ type: "applyRivaMeeting" })}
              />
            )}
          </div>
        )}
      </details>
    </div>
  );
}
