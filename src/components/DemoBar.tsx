import { useState, type Dispatch } from "react";
import { DEMO_BAR, STAGE_LABELS, type Stage } from "../constants/labels";
import { BROWSE, type Action, type State } from "../state/store";

type Props = { state: State; dispatch: Dispatch<Action> };

const STAGES: Stage[] = ["acute", "recovery", "preReturn", "afterReturn"];

export default function DemoBar({ state, dispatch: rawDispatch }: Props) {
  const restAllowed = state.stage === "recovery" || state.stage === "preReturn";
  // スマホでは1行にたたむ（製品の画面を広く見せるため）。操作したら閉じる。PCではいつも開いている
  const [open, setOpen] = useState(false);
  const dispatch: Dispatch<Action> = (a) => {
    rawDispatch(a);
    setOpen(false);
  };

  return (
    <div className={`demo-bar${open ? " demo-open" : ""}`} aria-label={DEMO_BAR.title}>
      <span className="demo-bar-title">
        {DEMO_BAR.title}
        {BROWSE && <span className="demo-browse-tag">{DEMO_BAR.browseTag}</span>}
        <span className="demo-build">{DEMO_BAR.build(__BUILD__)}</span>
      </span>
      <button className="demo-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>
          {state.view === "hr"
            ? DEMO_BAR.summaryHr(DEMO_BAR.hrRoles[state.hrRole])
            : DEMO_BAR.summary(state.view, STAGE_LABELS[state.stage], state.restMode)}
        </span>
        <span aria-hidden="true">{open ? "▲" : "▼"}</span>
      </button>

      {/* デモ：回復期に進む前の面談の日が来て、済んだことにする（本番では支援機関から報告が届く）。
          次に押すボタンなので、たたんだ帯の中に隠さず、いつも見えるところに出す */}
      {state.view === "person" && state.stage === "acute" && state.psychSchedule?.chosen && !state.psychMeetingDone && (
        <button className="demo-step" onClick={() => dispatch({ type: "markPsychDone" })}>
          {DEMO_BAR.gateDone} ›
        </button>
      )}

      <div className="demo-controls">

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

      {state.view === "hr" && (
        <div className="seg" role="group" aria-label={DEMO_BAR.hrRole}>
          <span className="seg-label">{DEMO_BAR.hrRole}</span>
          {(["admin", "staff"] as const).map((r) => (
            <button key={r} aria-pressed={state.hrRole === r} onClick={() => dispatch({ type: "setHrRole", role: r })}>
              {DEMO_BAR.hrRoles[r]}
            </button>
          ))}
        </div>
      )}

      {/* 人事の画面では、段階は人事の画面の中で進める。デモの段階の切り替えは本人の画面のときだけ */}
      {state.view === "person" && (
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
      )}

      {state.view === "person" && restAllowed && (
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

      {/* 本番では人事の画面で管理する。デモでは相談の入口がある画面のときだけ切り替えられる */}
      {state.view === "person" &&
        (state.tab === "consult" || (state.tab === "home" && (state.restMode || state.stage === "acute"))) && (
        <div className="seg" role="group" aria-label={DEMO_BAR.tickets}>
          <span className="seg-label">{DEMO_BAR.tickets}</span>
          <button aria-pressed={state.ticketsLeft > 0} onClick={() => dispatch({ type: "setTicketsLeft", on: true })}>
            {DEMO_BAR.ticketsYes}
          </button>
          <button aria-pressed={state.ticketsLeft === 0} onClick={() => dispatch({ type: "setTicketsLeft", on: false })}>
            {DEMO_BAR.ticketsNo}
          </button>
        </div>
      )}

      <a className="demo-mode" href={BROWSE ? location.pathname : `${location.pathname}?mode=browse`}>
        {BROWSE ? DEMO_BAR.toJourney : DEMO_BAR.toBrowse}
      </a>
      <button className="demo-reset" onClick={() => dispatch({ type: "reset" })}>
        {DEMO_BAR.reset}
      </button>
      </div>
    </div>
  );
}
