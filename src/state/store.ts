import { useEffect, useReducer } from "react";
import type { SelfReport } from "./selfReport";
import { ACUTE, CONSULT, type PrepPath, type Stage, type Tab } from "../constants/labels";
import {
  DEMO_TODAY,
  INITIAL_DIARY,
  INITIAL_HR_MESSAGES,
  INITIAL_STAGE_HISTORY,
  PERSON,
  SAMPLE_SELF_REPORT,
  type DiaryEntry,
  type HrMessage,
  type SentItem,
  type StageChange,
} from "../data/demo";

// 状態はブラウザの中だけに置く（サーバーには送らない）
export type View = "person" | "hr";
export type Invited = {
  id: string;
  name: string;
  dept: string;
  age: string;
  job: string;
  leaveStart: string;
  leaveEnd: string;
  issues: string; // 復職に向けた課題（会社の見立て）
  date: string;
};
// 支援機関から本人に届くお知らせ（相談タブ）。会社には見えない
export type CoordMessage = {
  id: string;
  date: string;
  from: "coordinator" | "psych";
  who: Who; // 本人に見せる相手の名前（復職コーディネーター／心理の専門家）
  body: string;
  options?: string[]; // 日程の候補（本人が選ぶ）
};
// 面談の日程：支援機関が候補を送り、本人が選ぶ。offerId は、いま選べる候補のお知らせ
export type Schedule = { offerId: string | null; chosen: string | null; round: number };
export type MeetingKind = CoordMessage["from"];
// 相談の相手。急性期と休息モード（しんどいとき）は心理の専門家、それ以外は復職コーディネーター
export type Who = "coord" | "psych";
export const whoNow = (s: { stage: Stage; restMode: boolean }): Who => (s.stage === "acute" || s.restMode ? "psych" : "coord");

export type ReturnOrder = "occFirst" | "doctorFirst";

