// 画面に出る言葉は、すべてここに集める。
// 言葉づかいの原則（本人向け）：押しつけない／責めない／選ぶのは本人／後退と言わない／「休職者」と呼ばない／「戻る」より「進む」

export type Stage = "acute" | "recovery" | "preReturn" | "afterReturn";

export const APP_NAME = "復職ナビポータル（仮）";

export const STAGE_LABELS: Record<Stage, string> = {
  acute: "急性期",
  recovery: "回復期",
  preReturn: "準備期",
  afterReturn: "復職（見守りモード）",
};

export const greeting = (name: string, hour: number): string => {
  if (hour >= 5 && hour < 10) return `おはようございます、${name}さん`;
  if (hour >= 10 && hour < 18) return `こんにちは、${name}さん`;
  if (hour >= 18) return `こんばんは、${name}さん`;
  return `こんばんは、${name}さん。ゆっくりで大丈夫です`;
};

export const TABS = {
  home: "ホーム",
  record: "記録",
  contact: "連絡",
  contents: "コンテンツ",
  consult: "相談",
} as const;
export type Tab = keyof typeof TABS;

export const COMMON = {
  newNotice: "新しいお知らせがあります",
  noReplyNeeded: "返信は不要です",
  comingSoon: "この画面は、これから作ります",
};

export const ACUTE = {
  message:
    "いまは、休んでいて大丈夫です。何かをしなければと思わなくてかまいません。開きたくなったときに、ここを開いてください。",
  hrContactSummary: (n: number) => `人事からのお知らせが${n}件`,
  readingsTitle: "少し楽になる読みもの",
  readings: [
    { title: "休んでいいと思えないときに", minutes: 3 },
    { title: "眠れない夜のための短い音声", minutes: 5 },
    { title: "家族に今の状態を伝えるには", minutes: 4 },
  ],
  recordEntry: "日記",
  todoTitle: "やれるならやってみよう",
  todo: "起きたらカーテンを開ける",
  checkTitle: "気が向いたときに",
  checkNote: "次の時期に進む目安です。今できていなくても、まったく問題ありません",
  checkItems: [
    "通院・服薬ができている",
    "家族や主治医以外と少し話せる",
    "週2日は外出できる",
  ],
  checkAllDone: "次に進めそうか、心理の専門家と一緒に確かめてみよう",
  checkButton: "心理の専門家と話してみる",
  checkButtonNote: "この面談は、チケットを使いません",
  checkConfirm: "リヴァの心理の専門家との面談を申し込みます。申し込むと、リヴァから日程の連絡が届きます。",
  checkConfirmYes: "申し込む",
  checkConfirmNo: "やめておく",
  checkApplied: "申し込みました。リヴァから日程の連絡が届きます",
};

export const DEMO_BAR = {
  title: "デモ操作",
  viewAs: "見る画面",
  viewPerson: "本人として見る",
  viewHr: "人事として見る",
  stage: "段階",
  restMode: "休息モード",
  on: "オン",
  off: "オフ",
  reset: "最初の状態に戻す",
  intro:
    "休職した社員と、会社の人事・産業保健スタッフ（産業医・保健師）をつなぐサービスの試作です。上のバーで、本人の画面と会社の画面を行き来できます。",
  introClose: "はじめる",
  notAi: "AIが相談や診断をするアプリではありません。判断するのは、医師・産業医・会社・リヴァの専門家です。",
};
