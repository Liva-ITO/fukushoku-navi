import { useEffect, useState, type Dispatch } from "react";
import { ABOUT, APP_NAME, CELEBRATE, COMMON, CONSULT, JOURNEY, TABS, type Tab, WELCOME } from "../constants/labels";
import JourneySheet from "./JourneySheet";
import { MedSheet } from "./Meds";
import type { Action, State } from "../state/store";
import AcuteHome from "./AcuteHome";
import RecoveryHome from "./RecoveryHome";
import PreReturnHome from "./PreReturnHome";
import WatchHome from "./WatchHome";
import RestHome from "./RestHome";
import DiaryTab from "./DiaryTab";
import ContactTab from "./ContactTab";
import ConsultTab from "./ConsultTab";
import Welcome, { AboutList } from "./Welcome";

type Props = { state: State; dispatch: Dispatch<Action> };

const REPLY_DELAY = 3000;

const TAB_ORDER: Tab[] = ["home", "record", "contact", "contents", "consult"];
const AFTER_TABS: Tab[] = ["home", "contact", "consult"];

// 2026-11-10 → 11月10日

function Home({ state, dispatch }: Props) {
  if (state.restMode) return <RestHome state={state} dispatch={dispatch} />;
  if (state.stage === "acute") return <AcuteHome state={state} dispatch={dispatch} />;
  if (state.stage === "recovery") return <RecoveryHome state={state} dispatch={dispatch} />;
  if (state.stage === "preReturn") return <PreReturnHome state={state} dispatch={dispatch} />;
  return <WatchHome state={state} dispatch={dispatch} />;
}

export default function PersonApp({ state, dispatch }: Props) {
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  // タブ・段階・休息モードが変わったら、いちばん上から見せる
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [state.tab, state.stage, state.restMode, state.personStarted]);
  const unread = state.coordInbox.length - state.coordSeen + (state.hrMessages.length - state.personHrSeen);

  // 回復期・準備期に入ったときに一度だけ、ようこその画面を閉じたあとに、復職までの流れを見せる
  // （ようこそ → 流れのグラフ → その段階のホーム。急性期の人には自動では出さない）
  useEffect(() => {
    if (state.celebrate) return;
    const stage = state.stage;
    if ((stage === "recovery" && !state.recoveryJourneySeen) || (stage === "preReturn" && !state.preReturnJourneySeen)) {
      setJourneyOpen(true);
      dispatch({ type: "markJourneySeen", stage });
    }
  }, [state.stage, state.celebrate, state.recoveryJourneySeen, state.preReturnJourneySeen, dispatch]);

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
        <span className="header-links">
          <button className="link-small" onClick={() => setAboutOpen(true)}>
            {ABOUT.open}
          </button>
          <button className="link-small" onClick={() => setJourneyOpen(true)}>
            {JOURNEY.open}
          </button>
        </span>
      </header>
      {state.stage === "acute" && <MedSheet state={state} dispatch={dispatch} />}
      {journeyOpen && <JourneySheet stage={state.stage} onClose={() => setJourneyOpen(false)} />}
      {aboutOpen && (
        <div className="sheet" role="dialog" aria-modal="true" aria-label={ABOUT.title}>
          <div className="sheet-body">
            <h1 className="page-title">{ABOUT.title}</h1>
            <AboutList />
            <button className="btn-outline btn-wide" onClick={() => setAboutOpen(false)}>
              {ABOUT.close}
            </button>
          </div>
        </div>
      )}

      {!state.live ? (
        <div className="phone-body">
          <div className="home welcome">
            <p className="lead">{WELCOME.notYetTitle}</p>
            <p>{WELCOME.notYetBody}</p>
            <p className="muted welcome-demo">{WELCOME.notYetDemo}</p>
          </div>
        </div>
      ) : !state.personStarted ? (
        <div className="phone-body">
          <Welcome name={state.live.name} dispatch={dispatch} />
        </div>
      ) : state.celebrate ? (
        <div className="phone-body">
          <Celebrate stage={state.celebrate} onClose={() => dispatch({ type: "closeCelebrate" })} />
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
        {/* 復職後（見守りモード）は、日記とコンテンツを出さない。会社との連絡も終わる */}
        {(state.stage === "afterReturn" ? AFTER_TABS : TAB_ORDER).map((t) => (
          <button
            key={t}
            aria-current={state.tab === t ? "page" : undefined}
            onClick={() => dispatch({ type: "setTab", tab: t })}
          >
            {TABS[t]}
            {/* 支援機関からの新しいお知らせを見逃さないよう、数を出す（赤ではなく落ち着いた色） */}
            {t === "contact" && unread > 0 && (state.stage === "acute" ? <span className="tab-dot" aria-label={CONSULT.newLinkQuiet} /> : <span className="tab-badge">{unread}</span>)}
          </button>
        ))}
      </nav>
      </>
      )}
    </div>
  );
}

// 段階が進んだときのお祝い。閉じると、その段階のホームになる
function Celebrate({ stage, onClose }: { stage: keyof typeof CELEBRATE; onClose: () => void }) {
  const c = CELEBRATE[stage];
  return (
    <div className={`celebrate celebrate-${stage}`} role="dialog" aria-modal="true" aria-labelledby="celebrate-title">
      <p className="celebrate-mark" aria-hidden="true">
        {c.mark}
      </p>
      <h1 id="celebrate-title" className="celebrate-title">
        {c.title}
      </h1>
      {c.lines.map((l) => (
        <p key={l}>{l}</p>
      ))}
      <button className="btn-primary btn-wide" onClick={onClose}>
        {c.close}
      </button>
    </div>
  );
}
