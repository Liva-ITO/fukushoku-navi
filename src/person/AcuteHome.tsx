import { useEffect, useState, type Dispatch } from "react";
import { ACUTE, ACUTE_MORE, REST, greeting } from "../constants/labels";
import { DEMO_TODAY } from "../data/demo";
import { slotDate, type Action, type State } from "../state/store";
import { LittleCard } from "./ContentsTab";
import { MedCard, MedTop } from "./Meds";
import { ConfirmButton, CoordinatorCard, DiaryEntryCard, HrNoticeList, WishCard } from "./parts";

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
  const meet = upcomingMeeting(state);
  const [dayDemo, setDayDemo] = useState(false);
  const isToday = meet !== null && (dayDemo || slotDate(meet.slot) === DEMO_TODAY);

  return (
    <div className="home home-acute">
      <p className="greeting">{greeting(state.live?.name ?? "", new Date().getHours())}</p>
      {meet && isToday && <MeetToday meet={meet} />}
      <MedTop state={state} dispatch={dispatch} />
      <p className="lead">{first ? ACUTE.messageFirst : ACUTE.message}</p>

      <WakeSleep state={state} dispatch={dispatch} />

      {/* 急性期でいちばん大事なのは、治療を切らないこと（服薬と通院）。薬のことは本人の端末だけ */}
      <MedCard state={state} dispatch={dispatch} />

      <DiaryEntryCard state={state} dispatch={dispatch} />

      {meet && <MeetBox meet={meet} dayDemo={dayDemo} onDemo={() => setDayDemo(!dayDemo)} />}

      {state.psychMeetingDone && <WishCard state={state} dispatch={dispatch} />}

      {/* 大きく体調を崩している時期なので、休息モードと同じく、チケットがなければ公的な窓口を出す */}
      <CoordinatorCard state={state} dispatch={dispatch} title={REST.hardTitle} note={ACUTE_MORE.hardPsychNote} alwaysPublic showNewLink={false} />

      {/* 何かをするより、見るだけのほうが負担が少ない。週替わりで2本だけ */}
      <LittleCard state={state} dispatch={dispatch} />

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

// 日程が決まった面談（急性期は、回復期に進む前のコーディネーターとの面談と、心理の専門家との面談）
type Meet = { slot: string; who: string; what: string };
function upcomingMeeting(state: State): Meet | null {
  const ps = state.psychSchedule;
  if (ps?.chosen && !state.psychMeetingDone) return { slot: ps.chosen, who: ACUTE_MORE.meetCoord, what: ACUTE_MORE.meetCoordWhat };
  const cs = state.coordSchedule;
  const r = state.coordinatorReport;
  if (cs?.chosen && state.coordinatorMeeting !== null && r !== "done" && r !== "declined")
    return { slot: cs.chosen, who: ACUTE_MORE.meetPsych, what: ACUTE_MORE.meetPsychWhat };
  return null;
}

function MeetBox({ meet, dayDemo, onDemo }: { meet: Meet; dayDemo: boolean; onDemo: () => void }) {
  return (
    <section className="card">
      <h2>{ACUTE_MORE.meetTitle}</h2>
      <dl className="meet-rows">
        <dt>{ACUTE_MORE.meetWhen}</dt>
        <dd>{meet.slot}</dd>
        <dt>{ACUTE_MORE.meetWhere}</dt>
        <dd>{ACUTE_MORE.online}</dd>
        <dt>{ACUTE_MORE.meetWho}</dt>
        <dd>{meet.who}</dd>
        <dt>{ACUTE_MORE.meetWhat}</dt>
        <dd>{meet.what}</dd>
      </dl>
      <p className="muted">{ACUTE_MORE.meetPrivate}</p>
      <button className="link-small link-muted" onClick={onDemo}>
        {dayDemo ? ACUTE_MORE.demoTodayOff : ACUTE_MORE.demoToday}
      </button>
    </section>
  );
}

// 面談の当日だけ、あいさつのすぐ下に短く出す
function MeetToday({ meet }: { meet: Meet }) {
  const [open, setOpen] = useState(false);
  const time = meet.slot.match(/\d{1,2}:\d{2}/)?.[0] ?? "";
  return (
    <div className="meet-today">
      <p>{ACUTE_MORE.todayTitle(time, meet.who)}</p>
      {open ? (
        <p className="muted">{ACUTE_MORE.howJoinText}</p>
      ) : (
        <button className="link-small" onClick={() => setOpen(true)}>
          {ACUTE_MORE.howJoin} ›
        </button>
      )}
    </div>
  );
}
