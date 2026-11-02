import { useEffect, useState, type Dispatch } from "react";
import { APP_NAME, COMMON, JOURNEY, TABS, type Tab } from "../constants/labels";
import JourneySheet from "./JourneySheet";
import type { Action, State } from "../state/store";
import AcuteHome from "./AcuteHome";
import RecoveryHome from "./RecoveryHome";
import RestHome from "./RestHome";
import DiaryTab from "./DiaryTab";
import ContactTab from "./ContactTab";

type Props = { state: State; dispatch: Dispatch<Action> };

const TAB_ORDER: Tab[] = ["home", "record", "contact", "contents", "consult"];

function Home({ state, dispatch }: Props) {
  if (state.restMode) return <RestHome state={state} dispatch={dispatch} />;
  if (state.stage === "acute") return <AcuteHome state={state} dispatch={dispatch} />;
  if (state.stage === "recovery") return <RecoveryHome state={state} dispatch={dispatch} />;
  return <p className="placeholder">{COMMON.comingSoon}</p>;
}

export default function PersonApp({ state, dispatch }: Props) {
  const [journeyOpen, setJourneyOpen] = useState(false);

  // 回復期に入ったときに一度だけ、復職までの流れを見せる（急性期の人には自動では出さない）
  useEffect(() => {
    if (state.stage === "recovery" && !state.recoveryJourneySeen) {
      setJourneyOpen(true);
      dispatch({ type: "markRecoveryJourneySeen" });
    }
  }, [state.stage, state.recoveryJourneySeen, dispatch]);

  return (
    <div className={state.restMode ? "phone phone-rest" : "phone"}>
      <header className="phone-header">
        <span className="app-name">{APP_NAME}</span>
        <button className="link-small" onClick={() => setJourneyOpen(true)}>
          {JOURNEY.open}
        </button>
      </header>
      {journeyOpen && <JourneySheet stage={state.stage} onClose={() => setJourneyOpen(false)} />}

      <div className="phone-body">
        {state.tab === "home" && <Home state={state} dispatch={dispatch} />}
        {state.tab === "record" && <DiaryTab state={state} dispatch={dispatch} />}
        {state.tab === "contact" && <ContactTab state={state} dispatch={dispatch} />}
        {(state.tab === "contents" || state.tab === "consult") && <p className="placeholder">{COMMON.comingSoon}</p>}
      </div>

      <nav className="tab-bar">
        {TAB_ORDER.map((t) => (
          <button
            key={t}
            aria-current={state.tab === t ? "page" : undefined}
            onClick={() => dispatch({ type: "setTab", tab: t })}
          >
            {TABS[t]}
          </button>
        ))}
      </nav>
    </div>
  );
}
