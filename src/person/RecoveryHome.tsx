import type { Dispatch } from "react";
import { RECOVERY, STAGE_LABELS, greeting, type PrepPath } from "../constants/labels";
import { PERSON } from "../data/demo";
import type { Action, State } from "../state/store";
import { ConfirmButton, HrNoticeFold } from "./parts";

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
          <div className="next-step">
            <p className="muted">{RECOVERY.selfConsult}</p>
            <button className="btn-outline" onClick={() => dispatch({ type: "setTab", tab: "consult" })}>
              {RECOVERY.selfConsultButton}
            </button>
          </div>
        </section>
      )}

      <section className="card">
        <h2>{RECOVERY.nextTitle}</h2>
        <ul className="list-dot">
          {nextItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="muted next-note">{RECOVERY.nextNote[noteKey]}</p>

        {/* 自分のペースで準備する人だけ、ここから会社との面談を申し込む。リワークはプログラムの中で確かめる */}
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
