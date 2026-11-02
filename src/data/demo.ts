// デモ用の架空データ。実在の人・会社とは関係ありません。

// デモの「今日」は固定する（挨拶の時間帯だけは実際の時刻を使う）
export const DEMO_TODAY = "2026-11-04";

export type HrMessage = {
  id: string;
  date: string;
  body: string;
  noReplyNeeded: boolean;
};

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
