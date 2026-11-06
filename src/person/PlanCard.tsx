import { useState, type Dispatch } from "react";
import { PLAN } from "../constants/labels";
import { PLAN_CATS, PLAN_TASKS, planToday, type PlanCat, type PlanResult } from "../data/recoveryPlan";
import { DEMO_TODAY } from "../data/demo";
import type { Action, State } from "../state/store";

type Props = { state: State; dispatch: Dispatch<Action> };

// 回復期の「きょうやること」。4つの種類から、その日にやるものをいくつでも選ぶ。
// 種類ごとに、やってみた感じで次のステップをすすめたり、黙って下げたりする
export default function PlanCard({ state, dispatch }: Props) {
  const plan = state.plan;
  const cats = PLAN_CATS.filter((c) => plan.cats.includes(c));
  const allDone = cats.every((c) => plan.done.includes(c));
  const afterRest = plan.afterRest > 0;

  return (
    <section className="card plan-card">
      <h2>{PLAN.title}</h2>
      {afterRest ? <p className="plan-head">{PLAN.head.afterRest}</p> : <p className="muted">{PLAN.lead}</p>}

      <p className="path-group">{PLAN.pick}</p>
      <div className="chips">
        {PLAN_CATS.map((c) => (
          <button
            key={c}
            className="chip"
            aria-pressed={plan.cats.includes(c)}
            onClick={() => dispatch({ type: "planToggleCat", cat: c })}
          >
            {PLAN_TASKS[c].name}
          </button>
        ))}
      </div>

      {cats.map((c) => (
        <PlanRow key={c} cat={c} state={state} dispatch={dispatch} />
      ))}

      {allDone ? <p className="done-note">{PLAN.allDone}</p> : <p className="muted">{PLAN.skipNote}</p>}

      {plan.done.length > 0 && (
        <button className="link-small link-muted plan-demo" onClick={() => dispatch({ type: "planNextDay" })}>
          {PLAN.demoNextDay}
        </button>
      )}
    </section>
  );
}

function PlanRow({ cat, state, dispatch }: { cat: PlanCat } & Props) {
  const plan = state.plan;
  const today = planToday(plan, cat);
  const [easy, setEasy] = useState(false);
  const name = PLAN_TASKS[cat].name;

  if (plan.done.includes(cat)) {
    const mine = [...plan.log].reverse().find((e) => e.cat === cat && e.date === DEMO_TODAY);
    const up = plan.offerUp.includes(cat);
    return (
      <div className="plan-row plan-row-done">
        <p className="plan-step muted">{PLAN.step(name, mine?.step ?? plan.steps[cat])}</p>
        {mine && <p className="done-note">{PLAN.done[mine.result]}</p>}
        {up && (
          <div className="plan-up">
            <p>{PLAN.upAsk(name)}</p>
            <p className="muted">
              {PLAN.upExample}
              {PLAN_TASKS[cat].steps[plan.steps[cat]]?.tasks[0]}
            </p>
            <div className="confirm-actions">
              <button className="btn-outline" onClick={() => dispatch({ type: "planDecideUp", cat, up: true })}>
                {PLAN.upYes}
              </button>
              <button className="btn-outline" onClick={() => dispatch({ type: "planDecideUp", cat, up: false })}>
                {PLAN.upNo}
              </button>
            </div>
            <p className="muted">{PLAN.upNote}</p>
          </div>
        )}
      </div>
    );
  }

  const answer = (result: PlanResult) => {
    dispatch({ type: "planAnswer", cat, result, easy: today.mode === "afterRest" || easy });
    setEasy(false);
  };

  return (
    <div className="plan-row">
      <p className="plan-step muted">{PLAN.step(name, today.step)}</p>
      {today.mode === "gentle" && <p className="plan-head">{PLAN.head.gentle}</p>}
      {today.mode === "afterRest" ? (
        <div className="plan-opt">
          <span className="plan-opt-label">{PLAN.easyOnly}</span>
          <p className="plan-task">{today.easy}</p>
        </div>
      ) : (
        <div className="plan-opts">
          <div className="plan-opt">
            <span className="plan-opt-label">{PLAN.usualLabel}</span>
            <p className="plan-task">{today.task}</p>
          </div>
          <div className="plan-opt plan-opt-easy">
            <span className="plan-opt-label">{PLAN.easy}</span>
            <p className="plan-easy-task">{today.easy}</p>
          </div>
        </div>
      )}
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
      </div>
    </div>
  );
}
