import type { Dispatch } from "react";
import { DEMO_BAR, STAGE_LABELS, type Stage } from "../constants/labels";
import type { Action, State } from "../state/store";

type Props = { state: State; dispatch: Dispatch<Action> };

const STAGES: Stage[] = ["acute", "recovery", "preReturn", "afterReturn"];

export default function DemoBar({ state, dispatch }: Props) {
  const restAllowed = state.stage === "recovery" || state.stage === "preReturn";

  return (
    <div className="demo-bar" aria-label={DEMO_BAR.title}>
      <span className="demo-bar-title">{DEMO_BAR.title}</span>

      <div className="seg" role="group" aria-label={DEMO_BAR.viewAs}>
        <button
          aria-pressed={state.view === "person"}
          onClick={() => dispatch({ type: "setView", view: "person" })}
        >
          {DEMO_BAR.viewPerson}
        </button>
        <button aria-pressed={state.view === "hr"} onClick={() => dispatch({ type: "setView", view: "hr" })}>
          {DEMO_BAR.viewHr}
        </button>
      </div>

      <label className="demo-field">
        {DEMO_BAR.stage}
        <select
          value={state.stage}
          onChange={(e) => dispatch({ type: "setStage", stage: e.target.value as Stage })}
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      {restAllowed && (
        <div className="seg" role="group" aria-label={DEMO_BAR.restMode}>
          <span className="seg-label">{DEMO_BAR.restMode}</span>
          <button aria-pressed={state.restMode} onClick={() => dispatch({ type: "setRestMode", on: true })}>
            {DEMO_BAR.on}
          </button>
          <button aria-pressed={!state.restMode} onClick={() => dispatch({ type: "setRestMode", on: false })}>
            {DEMO_BAR.off}
          </button>
        </div>
      )}

      <button className="demo-reset" onClick={() => dispatch({ type: "reset" })}>
        {DEMO_BAR.reset}
      </button>
    </div>
  );
}
