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
  checkNote:
    "回復期に進む目安です。今できていなくても、まったく問題ありません。回復期に進むときは、リヴァの心理の専門家との面談で一緒に確かめます（チケットは使いません）",
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

export type PrepPath = "rivatore" | "rivabiz" | "self";

export const RECOVERY = {
  introLines: [
    "回復期に入りました。ここからは、生活のリズムを少しずつ整えていく時期です。",
    "調子が落ちる日があるのは自然なことです。そのときは「今日はしんどい」を押してください。画面が静かになります。",
  ],
  introClose: "わかりました",
  stageNote: "生活のリズムを整えながら、次の一歩を考えはじめる時期です",

  pathTitle: "準備の進め方",
  pathNote: "復職に向けた準備は、2つの道から選べます。どちらを選んでも大丈夫です。途中で変えることもできます",
  pathRework: "リワークを使う",
  pathReworkNote: "専門のプログラムで、仲間と一緒に準備する",
  pathOptions: {
    rivatore: { name: "リヴァトレ", note: "通いながら、仲間と一緒にトレーニングする" },
    rivabiz: { name: "リヴァBiz", note: "自宅からオンラインで参加できる" },
    self: { name: "自分のペースで準備する", note: "このアプリの記録やガイドを使って、自分で準備を進める" },
  } satisfies Record<PrepPath, { name: string; note: string }>,
  pathChosen: (name: string) => `いまの進め方：${name}`,
  pathChange: "変える",

  // 準備期に進む目安。「やること」ではなく「できている状態」で書く。次に進むかを決めるのはアプリではなく面談
  // ※仮置き。厚生労働省「心の健康問題により休業した労働者の職場復帰支援の手引き」の判断基準の例を参考にした。基準はリヴァで詰める
  nextTitle: "準備期に進む目安",
  next: {
    none: [
      "決まった時間に起きて、日中に活動できている",
      "通勤と同じ時間帯に、外出できている",
      "図書館などで、仕事に近い作業を続けられている",
      "疲れが、次の日までに回復している",
    ],
    rework: [
      "決まった時間に起きて、日中に活動できている",
      "プログラムに、決まった日数参加できている",
      "疲れが、次の日までに回復している",
    ],
    self: [
      "決まった時間に起きて、日中に活動できている",
      "通勤と同じ時間帯に、外出できている",
      "図書館などで、仕事に近い作業を続けられている",
      "疲れが、次の日までに回復している",
    ],
  },
  nextNote: "次に進むかどうかは、面談で一緒に確かめます",

  restButton: "今日はしんどい",

  nextStepNote: "目安に近づいてきたと感じたら、面談を申し込めます。話す相手を選べます",
  meetCompany: "会社と面談する",
  meetCompanyConfirm: "会社との面談を申し込みます。申し込むと、会社から日程の連絡が届きます。",
  meetCompanyApplied: "申し込みました。会社から日程の連絡が届きます",
  meetRiva: "心理の専門家に相談する",
  meetRivaNote: "リヴァの面談です。チケットを1枚使います",
  meetRivaConfirm: "リヴァの心理の専門家との面談を申し込みます。チケットを1枚使います。申し込むと、リヴァから日程の連絡が届きます。",
  meetRivaApplied: "申し込みました。リヴァから日程の連絡が届きます",
  confirmYes: "申し込む",
  confirmNo: "やめておく",
};

export const REST = {
  lines: [
    "今日は、休む日にして大丈夫です。",
    "調子に波があるのは、回復の途中ではよくあることです。段階は変わりません。会社にも伝わりません。",
  ],
  recordEntry: "日記",
  back: "少し動けそう",
};

export type SleepQuality = "good" | "normal" | "poor";
export type Meal = "morning" | "noon" | "night";

export const RECORD = {
  title: "今日の記録",
  privacy: "ここに書いたことは、自分だけが見られます。会社には、自分で提出したときだけ届きます",
  wake: "起きた時刻",
  sleep: "寝た時刻",
  sleepQuality: "睡眠",
  sleepQualityOptions: { good: "よく眠れた", normal: "ふつう", poor: "あまり眠れなかった" } satisfies Record<SleepQuality, string>,
  meals: "食事",
  mealOptions: { morning: "朝", noon: "昼", night: "夜" } satisfies Record<Meal, string>,
  activity: "体を動かした・外に出た",
  activityYes: "した",
  activityNo: "しなかった",
  activityMinutes: [15, 30, 60],
  minutes: (n: number) => `${n}分`,
  mood: "気分",
  // 気分は言葉を出さず、顔だけで選ぶ
  moodFaces: ["😣", "😟", "😐", "🙂", "😊"],
  note: "ひとこと",
  notePlaceholder: "書かなくても大丈夫です",
  voice: "話して入力",
  voiceListening: "聞いています…",
  save: "残す",
  saved: "今日の記録を見る",
  edit: "書きなおす",
  thanks: [
    "記録できましたね。それだけで十分です",
    "今日の自分を残せました",
    "書いてくれて、ありがとうございます",
    "書けた日も、書けなかった日も、どちらも大丈夫です",
  ],
  weekTitle: "今週の記録",
  // 書けなかった日は空欄のまま。×や警告色は使わない
  weekdays: ["日", "月", "火", "水", "木", "金", "土"],
};

// 段階の全体像。本人が「いまどこにいて、この先どうなるか」をイメージできるようにする
export const JOURNEY = {
  open: "復職までの流れ",
  title: "復職までの流れ",
  lead: "休職から復職までは、だいたいこんな流れです。調子は一直線には良くならず、波を描きながら少しずつ上がっていきます。",
  now: "いまここ",
  // 期間は出さない（「もう○か月なのに」と焦らせないため）
  paceNote: "進み方やかかる時間は、人によって違います。",
  stages: [
    { stage: "acute", body: "心と体を休ませる時期です。外に出られない日があっても、何もできなくても大丈夫です。" },
    { stage: "recovery", body: "生活のリズムを整えて、少しずつ活動を増やしていく時期です。調子が落ちる日があるのは自然なことです。" },
    { stage: "preReturn", body: "会社と一緒に、復職の日を決めていく時期です。最後の仕上げをします。" },
    { stage: "afterReturn", body: "働きながら、自分のペースを保つ時期です。崩れかけたときは、休職中に作った「自分の取説」を見返せます。" },
  ] satisfies { stage: Stage; body: string }[],
  close: "閉じる",
};

export const CONTACT = {
  title: "人事との連絡",
  fromHr: "人事から",
  replyTitle: "返信する",
  // 急性期は例文を選ぶだけ。回復期からは自分の言葉で書く（復職に向けた練習）
  replyPickNote: "選ぶだけで送れます",
  replyWriteNote: "自分の言葉で書いてみよう。短くて大丈夫です",
  replyExamplesLabel: "書き出しの例",
  examples: ["少しずつ良くなっています", "今は休むことに専念しています", "確認しました", "もう少し時間をください", "ありがとうございます"],
  send: "送る",
  cancel: "やめておく",
  sent: "送りました",

  visitTitle: "通院のあとに",
  visitButton: "通院してきました",
  visitNote: "選ぶだけで、人事に届きます",
  visitOptions: ["順調と言われました", "少し様子を見ることになりました", "薬が変わりました"],
  visitSent: "送りました。おつかれさまでした",
  visitBody: (option: string) => `通院してきました。${option}`,

  historyTitle: "会社に届いたもの",
  historyEmpty: "まだありません",
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
