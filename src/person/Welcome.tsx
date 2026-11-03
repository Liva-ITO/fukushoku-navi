import type { Dispatch } from "react";
import { COMPANY_NAME, WELCOME } from "../constants/labels";
import type { Action } from "../state/store";

// 使い始めの画面（見本）。本人は自分の個人アカウントで始める。会社のアカウントやパスワードは使わない
export default function Welcome({ dispatch }: { dispatch: Dispatch<Action> }) {
  return (
    <div className="home welcome">
      <p className="lead">{WELCOME.lead(COMPANY_NAME)}</p>
      <p>{WELCOME.about}</p>
      <p className="muted">{WELCOME.account}</p>
      <p className="muted">{WELCOME.records}</p>
      <div className="stack">
        {WELCOME.providers.map((p) => (
          <button key={p} className="btn-outline btn-wide" onClick={() => dispatch({ type: "startPerson" })}>
            {p}
          </button>
        ))}
      </div>
      <p className="muted welcome-demo">{WELCOME.demoNote}</p>
    </div>
  );
}
