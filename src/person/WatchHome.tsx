import type { Dispatch } from "react";
import { COMMON, WATCH, greeting } from "../constants/labels";
import type { Action, State } from "../state/store";
import { CoordinatorCard, NewNoticeLink } from "./parts";
import { MedCard, MedTop } from "./Meds";
import { TorisetsuCard } from "./Torisetsu";

type Props = { state: State; dispatch: Dispatch<Action> };

const japaneseDate = (d: string) => `${Number(d.slice(5, 7))}月${Number(d.slice(8, 10))}日`;

// 見守りモード（たたき台。スタッフがブラッシュアップする）：復職したあと。会社からは見えない。
// 毎日使うものではなく、崩れかけたときに思い出せるもの。自分の取説と、相談だけを置く
export default function WatchHome({ state, dispatch }: Props) {
  return (
    <div className="home">
      <p className="greeting">{greeting(state.live?.name ?? "", new Date().getHours())}</p>
      {state.returnPlan && <p className="done-note">{COMMON.returnDay(japaneseDate(state.returnPlan.date))}</p>}
      {/* 回復期と同じく、閉じたら次からは出さない */}
      {!state.watchIntroSeen && (
        <section className="card card-intro">
          {WATCH.lines.map((l) => (
            <p key={l}>{l}</p>
          ))}
          <button className="btn-quiet" onClick={() => dispatch({ type: "closeWatchIntro" })}>
            {WATCH.introClose}
          </button>
        </section>
      )}

      <NewNoticeLink state={state} dispatch={dispatch} />
      <MedTop state={state} dispatch={dispatch} />

      <MedCard state={state} dispatch={dispatch} />

      <TorisetsuCard state={state} dispatch={dispatch} readOnly />

      <CoordinatorCard state={state} dispatch={dispatch} title={WATCH.talkTitle} note={WATCH.talkNote} showNewLink={false} publicWhenEmpty />
    </div>
  );
}
