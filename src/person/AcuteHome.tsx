import { useEffect, useState, type Dispatch } from "react";
import { ACUTE, REST, greeting } from "../constants/labels";
import { DEMO_TODAY } from "../data/demo";
import type { Action, State } from "../state/store";
import { ConfirmButton, CoordinatorCard, DiaryEntryCard, HrNoticeList, ReadingsCard, WishCard } from "./parts";

type Props = { state: State; dispatch: Dispatch<Action> };

// 急性期：やることを求めない、静かなホーム。赤いバッジや数字は出さない
export default function AcuteHome({ state, dispatch }: Props) {
  // はじめて開いたときだけ3文。開いた時点で「見た」にして、次からは1文にする
  const [first] = useState(!state.acuteIntroSeen);
  useEffect(() => {
    dispatch({ type: "markAcuteIntroSeen" });
  }, [dispatch]);
  // 次の段階への道すじの、いまの位置（コーディネーターと話す → 希望を伝える → 回復期へ）
  const stepNow = !state.psychMeetingDone ? 0 : 1;
  // 急性期は、面談は1つずつ。心理の専門家との面談（チケット）が済むまでは、回復期に進む前のコーディネーターとの面談を申し込めない
  const coordBusy = state.coordinatorMeeting !== null && state.coordinatorReport === null;

  return (
    <div className="home home-acute">
      <p className="greeting">{greeting(state.live?.name ?? "", new Date().getHours())}</p>
      <p className="lead">{first ? ACUTE.messageFirst : ACUTE.message}</p>

      <WakeSleep state={state} dispatch={dispatch} />

      <DiaryEntryCard state={state} dispatch={dispatch} />

      {state.psychMeetingDone && <WishCard state={state} dispatch={dispatch} />}

      {/* 大きく体調を崩している時期なので、休息モードと同じく、チケットがなければ公的な窓口を出す */}
      <CoordinatorCard state={state} dispatch={dispatch} title={REST.hardTitle} note={REST.hardNote} publicWhenEmpty />

      <ReadingsCard />

      {/* 人事からの連絡は、上にあるとプレッシャーになるので下に。急性期は新しい1件だけ（仕様どおり） */}
      <HrNoticeList messages={state.hrMessages} max={1} dispatch={dispatch} />

      <details className="card card-quiet">
        <summary>{ACUTE.checkTitle}</summary>
        <p className="muted">{ACUTE.checkNote}</p>
        <ol className="next-steps">
          {ACUTE.checkSteps.map((s, i) => (
            <li key={s} className={i === stepNow ? "step-now" : i < stepNow ? "step-done" : undefined}>
              {s}
              {i === stepNow && <span className="tag-soft">{ACUTE.checkHere}</span>}
              {i === 0 && stepNow === 0 && state.psychSchedule?.chosen && (
                <span className="step-sub">{ACUTE.checkStepDate(state.psychSchedule.chosen)}</span>
              )}
              {i === 1 && stepNow === 1 && (
                <span className="step-sub">{state.nextWish ? ACUTE.checkStepSent : ACUTE.checkStepWish}</span>
              )}
            </li>
          ))}
        </ol>
        <p className="muted">{ACUTE.checkOutlook}</p>
        {!state.psychMeetingDone && (
          <div className="next-step">
            <p>{ACUTE.checkMeetNote}</p>
            {state.rivaMeetingApplied ? (
              <p className="done-note">{ACUTE.checkApplied}</p>
            ) : coordBusy ? (
              <p className="muted">{ACUTE.busyCoord}</p>
            ) : (
              <ConfirmButton
                quiet
                modal
                label={ACUTE.checkButton}
                confirm={ACUTE.checkConfirm}
                yes={ACUTE.checkConfirmYes}
                no={ACUTE.checkConfirmNo}
                onConfirm={() => dispatch({ type: "applyRivaMeeting" })}
              />
            )}
          </div>
        )}
      </details>
    </div>
  );
}

// 「起きた」「寝る」の2タップ。押した時刻が日記に入る。取り消しもできる
function WakeSleep({ state, dispatch }: Props) {
  const taps = state.taps?.date === DEMO_TODAY ? state.taps : { wake: null, sleep: null };
  const now = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };
  const kinds = [
    { what: "wake" as const, label: ACUTE.wake, time: taps.wake },
    { what: "sleep" as const, label: ACUTE.sleep, time: taps.sleep },
  ];
  return (
    <div className="tap-row">
      <div className="tap-buttons">
        {kinds.map((k) => (
          <button
            key={k.what}
            className="tap-btn"
            aria-pressed={k.time !== null}
            onClick={() => dispatch({ type: "tap", what: k.what, time: now() })}
          >
            {k.label}
          </button>
        ))}
      </div>
      {kinds
        .filter((k) => k.time !== null)
        .map((k) => (
          <p key={k.what} className="tap-saved">
            <span>{ACUTE.tapSaved(k.label, k.time!)}</span>
            <button className="link-small link-muted" onClick={() => dispatch({ type: "tap", what: k.what, time: null })}>
              {ACUTE.tapUndo}
            </button>
          </p>
        ))}
    </div>
  );
}
