import type { Dispatch } from "react";
import { ACUTE, COMMON, greeting } from "../constants/labels";
import { PERSON } from "../data/demo";
import type { Action, State } from "../state/store";

type Props = { state: State; dispatch: Dispatch<Action> };

// 急性期：やることを求めない、静かなホーム。赤いバッジや数字は出さない
export default function AcuteHome({ state, dispatch }: Props) {
  const latest = state.hrMessages[state.hrMessages.length - 1];
  const allChecked = state.acuteChecks.every(Boolean);

  return (
    <div className="home home-acute">
      <p className="greeting">{greeting(PERSON.name, new Date().getHours())}</p>
      <p className="lead">{ACUTE.message}</p>

      {latest && (
        <section className="card">
          <h2>{ACUTE.hrContactTitle}</h2>
          <p>{latest.body}</p>
          {latest.noReplyNeeded && <span className="tag-soft">{COMMON.noReplyNeeded}</span>}
        </section>
      )}

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
              <>
                <button className="btn-primary" onClick={() => dispatch({ type: "applyRivaMeeting" })}>
                  {ACUTE.checkButton}
                </button>
                <p className="muted">{ACUTE.checkButtonNote}</p>
              </>
            )}
          </div>
        )}
      </details>
    </div>
  );
}
