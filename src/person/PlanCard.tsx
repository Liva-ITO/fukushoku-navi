import { useState, type Dispatch } from "react";
import { PLAN } from "../constants/labels";
import { PLAN_CATS, PLAN_TASKS, planToday, type PlanResult } from "../data/recoveryPlan";
import type { Action, State } from "../state/store";

type Props = { state: State; dispatch: Dispatch<Action> };

// 回復期の「きょうのひとつ」。1日に1つ出し、やってみた感じで次のステップをすすめたり、黙って下げたりする
export default function PlanCard({ state, dispatch }: Props) {
  const plan = state.plan;
  const today = planToday(plan);
  const [picking, setPicking] = useState(false);
  const [easy, setEasy] = useState(false);
  const name = PLAN_TASKS[today.cat].name;
  const last = plan.log[plan.log.length - 1];

  const pick = (
    <div className="chips">
      {PLAN_CATS.map((c) => (
        <button
          key={c}
          className="chip"
          aria-pressed={plan.cat === c}
          onClick={() => {
            dispatch({ type: "planPickCat", cat: c });
            setPicking(false);
          }}
        >
          {PLAN_TASKS[c].name}
        </button>
      ))}
    </div>
  );

  if (plan.doneToday) {
    const up = plan.offerUp;
    return (
      <section className="card plan-card">
        <h2>{PLAN.title}</h2>
        {last && <p className="done-note">{PLAN.done[last.result]}</p>}
        {up ? (
          <div className="plan-up">
            <p>{PLAN.upAsk(PLAN_TASKS[up].name)}</p>
            <p className="muted">
              {PLAN.upExample}
              {PLAN_TASKS[up].steps[plan.steps[up]]?.tasks[0]}
            </p>
            <div className="confirm-actions">
              <button className="btn-outline" onClick={() => dispatch({ type: "planDecideUp", up: true })}>
                {PLAN.upYes}
              </button>
              <button className="btn-outline" onClick={() => dispatch({ type: "planDecideUp", up: false })}>
                {PLAN.upNo}
              </button>
            </div>
            <p className="muted">{PLAN.upNote}</p>
          </div>
        ) : (
          <div className="plan-next">
            <p className="plan-tomorrow">
              <span className="muted">{PLAN.tomorrow}</span>
              {today.mode === "afterRest" ? today.easy : today.task}
            </p>
            <button className="link-small link-muted" onClick={() => setPicking(!picking)}>
              {PLAN.tomorrowPick}
            </button>
            {picking && pick}
          </div>
        )}
        <button
          className="link-small link-muted plan-demo"
          onClick={() => {
            setEasy(false);
            dispatch({ type: "planNextDay" });
          }}
        >
          {PLAN.demoNextDay}
        </button>
      </section>
    );
  }

  const answer = (result: PlanResult) => dispatch({ type: "planAnswer", result, easy: today.mode === "afterRest" || easy });

  return (
    <section className="card plan-card">
      <h2>{PLAN.title}</h2>
      {PLAN.head[today.mode] ? <p className="plan-head">{PLAN.head[today.mode]}</p> : <p className="muted">{PLAN.lead}</p>}
      <p className="plan-step muted">{PLAN.step(name, today.step)}</p>
      {today.mode === "afterRest" ? (
        <p className="plan-task">
          <span className="muted plan-easy-label">{PLAN.easyOnly}</span>
          {today.easy}
        </p>
      ) : (
        <>
          <p className="plan-task">{today.task}</p>
          <p className="plan-easy">
            {PLAN.easy}
            {today.easy}
          </p>
        </>
      )}
      <button className="link-small link-muted" onClick={() => setPicking(!picking)}>
        {PLAN.other}
      </button>
      {picking && pick}

      <div className="plan-ask">
        <p className="path-group">{PLAN.ask}</p>
        {today.mode !== "afterRest" && (
          <label className="check">
            <input type="checkbox" checked={easy} onChange={() => setEasy(!easy)} />
            {PLAN.easyDid}
          </label>
        )}
        <div className="plan-results">
          {(Object.keys(PLAN.results) as PlanResult[]).map((r) => (
            <button key={r} className="btn-outline" onClick={() => answer(r)}>
              {PLAN.results[r]}
            </button>
          ))}
        </div>
        <p className="muted">{PLAN.skipNote}</p>
      </div>
    </section>
  );
}

