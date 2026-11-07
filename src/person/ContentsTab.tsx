import type { Dispatch } from "react";
import { CONTENTS_UI } from "../constants/labels";
import { CONTENTS, weeklyPicks, type Content } from "../data/contents";
import type { Action, State } from "../state/store";

type Props = { state: State; dispatch: Dispatch<Action> };

// コンテンツのタブ。いまの時期に合うものを先に、ほかは下に。押すと、その場で読む
export default function ContentsTab({ state, dispatch }: Props) {
  const open = CONTENTS.find((c) => c.id === state.contentOpen);
  if (open) {
    return (
      <div className="home">
        <button className="link-small" onClick={() => dispatch({ type: "openContent", id: null })}>
          ‹ {CONTENTS_UI.back}
        </button>
        <h1 className="page-title">{open.title}</h1>
        <p className="muted">{CONTENTS_UI.minutes(open.minutes)}</p>
        {open.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <p className="muted">{CONTENTS_UI.draft}</p>
      </div>
    );
  }
  const now = CONTENTS.filter((c) => c.stages.includes(state.stage));
  const other = CONTENTS.filter((c) => !c.stages.includes(state.stage));
  return (
    <div className="home">
      <h1 className="page-title">{CONTENTS_UI.title}</h1>
      <p className="muted">{CONTENTS_UI.note}</p>
      <section className="card">
        <h2>{CONTENTS_UI.nowTitle}</h2>
        <ContentList items={now} dispatch={dispatch} />
      </section>
      {other.length > 0 && (
        <section className="card card-quiet-box">
          <h2>{CONTENTS_UI.otherTitle}</h2>
          <ContentList items={other} dispatch={dispatch} />
        </section>
      )}
    </div>
  );
}

function ContentList({ items, dispatch }: { items: Content[]; dispatch: Dispatch<Action> }) {
  return (
    <ul className="content-list">
      {items.map((c) => (
        <li key={c.id}>
          <button className="content-row" onClick={() => dispatch({ type: "openContent", id: c.id })}>
            <span>
              {c.title}
              <span className="muted">（{CONTENTS_UI.minutes(c.minutes)}）</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

// 急性期ホームの「余裕があるときに、少しだけ」。週替わりで2本と、ほかのコンテンツへの入口
export function LittleCard({ state, dispatch }: Props) {
  return (
    <section className="card">
      <h2>{CONTENTS_UI.littleTitle}</h2>
      <p className="muted">{CONTENTS_UI.littleNote}</p>
      <ContentList items={weeklyPicks(state.stage)} dispatch={dispatch} />
      <button className="link-small" onClick={() => dispatch({ type: "openContent", id: null })}>
        {CONTENTS_UI.more} ›
      </button>
    </section>
  );
}
