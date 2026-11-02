import { useEffect, useReducer } from "react";
import { ACUTE, type PrepPath, type Stage, type Tab } from "../constants/labels";
import {
  DEMO_TODAY,
  INITIAL_DIARY,
  INITIAL_HR_MESSAGES,
  type DiaryEntry,
  type HrMessage,
  type SentItem,
} from "../data/demo";

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
  recoveryIntroSeen: boolean;
  recoveryJourneySeen: boolean;
  prepPath: PrepPath | null;
  companyMeetingApplied: boolean;
  ticketsLeft: boolean;
  coordinatorMeeting: "applied" | "requested" | null;
  diary: Record<string, DiaryEntry>;
  sentToHr: SentItem[];
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
  recoveryIntroSeen: false,
  recoveryJourneySeen: false,
  prepPath: null,
  companyMeetingApplied: false,
  ticketsLeft: true,
  coordinatorMeeting: null,
  diary: INITIAL_DIARY,
  sentToHr: [],
};

export type Action =
  | { type: "setView"; view: View }
  | { type: "setStage"; stage: Stage }
  | { type: "setRestMode"; on: boolean }
  | { type: "setTab"; tab: Tab }
  | { type: "closeIntro" }
  | { type: "toggleAcuteCheck"; index: number }
  | { type: "applyRivaMeeting" }
  | { type: "closeRecoveryIntro" }
  | { type: "markRecoveryJourneySeen" }
  | { type: "setPrepPath"; path: PrepPath | null }
  | { type: "applyCompanyMeeting" }
  | { type: "setTicketsLeft"; on: boolean }
  | { type: "askCoordinator" }
  | { type: "saveDiary"; entry: DiaryEntry }
  | { type: "sendToHr"; kind: SentItem["kind"]; body: string }
  | { type: "reset" };

const toggleAt = (list: boolean[], index: number) => list.map((v, i) => (i === index ? !v : v));

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
      return { ...state, restMode: action.on, tab: "home" };
    case "setTab":
      return { ...state, tab: action.tab };
    case "closeIntro":
      return { ...state, introSeen: true };
    case "toggleAcuteCheck":
      return { ...state, acuteChecks: toggleAt(state.acuteChecks, action.index) };
    case "applyRivaMeeting":
      return { ...state, rivaMeetingApplied: true };
    case "closeRecoveryIntro":
      return { ...state, recoveryIntroSeen: true };
    case "markRecoveryJourneySeen":
      return { ...state, recoveryJourneySeen: true };
    case "setPrepPath":
      return { ...state, prepPath: action.path };
    case "applyCompanyMeeting":
      return { ...state, companyMeetingApplied: true };
    case "setTicketsLeft":
      return { ...state, ticketsLeft: action.on, coordinatorMeeting: null };
    case "askCoordinator":
      return { ...state, coordinatorMeeting: state.ticketsLeft ? "applied" : "requested" };
    case "saveDiary":
      return { ...state, diary: { ...state.diary, [DEMO_TODAY]: action.entry } };
    case "sendToHr":
      return {
        ...state,
        sentToHr: [
          ...state.sentToHr,
          { id: `s${state.sentToHr.length + 1}`, date: DEMO_TODAY, kind: action.kind, body: action.body },
        ],
      };
    case "reset":
      return { ...initialState, introSeen: true };
  }
}

// 状態の形を変えたら番号を上げる（古い保存内容を読まないため）
const STORAGE_KEY = "fukushoku-navi-demo-v8";

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
