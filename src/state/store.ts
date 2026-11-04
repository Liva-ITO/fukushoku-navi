import { useEffect, useReducer } from "react";
import type { SelfReport } from "./selfReport";
import { ACUTE, BOSS, CONSULT, HR, RECOVERY, type PrepPath, type Stage, type Tab } from "../constants/labels";
import {
  DEMO_TODAY,
  INITIAL_DIARY,
  INITIAL_STAGE_HISTORY,
  PERSON,
  SAMPLE_PERSON,
  SAMPLE_SELF_REPORT,
  INITIAL_HR_MESSAGES,
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
  email: string; // 本人の個人のメールアドレス（案内の送り先）
  date: string;
  resends: { date: string; email: string }[]; // 案内を送り直した記録
  bossId?: string; // 担当の上司（窓口を上司にした会社だけ）
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
// 会社側のアカウント（デモでは名前・立場・権限だけ）
export type HrRole = "admin" | "staff" | "boss";
// 上司（boss）は、休職者を登録するときに自動で作られる。担当する人だけを見る
export type HrAccount = { id: string; name: string; position: string; role: HrRole; email?: string };
export type BossInput = { name: string; email: string };
// 済んだ面談の記録（経緯に、面談の日付で1行ずつ残す。やり直しても前の面談は消えない）
export type MeetingLog = { date: string; key: "psych" | "company" | "coordinator" | "occ"; who?: Who; status: "done" | "declined" };
export type RegPatch = Partial<Pick<Invited, "name" | "dept" | "leaveStart" | "leaveEnd" | "email" | "bossId">>;
export type Torisetsu = { reason: string; signs: string; actions: string; help: string };
export type OccOpinion = { verdict: "ok" | "conditional" | "notYet"; note: string };

export type State = {
  view: View;
  stage: Stage;
  stageHistory: StageChange[];
  restMode: boolean;
  tab: Tab;
  introSeen: boolean;
  hrMessages: HrMessage[];
  contactOpen: string | null; // 連絡タブで開いている人事からの連絡
  // デモの本人以外への連絡（デモでは人事の経緯に残るだけ）
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
  coordSeen: number; // 本人が連絡タブで見た件数（①の印を消すため）
  personHrSeen: number;
  hrRepliedAt: number;
  bossRepliedAt: number; // 上司が最後に本人へ送ったとき、本人から届いていた件数 // 人事が最後に本人へ送ったとき、本人から届いていた件数（返信したら「本人からの連絡」は消える） // 本人が連絡タブで見た、人事からのお知らせの件数
  // 復職までの手順。順番は会社の設定（産業医との面談を先にするか、主治医の診断書を先にするか）
  returnOrder: ReturnOrder;
  // 会社の設定（見本）。いまは手順の順番だけが画面に反映される
  maxLeave: string;
  depts: string[]; // 部署（会社の設定）。登録ではここから選ぶ
  contactBy: "hr" | "boss"; // 本人との連絡の窓口（会社の設定）
  sickLeave: boolean;
  sickLeaveDays: number;
  rehab: boolean;
  // 準備期に進める条件（会社が選ぶ）
  prepConds: { attendance: boolean; attendanceRate: number; selfCheck: boolean; companyMeeting: boolean; selfReport: boolean };
  // 自分で準備する人が会社に出す、生活の記録のレポート（本人が確かめて送ったものだけ）
  selfReports: SelfReport[];
  // リワークの施設から会社に届く月次レポート（出席の事実だけ）
  reworkReports: { month: string; days: number; rate: number; date: string }[];
  occMeeting: { status: "scheduled" | "done"; date: string; opinion?: OccOpinion } | null;
  // 産業医の意見の記録（面談をやり直しても残す。経緯に出す）
  occOpinions: (OccOpinion & { date: string })[];
  meetingLog: MeetingLog[];
  // 会社の見立ての追記（人ごと・日付つき）。本人には見せない
  issueNotes: Record<string, { date: string; text: string }[]>;
  // 登録内容を直した記録（人ごと・日付つき）
  regEdits: { personId: string; date: string; text: string }[];
  // 自分の取説（本人だけのもの。会社には届かない）
  torisetsu: Torisetsu | null;
  // リワークのスタッフへの共有：本人の同意（null はまだ答えていない）と、会社が共有した日
  shareConsent: boolean | null;
  sharedDate: string | null;
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
  hrPage: "list" | "analytics" | "invite" | "settings" | "accounts";
  // デモで人事の画面を見るときの権限（管理者だけが会社の設定とアカウントを触れる）
  hrRole: HrRole;
  hrReport: number | null; // 人事の画面で開いているレポート（selfReports の番号）
  hrAccounts: HrAccount[];
  // 人事が招待した人（デモでは一覧に増えるだけ。本人はまだ始めていない）
  invited: Invited[];
  // デモの主人公：人事が最初に登録した人が、そのまま本人の画面の人になる（id は "a"）
  live: Invited | null;
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
  hrMessages: [],
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
  personHrSeen: 0,
  hrRepliedAt: 0,
  bossRepliedAt: 0,
  returnOrder: "occFirst",
  maxLeave: "1年6か月",
  depts: ["営業部", "開発部", "製造部", "総務部", "企画部"],
  contactBy: "hr",
  sickLeave: true,
  sickLeaveDays: 30,
  rehab: true,
  prepConds: { attendance: true, attendanceRate: 80, selfCheck: true, companyMeeting: true, selfReport: true },
  selfReports: [],
  reworkReports: [],
  occMeeting: null,
  occOpinions: [],
  meetingLog: [],
  issueNotes: {},
  regEdits: [],
  torisetsu: null,
  shareConsent: null,
  sharedDate: null,
  doctorNote: false,
  returnDecision: null,
  returnDecisionLog: [],
  returnPlan: null,
  diary: INITIAL_DIARY,
  sentToHr: [],
  hrSelected: null,
  hrPage: "list",
  hrRole: "admin",
  hrReport: null,
  hrAccounts: [
    { id: "u1", name: "担当A", position: "人事", role: "admin" },
    { id: "u2", name: "担当B", position: "人事", role: "staff" },
    { id: "u3", name: "担当C", position: "産業医", role: "staff" },
    { id: "u4", name: "担当D", position: "保健師", role: "staff" },
  ],
  invited: [],
  live: null,
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
  | { type: "finishOccMeeting"; opinion: OccOpinion }
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
  | { type: "sendHrMessage"; personId: string; title: string; body: string; noReplyNeeded: boolean; by?: string }
  | { type: "openHrMessage"; id: string | null; goContact?: boolean }
  | { type: "hrSelect"; id: string | null; incoming?: number; prevSeen?: number }
  | { type: "hrPage"; page: State["hrPage"] }
  | { type: "setHrRole"; role: HrRole }
  | { type: "openReport"; index: number | null }
  | { type: "addAccount"; account: Omit<HrAccount, "id"> }
  | { type: "setAccountRole"; id: string; role: "admin" | "staff" }
  | { type: "removeAccount"; id: string }
  | { type: "setCompany"; patch: Partial<Pick<State, "maxLeave" | "depts" | "contactBy" | "sickLeave" | "sickLeaveDays" | "rehab" | "prepConds">> }
  | { type: "reworkReport" }
  | { type: "addIssueNote"; personId: string; text: string }
  | { type: "editRegistration"; personId: string; patch: RegPatch; text: string; boss?: BossInput }
  | { type: "saveTorisetsu"; torisetsu: Torisetsu }
  | { type: "setShareConsent"; consent: boolean | null }
  | { type: "recordShared" }
  | { type: "sendSelfReport"; report: SelfReport }
  | { type: "demoSelfReport" }
  | { type: "invite"; person: Omit<Invited, "id" | "date" | "resends" | "bossId">; boss?: BossInput }
  | { type: "resendInvite"; id: string; email: string }
  | { type: "sync"; state: State }
  | { type: "startPerson" }
  | { type: "hrMarkDone"; key: string; personId: string; text: string }
  | { type: "reset" };

// 上司のアカウントを、会社のメールアドレスで探す。なければ作る（休職者の登録や、上司を替えたとき）
function ensureBoss(accounts: HrAccount[], boss: BossInput): [HrAccount[], string] {
  const email = boss.email.trim().toLowerCase();
  const found = accounts.find((a) => a.role === "boss" && a.email?.toLowerCase() === email);
  if (found) return [accounts, found.id];
  const id = `b${accounts.length + 1}-${Date.now() % 1000}`;
  return [[...accounts, { id, name: boss.name.trim(), position: BOSS.position, role: "boss", email: boss.email.trim() }], id];
}
// デモで上司の画面を見るときの上司：デモの本人の担当の上司（いなければ、最初の上司）
export function currentBossId(state: State): string | null {
  return state.live?.bossId ?? state.hrAccounts.find((a) => a.role === "boss")?.id ?? null;
}

// 日程の候補（「11月9日（月）11:00」）から日付を取り出す。取れなければ今日
function slotDate(slot: string | null | undefined): string {
  const m = slot?.match(/(\d+)月(\d+)日/);
  if (!m) return DEMO_TODAY;
  return `${DEMO_TODAY.slice(0, 4)}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}
// 人事から本人へのお知らせを足す（面談の日程を決めたときなどに、自動で届く）
const jpDate = (d: string) => `${Number(d.slice(5, 7))}月${Number(d.slice(8, 10))}日`;
function withHrMessage(state: State, t: { title: string; text: string; noReply: boolean }): State {
  return {
    ...state,
    hrMessages: [
      ...state.hrMessages,
      { id: `m${state.hrMessages.length + 1}`, date: DEMO_TODAY, title: t.title, body: t.text, noReplyNeeded: t.noReply },
    ],
  };
}
const logMeeting = (state: State, entry: MeetingLog): State => ({ ...state, meetingLog: [...state.meetingLog, entry] });

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
      return withMessage(
        logMeeting({ ...state, psychMeetingDone: true }, { date: slotDate(state.psychSchedule?.chosen), key: "psych", status: "done" }),
        "psych",
        CONSULT.msgGateDone,
      );
    case "sendWish": {
      const body = ACUTE.wishBody(ACUTE.wishOptions[action.wish]);
      return {
        ...state,
        nextWish: action.wish,
        sentToHr: [...state.sentToHr, { id: `s${state.sentToHr.length + 1}`, date: DEMO_TODAY, kind: "wish", body }],
      };
    }
    case "markCoordSeen":
      return { ...state, coordSeen: state.coordInbox.length, personHrSeen: state.hrMessages.length };
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
      // 日を決めたら、本人の「連絡」に日程のお知らせが届く
      return withHrMessage({ ...state, companyMeeting: { status: "scheduled", date: action.date } }, HR.companyNotifyTemplate(jpDate(action.date)));
    case "finishCompanyMeeting":
      return state.companyMeeting
        ? logMeeting(
            { ...state, companyMeeting: { ...state.companyMeeting, status: "done" } },
            { date: state.companyMeeting.date ?? DEMO_TODAY, key: "company", status: "done" },
          )
        : state;
    case "coordinatorReport": {
      // 難しいという連絡は、本人の相談タブにお知らせとして届く
      const s = logMeeting(
        { ...state, coordinatorReport: action.report },
        { date: action.report === "done" ? slotDate(state.coordSchedule?.chosen) : DEMO_TODAY, key: "coordinator", who: state.coordWho, status: action.report },
      );
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
      return withHrMessage({ ...state, occMeeting: { status: "scheduled", date: action.date } }, HR.templatesPreReturn(jpDate(action.date))[0]);
    case "finishOccMeeting":
      return state.occMeeting
        ? {
            ...state,
            occMeeting: { ...state.occMeeting, status: "done", opinion: action.opinion },
            occOpinions: [...state.occOpinions, { ...action.opinion, date: state.occMeeting.date }],
            meetingLog: [...state.meetingLog, { date: state.occMeeting.date, key: "occ", status: "done" }],
          }
        : state;
    case "receiveDoctorNote":
      return { ...state, doctorNote: true };
    // 押しまちがい・予定の変更に備えて、記録は戻せるようにする
    case "undoDoctorNote":
      return { ...state, doctorNote: false };
    // 会社の判断は産業医との面談が前提なので、面談を戻したら判断も戻す
    case "rescheduleOccMeeting":
      return { ...state, occMeeting: null, returnDecision: null };
    case "undoOccMeetingDone":
      // 押しまちがいなので、そのとき残した意見の記録も消す
      return state.occMeeting
        ? {
            ...state,
            occMeeting: { status: "scheduled", date: state.occMeeting.date },
            occOpinions: state.occOpinions.slice(0, -1),
            // 押しまちがいなので、残した面談の記録も消す
            meetingLog: state.meetingLog.filter((_, i, a) => !(a[i].key === "occ" && i === a.map((x) => x.key).lastIndexOf("occ"))),
            returnDecision: null,
          }
        : state;
    case "decideReturn": {
      if (state.occMeeting?.status !== "done") return state;
      // 判断は面談のあと。デモで面談の日が先の日付なら、判断もその日にする（経緯の順番がくずれないように）
      const when = state.occMeeting.date > DEMO_TODAY ? state.occMeeting.date : DEMO_TODAY;
      const log = [...state.returnDecisionLog, { date: when, result: action.result }];
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
          by: action.by,
        };
        return { ...state, hrMessagesOthers: { ...state.hrMessagesOthers, [action.personId]: [...list, m] } };
      }
      return {
        ...state,
        ...(action.by ? { bossRepliedAt: state.sentToHr.length } : { hrRepliedAt: state.sentToHr.length }),
        hrMessages: [
          ...state.hrMessages,
          {
            id: `m${state.hrMessages.length + 1}`,
            date: DEMO_TODAY,
            title: action.title,
            body: action.body,
            noReplyNeeded: action.noReplyNeeded,
            by: action.by,
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
      if (state.hrRole !== "admin") return state;
      return { ...state, ...action.patch };
    case "sendSelfReport":
      return { ...state, selfReports: [...state.selfReports, action.report] };
    case "demoSelfReport":
      // デモ：人事の画面で、本人からレポートが届いたことにする（準備期の本人画面はスタッフが作る）
      return { ...state, selfReports: [...state.selfReports, { ...SAMPLE_SELF_REPORT, date: DEMO_TODAY }] };
    case "setShareConsent": {
      if (action.consent === null) return { ...state, shareConsent: null };
      // 答えたことは、本人から会社への連絡として届く
      const body = RECOVERY.consentSent(action.consent ? RECOVERY.consentYes : RECOVERY.consentNo);
      return {
        ...state,
        shareConsent: action.consent,
        sharedDate: action.consent ? state.sharedDate : null,
        sentToHr: [...state.sentToHr, { id: `s${state.sentToHr.length + 1}`, date: DEMO_TODAY, kind: "new", body }],
      };
    }
    case "recordShared":
      return state.shareConsent ? { ...state, sharedDate: DEMO_TODAY } : state;
    case "saveTorisetsu":
      return { ...state, torisetsu: action.torisetsu };
    case "editRegistration": {
      let base = state;
      let patch: RegPatch = action.patch;
      if (action.boss && state.contactBy === "boss") {
        const [accounts, bossId] = ensureBoss(state.hrAccounts, action.boss);
        base = { ...state, hrAccounts: accounts };
        patch = { ...patch, bossId };
      }
      const log = [...state.regEdits, { personId: action.personId, date: DEMO_TODAY, text: action.text }];
      if (action.personId === PERSON.id && base.live) {
        const state = base;
        const live = { ...state.live!, ...patch };
        // 休職の開始日を直したら、段階の記録の最初の日も合わせる
        const hist = state.stageHistory.map((h, i) => (i === 0 ? { ...h, date: live.leaveStart } : h));
        return { ...state, live, stageHistory: hist, regEdits: log };
      }
      return {
        ...base,
        invited: base.invited.map((p) => (p.id === action.personId ? { ...p, ...patch } : p)),
        regEdits: log,
      };
    }
    case "addIssueNote":
      return {
        ...state,
        issueNotes: {
          ...state.issueNotes,
          [action.personId]: [...(state.issueNotes[action.personId] ?? []), { date: DEMO_TODAY, text: action.text }],
        },
      };
    case "reworkReport": {
      // デモ：月次レポートが届く（見本の数字）
      const n = state.reworkReports.length;
      const sample = [
        { month: "10月", days: 14, rate: 74 },
        { month: "11月", days: 17, rate: 88 },
      ][Math.min(n, 1)];
      return { ...state, reworkReports: [...state.reworkReports, { ...sample, date: DEMO_TODAY }] };
    }
    case "invite": {
      if (state.hrRole === "boss") return state;
      // 窓口が上司の会社：上司のアカウントを自動で作る（すでにいれば、担当が増えるだけ）
      let accounts = state.hrAccounts;
      let bossId: string | undefined;
      if (action.boss && state.contactBy === "boss") [accounts, bossId] = ensureBoss(state.hrAccounts, action.boss);
      const person = { ...action.person, bossId, date: DEMO_TODAY, resends: [] };
      // 最初に登録した人が、デモの本人になる。段階は休職の開始日から急性期
      if (!state.live)
        return {
          ...state,
          hrAccounts: accounts,
          live: { ...person, id: PERSON.id },
          stageHistory: [{ date: action.person.leaveStart, stage: "acute" }],
        };
      return {
        ...state,
        hrAccounts: accounts,
        invited: [...state.invited, { ...person, id: `inv${state.invited.length + 1}` }],
      };
    }
    case "resendInvite":
      if (action.id === PERSON.id && state.live)
        return {
          ...state,
          live: { ...state.live, email: action.email, resends: [...state.live.resends, { date: DEMO_TODAY, email: action.email }] },
        };
      return {
        ...state,
        invited: state.invited.map((p) =>
          p.id === action.id ? { ...p, email: action.email, resends: [...p.resends, { date: DEMO_TODAY, email: action.email }] } : p,
        ),
      };
    case "startPerson":
      return { ...state, personStarted: true };
    case "hrPage":
      // 会社の設定とアカウントは、管理者だけ。上司は、担当している人の一覧だけ
      if ((action.page === "settings" || action.page === "accounts") && state.hrRole !== "admin") return state;
      if (state.hrRole === "boss" && action.page !== "list") return state;
      return { ...state, hrPage: action.page, hrSelected: null };
    case "openReport":
      return { ...state, hrReport: action.index };
    case "setHrRole":
      return {
        ...state,
        hrRole: action.role,
        hrPage:
          action.role === "boss" || (action.role === "staff" && (state.hrPage === "settings" || state.hrPage === "accounts")) ? "list" : state.hrPage,
        // 上司の画面と行き来したら、開いている人を閉じる（見られる人が違うため）
        hrSelected: action.role === "boss" || state.hrRole === "boss" ? null : state.hrSelected,
      };
    case "addAccount":
      if (state.hrRole !== "admin") return state;
      return { ...state, hrAccounts: [...state.hrAccounts, { ...action.account, id: `u${state.hrAccounts.length + 1}-${Date.now() % 1000}` }] };
    case "setAccountRole": {
      if (state.hrRole !== "admin") return state;
      const next = state.hrAccounts.map((a) => (a.id === action.id ? { ...a, role: action.role } : a));
      // 管理者は1人以上
      return next.some((a) => a.role === "admin") ? { ...state, hrAccounts: next } : state;
    }
    case "removeAccount": {
      if (state.hrRole !== "admin") return state;
      const next = state.hrAccounts.filter((a) => a.id !== action.id);
      // 上司を外したら、その人が担当していた休職者の担当も外す
      const unassign = (p: Invited): Invited => (p.bossId === action.id ? { ...p, bossId: undefined } : p);
      return next.some((a) => a.role === "admin")
        ? { ...state, hrAccounts: next, live: state.live && unassign(state.live), invited: state.invited.map(unassign) }
        : state;
    }
    case "hrMarkDone":
      return {
        ...state,
        hrDone: [...state.hrDone, { key: action.key, personId: action.personId, text: action.text, date: DEMO_TODAY }],
      };
    case "sync": {
      // ほかのウィンドウで変わった中身を取りこむ。見ている画面（本人か人事か、どのタブか）は、このウィンドウのまま。
      // ただし段階が変わったときは、本人の画面はホームに戻す（新しい段階のホームを見せるため）
      const local = pick(state, LOCAL_KEYS);
      return { ...action.state, ...local, tab: action.state.stage !== state.stage ? "home" : local.tab };
    }
    case "reset":
      return { ...startState(), introSeen: true, view: state.view };
  }
}

// 見本のモードでは、最初から本人（社員A）が登録済みで始めた状態にする。段階はデモ操作で自由に切り替えられる
function startState(): State {
  if (!BROWSE) return initialState;
  return {
    ...initialState,
    live: SAMPLE_PERSON,
    personStarted: true,
    stageHistory: [{ date: SAMPLE_PERSON.leaveStart, stage: "acute" }],
    hrMessages: INITIAL_HR_MESSAGES,
  };
}

// 保存の名前は固定する。項目を足しても、読みこむときに最初の状態で足りない項目が補われるので、
// ページを更新しても途中から続けられる（番号を上げると、それまでの進み具合が消えてしまう）。
// 形が合わなくなる変更のときだけ、名前を変える
// 「画面を見る（見本）」は、アドレスの ?mode=browse で切り替える。通しのデモとは保存を分ける
export const BROWSE = typeof location !== "undefined" && new URLSearchParams(location.search).get("mode") === "browse";
const STORAGE_KEY = BROWSE ? "fukushoku-navi-browse" : "fukushoku-navi-demo";
const PREVIOUS_KEY = BROWSE ? "" : "fukushoku-navi-demo-v40"; // 名前を固定する前の保存。あれば引きつぐ
const LOCAL_STORAGE_KEY = `${STORAGE_KEY}-window`;

// ウィンドウごとに持つもの（見ている画面）。ほかのウィンドウとは合わせず、このウィンドウの中だけに保存する。
// 共有する保存にこれを混ぜると、2つのウィンドウが互いに書き換え合って止まらなくなる
const LOCAL_KEYS = ["view", "tab", "hrPage", "hrSelected", "contactOpen", "hrRole", "introSeen", "hrReport"] as const;
type LocalKey = (typeof LOCAL_KEYS)[number];
function pick<T extends object, K extends keyof T>(o: T, keys: readonly K[]): Pick<T, K> {
  const r = {} as Pick<T, K>;
  for (const k of keys) r[k] = o[k];
  return r;
}
function shared(state: State): Omit<State, LocalKey> {
  const r = { ...state } as Partial<State>;
  for (const k of LOCAL_KEYS) delete r[k];
  return r as Omit<State, LocalKey>;
}

function load(): State {
  let s = startState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(PREVIOUS_KEY);
    if (raw) s = { ...s, ...JSON.parse(raw) };
    const local = sessionStorage.getItem(LOCAL_STORAGE_KEY) ?? sessionStorage.getItem(`${PREVIOUS_KEY}-window`);
    if (local) s = { ...s, ...JSON.parse(local) };
  } catch {
    // 保存できない環境でも、最初の状態で動かす
  }
  return s;
}

export function useDemoStore() {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      // 共有するのは中身だけ。同じ中身なら書かない
      const json = JSON.stringify(shared(state));
      if (localStorage.getItem(STORAGE_KEY) !== json) localStorage.setItem(STORAGE_KEY, json);
      sessionStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(pick(state, LOCAL_KEYS)));
    } catch {
      // 保存できなくても動作は続ける
    }
  }, [state]);
  // 人事と本人を2つのウィンドウで並べたとき、片方の操作をもう片方にその場で映す
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        dispatch({ type: "sync", state: { ...initialState, ...JSON.parse(e.newValue) } });
      } catch {
        // 読めない内容は無視する
      }
    };
    // 念のため、ウィンドウに戻ってきたときも保存を読み直す（知らせを取りこぼしても追いつくように）
    const onFocus = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) dispatch({ type: "sync", state: { ...initialState, ...JSON.parse(raw) } });
      } catch {
        // 読めない内容は無視する
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);
  return [state, dispatch] as const;
}
