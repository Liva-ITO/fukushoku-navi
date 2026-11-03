import type { Dispatch } from "react";
import { ABOUT, COMPANY_NAME, WELCOME } from "../constants/labels";
import type { Action } from "../state/store";

// 使い始めの画面（見本）。本人は自分の個人アカウントで始める。会社のアカウントやパスワードは使わない
export default function Welcome({ dispatch }: { dispatch: Dispatch<Action> }) {
  return (
    <div className="home welcome">
      <p className="lead">{WELCOME.lead(COMPANY_NAME)}</p>
      <p>{WELCOME.about}</p>
      <AboutList />
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

// このアプリでできることと、会社に見えるもの・見えないもの（使い始めの画面と「できること」で共通）
export function AboutList() {
  return (
    <div className="about">
      <ul className="about-list">
        {ABOUT.items.map((i) => (
          <li key={i.name}>
            <span className="about-name">{i.name}</span>
            <span className="muted">{i.body}</span>
          </li>
        ))}
      </ul>
      <div className="about-seen">
        <p className="about-name">{ABOUT.seenTitle}</p>
        <p className="muted">{ABOUT.seen}</p>
        <p className="muted">{ABOUT.unseen}</p>
      </div>
    </div>
  );
}
