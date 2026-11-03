import { useState, type Dispatch } from "react";
import { RECOVERY, REST, STAGE_LABELS, greeting, type PrepPath } from "../constants/labels";
import { PERSON } from "../data/demo";
import type { Action, State } from "../state/store";
import { ConfirmButton, CoordinatorCard, DiaryEntryCard, HrNoticeList, NewNoticeLink } from "./parts";
import { SelfReportCard } from "./SelfReportCard";

type Props = { state: State; dispatch: Dispatch<Action> };

const REWORK_PATHS: PrepPath[] = ["rivatore", "rivabiz"];

// 回復期：生活のリズムを整える。ゴールは見せるが、急かさない
// 2026-11-10 → 11月10日
const japaneseDate = (d: string) => `${Number(d.slice(5, 7))}月${Number(d.slice(8, 10))}日`;

export default function RecoveryHome({ state, dispatch }: Props) {
  const path = state.prepPath;
  const nextItems =
    path === null ? RECOVERY.next.none : path === "self" ? RECOVERY.next.self : RECOVERY.next.rework;
  const noteKey = path === null ? "none" : path === "self" ? "self" : "rework";
  const allChecked = nextItems.every((i) => state.recoveryChecks.includes(i));
  // 準備の進め方は2段階：まず「リワークを使う／自分で準備する」の2つ。リワークを押したら、通う／オンラインを開く
  const [reworkOpen, setReworkOpen] = useState(false);

  return (
    <div className="home">
      <p className="greeting">{greeting(PERSON.name, new Date().getHours())}</p>
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

      <DiaryEntryCard state={state} dispatch={dispatch} />

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
          <p className="path-group">{RECOVERY.selfStepsTitle}</p>
          <ol className="self-steps">
            {RECOVERY.selfSteps.map((s) => (
              <li key={s.name}>
                <span className="self-step-name">{s.name}</span>
                <span className="muted">{s.body}</span>
              </li>
            ))}
          </ol>
          <p className="muted">{RECOVERY.selfStepsNote}</p>
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
          <SelfReportCard state={state} dispatch={dispatch} />
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
        {allChecked && RECOVERY.nextAllDone[noteKey] && <p className="next-note">{RECOVERY.nextAllDone[noteKey]}</p>}
        <p className="muted next-note">{RECOVERY.nextNote[noteKey]}</p>

        {/* 自分で準備する人は、ここから会社との面談を申し込む */}
        {path === "self" && (
          <div className="next-step">
            {state.companyMeeting ? (
              <p className="done-note">
                {state.companyMeeting.status === "done"
                  ? RECOVERY.meetCompanyDone
                  : state.companyMeeting.status === "scheduled" && state.companyMeeting.date
                    ? RECOVERY.meetCompanyScheduled(japaneseDate(state.companyMeeting.date))
                    : RECOVERY.meetCompanyApplied}
              </p>
            ) : (
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
