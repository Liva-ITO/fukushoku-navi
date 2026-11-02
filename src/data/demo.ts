// デモ用の架空データ。実在の人・会社とは関係ありません。
import type { Meal, SleepQuality } from "../constants/labels";

// デモの「今日」は固定する（挨拶の時間帯だけは実際の時刻を使う）
export const DEMO_TODAY = "2026-11-04";

export type HrMessage = {
  id: string;
  date: string;
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

export const PERSON = {
  name: "社員A",
};

export const INITIAL_HR_MESSAGES: HrMessage[] = [
  {
    id: "m1",
    date: "2026-11-02",
    body: "手続きのご案内です。急ぎではありませんので、落ち着いたときにご確認ください。",
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
