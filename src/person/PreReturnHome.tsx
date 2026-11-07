import { useState, type Dispatch } from "react";
import { HR, PREP, STAGE_LABELS, greeting } from "../constants/labels";
import { whenOf, type Action, type State } from "../state/store";
import { MedEditLink, MedTop } from "./Meds";
import { ConfirmButton, CoordinatorCard, DiaryEntryCard, HrNoticeList, NewNoticeLink } from "./parts";
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
      <MedTop state={state} dispatch={dispatch} />

      {/* 回復期と同じく、手順の流れをいちばん上に。説明は「いまここ」だけ開き、ほかは押したら開く */}
      <ReturnSteps state={state} dispatch={dispatch} />

      <DiaryEntryCard state={state} dispatch={dispatch} />

      <TorisetsuCard state={state} dispatch={dispatch} />

      <AccommodationCard state={state} dispatch={dispatch} />

      <HrNoticeList messages={state.hrMessages} max={3} dispatch={dispatch} />
      <CoordinatorCard state={state} dispatch={dispatch} showNewLink={false} />

      {/* 薬の種類・量が変わったとき用。設定そのものは急性期に済ませている前提 */}
      <MedEditLink dispatch={dispatch} />
    </div>
  );
}

// 復職までの手順。順番は会社の設定に合わせる。本人がすることと、会社がすることを分けて書く
function ReturnSteps({ state, dispatch }: Props) {
  const occ = state.occMeeting;
  // 前回の会社の確認が「もう少し準備が必要」で、まだ次の面談が決まっていない
  const lastDecision = state.returnDecisionLog[state.returnDecisionLog.length - 1];
  const again = lastDecision?.result === "notYet" && state.returnDecision !== "ok";
  // 会社からの課題の連絡（判断のあとに届いたもの）
  const issueMsg = [...state.hrMessages].reverse().find((m) => m.title === HR.issue.title);
  // 取説 → レポートの見直し がそろってから、産業医との面談を申し込める
  const canApply = state.torisetsu !== null && state.prepReviewed;
  // 課題の連絡を受け取るまでは、もう一度の申し込みはできない
  const canApplyNow = canApply && !(again && state.occIssuePending);
  const reviewing = state.torisetsu !== null && !state.prepReviewed;
  const steps = {
    torisetsu: {
      name: PREP.steps.torisetsu,
      done: state.torisetsu !== null,
      note: state.torisetsu ? PREP.torisetsuDone : PREP.torisetsuWait,
    },
    review: {
      name: PREP.steps.review,
      done: state.prepReviewed,
      note: state.prepReviewed
        ? PREP.reviewDone
        : !state.torisetsu
          ? PREP.reviewWait
          : state.prepPath === "self"
            ? PREP.reviewSelf
            : PREP.reviewRework,
    },
    occ: {
      name: PREP.steps.occ,
      done: occ?.status === "done",
      note:
        occ?.status === "done"
          ? PREP.occDone
          : occ
            ? PREP.occDate(whenOf(occ.date, occ.time))
            : state.offers.occ && !state.offers.occ.declined
              ? PREP.occOffered
              : state.occApplied
                ? PREP.occWait
                : again
                  ? state.occIssuePending || !issueMsg
                    ? PREP.occAgainWait
                    : PREP.occAgainNote(japaneseDate(issueMsg.date))
                  : canApply
                    ? PREP.occApplyReady
                    : PREP.occApplyNote,
    },
    decision: {
      name: PREP.steps.decision,
      done: state.returnDecision === "ok",
      note: state.returnDecision === "ok" ? PREP.decisionDone : again ? PREP.decisionNotYetNote : PREP.decisionWait,
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
  // 取説とレポートの見直しは、いつもいちばん先
  type Key = keyof typeof steps;
  const keys: Key[] =
    state.returnOrder === "occFirst"
      ? ["torisetsu", "review", "occ", "decision", "doctor", "plan"]
      : ["torisetsu", "review", "doctor", "occ", "decision", "plan"];
  const now = keys.findIndex((k) => !steps[k].done);
  // 本人が押すボタンがある手順（レポートの見直し・面談の申し込み）
  const hasAction = (k: Key) => (k === "review" && reviewing) || (k === "occ" && !occ && !state.occApplied && canApplyNow);
  // はじめは、ボタンのある手順か「いまここ」の説明を出す。番号を押すと、その手順の説明に替わる
  const [picked, setPicked] = useState<Key | null>(null);
  const sel: Key | undefined = picked ?? keys.find(hasAction) ?? keys[now];
  const s = sel ? steps[sel] : undefined;

  return (
    <section className="card">
      <h2>{PREP.stepsTitle}</h2>
      <p className="muted">{PREP.stepsNote}</p>
      <ol className="flow flow-6">
        {keys.map((k, i) => (
          <li key={k}>
            <button
              className={`flow-step${i === now ? " flow-now" : steps[k].done ? " flow-done" : ""}`}
              aria-expanded={sel === k}
              aria-label={`${i + 1} ${steps[k].name}${i === now ? ` ${PREP.hereTag}` : steps[k].done ? ` ${PREP.doneTag}` : ""}`}
              onClick={() => setPicked(k)}
            >
              <span className="flow-num">{steps[k].done && i !== now ? "✓" : i + 1}</span>
              <span className="flow-name">{PREP.stepsShort[k]}</span>
            </button>
          </li>
        ))}
      </ol>
      {sel && s && (
        <div className="flow-detail">
          <p className="self-step-name">
            {keys.indexOf(sel) + 1}. {s.name}
            {keys.indexOf(sel) === now && <span className="tag-soft">{PREP.hereTag}</span>}
            {s.done && keys.indexOf(sel) !== now && <span className="tag-soft">{PREP.doneTag}</span>}
          </p>
          <p>{s.note}</p>
          {sel === "review" && reviewing && (
            <div className="step-action">
              {state.prepPath === "self" && <SelfReportCard state={state} dispatch={dispatch} />}
              <button className="btn-outline btn-small" onClick={() => dispatch({ type: "markPrepReviewed" })}>
                {state.prepPath === "self" ? PREP.reviewKeep : PREP.reviewReworkDone}
              </button>
            </div>
          )}
          {sel === "occ" && !occ && !state.occApplied && canApplyNow && (
            <ConfirmButton
              quiet
              modal
              label={again ? PREP.occApplyAgain : PREP.occApply}
              confirm={PREP.occApplyConfirm}
              yes={PREP.occApplyYes}
              no={PREP.occApplyNo}
              onConfirm={() => dispatch({ type: "applyOccMeeting" })}
            />
          )}
        </div>
      )}
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
