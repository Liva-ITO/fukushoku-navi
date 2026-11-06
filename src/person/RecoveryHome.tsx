import { useState, type Dispatch } from "react";
import { RECOVERY, REST, STAGE_LABELS, greeting, type PrepPath } from "../constants/labels";
import { whenOf, type Action, type State } from "../state/store";
import { ConfirmButton, CoordinatorCard, DiaryEntryCard, HrNoticeList, NewNoticeLink } from "./parts";
import PlanCard from "./PlanCard";
import { MAX_STEP, PLAN_CATS } from "../data/recoveryPlan";
import { SelfReportAbout, SelfReportCard } from "./SelfReportCard";

type Props = { state: State; dispatch: Dispatch<Action> };

const REWORK_PATHS: PrepPath[] = ["rivatore", "rivabiz"];

// 回復期：生活のリズムを整える。ゴールは見せるが、急かさない
// 2026-11-10 → 11月10日
const japaneseDate = (d: string) => `${Number(d.slice(5, 7))}月${Number(d.slice(8, 10))}日`;

// 自分で準備する人の、回復期の流れ。いつも全部の説明を出さず、押したステップだけ開く
function SelfFlow({ state }: { state: State }) {
  const [open, setOpen] = useState<number | null>(null);
  const s = open === null ? null : RECOVERY.selfSteps[open];
  return (
    <section className="card self-flow">
      <h2>{RECOVERY.selfStepsTitle}</h2>
      <ol className="flow">
        {RECOVERY.selfSteps.map((st, i) => (
          <li key={st.name}>
            <button className="flow-step" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              <span className="flow-num">{i + 1}</span>
              <span className="flow-name">{st.short}</span>
            </button>
          </li>
        ))}
      </ol>
      {s && open !== null ? (
        <div className="flow-detail">
          <p className="self-step-name">{s.name}</p>
          <p>{s.body}</p>
          <p className="muted">{RECOVERY.selfStepsNow(state.plan.steps[PLAN_CATS[open]], MAX_STEP)}</p>
        </div>
      ) : (
        <p className="muted">{RECOVERY.selfStepsNote}</p>
      )}
    </section>
  );
}

