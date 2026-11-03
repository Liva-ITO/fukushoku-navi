import type { Dispatch } from "react";
import { REST, STAGE_LABELS } from "../constants/labels";
import type { Action, State } from "../state/store";
import { CoordinatorCard, DiaryEntryCard, ReadingsCard } from "./parts";

type Props = { state: State; dispatch: Dispatch<Action> };

// 休息モード：提案を引っ込めて、静かにする。段階の表示はそのまま。会社には伝わらない
export default function RestHome({ state, dispatch }: Props) {
  return (
    <div className="home home-rest">
      <p className="stage-chip">{STAGE_LABELS[state.stage]}</p>
      {REST.lines.map((l, i) => (
        <p key={l} className={i === 0 ? "lead" : "rest-note"}>
          {l}
        </p>
      ))}
      {/* 回復期の「今日はしんどい」と同じ場所に、出口を置く（入口と出口を対にする） */}
      <p className="rest-link">
        <button className="link-small" onClick={() => dispatch({ type: "setRestMode", on: false })}>
          {REST.back}
        </button>
      </p>

      <ReadingsCard />

      <DiaryEntryCard state={state} dispatch={dispatch} />

      <CoordinatorCard state={state} dispatch={dispatch} title={REST.hardTitle} note={REST.hardNote} publicWhenEmpty />

      <button className="btn-quiet btn-back" onClick={() => dispatch({ type: "setRestMode", on: false })}>
        {REST.back}
      </button>
    </div>
  );
}
