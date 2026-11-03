// デモ用の架空データ。実在の人・会社とは関係ありません。
import type { Meal, SleepQuality, Stage } from "../constants/labels";

// デモの「今日」は固定する（挨拶の時間帯だけは実際の時刻を使う）
export const DEMO_TODAY = "2026-11-04";

// 人事からの連絡。長い案内もあるので、ホームには件名だけを出し、本文は連絡タブで読む
export type HrMessage = {
  id: string;
  date: string;
  title: string;
  body: string;
  noReplyNeeded: boolean;
};

// 本人から会社に届いたもの（返信・通院の報告・提出物）。会社に見えるのはこれだけ
export type SentItem = {
  id: string;
  date: string;
  kind: "reply" | "visit";
  body: string;
};

export type DiaryEntry = {
  wake: string;
  sleep: string;
  sleepQuality: SleepQuality | null;
  meals: Meal[];
  activity: boolean | null;
  activityMinutes: number | null;
  mood: number | null; // 0〜4
  note: string;
};

export const emptyEntry = (): DiaryEntry => ({
  wake: "",
  sleep: "",
  sleepQuality: null,
  meals: [],
  activity: null,
  activityMinutes: null,
  mood: null,
  note: "",
});

export type StageChange = { date: string; stage: Stage };

export const PERSON = {
  id: "a",
  name: "社員A",
  dept: "営業部",
  leaveStart: "2026-10-06",
  leaveEnd: "2027-04-05",
};

export const INITIAL_STAGE_HISTORY: StageChange[] = [{ date: PERSON.leaveStart, stage: "acute" }];

// 人事画面に並ぶ、ほかの休職者（すべて架空）。社員Aだけが本人画面と連動する
// status は面談のいまの状態、noReply は人事の連絡に「返信は不要です」をつけたか
export type HrEvent = {
  date: string;
  kind: "stage" | "fromHr" | "fromPerson" | "meeting" | "submit" | "done" | "decision";
  body: string;
  status?: string;
  noReply?: boolean;
  byHr?: boolean; // 人事が自分で記録したもの（新着にしない）
};
// 人事が対応すること。due は期限（満了日など）があるときだけ
export type HrTodo = { key: string; text: string; date: string; due?: string };
export type OtherPerson = {
  id: string;
  name: string;
  dept: string;
  stage: Stage;
  leaveStart: string;
  leaveEnd: string;
  rework: string;
  todo: HrTodo | null;
  seen: number; // 本人から届いたもの（連絡・提出・申し込み）のうち、人事がもう見た件数
  events: HrEvent[];
};

