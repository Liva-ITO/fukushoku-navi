// 急性期の「きょうの薬」。薬・頓服・メモ・通院日は本人の端末だけに置く。
// 会社・コーディネーター・人事の画面・レポートには一切出さない。段階の判定にも使わない。
// アプリは「飲んでよい／まだ」「量を変える」「副作用かどうか」を言わない（記録と知らせるだけ）。
// 間隔・上限は、本人が主治医・薬剤師の指示を写す欄で、初期値なし
import { DEMO_TODAY } from "./demo";

export type MedTime = { at: string; alarm: boolean; amount: number | null };
export type Med = {
  id: string;
  label: string; // 呼び名（朝の薬など）
  name: string; // 薬の名前（任意）
  times: MedTime[];
  stock: number | null; // 残り。飲んだ分だけ減る
  memo: string; // 主治医・薬剤師に言われたこと
  ended: string | null; // 終わった日（消さずに残す）
};
export type PrnMed = {
  id: string;
  label: string;
  name: string;
  amount: number | null;
  intervalHours: number | null;
  maxPerDay: number | null;
  reasons: string[];
  toMemo: boolean; // 飲んだ記録を、主治医に伝えるメモに入れる
  stock: number | null;
  ended: string | null;
};
export type MedLog = { date: string; medId: string; at: string; takenAt: string };
export type PrnLog = { date: string; prnId: string; time: string; reason: string | null };
export type DoctorMemoKind = "sideEffect" | "noEffect" | "wantStop";
export type DoctorMemo = { date: string; kind: DoctorMemoKind };
export type AlarmSetting = { on: boolean; sound: boolean; onlyIfNotTaken: boolean; device: boolean };
export type MedView =
  | { kind: "settings" }
  | { kind: "med"; id: string | null }
  | { kind: "prn"; id: string | null }
  | { kind: "prnTake"; id: string }
  | { kind: "memo" };
// 鳴っているアラーム。「30分あとにもう一度」は1回だけ（snoozed のあいだは閉じていて、次に鳴ったら「もう一度」は出さない）
export type AlarmNow = { medId: string; at: string; snoozed: boolean; open: boolean };

export type MedState = {
  meds: Med[];
  prnMeds: PrnMed[];
  medLog: MedLog[];
  prnLog: PrnLog[];
  nextVisit: string | null;
  doctorMemo: DoctorMemo[];
  alarm: AlarmSetting;
  medView: MedView | null;
  alarmNow: AlarmNow | null;
};

export const INITIAL_MEDS: MedState = {
  meds: [],
  prnMeds: [],
  medLog: [],
  prnLog: [],
  nextVisit: null,
  doctorMemo: [],
  alarm: { on: true, sound: false, onlyIfNotTaken: true, device: false },
  medView: null,
  alarmNow: null,
};

export const PRN_REASONS = ["不安", "眠れない", "動悸", "そのほか"];

export const nowHm = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export const newId = (p: string) => `${p}-${Date.now().toString(36)}`;

const toMs = (date: string, hm: string) => new Date(`${date}T${hm}:00`).getTime();
const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// 「11月14日（金）」
export const jpDate = (date: string) => {
  const d = new Date(`${date}T00:00:00`);
  return `${d.getMonth() + 1}月${d.getDate()}日（${"日月火水木金土"[d.getDay()]}）`;
};

// 頓服の前回。「きのう 15:10（19時間前）」のように、事実だけを出す
export function prnLast(s: MedState, prnId: string): { when: string; ago: string } | null {
  const logs = s.prnLog.filter((l) => l.prnId === prnId);
  if (logs.length === 0) return null;
  const last = logs.reduce((a, b) => (toMs(a.date, a.time) > toMs(b.date, b.time) ? a : b));
  const min = Math.max(0, Math.floor((toMs(DEMO_TODAY, nowHm()) - toMs(last.date, last.time)) / 60000));
  const ago = min < 60 ? `${min}分前` : `${Math.floor(min / 60)}時間前`;
  const day = last.date === DEMO_TODAY ? "きょう" : last.date === addDays(DEMO_TODAY, -1) ? "きのう" : jpDate(last.date);
  return { when: `${day} ${last.time}`, ago };
}
export const prnTodayCount = (s: MedState, prnId: string) =>
  s.prnLog.filter((l) => l.prnId === prnId && l.date === DEMO_TODAY).length;

export const takenToday = (s: MedState, medId: string, at: string) =>
  s.medLog.find((l) => l.medId === medId && l.at === at && l.date === DEMO_TODAY) ?? null;

// まだ飲んでいない、アラームのある時間のうち、いちばん早いもの（デモでアラームを鳴らすときに使う）
export function nextAlarm(s: MedState): { medId: string; at: string } | null {
  const rows = s.meds
    .filter((m) => !m.ended)
    .flatMap((m) => m.times.filter((t) => t.alarm && !takenToday(s, m.id, t.at)).map((t) => ({ medId: m.id, at: t.at })));
  rows.sort((a, b) => a.at.localeCompare(b.at));
  return rows[0] ?? null;
}

// 主治医に伝えるメモに出す、頓服の1週間ぶん
export function prnWeek(s: MedState): (PrnLog & { label: string })[] {
  const from = addDays(DEMO_TODAY, -6);
  return s.prnLog
    .filter((l) => l.date >= from)
    .map((l) => ({ ...l, label: s.prnMeds.find((p) => p.id === l.prnId && p.toMemo)?.label ?? "" }))
    .filter((l) => l.label !== "")
    .sort((a, b) => toMs(b.date, b.time) - toMs(a.date, a.time));
}

// デモ用の例（設定の画面から入れられる）
export function sampleMeds(): Partial<MedState> {
  return {
    meds: [
      { id: "m-am", label: "朝の薬", name: "", times: [{ at: "09:00", alarm: true, amount: 1 }], stock: 28, memo: "", ended: null },
      { id: "m-pm", label: "夜の薬", name: "", times: [{ at: "21:00", alarm: true, amount: 1 }], stock: 28, memo: "食後に", ended: null },
    ],
    prnMeds: [
      {
        id: "p-1",
        label: "不安が強いとき",
        name: "",
        amount: 1,
        intervalHours: 6,
        maxPerDay: 2,
        reasons: [...PRN_REASONS],
        toMemo: true,
        stock: 10,
        ended: null,
      },
    ],
    prnLog: [{ date: addDays(DEMO_TODAY, -1), prnId: "p-1", time: "15:10", reason: "不安" }],
    nextVisit: addDays(DEMO_TODAY, 10),
  };
}
