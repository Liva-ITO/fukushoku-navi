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
  checkTitle: "次の段階への目安（焦らなくて大丈夫）",
  checkNote: "回復期に進むときは、心理の専門家との面談で一緒に確かめます",
  checkItems: [
    "通院・服薬ができている",
    "家族や主治医以外と少し話せる",
    "週2日は外出できる",
  ],
  checkAllDone: "次に進めそうか、心理の専門家と一緒に確かめてみよう",
  checkButton: "心理の専門家と話してみる",
  checkConfirm: "心理の専門家との面談を申し込みます。申し込むと、専門家から日程の連絡が届きます。申し込んだことは会社にも伝わります。話した内容は伝わりません。",
  checkConfirmYes: "申し込む",
  checkConfirmNo: "やめておく",
  checkApplied: "申し込みました。専門家から日程の連絡が届きます",
};

export type PrepPath = "rivatore" | "rivabiz" | "self";

export const RECOVERY = {
  introLines: [
    "回復期に入りました。ここからは、生活のリズムを少しずつ整えていく時期です。",
    "調子が落ちる日があるのは自然なことです。画面を見るのもつらい日もありますよね。そんな日は「今日はしんどい」を押すと、休むための表示だけになります。",
  ],
  introClose: "閉じる",
  stageNote: "生活のリズムを整えながら、次の一歩を考えはじめる時期です",

  pathTitle: "準備の進め方",
  pathNote: "復職に向けた準備は、2つの道から選べます。どちらを選んでも大丈夫です。途中で変えることもできます",
  pathRework: "リワークを使う",
  pathReworkNote: "専門のプログラムで、仲間と一緒に準備する",
  pathOptions: {
    rivatore: { name: "通うリワーク", note: "通いながら、仲間と一緒にトレーニングする" },
    rivabiz: { name: "オンラインのリワーク", note: "自宅からオンラインで参加できる" },
    self: { name: "自分のペースで準備する", note: "このアプリの記録やガイドを使って、自分で準備を進める" },
  } satisfies Record<PrepPath, { name: string; note: string }>,
  pathChosen: (name: string) => `いまの進め方：${name}`,
  pathChange: "変える",

  // 準備期に進む目安。「やること」ではなく「できている状態」で書く。次に進むかを決めるのはアプリではなく面談
  // ※仮置き。厚生労働省「心の健康問題により休業した労働者の職場復帰支援の手引き」の判断基準の例を参考にした。基準はこれから詰める
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
  // 次に進むかの確かめ方は、準備の進め方で変わる。リワークはプログラムの中で確かめるので、ここから申し込まない
  nextNote: {
    none: "次に進むかどうかは、面談で一緒に確かめます。準備の進め方を選ぶと、確かめ方がここに出ます",
    rework: "次に進むかどうかは、プログラムのスタッフと一緒に確かめます",
    self: "次に進むかどうかは、会社との面談で確かめます",
  },

  restButton: "今日はしんどい",

  // 自分のペースで準備する人向け。ひとりで抱え込まないよう、本と復職コーディネーターへの相談の入口を置く
  selfTitle: "自分のペースで準備するときに",
  booksTitle: "おすすめの本",
  books: [
    { title: "メンタル不調者のための 脱うつ 書くだけ30日ワーク", note: "書き込みながら、復職の準備を進めるワーク" },
    { title: "今後掲載します", note: "" },
    { title: "今後掲載します", note: "" },
  ],
  selfConsult: "ひとりで進めていて迷ったら、復職コーディネーターに相談できます",
  selfConsultButton: "相談する",

  meetCompanyNote: "目安に近づいてきたと感じたら、申し込めます",
  meetCompany: "会社と面談する",
  meetCompanyConfirm: "会社との面談を申し込みます。申し込むと、会社から日程の連絡が届きます。",
  meetCompanyApplied: "申し込みました。会社から日程の連絡が届きます",
  confirmYes: "申し込む",
  confirmNo: "やめておく",
};

