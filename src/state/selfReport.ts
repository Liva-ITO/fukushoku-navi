import { DEMO_TODAY, type DiaryEntry } from "../data/demo";

// 自分で準備する人が会社に出す「生活の記録のレポート」。生活記録表にならい、
// 睡眠と外出は日記から自動でまとめ、活動時間・体調の変化・休職に至った理由・対策は本人が書く。
// 会社に届くのは、本人が中身を確かめて送ったものだけ（日記そのものや気分は届かない）
export type SelfReport = {
  date: string;
  period: number; // まとめた期間（日）
  days: number; // そのうち日記を書いた日
  bed: string; // 平均の寝た時刻
  wake: string; // 平均の起きた時刻
  sleepHours: number; // 平均の睡眠時間
  activityHours: number; // 1日の活動時間（横にならずに過ごした時間。本人が書く）
  outDays: number; // 外出・運動した日
  outMinutes: number; // その平均の分
  condition: string; // 体調の変化
  reason: string; // 休職に至った理由
  measures: string; // その対策（具体的に）
};

export const REPORT_PERIOD = 14;

const toMin = (t: string, night: boolean) => {
  const [h, m] = t.split(":").map(Number);
  // 寝た時刻は、0時すぎを前日の続きとして数える（23:30 と 00:30 の平均を 00:00 にする）
  return (night && h < 12 ? h + 24 : h) * 60 + m;
};
const toTime = (min: number) => {
  // 10分単位にそろえる（「00:12ごろ」より「00:10ごろ」のほうが読みやすい）
  const m = (Math.round(min / 10) * 10) % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

// 日記から、直近の期間の睡眠と外出をまとめる
export function fromDiary(diary: Record<string, DiaryEntry>, today = DEMO_TODAY) {
  const base = new Date(`${today}T00:00:00`);
  const from = new Date(base);
  from.setDate(base.getDate() - (REPORT_PERIOD - 1));
  const entries = Object.entries(diary)
    .filter(([d]) => new Date(`${d}T00:00:00`) >= from && d <= today)
    .map(([, e]) => e);
  const slept = entries.filter((e) => e.wake && e.sleep);
  const beds = slept.map((e) => toMin(e.sleep, true));
  const wakes = slept.map((e) => toMin(e.wake, false) + 24 * 60);
  const out = entries.filter((e) => e.activity);
  return {
    period: REPORT_PERIOD,
    days: entries.length,
    bed: slept.length ? toTime(avg(beds)) : "",
    wake: slept.length ? toTime(avg(wakes)) : "",
    sleepHours: slept.length ? Math.round(avg(slept.map((_, i) => wakes[i] - beds[i])) / 6) / 10 : 0,
    outDays: out.length,
    outMinutes: out.length ? Math.round(avg(out.map((e) => e.activityMinutes ?? 0))) : 0,
  };
}
