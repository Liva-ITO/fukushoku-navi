import { useState, type Dispatch } from "react";
import { PREP, STAGE_LABELS, greeting } from "../constants/labels";
import type { Action, State } from "../state/store";
import { CoordinatorCard, DiaryEntryCard, HrNoticeList, NewNoticeLink } from "./parts";
import { SelfReportCard } from "./SelfReportCard";
import { TorisetsuCard } from "./Torisetsu";

type Props = { state: State; dispatch: Dispatch<Action> };

// 準備期（たたき台。スタッフがブラッシュアップする）：会社と一緒に、復職日を決めていく。
// 手順の進み具合・産業医との面談の準備・自分の取説・配慮してほしいこと
const japaneseDate = (d: string) => `${Number(d.slice(5, 7))}月${Number(d.slice(8, 10))}日`;

export default function PreReturnHome({ state, dispatch }: Props) {
  return (
    <div className="home">
      <p className="greeting">{greeting(state.live?.name ?? "", new Date().getHours())}</p>
      <p className="stage-chip">{STAGE_LABELS.preReturn}</p>
      <p className="lead lead-small">{PREP.stageNote}</p>
      <p className="rest-link">
        <button className="link-small link-muted" onClick={() => dispatch({ type: "setRestMode", on: true })}>
          {PREP.restButton}
        </button>
      </p>

      <NewNoticeLink state={state} dispatch={dispatch} />
      <DiaryEntryCard state={state} dispatch={dispatch} />

      <ReturnSteps state={state} />

      <section className="card">
        <h2>{PREP.occPrepTitle}</h2>
        <p className="muted">{state.prepPath === "self" ? PREP.occPrepSelf : PREP.occPrepRework}</p>
        {state.prepPath === "self" && <SelfReportCard state={state} dispatch={dispatch} />}
      </section>

      <TorisetsuCard state={state} dispatch={dispatch} />

      <AccommodationCard state={state} dispatch={dispatch} />

      <HrNoticeList messages={state.hrMessages} max={3} dispatch={dispatch} />
      <CoordinatorCard state={state} dispatch={dispatch} showNewLink={false} />
    </div>
  );
}

// 復職までの手順。順番は会社の設定に合わせる。本人がすることと、会社がすることを分けて書く
function ReturnSteps({ state }: { state: State }) {
  const occ = state.occMeeting;
  const steps = {
    occ: {
      name: PREP.steps.occ,
      done: occ?.status === "done",
      note: occ?.status === "done" ? PREP.occDone : occ ? PREP.occDate(japaneseDate(occ.date)) : PREP.occWait,
    },
    decision: {
      name: PREP.steps.decision,
      done: state.returnDecision === "ok",
      note: state.returnDecision === "ok" ? PREP.decisionDone : PREP.decisionWait,
    },
    doctor: {
      name: PREP.steps.doctor,
      done: state.doctorNote,
      note: state.doctorNote ? PREP.doctorDone : PREP.doctorWait,
    },
    plan: {
      name: PREP.steps.plan,
      done: state.returnPlan !== null,
      note: state.returnPlan ? PREP.planDone(japaneseDate(state.returnPlan.date)) : PREP.planWait,
    },
  };
  const order =
    state.returnOrder === "occFirst"
      ? [steps.occ, steps.decision, steps.doctor, steps.plan]
      : [steps.doctor, steps.occ, steps.decision, steps.plan];
  const now = order.findIndex((s) => !s.done);

  return (
    <section className="card">
      <h2>{PREP.stepsTitle}</h2>
      <p className="muted">{PREP.stepsNote}</p>
      <ol className="next-steps prep-steps">
        {order.map((s, i) => (
          <li key={s.name} className={i === now ? "step-now" : s.done ? "step-done" : undefined}>
            {s.name}
            {s.done && <span className="tag-soft">{PREP.doneTag}</span>}
            {i === now && <span className="tag-soft">{PREP.hereTag}</span>}
            <span className="step-sub">{s.note}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// 配慮してほしいことを、会社に伝える（選ぶ ＋ 書き足す → 届く文を見る → 送る）
function AccommodationCard({ state, dispatch }: Props) {
  const sent = [...state.sentToHr].reverse().find((s) => s.kind === "accommodation");
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(false);
  const body = PREP.accBody([...picked, text.trim()].filter(Boolean));
  const ready = picked.length > 0 || text.trim() !== "";

  return (
    <section className="card">
      <h2>{PREP.accTitle}</h2>
      <p className="muted">{PREP.accNote}</p>
      {sent && !open && <p className="done-note">{PREP.accSent(japaneseDate(sent.date))}</p>}
      {!open ? (
        <button className="btn-outline" onClick={() => setOpen(true)}>
          {sent ? PREP.accAgain : PREP.accOpen}
        </button>
      ) : preview ? (
        <div className="preview">
          <p className="muted">{PREP.accPreview}</p>
          <p>{body}</p>
          <div className="confirm-actions">
            <button
              className="btn-primary"
              onClick={() => {
                dispatch({ type: "sendToHr", kind: "accommodation", body });
                setOpen(false);
                setPreview(false);
                setPicked([]);
                setText("");
              }}
            >
              {PREP.send}
            </button>
            <button className="btn-quiet" onClick={() => setPreview(false)}>
              {PREP.edit}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="chips">
            {PREP.accOptions.map((o) => (
              <button
                key={o}
                className="chip"
                aria-pressed={picked.includes(o)}
                onClick={() => setPicked(picked.includes(o) ? picked.filter((x) => x !== o) : [...picked, o])}
              >
                {o}
              </button>
            ))}
          </div>
          <label className="field field-tight">
            {PREP.accFree}
            <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <div className="confirm-actions">
            <button className="btn-primary" disabled={!ready} onClick={() => setPreview(true)}>
              {PREP.accPreview}
            </button>
            <button className="btn-quiet" onClick={() => setOpen(false)}>
              {PREP.cancel}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