// 相談タブ。復職コーディネーターとの面談は、段階を進めるためではなく、相談したいときに本人が選ぶもの
// 申し込んだこと・リクエストしたことは会社に伝わる（会社が把握している必要がある）。話した内容は伝わらない
// チケットの残りは人事側で管理し、本人には数も「チケット」という言葉も見せない。
// 残りがあれば「申し込む」、なければ「リクエスト」（ニーズが人事に見える）。どちらも必ずコーディネーターから返事が来る
export const CONSULT = {
  title: "相談",
  coordinatorTitle: "復職コーディネーターに相談する",
  coordinatorNote: "復職のことや、休職中の過ごし方など、相談したいときに使えます",
  apply: "面談を申し込む",
  applyConfirm: "復職コーディネーターとの面談を申し込みます。申し込むと、コーディネーターから日程の連絡が届きます。申し込んだことは会社にも伝わります。話した内容は伝わりません。",
  applyYes: "申し込む",
  applied: "申し込みました。コーディネーターから日程の連絡が届きます",
  request: "面談をリクエストする",
  requestConfirm: "復職コーディネーターとの面談をリクエストします。リクエストしたことは会社にも伝わります。話す内容は伝わりません。",
  requestYes: "リクエストする",
  requestedTitle: "リクエストを受け付けました",
  requestedLines: [
    "面談の日程か、いまは難しい場合はそのことを、7日以内にコーディネーターからお知らせします。",
    "急いで誰かと話したいときは、主治医に相談してください。",
  ],
  no: "やめておく",
  // 公的な窓口。番号と内容は厚生労働省のページで確かめた（2026-11-02）
  publicPlaces: [
    { name: "主治医", tel: "", note: "通っている医療機関に連絡できます" },
    {
      name: "こころの健康相談統一ダイヤル",
      tel: "0570-064-556",
      note: "電話をかけた地域の、公的な相談窓口につながります（通話料がかかります）",
    },
    { name: "まもろうよこころ（厚生労働省）", tel: "", note: "電話やSNSで相談できる窓口を探せます" },
  ],
};

export const REST = {
  lines: [
    "今日は、休む日にして大丈夫です。",
    "調子に波があるのは、回復の途中ではよくあることです。段階は変わりません。会社にも伝わりません。",
  ],
  recordEntry: "日記",
  talkTitle: "過ごし方などを相談したいときは",
  talkNote: "復職コーディネーターに相談できます",
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
  tickets: "面談チケット",
  ticketsYes: "残りあり",
  ticketsNo: "なし",
  intro:
    "休職した社員と、会社の人事・産業保健スタッフ（産業医・保健師）をつなぐサービスの試作です。上のバーで、本人の画面と会社の画面を行き来できます。",
  introClose: "はじめる",
  notAi: "AIが相談や診断をするアプリではありません。判断するのは、医師・産業医・会社・支援機関の専門家です。",
};

