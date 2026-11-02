import type { Dispatch } from "react";
import { APP_NAME, COMMON, TABS, type Tab } from "../constants/labels";
import type { Action, State } from "../state/store";
import AcuteHome from "./AcuteHome";

type Props = { state: State; dispatch: Dispatch<Action> };

const TAB_ORDER: Tab[] = ["home", "record", "contact", "contents", "consult"];

export default function PersonApp({ state, dispatch }: Props) {
  return (
    <div className="phone">
      <header className="phone-header">
        <span className="app-name">{APP_NAME}</span>
      </header>

      <div className="phone-body">
        {state.tab === "home" && state.stage === "acute" && <AcuteHome state={state} dispatch={dispatch} />}
        {(state.tab !== "home" || state.stage !== "acute") && <p className="placeholder">{COMMON.comingSoon}</p>}
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