export default function RecoveryHome({ state, dispatch }: Props) {
  const path = state.prepPath;
  // 会社がレポートを準備期に進む条件にしているときは、送るまで会社との面談を申し込めない
  const reportRequired = state.prepConds.selfReport;
  const needReport = reportRequired && state.selfReports.length === 0;
  // 「レポートを書けそう」にチェックがついたら、レポートを作るボタンを出す
  const canWriteReport = state.recoveryChecks.includes(RECOVERY.reportItem);
  const nextItems =
    path === null ? RECOVERY.next.none : path === "self" ? RECOVERY.next.self : RECOVERY.next.rework;
  const noteKey = path === null ? "none" : path === "self" ? "self" : "rework";
  const allChecked = nextItems.every((i) => state.recoveryChecks.includes(i));
  // 道すじの「いまここ」：チェックがそろう → （会社がレポートを求めていれば）レポートを送る → 会社と面談
  const steps = reportRequired ? RECOVERY.nextSteps.withReport : RECOVERY.nextSteps.noReport;
  const stepNow = !allChecked ? 0 : needReport ? 1 : steps.length - 1;
  // 準備の進め方は2段階：まず「リワークを使う／自分で準備する」の2つ。リワークを押したら、通う／オンラインを開く
  const [reworkOpen, setReworkOpen] = useState(false);

  return (
    <div className="home">
      <p className="greeting">{greeting(state.live?.name ?? "", new Date().getHours())}</p>
      <p className="stage-chip">{STAGE_LABELS.recovery}</p>
      <p className="lead lead-small">{RECOVERY.stageNote}</p>
      <p className="rest-link">
        <button className="link-small link-muted" onClick={() => dispatch({ type: "setRestMode", on: true })}>
          {RECOVERY.restButton}
        </button>
      </p>

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

      {/* 回復期のホームは長いので、相談の新しいお知らせは上にも出す */}
      <NewNoticeLink state={state} dispatch={dispatch} />

      {/* 会社との面談の日が決まったら、上にも出す（たたんだ目安の中だけだと見落とすため） */}
      {state.companyMeeting?.status === "scheduled" && state.companyMeeting.date && (
        <button
          className="new-link"
          onClick={() => {
            const m = [...state.hrMessages].reverse().find((x) => x.body.includes(japaneseDate(state.companyMeeting?.date ?? "")));
            dispatch({ type: "openHrMessage", id: m?.id ?? null, goContact: true });
          }}
        >
          {RECOVERY.meetCompanyTop(whenOf(state.companyMeeting.date, state.companyMeeting.time))} ›
        </button>
      )}

      {path === "self" && <SelfFlow state={state} />}

      <DiaryEntryCard state={state} dispatch={dispatch} />

      {/* リワークを使う人は、プログラムの中で負荷を上げていくので出さない */}
      {(path === null || path === "self") && <PlanCard state={state} dispatch={dispatch} />}

      <section className="card">
        <h2>{RECOVERY.pathTitle}</h2>
        {path ? (
          <>
          <div className="path-chosen">
            <p>{RECOVERY.pathChosen(RECOVERY.pathOptions[path].name)}</p>
            <button className="btn-quiet" onClick={() => dispatch({ type: "setPrepPath", path: null })}>
              {RECOVERY.pathChange}
            </button>
          </div>
          {REWORK_PATHS.includes(path) && <ShareConsentCard state={state} dispatch={dispatch} />}
          </>
        ) : (
          <>
            <p className="muted">{RECOVERY.pathNote}</p>
            <details className="rework-about">
              <summary>{RECOVERY.reworkAboutTitle}</summary>
              {RECOVERY.reworkAbout.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </details>
            <button className="path-option" aria-expanded={reworkOpen} onClick={() => setReworkOpen(!reworkOpen)}>
              <span className="path-name">
                {RECOVERY.pathRework}
                <span className="path-caret" aria-hidden="true">
                  {reworkOpen ? "▲" : "▼"}
                </span>
              </span>
              <span className="muted">{RECOVERY.pathReworkNote}</span>
            </button>
            {reworkOpen && (
              <div className="path-sub">
                <p className="muted">{RECOVERY.pathReworkPick}</p>
                {REWORK_PATHS.map((p) => (
                  <PathOption key={p} path={p} dispatch={dispatch} />
                ))}
              </div>
            )}
            <PathOption path="self" dispatch={dispatch} />
          </>
        )}
      </section>

      {path === "self" && (
        <section className="card">
          <h2>{RECOVERY.selfTitle}</h2>
          <p className="path-group">{RECOVERY.booksTitle}</p>
          <ul className="list-plain">
            {RECOVERY.books.map((b, i) =>
              b.note ? (
                <li key={i}>
                  {b.title}
                  <br />
                  <span className="muted">{b.note}</span>
                </li>
              ) : (
                <li key={i} className="muted">
                  {b.title}
                </li>
              ),
            )}
          </ul>
          <SelfReportAbout state={state} />
          <div className="next-step">
            <p className="muted">{RECOVERY.selfConsult}</p>
            <button className="btn-outline" onClick={() => dispatch({ type: "setTab", tab: "consult" })}>
              {RECOVERY.selfConsultButton}
            </button>
          </div>
        </section>
      )}

      {/* 目安は「自分で準備する」人だけ。リワークはスタッフと一緒に確かめていくので出さない。
          急性期と同じく、たたんでおき、自分でチェックできる。会社との面談を申し込んだあとは、状態が見えるよう開いておく */}
      {path === "self" && (
      <details className="card card-quiet" open={state.companyMeeting !== null || undefined}>
        <summary>{RECOVERY.nextTitle}</summary>
        <p className="muted">{RECOVERY.nextLead}</p>
        <ol className="next-steps">
          {steps.map((s, i) => (
            <li key={s} className={i === stepNow ? "step-now" : i < stepNow ? "step-done" : undefined}>
              {s}
              {i === stepNow && <span className="tag-soft">{RECOVERY.nextHere}</span>}
            </li>
          ))}
        </ol>
        <ul className="list-plain">
          {nextItems.map((item) => (
            <li key={item}>
              <label className="check">
                <input
                  type="checkbox"
                  checked={state.recoveryChecks.includes(item)}
                  onChange={() => dispatch({ type: "toggleRecoveryCheck", item })}
                />
                {item}
              </label>
            </li>
          ))}
        </ul>
        {/* レポートを書けそうになったら、ここで作れる */}
        {path === "self" && canWriteReport && !state.companyMeeting && (
          <div className="next-step">
            <p className="path-group">{RECOVERY.report.title}</p>
            <SelfReportCard state={state} dispatch={dispatch} />
          </div>
        )}
        {allChecked && !needReport && RECOVERY.nextAllDone[noteKey] && <p className="next-note">{RECOVERY.nextAllDone[noteKey]}</p>}
        <p className="muted next-note">{RECOVERY.nextNote[noteKey]}</p>

        {/* 自分で準備する人は、ここから会社との面談を申し込む */}
        {path === "self" && (
          <div className="next-step">
            {state.companyMeeting ? (
              <p className="done-note">
                {state.companyMeeting.status === "done"
                  ? RECOVERY.meetCompanyDone
                  : state.companyMeeting.status === "scheduled" && state.companyMeeting.date
                    ? RECOVERY.meetCompanyScheduled(whenOf(state.companyMeeting.date, state.companyMeeting.time))
                    : RECOVERY.meetCompanyApplied}
              </p>
            ) : needReport ? null : (
              <>
                <p className="muted">{RECOVERY.meetCompanyNote}</p>
                <ConfirmButton
                  quiet
                  modal
                  label={RECOVERY.meetCompany}
                  confirm={RECOVERY.meetCompanyConfirm}
                  yes={RECOVERY.confirmYes}
                  no={RECOVERY.confirmNo}
                  onConfirm={() => dispatch({ type: "applyCompanyMeeting" })}
                />
              </>
            )}
          </div>
        )}
      </details>
      )}

      {/* 人事からの連絡は、上にあるとプレッシャーになるので下に */}
      <HrNoticeList messages={state.hrMessages} max={3} dispatch={dispatch} />

      {/* 相談は段階に関係なく、相談したいときに選ぶ（急性期・休息モードと同じ枠） */}
      <CoordinatorCard state={state} dispatch={dispatch} title={REST.talkTitle} note={REST.talkNote} showNewLink={false} />
    </div>
  );
}

function PathOption({ path, dispatch }: { path: PrepPath; dispatch: Dispatch<Action> }) {
  const opt = RECOVERY.pathOptions[path];
  return (
    <button
      className={`path-option${path === "self" ? "" : " path-option-sub"}`}
      onClick={() => dispatch({ type: "setPrepPath", path })}
    >
      <span className="path-name">{opt.name}</span>
      <span className="muted">{opt.note}</span>
    </button>
  );
}

// リワークを選んだら、会社が把握している課題をリワークのスタッフに共有してよいかをたずねる。
// 課題の中身は見せない（はじめは受け止めにくいことも多いため）。答えは会社に届き、あとから変えられる
function ShareConsentCard({ state, dispatch }: Props) {
  const c = state.shareConsent;
  return (
    <div className="consent-box">
      <p className="consent-title">{RECOVERY.consentTitle}</p>
      {c === null ? (
        <>
          <p>{RECOVERY.consentBody}</p>
          <div className="confirm-actions">
            <button className="btn-outline" onClick={() => dispatch({ type: "setShareConsent", consent: true })}>
              {RECOVERY.consentYes}
            </button>
            <button className="btn-outline" onClick={() => dispatch({ type: "setShareConsent", consent: false })}>
              {RECOVERY.consentNo}
            </button>
          </div>
          <p className="muted">{RECOVERY.consentNote}</p>
        </>
      ) : (
        <>
          <p className="done-note">{c ? RECOVERY.consentDoneYes : RECOVERY.consentDoneNo}</p>
          <button className="btn-quiet" onClick={() => dispatch({ type: "setShareConsent", consent: null })}>
            {RECOVERY.consentChange}
          </button>
        </>
      )}
    </div>
  );
}
