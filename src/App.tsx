import { DEMO_BAR } from "./constants/labels";
import { useDemoStore } from "./state/store";
import DemoBar from "./components/DemoBar";
import PersonApp from "./person/PersonApp";
import HrApp from "./hr/HrApp";

export default function App() {
  const [state, dispatch] = useDemoStore();

  return (
    <div className="app">
      <DemoBar state={state} dispatch={dispatch} />
      <main className={state.view === "person" ? "stage-person" : "stage-hr"}>
        {state.view === "person" ? (
          <PersonApp state={state} dispatch={dispatch} />
        ) : (
          <HrApp state={state} />
        )}
      </main>

      {!state.introSeen && (
        <div className="intro-backdrop" role="dialog" aria-modal="true">
          <div className="intro">
            <p>{DEMO_BAR.intro}</p>
            <p className="intro-note">{DEMO_BAR.notAi}</p>
            <button className="btn-primary" onClick={() => dispatch({ type: "closeIntro" })}>
              {DEMO_BAR.introClose}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
