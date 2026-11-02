import type { Dispatch } from "react";
import { RECOVERY, STAGE_LABELS, greeting, type PrepPath } from "../constants/labels";
import { PERSON } from "../data/demo";
import type { Action, State } from "../state/store";
import { ConfirmButton, HrNoticeFold } from "./parts";

type Props = { state: State; dispatch: Dispatch<Action> };

const REWORK_PATHS: PrepPath[] = ["rivatore", "rivabiz"];

// 回復期：生活のリズムを整える。ゴールは見せるが、急かさない
export default function RecoveryHome({ state, dispatch }: Props) {
  const path = state.prepPath;
  const nextItems =
    path === null ? RECOVERY.next.none : path === "self" ? RECOVERY.next.self : RECOVERY.next.rework;

  return (
    <div className="home">
      <p className="greeting">{greeting(PERSON.name, new Date().getHours())}</p>
      <p className="stage-chip">{STAGE_LABELS.recovery}</p>
      <p className="lead lead-small">{RECOVERY.stageNote}</p>

      {!state.recoveryIntroSeen && (
        <section className="card card-intro">
          {RECOVERY.introLines.map((l) => (
            <p key={l}>{l}</p>
          ))}
          <button className="btn-quiet" onClick={() => dispatch({ type: "closeRecoveryIntro" })}>
            {RECOVERY.introClose}
          </button>
        </section>
      )}

      <section className="card">
        <h2>{RECOVERY.todayTitle}</h2>
        <ul className="list-plain">
          {RECOVERY.todayItems.map((item, i) => (
            <li key={item}>
              <label className="check">
                <input
                  type="checkbox"
                  checked={state.todayTodos[i]}
                  onChange={() => dispatch({ type: "toggleTodayTodo", index: i })}
                />
                {item}
              </label>
            </li>
          ))}
        </ul>
        <p className="muted">{RECOVERY.todayNote}</p>
      </section>

      <button className="btn-rest" onClick={() => dispatch({ type: "setRestMode", on: true })}>
        {RECOVERY.restButton}
      </button>

      <HrNoticeFold messages={state.hrMessages} />

      <section className="card">
        <h2>{RECOVERY.pathTitle}</h2>
        {path ? (
          <div className="path-chosen">
            <p>{RECOVERY.pathChosen(RECOVERY.pathOptions[path].name)}</p>
            <button className="btn-quiet" onClick={() => dispatch({ type: "setPrepPath", path: null })}>
              {RECOVERY.pathChange}
            </button>
          </div>
        ) : (
          <>
            <p className="muted">{RECOVERY.pathNote}</p>
            <p className="path-group">
              {RECOVERY.pathRework}
              <span className="muted">　{RECOVERY.pathReworkNote}</span>
            </p>
            {REWORK_PATHS.map((p) => (
              <PathOption key={p} path={p} dispatch={dispatch} />
            ))}
            <PathOption path="self" dispatch={dispatch} />
          </>
        )}
      </section>

      <section className="card">
        <h2>{RECOVERY.nextTitle}</h2>
        <ul className="list-dot">
          {nextItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="card card-quiet-box">
        <h2>{RECOVERY.nextStepTitle}</h2>
        {state.preReturnMeeting ? (
          <p className="done-note">
            {state.preReturnMeeting === "company" ? RECOVERY.meetCompanyApplied : RECOVERY.meetRivaApplied}
          </p>
        ) : (
          <>
            <p className="muted">{RECOVERY.nextStepNote}</p>
            <div className="stack">
              <ConfirmButton
                quiet
                label={RECOVERY.meetCompany}
                confirm={RECOVERY.meetCompanyConfirm}
                yes={RECOVERY.confirmYes}
                no={RECOVERY.confirmNo}
                onConfirm={() => dispatch({ type: "applyPreReturnMeeting", with: "company" })}
              />
              <ConfirmButton
                quiet
                label={RECOVERY.meetRiva}
                note={RECOVERY.meetRivaNote}
                confirm={RECOVERY.meetRivaConfirm}
                yes={RECOVERY.confirmYes}
                no={RECOVERY.confirmNo}
                onConfirm={() => dispatch({ type: "applyPreReturnMeeting", with: "riva" })}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function PathOption({ path, dispatch }: { path: PrepPath; dispatch: Dispatch<Action> }) {
  const opt = RECOVERY.pathOptions[path];
  return (
    <button
      className={`path-option${path === "self" ? "" : " path-option-indent"}`}
      onClick={() => dispatch({ type: "setPrepPath", path })}
    >
      <span className="path-name">{opt.name}</span>
      <span className="muted">{opt.note}</span>
    </button>
  );
}