export type State = {
  view: View;
  stage: Stage;
  stageHistory: StageChange[];
  restMode: boolean;
  tab: Tab;
  introSeen: boolean;
  hrMessages: HrMessage[];
  contactOpen: string | null; // 連絡タブで開いている人事からの連絡
  // 社員A以外への連絡（デモでは人事の経緯に残るだけ）
  hrMessagesOthers: Record<string, HrMessage[]>;
  acuteChecks: boolean[];
  recoveryChecks: string[]; // 回復期の目安で、本人がチェックした項目
  rivaMeetingApplied: boolean;
  // 急性期→回復期に必須の、復職コーディネーターとの面談（回復期に進む前）が済んだか（人事が記録する）
  psychMeetingDone: boolean;
  psychSchedule: Schedule | null;
  // 面談のあと、本人が会社に伝えた希望（回復期に進みたい／もう少し休みたい）
  nextWish: "go" | "rest" | null;
  recoveryIntroSeen: boolean;
  recoveryJourneySeen: boolean;
  prepPath: PrepPath | null;
  // 会社との面談。人事が日程を決め、実施を記録する（産業医やほかの担当者とも共有するため）
  companyMeeting: { status: "applied" | "scheduled" | "done"; date?: string } | null;
  // 面談チケットの残り（会社全体）。人事が管理し、本人には数を見せない
  ticketsLeft: number;
  coordinatorMeeting: "applied" | "requested" | null;
  coordWho: Who; // チケットの面談を申し込んだときの相手
  // 支援機関から会社に届く報告。伝えるのは、実施したか・日程を連絡したかだけ（話した内容は届かない）
  coordinatorReport: "done" | "declined" | null;
  coordSchedule: Schedule | null;
  coordInbox: CoordMessage[];
  coordSeen: number; // 本人が相談タブで見た件数（①の印を消すため）
  // 復職までの手順。順番は会社の設定（産業医との面談を先にするか、主治医の診断書を先にするか）
  returnOrder: ReturnOrder;
  // 会社の設定（見本）。いまは手順の順番だけが画面に反映される
  maxLeave: string;
  sickLeave: boolean;
  sickLeaveDays: number;
  rehab: boolean;
  // 準備期に進める条件（会社が選ぶ）
  prepConds: { attendance: boolean; attendanceRate: number; selfCheck: boolean; companyMeeting: boolean; selfReport: boolean };
  // 自分で準備する人が会社に出す、生活の記録のレポート（本人が確かめて送ったものだけ）
  selfReports: SelfReport[];
  // リワークの施設から会社に届く月次レポート（出席の事実だけ）
  reworkReports: { month: string; days: number; rate: number; date: string }[];
  occMeeting: { status: "scheduled" | "done"; date: string } | null;
  doctorNote: boolean;
  // 会社の復職判断（産業医との面談のあと）。見送りも経緯に残す
  returnDecision: "ok" | null;
  returnDecisionLog: { date: string; result: "ok" | "notYet" }[];
  returnPlan: { date: string; accommodation: string } | null;
  diary: Record<string, DiaryEntry>;
  sentToHr: SentItem[];
  // 人事画面で開いている人（null なら一覧）
  hrSelected: string | null;
  // 人事画面の上のタブ（休職者の一覧／データ分析）
  hrPage: "list" | "analytics" | "invite" | "settings";
  // 人事が招待した人（デモでは一覧に増えるだけ。本人はまだ始めていない）
  invited: Invited[];
  // 本人が招待から始めたか（デモでは、最初の画面で個人アカウントのボタンを押したら始まる）
  personStarted: boolean;
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
  contactOpen: null,
  hrMessagesOthers: {},
  acuteChecks: ACUTE.checkItems.map(() => false),
  recoveryChecks: [],
  rivaMeetingApplied: false,
  psychMeetingDone: false,
  psychSchedule: null,
  nextWish: null,
  recoveryIntroSeen: false,
  recoveryJourneySeen: false,
  prepPath: null,
  companyMeeting: null,
  ticketsLeft: DEMO_TICKETS,
  coordinatorMeeting: null,
  coordWho: "coord",
  coordinatorReport: null,
  coordSchedule: null,
  coordInbox: [],
  coordSeen: 0,
  returnOrder: "occFirst",
  maxLeave: "1年6か月",
  sickLeave: true,
  sickLeaveDays: 30,
  rehab: true,
  prepConds: { attendance: true, attendanceRate: 80, selfCheck: true, companyMeeting: true, selfReport: true },
  selfReports: [],
  reworkReports: [],
  occMeeting: null,
  doctorNote: false,
  returnDecision: null,
  returnDecisionLog: [],
  returnPlan: null,
  diary: INITIAL_DIARY,
  sentToHr: [],
  hrSelected: null,
  hrPage: "list",
  invited: [],
  personStarted: false,
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
  | { type: "toggleRecoveryCheck"; item: string }
  | { type: "applyRivaMeeting" }
  | { type: "markPsychDone" }
  | { type: "sendWish"; wish: "go" | "rest" }
  | { type: "markCoordSeen" }
  | { type: "closeRecoveryIntro" }
  | { type: "markRecoveryJourneySeen" }
  | { type: "setPrepPath"; path: PrepPath | null }
  | { type: "applyCompanyMeeting" }
  | { type: "scheduleCompanyMeeting"; date: string }
  | { type: "finishCompanyMeeting" }
  | { type: "coordinatorReport"; report: "done" | "declined" }
  | { type: "offerSlots"; kind: MeetingKind }
  | { type: "chooseSlot"; kind: MeetingKind; slot: string }
  | { type: "noneFit"; kind: MeetingKind }
  | { type: "setTicketsLeft"; on: boolean }
  | { type: "refillTickets" }
  | { type: "askCoordinator" }
  | { type: "setReturnOrder"; order: ReturnOrder }
  | { type: "scheduleOccMeeting"; date: string }
  | { type: "finishOccMeeting" }
  | { type: "receiveDoctorNote" }
  | { type: "undoDoctorNote" }
  | { type: "rescheduleOccMeeting" }
  | { type: "undoOccMeetingDone" }
  | { type: "rescheduleCompanyMeeting" }
  | { type: "setReturnPlan"; date: string; accommodation: string }
  | { type: "decideReturn"; result: "ok" | "notYet" }
  | { type: "undoReturnDecision" }
  | { type: "confirmReturn" }
  | { type: "saveDiary"; entry: DiaryEntry }
  | { type: "sendToHr"; kind: SentItem["kind"]; body: string }
  | { type: "sendHrMessage"; personId: string; title: string; body: string; noReplyNeeded: boolean }
  | { type: "openHrMessage"; id: string | null; goContact?: boolean }
  | { type: "hrSelect"; id: string | null; incoming?: number; prevSeen?: number }
  | { type: "hrPage"; page: "list" | "analytics" | "invite" | "settings" }
  | { type: "setCompany"; patch: Partial<Pick<State, "maxLeave" | "sickLeave" | "sickLeaveDays" | "rehab" | "prepConds">> }
  | { type: "reworkReport" }
  | { type: "sendSelfReport"; report: SelfReport }
  | { type: "demoSelfReport" }
  | { type: "invite"; person: Omit<Invited, "id" | "date"> }
  | { type: "startPerson" }
  | { type: "hrMarkDone"; key: string; personId: string; text: string }
  | { type: "reset" };

function withMessage(state: State, from: MeetingKind, body: string, options?: string[]): State {
  const id = `c${state.coordInbox.length + 1}`;
  // 回復期に進む前の面談（psych）は、いつも復職コーディネーター
  const who: Who = from === "psych" ? "coord" : state.coordWho;
  return { ...state, coordInbox: [...state.coordInbox, { id, date: DEMO_TODAY, from, who, body, options }] };
}

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
        ...(action.stage === "acute" ? { rivaMeetingApplied: false, psychMeetingDone: false, psychSchedule: null, nextWish: null } : {}),
        // 準備期より前に戻したら、復職までの手順はやり直し
        ...(action.stage === "acute" || action.stage === "recovery"
          ? { occMeeting: null, doctorNote: false, returnPlan: null, returnDecision: null }
          : {}),
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
      if (state.coordinatorMeeting !== null && state.coordinatorReport === null) return state;
      return { ...state, rivaMeetingApplied: true };
    case "markPsychDone":
      // 面談が済んだら、コーディネーターから次にすることのお知らせが届く
      return withMessage({ ...state, psychMeetingDone: true }, "psych", CONSULT.msgGateDone);
    case "sendWish": {
      const body = ACUTE.wishBody(ACUTE.wishOptions[action.wish]);
      return {
        ...state,
        nextWish: action.wish,
        sentToHr: [...state.sentToHr, { id: `s${state.sentToHr.length + 1}`, date: DEMO_TODAY, kind: "wish", body }],
      };
    }
    case "markCoordSeen":
      return { ...state, coordSeen: state.coordInbox.length };
    case "toggleRecoveryCheck":
      return {
        ...state,
        recoveryChecks: state.recoveryChecks.includes(action.item)
          ? state.recoveryChecks.filter((i) => i !== action.item)
          : [...state.recoveryChecks, action.item],
      };
    case "closeRecoveryIntro":
      return { ...state, recoveryIntroSeen: true };
    case "markRecoveryJourneySeen":
      return { ...state, recoveryJourneySeen: true };
    case "setPrepPath":
      return { ...state, prepPath: action.path };
    case "applyCompanyMeeting":
      // 自分で準備する人は、会社がレポートを条件にしているなら、送るまで申し込めない（画面だけでなくここでも止める）
      if (state.prepPath === "self" && state.prepConds.selfReport && state.selfReports.length === 0) return state;
      return { ...state, companyMeeting: { status: "applied" } };
    case "scheduleCompanyMeeting":
      return { ...state, companyMeeting: { status: "scheduled", date: action.date } };
    case "finishCompanyMeeting":
      return state.companyMeeting ? { ...state, companyMeeting: { ...state.companyMeeting, status: "done" } } : state;
    case "coordinatorReport": {
      // 難しいという連絡は、本人の相談タブにお知らせとして届く
      const s = { ...state, coordinatorReport: action.report };
      return action.report === "declined" ? withMessage(s, "coordinator", CONSULT.msgDeclined) : s;
    }
    case "offerSlots": {
      const key = action.kind === "psych" ? "psychSchedule" : "coordSchedule";
      const round = state[key]?.round ?? 0;
      const sets = action.kind === "psych" ? CONSULT.psychSlotSets : CONSULT.slotSets;
      const options = sets[round % sets.length];
      const s = withMessage(state, action.kind, CONSULT.msgOffer, options);
      const offerId = s.coordInbox[s.coordInbox.length - 1].id;
      return { ...s, [key]: { offerId, chosen: null, round: round + 1 } };
    }
    case "chooseSlot": {
      const key = action.kind === "psych" ? "psychSchedule" : "coordSchedule";
      const cur = state[key];
      if (!cur) return state;
      const s = withMessage(state, action.kind, CONSULT.msgDecided(action.slot));
      return { ...s, [key]: { ...cur, offerId: null, chosen: action.slot }, coordSeen: s.coordInbox.length };
    }
    case "noneFit": {
      // どれも難しいときは、支援機関が別の候補を送り直す（デモでは数秒後に届く）
      const key = action.kind === "psych" ? "psychSchedule" : "coordSchedule";
      const cur = state[key];
      if (!cur) return state;
      const s = withMessage(state, action.kind, CONSULT.msgNoneFit);
      return { ...s, [key]: { ...cur, offerId: null }, coordSeen: s.coordInbox.length };
    }
    case "setTicketsLeft":
      return {
        ...state,
        ticketsLeft: action.on ? Math.max(state.ticketsLeft, DEMO_TICKETS) : 0,
        coordinatorMeeting: null,
        coordinatorReport: null,
        coordSchedule: null,
      };
    case "refillTickets": {
      // 待っているリクエストは、補充したら受け付ける（チケットを1枚使う）
      const waiting = state.coordinatorMeeting === "requested" && state.coordinatorReport === null;
      return waiting
        ? {
            ...withMessage(state, "coordinator", CONSULT.msgAccepted),
            ticketsLeft: state.ticketsLeft + REFILL_TICKETS - 1,
            coordinatorMeeting: "applied",
          }
        : { ...state, ticketsLeft: state.ticketsLeft + REFILL_TICKETS };
    }
    case "askCoordinator":
      // 急性期は、面談は1つずつ（画面のボタンを消すだけでなく、ここでも止める）
      if (state.stage === "acute" && state.rivaMeetingApplied && !state.psychMeetingDone) return state;
      return state.ticketsLeft > 0
        ? { ...state, coordWho: whoNow(state), coordinatorMeeting: "applied", coordinatorReport: null, coordSchedule: null, ticketsLeft: state.ticketsLeft - 1 }
        : { ...state, coordWho: whoNow(state), coordinatorMeeting: "requested", coordinatorReport: null, coordSchedule: null };
    case "setReturnOrder":
      return { ...state, returnOrder: action.order };
    case "scheduleOccMeeting":
      return { ...state, occMeeting: { status: "scheduled", date: action.date } };
    case "finishOccMeeting":
      return state.occMeeting ? { ...state, occMeeting: { ...state.occMeeting, status: "done" } } : state;
    case "receiveDoctorNote":
      return { ...state, doctorNote: true };
    // 押しまちがい・予定の変更に備えて、記録は戻せるようにする
    case "undoDoctorNote":
      return { ...state, doctorNote: false };
    // 会社の判断は産業医との面談が前提なので、面談を戻したら判断も戻す
    case "rescheduleOccMeeting":
      return { ...state, occMeeting: null, returnDecision: null };
    case "undoOccMeetingDone":
      return state.occMeeting
        ? { ...state, occMeeting: { ...state.occMeeting, status: "scheduled" }, returnDecision: null }
        : state;
    case "decideReturn": {
      if (state.occMeeting?.status !== "done") return state;
      const log = [...state.returnDecisionLog, { date: DEMO_TODAY, result: action.result }];
      // もう少し準備が必要なら、準備期のまま産業医との面談をもう一度にする（段階は戻さない）
      return action.result === "ok"
        ? { ...state, returnDecision: "ok", returnDecisionLog: log }
        : { ...state, returnDecision: null, occMeeting: null, returnDecisionLog: log };
    }
    case "undoReturnDecision": {
      const last = state.returnDecisionLog[state.returnDecisionLog.length - 1];
      return {
        ...state,
        returnDecision: null,
        returnDecisionLog: last?.result === "ok" ? state.returnDecisionLog.slice(0, -1) : state.returnDecisionLog,
      };
    }
    case "rescheduleCompanyMeeting":
      return state.companyMeeting ? { ...state, companyMeeting: { status: "applied" } } : state;
    case "setReturnPlan":
      return { ...state, returnPlan: { date: action.date, accommodation: action.accommodation } };
    case "confirmReturn":
      // 3つの手順がそろっているときだけ、復職（見守りモード）に進める
      if (state.occMeeting?.status !== "done" || state.returnDecision !== "ok" || !state.doctorNote || !state.returnPlan)
        return state;
      // 確定したら、会社からはもう詳しい画面を開けないので一覧に戻す
      return { ...reducer(state, { type: "setStage", stage: "afterReturn" }), hrSelected: null };
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
    case "sendHrMessage": {
      if (action.personId !== PERSON.id) {
        const list = state.hrMessagesOthers[action.personId] ?? [];
        const m: HrMessage = {
          id: `${action.personId}-m${list.length + 1}`,
          date: DEMO_TODAY,
          title: action.title,
          body: action.body,
          noReplyNeeded: action.noReplyNeeded,
        };
        return { ...state, hrMessagesOthers: { ...state.hrMessagesOthers, [action.personId]: [...list, m] } };
      }
      return {
        ...state,
        hrMessages: [
          ...state.hrMessages,
          {
            id: `m${state.hrMessages.length + 1}`,
            date: DEMO_TODAY,
            title: action.title,
            body: action.body,
            noReplyNeeded: action.noReplyNeeded,
          },
        ],
      };
    }
    case "openHrMessage":
      return { ...state, contactOpen: action.id, ...(action.goContact ? { tab: "contact" as const } : {}) };
    case "hrSelect":
      if (action.id === null) return { ...state, hrSelected: null };
      return {
        ...state,
        hrSelected: action.id,
        hrSeen: { ...state.hrSeen, [action.id]: action.incoming ?? 0 },
        hrNewFrom: { ...state.hrNewFrom, [action.id]: action.prevSeen ?? 0 },
      };
    case "setCompany":
      return { ...state, ...action.patch };
    case "sendSelfReport":
      return { ...state, selfReports: [...state.selfReports, action.report] };
    case "demoSelfReport":
      // デモ：人事の画面で、本人からレポートが届いたことにする（準備期の本人画面はスタッフが作る）
      return { ...state, selfReports: [...state.selfReports, { ...SAMPLE_SELF_REPORT, date: DEMO_TODAY }] };
    case "reworkReport": {
      // デモ：月次レポートが届く（見本の数字）
      const n = state.reworkReports.length;
      const sample = [
        { month: "10月", days: 14, rate: 74 },
        { month: "11月", days: 17, rate: 88 },
      ][Math.min(n, 1)];
      return { ...state, reworkReports: [...state.reworkReports, { ...sample, date: DEMO_TODAY }] };
    }
    case "invite":
      return {
        ...state,
        invited: [...state.invited, { ...action.person, id: `inv${state.invited.length + 1}`, date: DEMO_TODAY }],
      };
    case "startPerson":
      return { ...state, personStarted: true };
    case "hrPage":
      return { ...state, hrPage: action.page, hrSelected: null };
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
const STORAGE_KEY = "fukushoku-navi-demo-v30";

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
