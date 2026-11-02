import { useEffect, useReducer } from "react";
import { ACUTE, type PrepPath, type Stage, type Tab } from "../constants/labels";
import {
  DEMO_TODAY,
  INITIAL_DIARY,
  INITIAL_HR_MESSAGES,
  INITIAL_STAGE_HISTORY,
  type DiaryEntry,
  type HrMessage,
  type SentItem,
  type StageChange,
} from "../data/demo";

// 状態はブラウザの中だけに置く（サーバーには送らない）
export type View = "person" | "hr";

export type State = {
  view: View;
  stage: Stage;
  stageHistory: StageChange[];
  restMode: boolean;
  tab: Tab;
  introSeen: boolean;
  hrMessages: HrMessage[];
  acuteChecks: boolean[];
  rivaMeetingApplied: boolean;
  // 急性期→回復期に必須の、心理の専門家との面談が済んだか（人事が記録する）
  psychMeetingDone: boolean;
  recoveryIntroSeen: boolean;
  recoveryJourneySeen: boolean;
  prepPath: PrepPath | null;
  companyMeetingApplied: boolean;
  // 面談チケットの残り（会社全体）。人事が管理し、本人には数を見せない
  ticketsLeft: number;
  coordinatorMeeting: "applied" | "requested" | null;
  diary: Record<string, DiaryEntry>;
  sentToHr: SentItem[];
  // 人事画面で開いている人（null なら一覧）
  hrSelected: string | null;
  // 人事が対応済みにしたこと（経緯にも残す）
  hrDone: { key: string; personId: string; text: string; date: string }[];
  // 人事が詳しい画面で見た件数（新着を消すため）と、開く前に見ていた件数（どれが新着だったかを示すため）
  hrSeen: Record<string, number>;
  hrNewFrom: Record<string, number>;
};

const DEMO_TICKETS = 3;
const REFILL_TICKETS = 5;

export const initialState: State = {
  view: "person",
  stage: "acute",
  stageHistory: INITIAL_STAGE_HISTORY,
  restMode: false,
  tab: "home",
  introSeen: false,
  hrMessages: INITIAL_HR_MESSAGES,
  acuteChecks: ACUTE.checkItems.map(() => false),
  rivaMeetingApplied: false,
  psychMeetingDone: false,
  recoveryIntroSeen: false,
  recoveryJourneySeen: false,
  prepPath: null,
  companyMeetingApplied: false,
  ticketsLeft: DEMO_TICKETS,
  coordinatorMeeting: null,
  diary: INITIAL_DIARY,
  sentToHr: [],
  hrSelected: null,
  hrDone: [],
  hrSeen: {},
  hrNewFrom: {},
};

export type Action =
  | { type: "setView"; view: View }
  | { type: "setStage"; stage: Stage }
  | { type: "setRestMode"; on: boolean }
  | { type: "setTab"; tab: Tab }
  | { type: "closeIntro" }
  | { type: "toggleAcuteCheck"; index: number }
  | { type: "applyRivaMeeting" }
  | { type: "markPsychDone" }
  | { type: "closeRecoveryIntro" }
  | { type: "markRecoveryJourneySeen" }
  | { type: "setPrepPath"; path: PrepPath | null }
  | { type: "applyCompanyMeeting" }
  | { type: "setTicketsLeft"; on: boolean }
  | { type: "refillTickets" }
  | { type: "askCoordinator" }
  | { type: "saveDiary"; entry: DiaryEntry }
  | { type: "sendToHr"; kind: SentItem["kind"]; body: string }
  | { type: "sendHrMessage"; body: string; noReplyNeeded: boolean }
  | { type: "hrSelect"; id: string | null; incoming?: number; prevSeen?: number }
  | { type: "hrMarkDone"; key: string; personId: string; text: string }
  | { type: "reset" };

const toggleAt = (list: boolean[], index: number) => list.map((v, i) => (i === index ? !v : v));

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setView":
      return { ...state, view: action.view };
    case "setStage": {
      if (action.stage === state.stage) return state;
      // 休息モードは回復期・準備期だけ
      const restAllowed = action.stage === "recovery" || action.stage === "preReturn";
      return {
        ...state,
        stage: action.stage,
        stageHistory: [...state.stageHistory, { date: DEMO_TODAY, stage: action.stage }],
        restMode: restAllowed && state.restMode,
        tab: "home",
        // 急性期に戻したら、回復期に進むための面談はもう一度
        ...(action.stage === "acute" ? { rivaMeetingApplied: false, psychMeetingDone: false } : {}),
      };
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
    case "markPsychDone":
      return { ...state, psychMeetingDone: true };
    case "closeRecoveryIntro":
      return { ...state, recoveryIntroSeen: true };
    case "markRecoveryJourneySeen":
      return { ...state, recoveryJourneySeen: true };
    case "setPrepPath":
      return { ...state, prepPath: action.path };
    case "applyCompanyMeeting":
      return { ...state, companyMeetingApplied: true };
    case "setTicketsLeft":
      return {
        ...state,
        ticketsLeft: action.on ? Math.max(state.ticketsLeft, DEMO_TICKETS) : 0,
        coordinatorMeeting: null,
      };
    case "refillTickets":
      return { ...state, ticketsLeft: state.ticketsLeft + REFILL_TICKETS };
    case "askCoordinator":
      return state.ticketsLeft > 0
        ? { ...state, coordinatorMeeting: "applied", ticketsLeft: state.ticketsLeft - 1 }
        : { ...state, coordinatorMeeting: "requested" };
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
    case "sendHrMessage":
      return {
        ...state,
        hrMessages: [
          ...state.hrMessages,
          {
            id: `m${state.hrMessages.length + 1}`,
            date: DEMO_TODAY,
            body: action.body,
            noReplyNeeded: action.noReplyNeeded,
          },
        ],
      };
    case "hrSelect":
      if (action.id === null) return { ...state, hrSelected: null };
      return {
        ...state,
        hrSelected: action.id,
        hrSeen: { ...state.hrSeen, [action.id]: action.incoming ?? 0 },
        hrNewFrom: { ...state.hrNewFrom, [action.id]: action.prevSeen ?? 0 },
      };
    case "hrMarkDone":
      return {
        ...state,
        hrDone: [...state.hrDone, { key: action.key, personId: action.personId, text: action.text, date: DEMO_TODAY }],
      };
    case "reset":
      return { ...initialState, introSeen: true, view: state.view };
  }
}

// 状態の形を変えたら番号を上げる（古い保存内容を読まないため）
const STORAGE_KEY = "fukushoku-navi-demo-v12";

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