export const OTHER_PEOPLE: OtherPerson[] = [
  {
    id: "b",
    name: "社員B",
    dept: "開発部",
    stage: "recovery",
    leaveStart: "2026-06-22",
    leaveEnd: "2026-12-21",
    rework: "通うリワーク",
    todo: { key: "b-end", text: "休職期間の満了日が近づいています", date: "2026-11-04", due: "2026-12-21" },
    seen: 2,
    events: [
      { date: "2026-06-22", kind: "stage", body: "急性期" },
      { date: "2026-08-24", kind: "stage", body: "回復期" },
      { date: "2026-09-07", kind: "fromPerson", body: "通院してきました。順調と言われました" },
      { date: "2026-10-19", kind: "fromHr", body: "その後、体調はいかがですか。返信は急ぎません。" },
      { date: "2026-10-21", kind: "fromPerson", body: "少しずつ良くなっています。プログラムに週3日通えています" },
    ],
  },
  {
    id: "c",
    name: "社員C",
    dept: "総務部",
    stage: "acute",
    leaveStart: "2026-10-20",
    leaveEnd: "2027-04-19",
    rework: "未定",
    todo: { key: "c-sick", text: "傷病手当金の申請書が届きました。会社の記入欄を書いて提出してください", date: "2026-11-03" },
    seen: 0,
    events: [
      { date: "2026-10-20", kind: "stage", body: "急性期" },
      { date: "2026-10-22", kind: "fromHr", body: "傷病手当金の申請書をお送りします。主治医の記入が済んだら、送ってください。" },
      { date: "2026-11-02", kind: "meeting", body: "復職コーディネーターとの面談", status: "申し込み" },
      { date: "2026-11-03", kind: "submit", body: "傷病手当金の申請書（10月分・主治医の記入済み）" },
    ],
  },
  {
    id: "d",
    name: "社員D",
    dept: "営業部",
    stage: "recovery",
    leaveStart: "2026-07-13",
    leaveEnd: "2027-01-12",
    rework: "自分のペース",
    todo: { key: "d-company", text: "会社との面談の申し込みがありました（準備期への切り替えの相談）", date: "2026-11-02" },
    seen: 1,
    events: [
      { date: "2026-07-13", kind: "stage", body: "急性期" },
      { date: "2026-09-14", kind: "stage", body: "回復期" },
      { date: "2026-10-05", kind: "fromPerson", body: "通院してきました。少し様子を見ることになりました" },
      { date: "2026-11-02", kind: "meeting", body: "会社との面談の申し込み" },
    ],
  },
  {
    id: "e",
    name: "社員E",
    dept: "開発部",
    stage: "preReturn",
    leaveStart: "2026-04-13",
    leaveEnd: "2027-04-12",
    rework: "オンラインのリワーク",
    todo: { key: "e-return", text: "主治医の診断書が提出されました。復職日の確定を待っています", date: "2026-10-28" },
    seen: 1,
    events: [
      { date: "2026-04-13", kind: "stage", body: "急性期" },
      { date: "2026-06-08", kind: "stage", body: "回復期" },
      { date: "2026-09-01", kind: "stage", body: "準備期" },
      { date: "2026-10-15", kind: "submit", body: "記録のまとめ（直近4週間）" },
      { date: "2026-10-28", kind: "submit", body: "主治医の診断書（復職可）" },
    ],
  },
];

// 休職を始めた日から今日までの日数
export function daysSince(start: string, today = DEMO_TODAY): number {
  const ms = new Date(`${today}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime();
  return Math.round(ms / 86400000);
}

export const INITIAL_HR_MESSAGES: HrMessage[] = [
  {
    id: "m1",
    date: "2026-10-07",
    title: "休職中の連絡について",
    body: "休職中の連絡は、人事の担当からこのアプリでお送りします。\n\n連絡は月に1回くらいにします。急ぎのものがあるときは、件名でお知らせします。\n\nいまは、休むことを優先してください。",
    noReplyNeeded: true,
  },
  {
    id: "m2",
    date: "2026-11-02",
    title: "休職中の手続きのご案内",
    body: "休職中の手続きについて、ご案内します。\n\n・傷病手当金の申請書は、月に1回お送りします。主治医の記入が済んだら、送ってください。\n・休職の期間を延ばす場合は、主治医の診断書をお送りください。\n\n急ぎではありませんので、落ち着いたときにご確認ください。",
    noReplyNeeded: true,
  },
];

// 社員Aのこれまでの記録（書けなかった日もある）
export const INITIAL_DIARY: Record<string, DiaryEntry> = {
  "2026-10-29": { wake: "09:30", sleep: "01:00", sleepQuality: "poor", meals: ["noon", "night"], activity: false, activityMinutes: null, mood: 1, note: "" },
  "2026-10-30": { wake: "09:00", sleep: "00:30", sleepQuality: "normal", meals: ["noon", "night"], activity: true, activityMinutes: 15, mood: 2, note: "コンビニまで歩いた" },
  "2026-11-01": { wake: "08:30", sleep: "00:00", sleepQuality: "normal", meals: ["morning", "noon", "night"], activity: true, activityMinutes: 30, mood: 2, note: "" },
  "2026-11-02": { wake: "08:00", sleep: "23:30", sleepQuality: "good", meals: ["morning", "noon", "night"], activity: true, activityMinutes: 30, mood: 3, note: "図書館に行けた" },
  "2026-11-03": { wake: "08:30", sleep: "00:00", sleepQuality: "normal", meals: ["morning", "night"], activity: false, activityMinutes: null, mood: 2, note: "" },
};

// 今日から数えて過去7日の日付（古い順）
export function lastSevenDays(today = DEMO_TODAY): string[] {
  const base = new Date(`${today}T00:00:00`);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() - (6 - i));
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  });
}
