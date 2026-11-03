import { useEffect, useState, type Dispatch } from "react";
import { APP_NAME, COMMON, JOURNEY, TABS, type Tab } from "../constants/labels";
import JourneySheet from "./JourneySheet";
import type { Action, State } from "../state/store";
import AcuteHome from "./AcuteHome";
import RecoveryHome from "./RecoveryHome";
import RestHome from "./RestHome";
import DiaryTab from "./DiaryTab";
import ContactTab from "./ContactTab";
import ConsultTab from "./ConsultTab";
import Welcome from "./Welcome";

type Props = { state: State; dispatch: Dispatch<Action> };

const REPLY_DELAY = 3000;

const TAB_ORDER: Tab[] = ["home", "record", "contact", "contents", "consult"];

// 2026-11-10 → 11月10日
const japaneseDate = (d: string) => `${Number(d.slice(5, 7))}月${Number(d.slice(8, 10))}日`;

function Home({ state, dispatch }: Props) {
  if (state.restMode) return <RestHome state={state} dispatch={dispatch} />;
  if (state.stage === "acute") return <AcuteHome state={state} dispatch={dispatch} />;
  if (state.stage === "recovery") return <RecoveryHome state={state} dispatch={dispatch} />;
  // 復職後は、人事が確定した復職日だけ先に出す（見守りモードの画面はこれから）
  if (state.stage === "afterReturn" && state.returnPlan)
    return (
      <>
        <section className="card">
          <p className="done-note">{COMMON.returnDay(japaneseDate(state.returnPlan.date))}</p>
        </section>
        <p className="placeholder">{COMMON.comingSoon}</p>
      </>
    );
  return <p className="placeholder">{COMMON.comingSoon}</p>;
}

export default function PersonApp({ state, dispatch }: Props) {
  const [journeyOpen, setJourneyOpen] = useState(false);
  const unread = state.coordInbox.length - state.coordSeen;

  // 回復期に入ったときに一度だけ、復職までの流れを見せる（急性期の人には自動では出さない）
  useEffect(() => {
    if (state.stage === "recovery" && !state.recoveryJourneySeen) {
      setJourneyOpen(true);
      dispatch({ type: "markRecoveryJourneySeen" });
    }
  }, [state.stage, state.recoveryJourneySeen, dispatch]);

  // デモ：申し込んだら、数秒後に支援機関から日程の候補が届く（本番では支援機関が送る）
  // 「どれも難しい」を選んだときも、数秒後に別の候補が届く
  // リクエストの最初の候補は、人事がチケットを補充するかどうかで変わるので、人事の操作から届く
  const cs = state.coordSchedule;
  const coordWaiting =
    state.coordinatorReport === null &&
    ((state.coordinatorMeeting === "applied" && cs === null) ||
      (state.coordinatorMeeting !== null && cs !== null && !cs.offerId && !cs.chosen));
  const ps = state.psychSchedule;
  const psychWaiting = state.rivaMeetingApplied && !state.psychMeetingDone && (ps === null || (!ps.offerId && !ps.chosen));
  useEffect(() => {
    if (!coordWaiting) return;
    const t = setTimeout(() => dispatch({ type: "offerSlots", kind: "coordinator" }), REPLY_DELAY);
    return () => clearTimeout(t);
  }, [coordWaiting, dispatch]);
  useEffect(() => {
    if (!psychWaiting) return;
    const t = setTimeout(() => dispatch({ type: "offerSlots", kind: "psych" }), REPLY_DELAY);
    return () => clearTimeout(t);
  }, [psychWaiting, dispatch]);

  return (
    <div className={state.restMode ? "phone phone-rest" : "phone"}>
      <header className="phone-header">
        <span className="app-name">{APP_NAME}</span>
        <button className="link-small" onClick={() => setJourneyOpen(true)}>
          {JOURNEY.open}
        </button>
      </header>
      {journeyOpen && <JourneySheet stage={state.stage} onClose={() => setJourneyOpen(false)} />}

      {!state.personStarted ? (
        <div className="phone-body">
          <Welcome dispatch={dispatch} />
        </div>
      ) : (
      <>
      <div className="phone-body">
        {state.tab === "home" && <Home state={state} dispatch={dispatch} />}
        {state.tab === "record" && <DiaryTab state={state} dispatch={dispatch} />}
        {state.tab === "contact" && <ContactTab state={state} dispatch={dispatch} />}
        {state.tab === "consult" && <ConsultTab state={state} dispatch={dispatch} />}
        {state.tab === "contents" && <p className="placeholder">{COMMON.comingSoon}</p>}
      </div>

      <nav className="tab-bar">
        {TAB_ORDER.map((t) => (
          <button
            key={t}
            aria-current={state.tab === t ? "page" : undefined}
            onClick={() => dispatch({ type: "setTab", tab: t })}
          >
            {TABS[t]}
            {/* 支援機関からの新しいお知らせを見逃さないよう、数を出す（赤ではなく落ち着いた色） */}
            {t === "consult" && unread > 0 && <span className="tab-badge">{unread}</span>}
          </button>
        ))}
      </nav>
      </>
      )}
    </div>
  );
}