// 会社（人事・産業保健）の画面。本人が提出したもの・やり取り・申し込みがあったことだけを出す。
// 日記の中身、気分、休息モードかどうか、面談で話した内容は出さない
export const HR = {
  title: "休職者の状況",
  people: "休職中",
  peopleUnit: (n: number) => `${n}人`,
  todoCount: "対応が必要なこと",
  todoUnit: (n: number) => `${n}件`,
  tickets: "面談チケットの残り（会社全体）",
  ticketsUnit: (n: number) => `${n}枚`,
  refill: "5枚補充する",
  ticketsNote: "本人には枚数を見せていません。残りがないときは、本人からは「リクエスト」として届きます",

  todoTitle: "対応が必要なこと",
  todoEmpty: "いまはありません",
  open: "開く",
  done: "対応済みにする",
  received: (d: string) => `${d} 受付`,
  dueLeft: (n: number) => `期限まであと${n}日`,

  listTitle: "休職者の一覧",
  cols: {
    name: "氏名",
    dept: "部署",
    stage: "段階",
    days: "休職日数",
    end: "休職期間の満了日",
    rework: "リワーク",
    news: "新着",
  },
  days: (n: number) => `${n}日`,
  newsCount: (n: number) => `${n}件`,
  newsNote: "新着：本人から届いた連絡・提出物・申し込みのうち、まだ開いて見ていないもの",
  newTag: "新着",
  newTitle: "新しく届いたもの",
  reworkNone: "未定",
  reworkSelf: "自分のペース",

  notifyTitle: "こんな通知が届きます",
  notifyBody: "【復職ナビポータル】対応が必要なことが1件あります",
  notifyNote: "本番では担当者のメールやチャットに届きます。名前や中身は書きません",

  // 社員A（本人画面と連動）の「対応が必要なこと」
  todoA: {
    coordinatorApplied: "復職コーディネーターとの面談の申し込みがありました",
    coordinatorRequested: "復職コーディネーターとの面談のリクエストがありました（チケットの残りがありません）",
    companyMeeting: "会社との面談の申し込みがありました",
    psychMeeting: "心理の専門家との面談の申し込みがありました（回復期への切り替えの確認）",
    psychDone: "心理の専門家との面談が済みました。回復期に進めるか確認してください",
    newFromPerson: (n: number) => `本人から連絡が届いています（${n}件）`,
  },

  meetingEvent: {
    psych: "心理の専門家との面談の申し込み",
    psychDone: "心理の専門家との面談が済んだ",
    company: "会社との面談の申し込み",
    coordinatorApplied: "復職コーディネーターとの面談の申し込み",
    coordinatorRequested: "復職コーディネーターとの面談のリクエスト",
  },

  back: "一覧に戻る",
  historyTitle: "これまでの経緯",
  historyNote: "担当が変わっても流れが分かるよう、段階の切り替え・やり取り・提出物・申し込みを日付順に並べています",
  event: {
    stage: (label: string) => `段階：${label}`,
    fromHr: "人事から",
    fromPerson: "本人から",
    meeting: "申し込み",
    submit: "提出",
    done: "対応済み",
  },
  hidden: "日記の中身・気分・休息モードかどうか・面談で話した内容は、会社には表示されません",

  stageTitle: "段階",
  // 段階ごとに、人事がすることを一言で出す
  stageGuide: {
    acute: "休むことを優先する時期です。連絡は最小限にし、返信を求めない連絡にしてください",
    recovery: "生活のリズムを整える時期です。リワークの利用や、面談の申し込みに対応します",
    preReturn: "復職に向けた手順を、本人と一緒に進める時期です",
    afterReturn: "復職しました",
  } satisfies Record<Stage, string>,
  // 段階は人事が「次へ進める」。好きな段階を選ぶ操作は置かない
  nextLabel: { acute: "回復期に進める", recovery: "準備期に進める" } as Partial<Record<Stage, string>>,
  psychNone: "心理の専門家との面談：まだ申し込みはありません",
  psychApplied: "心理の専門家との面談：申し込みがありました",
  psychDone: "心理の専門家との面談：済みました",
  psychDoneButton: "面談が済んだことを記録する",
  nextLockedAcute: "心理の専門家との面談が済むと、回復期に進められます",
  confirmNext: (name: string, from: string, to: string) =>
    `${name}さんの段階を「${from}」から「${to}」に進めます。本人の画面も、${to}の内容に変わります。`,
  nextYes: "進める",
  backLabel: "前の段階に戻す",
  confirmBack: (name: string, from: string, to: string) =>
    `${name}さんの段階を「${from}」から「${to}」に戻します。戻す前に、本人と面談して理由を説明してください。`,
  backYes: "戻す",
  confirmNo: "やめておく",
  preReturnSoon: "復職を確定する操作は、これから作ります",
  stageDemoOnly: "デモでは、社員Aだけ操作できます",

  sendTitle: "本人に連絡する",
  sendNote: "例文から選んで、書きかえて送れます",
  templates: [
    "その後、体調はいかがですか。返信は急ぎません。",
    "手続きのご案内です。急ぎではありませんので、落ち着いたときにご確認ください。",
    "面談の日程について、ご都合のよい日を教えてください。",
  ],
  noReply: "「返信は不要です」をつける",
  send: "送る",
  sent: "送りました。本人の画面に届いています",
};
