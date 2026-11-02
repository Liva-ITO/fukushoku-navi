import { useEffect, useReducer } from "react";
import { ACUTE, type Stage, type Tab } from "../constants/labels";
import { INITIAL_HR_MESSAGES, type HrMessage } from "../data/demo";

// 状態はブラウザの中だけに置く（サーバーには送らない）
export type View = "person" | "hr";

export type State = {
  view: View;
  stage: Stage;
  restMode: boolean;
  tab: Tab;
  introSeen: boolean;
  hrMessages: HrMessage[];
  acuteChecks: boolean[];
  rivaMeetingApplied: boolean;
};

export const initialState: State = {
  view: "person",
  stage: "acute",
  restMode: false,
  tab: "home",
  introSeen: false,
  hrMessages: INITIAL_HR_MESSAGES,
  acuteChecks: ACUTE.checkItems.map(() => false),
  rivaMeetingApplied: false,
};

export type Action =
  | { type: "setView"; view: View }
  | { type: "setStage"; stage: Stage }
  | { type: "setRestMode"; on: boolean }
  | { type: "setTab"; tab: Tab }
  | { type: "closeIntro" }
  | { type: "toggleAcuteCheck"; index: number }
  | { type: "applyRivaMeeting" }
  | { type: "reset" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setView":
      return { ...state, view: action.view };
    case "setStage": {
      // 休息モードは回復期・準備期だけ
      const restAllowed = action.stage === "recovery" || action.stage === "preReturn";
      return { ...state, stage: action.stage, restMode: restAllowed && state.restMode, tab: "home" };
    }
    case "setRestMode":
      return { ...state, restMode: action.on };
    case "setTab":
      return { ...state, tab: action.tab };
    case "closeIntro":
      return { ...state, introSeen: true };
    case "toggleAcuteCheck":
      return {
        ...state,
        acuteChecks: state.acuteChecks.map((v, i) => (i === action.index ? !v : v)),
      };
    case "applyRivaMeeting":
      return { ...state, rivaMeetingApplied: true };
    case "reset":
      return { ...initialState, introSeen: true };
  }
}

// 状態の形を変えたら番号を上げる（古い保存内容を読まないため）
const STORAGE_KEY = "fukushoku-navi-demo-v2";

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...initialState, ...JSON.parse(raw) };
  } catch {
    // 保存できない環境でも、最初の状態で動かす
  }
  return initialState;
}

export function useDemoStore() {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // 保存できなくても動作は続ける
    }
  }, [state]);
  return [state, dispatch] as const;
}
