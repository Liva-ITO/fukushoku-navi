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
  // 人事が復職を確定したら、本人の画面に出す
  returnDay: (d: string) => `復職日は、${d}です`,
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
  // 「目安」だと開かれないので「次の段階へ」。何をすれば進めるのかを、道すじで見せる（ナビなので）
  checkTitle: "次の段階へ",
  checkNote: "焦らなくて大丈夫です。こんな順番で、回復期に進みます",
  checkSteps: ["下の3つにチェックがつく", "復職コーディネーターと面談する", "会社にこれからの希望を伝えて、回復期へ"],
  checkStepWish: "希望を送ってください。ホームのいちばん上から送れます",
  checkStepSent: "会社に伝えました。回復期に進めるかは、会社が決めます",
  checkStepDate: (slot: string) => `${slot}に面談します。済んだら、次にすることがここに出ます`,
  checkHere: "いまここ",
  checkItems: [
    "通院・服薬ができている",
    "家族や主治医以外と少し話せる",
    "週2日は外出できる",
  ],
  checkAllDone: "3つそろいました。次は、復職コーディネーターとの面談です。進めそうか、これからの過ごし方も含めて、一緒に確かめましょう",
  checkButton: "復職コーディネーターと話してみる",
  checkConfirm: "復職コーディネーターとの面談を申し込みます。申し込むと、コーディネーターから日程の連絡が届きます。申し込んだことは会社にも伝わります。話した内容は伝わりません。",
  checkConfirmYes: "申し込む",
  checkConfirmNo: "やめておく",
  checkApplied: "申し込みました。コーディネーターから日程の連絡が届きます",
  busyCoord: "いまは心理の専門家との面談を申し込んでいます。済んだら、こちらも申し込めます",
  // 復職コーディネーターとの面談のあと、これからの希望を本人が会社に伝える。面談の中身は伝わらない。判断するのは会社
  wishTitle: "これからのことを、会社に伝える",
  wishNote: "コーディネーターとの面談、おつかれさまでした。いまの気持ちに近いほうを選んでください。話した内容は、会社には伝わりません",
  wishOptions: { go: "回復期に進みたい", rest: "もう少し休みたい" },
  wishPreview: "会社に届く文",
  wishBody: (w: string) => `復職コーディネーターとの面談が済みました。これからのことについて：${w}`,
  wishSent: (w: string) => `会社に伝えました：${w}`,
  wishChange: "気持ちが変わったら、もう一度伝える",
  wishSend: "会社に送る",
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
  // 通所でもオンラインでも、スタッフと一緒に、仲間とのグループワークで取り組む（違いは、通うか自宅からか）
  pathReworkNote: "スタッフと一緒に、仲間とのグループワークで復職を目指す",
  pathReworkPick: "どちらで参加しますか",
  // リワークの説明（代表が確認済み）
  reworkAboutTitle: "リワークとは",
  reworkAbout: [
    "休職している人が、復職に向けて準備するためのプログラムです。",
    "決まった時間に参加することで、生活のリズムを整えていきます。",
    "スタッフと一緒に、仲間とのグループワークで、休職に至った背景をふり返り、また調子を崩さないための工夫を考えます。",
    "復職の時期や、会社とのやり取りも、スタッフと一緒に考えられます。",
    "通うか、自宅からオンラインで参加するかの違いがあります。どちらが合うかは、復職コーディネーターに相談できます。",
  ],
  pathOptions: {
    rivatore: { name: "通うリワーク", note: "会場に通って、仲間と一緒にグループで取り組む" },
    rivabiz: { name: "オンラインのリワーク", note: "自宅からオンラインで、仲間と一緒にグループで取り組む" },
    // リワークを使っても基本は自分のペースなので「自分のペース」とは言わない
    self: { name: "自分で準備する", note: "このアプリの記録やガイドを使って、自分で準備を進める" },
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

  // 目安は急性期と同じく、たたんでおき、自分でチェックできる。そろったときの一言は、進め方で変わる
  nextAllDone: {
    none: "",
    rework: "目安がそろってきました。プログラムのスタッフに伝えてみよう",
    self: "目安がそろってきました。会社との面談を申し込んでみよう",
  },

  restButton: "今日はしんどい",

  // 自分で準備する人向け。ひとりで抱え込まないよう、本と復職コーディネーターへの相談の入口を置く
  selfTitle: "自分で準備するときに",
  // 自分で準備する人の道すじ（代表が確認済み。中身はスタッフとさらに詰める）
  selfStepsTitle: "準備の道すじ（目安）",
  selfStepsNote: "順番どおりでなくて大丈夫です。行ったり来たりしながら進みます",
  selfSteps: [
    { name: "生活のリズムを整える", body: "起きる時間をそろえて、日記で睡眠と食事を残す" },
    { name: "外に出る時間をつくる", body: "散歩から始めて、通勤と同じ時間帯に出かけてみる" },
    { name: "仕事に近いことをしてみる", body: "図書館などで、決まった時間、読む・書く・調べる" },
    { name: "休職をふり返る", body: "何がしんどかったか、調子を崩す前のサインと、そのときの対処を考える" },
  ],
  booksTitle: "おすすめの本",
  books: [
    { title: "メンタル不調者のための 脱うつ 書くだけ30日ワーク", note: "書き込みながら、復職の準備を進めるワーク" },
    { title: "今後掲載します", note: "" },
    { title: "今後掲載します", note: "" },
  ],
  selfConsult: "ひとりで進めていて迷ったら、復職コーディネーターに相談できます",
  selfConsultButton: "相談する",
  // 自分で準備する人は、生活の記録をまとめたレポートを会社に出す。会社はこれを見て判断する
  report: {
    title: "会社に出すレポート",
    needFirst: "会社との面談は、レポートを会社に送ってから申し込めます。会社はレポートを見て、面談にのぞみます",
    goReport: "レポートを作る",
    note: "自分で準備するときは、生活の記録をまとめたレポートを会社に出します。会社は、これを見て、準備期に進めるかや、復職できるかを判断します。",
    open: "レポートを作る",
    again: "新しく作って送る",
    sent: (d: string) => `${d}に会社に送りました`,
    fromDiary: (period: number, days: number) => `日記からまとめた部分（この${period}日のうち、書いた日${days}日）`,
    noDiary: "日記がまだないので、睡眠と外出はまとめられません。日記を書くと、ここに入ります",
    condition: "体調の変化",
    conditionHint: "例：朝の起きづらさが減ってきた。午後に疲れが出やすい",
    reason: "休職に至った理由",
    reasonHint: "例：仕事を一人で抱えこみ、睡眠が削られていった",
    measures: "その対策（具体的に）",
    measuresHint: "例：週1回、上司に仕事の量を相談する。0時までに寝る",
    preview: "会社に届く内容を見る",
    previewTitle: "会社に届く内容",
    send: "会社に送る",
    edit: "書き直す",
    cancel: "やめておく",
  },

  meetCompanyNote: "目安に近づいてきたと感じたら、申し込めます",
  meetCompany: "会社と面談する",
  meetCompanyConfirm: "会社との面談を申し込みます。申し込むと、会社から日程の連絡が届きます。",
  meetCompanyApplied: "申し込みました。会社から日程の連絡が届きます",
  meetCompanyScheduled: (d: string) => `会社との面談は、${d}に決まりました`,
  meetCompanyDone: "会社との面談が済みました",
  confirmYes: "申し込む",
  confirmNo: "やめておく",
};

// 相談タブ。復職コーディネーターとの面談は、段階を進めるためではなく、相談したいときに本人が選ぶもの
// 申し込んだこと・リクエストしたことは会社に伝わる（会社が把握している必要がある）。話した内容は伝わらない
// チケットの残りは人事側で管理し、本人には数も「チケット」という言葉も見せない。
// 残りがあれば「申し込む」、なければ「リクエスト」（ニーズが人事に見える）。どちらも必ずコーディネーターから返事が来る
export const CONSULT = {
  title: "相談",
  // 相談の相手。急性期と休息モード（しんどいとき）は心理の専門家、それ以外は復職コーディネーター
  who: { coord: "復職コーディネーター", psych: "心理の専門家" },
  title_: { coord: "復職コーディネーターに相談する", psych: "心理の専門家に相談する" },
  note_: {
    coord: "復職のことや、休職中の過ごし方など、相談したいときに使えます",
    psych: "いまのしんどさや、気持ちの整理など、話したいときに使えます",
  },
  apply: "面談を申し込む",
  applyConfirm: (name: string) => `${name}との面談を申し込みますか？ 日程の候補は「連絡」に届きます。申し込んだことは会社にも伝わりますが、話した内容は伝わりません。`,
  applyYes: "はい、申し込む",
  applied: (name: string) => `申し込みました。${name}から日程の連絡が届きます`,
  request: "面談をリクエストする",
  requestConfirm: (name: string) => `${name}との面談をリクエストしますか？ お返事は「連絡」に届きます。リクエストしたことは会社にも伝わりますが、話す内容は伝わりません。`,
  requestYes: "はい、リクエストする",
  requestedTitle: "リクエストを受け付けました",
  requestedLines: (name: string) => [
    `面談の日程か、いまは難しい場合はそのことを、7日以内に${name}からお知らせします。`,
    "急いで誰かと話したいときは、主治医に相談してください。",
  ],
  no: "やめておく",
  // 日程は、届いた候補から選ぶだけ（メールでやり取りするより負担が少ない）
  decidedNote: (slot: string) => `面談は、${slot}に決まりました`,
  // 支援機関（コーディネーター・心理の専門家）からのお知らせ。会社には見えない
  inboxTitle: "お知らせ",
  inboxNote: "コーディネーターや専門家からのお知らせです。会社には見えません",
  newTag: "新しい",
  newLink: (n: number) => `新しいお知らせがあります（${n}件）`,

  msgOffer: "面談の日程の候補です。ご都合のよいものを選んでください。オンラインで行います。",
  slotSets: [
    ["11月10日（火）10:00", "11月11日（水）14:00", "11月13日（金）10:00"],
    ["11月16日（月）10:00", "11月17日（火）15:00", "11月19日（木）11:00"],
  ],
  // 回復期に進む前の面談の日程の候補（チケットの面談と同じ日時が並ばないように）
  psychSlotSets: [
    ["11月9日（月）11:00", "11月12日（木）15:00", "11月14日（土）10:00"],
    ["11月18日（水）11:00", "11月20日（金）14:00", "11月21日（土）10:00"],
  ],
  // 急性期は、面談は1つずつ（同じ支援機関の人と話すので、日程調整を2つ並べない）
  busyPsych: "復職コーディネーターとの面談を申し込んでいます。いまのしんどさも、その面談で話せます",
  // 回復期に進む前の面談が済んだら、コーディネーターから届く。次にすることを案内する（ナビなので）
  msgGateDone: "面談、ありがとうございました。面談が済んだことは、会社に伝えました（話した内容は伝えていません）。次は、これからの希望を会社に伝えましょう。このお知らせのすぐ下から送れます。",
  goHome: "ホームで希望を伝える",
  noneFit: "どれも難しい",
  noneFitConfirm: "別の日程の候補をお願いします。",
  noneFitYes: "お願いする",
  // 日程の候補は、やることが書いてある枠の中でそのまま選べるようにする（お知らせは履歴だけ）
  offerPick: "日程の候補が届いています。ご都合のよいものを選んでください",
  offerGo: "日程の候補が届いています。「連絡」で選べます",
  psychTitle: "復職コーディネーターとの面談",
  pickConfirm: (slot: string) => `${slot}で決めます。`,
  pickYes: "これで決める",
  msgDecided: (slot: string) => `${slot}に決まりました。オンラインで行います。前日に、参加のしかたをお送りします。`,
  msgNoneFit: "わかりました。別の候補をお送りします。",
  pickedDone: "選びました",
  msgAccepted: "リクエストを受け付けました。面談の日程は、あらためてお知らせします。",
  msgDeclined:
    "今回は、面談の日程を用意できませんでした。申し訳ありません。また相談したくなったら、いつでもリクエストできます。急いで誰かと話したいときは、主治医に相談してください。",
  // 公的な窓口。番号と内容は厚生労働省のページで確かめた（2026-11-02）
  // 相談タブのいちばん下に、段階やチケットに関係なくいつも出す（強い言葉や目立つ色にしない）
  otherTitle: "ほかの相談先",
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
  // 急性期と休息モード：しんどいときの相談は、心理の専門家
  hardTitle: "しんどいときは",
  hardNote: "心理の専門家に相談できます",
  back: "いつもの画面に戻る",
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
  // 生活記録表の「活動時間」。会社に出すレポートで、平均とグラフにする
  active: "日中、横にならずに過ごした時間",
  activeOptions: [2, 4, 6, 8, 10],
  activeHours: (h: number) => `${h}時間${h >= 10 ? "以上" : "くらい"}`,
  minutes: (n: number) => `${n}分`,
  mood: "気分",
  // 気分は言葉を出さず、顔だけで選ぶ
  moodFaces: ["😣", "😟", "😐", "🙂", "😊"],
  moodEnds: ["つらい", "いい"],
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
  short: { acute: "急性期", recovery: "回復期", preReturn: "準備期", afterReturn: "復職" } satisfies Record<Stage, string>,
  nowTag: "いまの段階",
};

export const CONTACT = {
  // 連絡タブ：やり取りは全部ここ。人事からと、コーディネーター・専門家からを分けて並べる
  title: "連絡",
  supportTitle: "コーディネーター・専門家から",
  supportNote: "日程の候補などが届きます。会社には見えません",
  // ホームには件名だけを出す（急性期は1件、回復期からは3件まで）。押すと連絡タブで本文を読む
  inboxTitle: "人事からのお知らせ",
  more: (n: number) => `ほか${n}件`,
  replyOpen: "返信する",
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
  visitNote: "選んで送るだけで、人事に届きます",
  visitPreview: "人事に届く文",
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
  // スマホでは1行にたたみ、いまの状態だけを出す
  summary: (view: "person" | "hr", stage: string, rest: boolean) =>
    view === "hr" ? "人事" : `本人・${stage}${rest ? "・休息モード" : ""}`,
  tickets: "面談チケット",
  gateDone: "面談が済む",
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
  refillTodo: "チケットを補充する",
  refillConfirm: "面談チケットを5枚補充します。待っているリクエストがあれば、受け付けられます",
  refillYes: "補充する",
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
  sortHint: "見出しを押すと並び替えられます",
  days: (n: number) => `${n}日`,
  newsCount: (n: number) => `${n}件`,
  newsNote: "新着：本人から届いた連絡・提出物・申し込みのうち、まだ開いて見ていないもの",
  newTag: "新着",
  newTitle: "新しく届いたもの",
  reworkNone: "未定",
  reworkSelf: "自分で準備",

  notifyTitle: "こんな通知が届きます",
  notifyBody: "【復職ナビポータル】対応が必要なことが1件あります",
  notifyNote: "本番では担当者のメールやチャットに届きます。名前や中身は書きません",

  // 社員A（本人画面と連動）の「対応が必要なこと」
  todoA: {
    // 人事にできるのは、チケットを補充するかどうかを決めることだけ
    coordinatorRequested: (name: string) => `${name}との面談のリクエストがありました。チケットを補充すると受け付けられ、日程の調整に進みます`,
    companyMeeting: "会社との面談の申し込みがありました",
    psychMeeting: "復職コーディネーターとの面談の申し込みがありました（回復期への切り替えの確認）",
    psychDone: "復職コーディネーターとの面談が済みました。本人の希望が届いたら、回復期に進めるか決めてください",
    wishArrived: "本人から、これからの希望が届きました。回復期に進めるか決めてください",
    newFromPerson: (n: number) => `本人から連絡が届いています（${n}件）`,
  },

  // 面談は1件を1行にし、状態を印で出す
  meetingTitle: "面談",
  meetingNote: "面談で話した内容は、会社には届きません。届くのは、申し込みと実施の事実だけです",
  meetingName: {
    psych: "回復期に進む前の面談（復職コーディネーター）",
    company: "会社との面談",
    coordinator: (name: string) => `${name}との面談`,
    coordinatorRequest: (name: string) => `${name}との面談のリクエスト`,
    occ: "産業医との面談",
  },
  meetingStatus: {
    applied: "申し込み",
    scheduled: (d: string) => `日程決定 ${d}`,
    done: "実施済み",
    requested: "リクエスト",
    notified: "日程を連絡済み",
    adjusting: "日程を調整中",
    decided: "日程決定",
    declined: "今回は難しいと連絡済み",
  },
  companyDate: "面談の日",
  companySchedule: "日程を決める",
  companyDone: "実施済みにする",
  demoReport: "デモ用：支援機関から届く報告",
  reportDone: "実施した",
  reportNotified: "日程を連絡した",
  reportScheduled: "日程の候補を送った",
  waitingPick: "本人が日程を選ぶのを待っています",
  reportDeclined: "今回は難しいと連絡した",
  noReplyTag: "返信は不要",

  back: "一覧に戻る",
  historyTitle: "これまでの経緯",
  historyNote: "担当が変わっても流れが分かるよう、段階の切り替え・やり取り・提出物・申し込みを日付順に並べています",
  event: {
    stage: (label: string) => `段階：${label}`,
    fromHr: "人事から",
    fromPerson: "本人から",
    meeting: "面談",
    submit: "提出",
    done: "対応済み",
    decision: "会社の判断",
  },
  hidden: "日記の中身・気分・休息モードかどうか・面談で話した内容は、会社には表示されません",

  stageTitle: "段階",
  // 段階ごとに、人事がすることを一言で出す
  stageGuide: {
    acute: "休むことを優先する時期です。連絡は手続きなど必要なものに絞ってください。手続きの連絡のときに、あわせて様子をうかがうと、本人の負担が少なくなります",
    recovery: "生活のリズムを整える時期です。リワークの利用や、面談の申し込みに対応します",
    preReturn: "復職に向けた手順を、本人と一緒に進める時期です",
    afterReturn: "復職しました",
  } satisfies Record<Stage, string>,
  // 段階は人事が「次へ進める」。好きな段階を選ぶ操作は置かない
  nextLabel: { acute: "回復期に進める", recovery: "準備期に進める" } as Partial<Record<Stage, string>>,
  psychNone: "復職コーディネーターとの面談：まだ申し込みはありません",
  psychApplied: "復職コーディネーターとの面談：申し込みがありました",
  psychDone: "復職コーディネーターとの面談：済みました",
  wishLabel: "本人の希望",
  wishNone: "まだ届いていません（面談のあと、本人が選んで送ります）",
  wishDecide: "判断するのは会社です。本人の希望と、これまでのやり取りを見て決めてください",
  nextLockedAcute: "復職コーディネーターとの面談が済むと、回復期に進められます",
  confirmNext: (name: string, from: string, to: string) =>
    `${name}さんの段階を「${from}」から「${to}」に進めます。本人の画面も、${to}の内容に変わります。`,
  nextYes: "進める",
  backLabel: "前の段階に戻す",
  confirmBack: (name: string, from: string, to: string) =>
    `${name}さんの段階を「${from}」から「${to}」に戻します。戻す前に、本人と面談して理由を説明してください。`,
  backYes: "戻す",
  confirmNo: "やめておく",
  // 準備期：復職までの手順（職場復帰支援の手引き 第2〜第4ステップ）。どの手順からでも押せ、確定だけは全部そろってから
  returnTitle: "復職までの手順",
  settingsTitle: "会社の設定",
  settingsNote: "会社の決まり（就業規則など）に合わせて、最初に一度決めておきます。全員に同じ設定が使われます",
  settingsDemoNote: "デモでは、「準備期に進める条件」と「復職までの手順の順番」が画面に反映されます。ほかの項目は見本です",
  settingsMore: "設定の項目は、運用に合わせてこれから増やします",
  maxLeaveLabel: "休職期間（最長）",
  maxLeaveOptions: ["6か月", "1年", "1年6か月", "2年", "勤続年数で変わる"],
  maxLeaveNote: "休職者を登録するときの、満了日の目安に使います",
  sickLeaveLabel: "病気休暇",
  sickLeaveYes: "あり",
  sickLeaveNo: "なし",
  sickLeaveDays: "日数",
  sickLeaveDaysUnit: "日",
  sickLeaveNote: "休職の前に使える休暇があるかどうか。休職の開始日の考え方に関わります",
  // 準備期に進める条件。判断するのは会社。リワークの施設が判断を返すことはせず、月次レポートの事実（出席率など）と照らし合わせる
  prepCondTitle: "準備期に進める条件",
  prepCondNote: "選んだ条件がそろうと、人事の画面に［準備期に進める］が出ます。判断するのは会社です",
  prepCond: {
    attendance: (rate: number) => `リワークの月次レポートで、出席率が${rate}%以上（リワークを使う人）`,
    selfCheck: "本人が「準備期に進む目安」をそろえている（自分で準備する人）",
    companyMeeting: "会社との面談が済んでいる（自分で準備する人）",
    selfReport: "本人から生活の記録のレポートが届いている（自分で準備する人）",
  },
  prepCondRate: "出席率",
  rehabLabel: "リハビリ出勤（試し出勤）",
  rehabYes: "あり",
  rehabNo: "なし",
  rehabNote: "復職の前に、試しに出勤する制度があるかどうか。準備期の手順に関わります",
  returnOrderLabel: "復職までの手順の順番",
  returnOrderNow: (order: string) => `手順の順番は、会社の設定で決めています（${order}）`,
  returnOrders: {
    occFirst: "産業医との面談 → 主治医の診断書",
    doctorFirst: "主治医の診断書 → 産業医との面談",
  },
  returnOrderNote: {
    occFirst: "産業医との面談で、職場で求められることを確かめてから、本人に主治医の診断書をお願いしてもらいます",
    doctorFirst: "本人から主治医の診断書を受け取ってから、産業医と面談します",
  },
  stepOcc: "産業医との面談",
  stepOccNote: "産業医がいない会社は、会社が決めた担当者との面談",
  stepDoctor: "主治医の診断書（復職できるという判断）",
  doctorReceived: "受け取った",
  stepPlan: "復職日と配慮",
  returnDate: "復職日",
  accommodation: "就業上の配慮（書かなくてもかまいません）",
  accommodationExample: "例：最初の1か月は残業なし",
  savePlan: "決める",
  editPlan: "変える",
  reschedule: "日程を変える",
  undoDone: "実施済みを取り消す",
  undoReceived: "受け取りを取り消す",
  stepDone: "済み",
  stepNotYet: "まだ",
  confirmReturnLabel: "復職を確定する",
  confirmReturnLocked: "4つの手順がそろうと押せます",
  // 診断書は最後の確認（主治医の「復職可」が先に出ると、本人がその時点で戻れると受け取りやすい）。確定は診断書がそろってから
  stepDecision: "会社の復職判断（主治医の診断書で最終確認）",
  // 回復期：会社の設定で選んだ条件を、本人ごとに「済み／まだ」で出す
  condTitle: "準備期に進める条件（会社の設定）",
  condMet: "済み",
  condNotYet: "まだ",
  condNoPath: "本人の準備の進め方が、まだ決まっていません",
  condLocked: "条件がそろうと、準備期に進められます",
  condNone: "この人に当てはまる条件は、設定されていません",
  reportArrive: "月次レポートが届く",
  // 自分で準備する人のレポート
  selfReportBody: (d: string) => `生活の記録のレポート（${d}）`,
  selfReportArrive: "レポートが届く",
  demoFromPerson: "デモ用：本人から届く",
  selfReportView: "届いたレポートを見る",
  selfReportNone: "生活の記録のレポート：まだ届いていません",
  // 産業医との面談の材料（会社の判断にも使う）
  occMaterial: "面談の材料",
  occMaterialSelf: "本人からの、生活の記録のレポート（いちばん新しいもの）",
  occMaterialRework: "リワークの月次レポート（いちばん新しいもの）",
  occMaterialNone: "まだ届いていません",
  rep: {
    activityChart: "日ごとの活動時間（日記から）",
    activityChartNote: "棒がない日は、日記に書いていない日です",
    period: "期間",
    periodBody: (p: number, d: number) => `この${p}日（日記を書いた日 ${d}日）`,
    sleep: "睡眠（平均）",
    sleepBody: (bed: string, wake: string, h: number) => `${bed}ごろ寝て、${wake}ごろ起きる（${h}時間）`,
    activity: "1日の活動時間（平均）",
    activityBody: (h: number) => (h > 0 ? `${h}時間くらい（横にならずに過ごした時間）` : "—"),
    out: "外出・運動",
    outBody: (d: number, m: number) => `${d}日（平均${m}分）`,
    condition: "体調の変化",
    reason: "休職に至った理由",
    measures: "その対策",
  },
  reportBody: (month: string, days: number, rate: number) => `リワークの月次レポート（${month}）：出席${days}日・出席率${rate}%`,
  stepDecisionNote: "産業医の意見を踏まえて、会社が決めます",
  // 産業医の意見：面談を実施済みにするときに残す。人事の画面だけ（本人には出さない）
  opinion: {
    title: "産業医の意見",
    verdict: "復職について",
    options: { ok: "復職できる", conditional: "条件つきで復職できる", notYet: "まだ難しい" },
    note: "就業上の配慮（書かなくてもよい）",
    noteExample: "例：残業なし。3か月は短時間勤務",
    save: "記録する",
    cancel: "やめておく",
    line: (v: string, n: string) => `産業医の意見：${v}${n ? `（配慮：${n}）` : ""}`,
    none: "産業医の意見：記録されていません",
  },
  decisionLocked: "産業医との面談が済むと、判断できます",
  decisionOk: "復職できると判断する",
  decisionOkConfirm: (name: string) =>
    `${name}さんは、復職できると判断します。このあと主治医の診断書を受け取ってから、復職を確定します。`,
  decisionNotYet: "もう少し準備が必要と判断する",
  decisionNotYetConfirm: (name: string) =>
    `${name}さんは、もう少し準備が必要と判断します。段階は準備期のままで、産業医との面談をもう一度行う形に戻ります。本人には、面談で理由を伝えてください。`,
  decisionYes: "判断する",
  decisionUndo: "判断を取り消す",
  decisionResult: { ok: "復職できる", notYet: "もう少し準備が必要" },
  confirmReturn: (name: string, date: string) =>
    `${name}さんの復職を確定します。復職日は${date}です。確定すると、段階が「復職（見守りモード）」に変わり、本人の画面に復職日が出ます。`,
  confirmReturnYes: "確定する",
  // 復職を確定した人は、会社からは見えなくなる。残すのは、会社が自分で決めた復職日と配慮だけ
  returnedTitle: "復職済み",
  // 休職期間中に会社に届いたものは、会社の記録として残す（再休職のときの参考に）。復職後の本人の画面は会社に見せない
  returnedNote: "復職を確定した人は、休職者の一覧から外れます。休職期間中の連絡・提出物・経緯は会社の記録として残り、ここから開いて見られます（再休職のときの参考に）。復職後の本人の画面は、会社には見えません",
  returnedReadOnly: "復職済みです。ここに出ているのは休職期間中の記録で、見るだけです。復職後の本人の画面は、会社には見えません",
  todoMark: (n: number) => `対応 ${n}件`,
  // 満了日が近いことは、満了日から自動で知らせる（見落とすと、退職扱いなどにつながる）
  todoEndNear: "休職期間の満了日が近づいています。延長が要るか、主治医・産業医の意見を早めに確かめましょう",
  endLeft: (n: number) => `あと${n}日`,
  afterReturnDate: (d: string) => `復職日：${d}`,
  afterReturnAccommodation: (t: string) => `就業上の配慮：${t}`,
  stageDemoOnly: "デモでは、社員Aだけ操作できます",

  // 送り先の取り違えを防ぐため、見出しと確認に名前を出す
  sendTitle: (name: string) => `${name}さんに連絡する`,
  sendNote: "例文から選んで、書きかえて送れます",
  // 例文は段階に合うものだけ出す。返信がいるかどうかは本文に書かず、「返信は不要です」の印で伝える
  // 急性期の連絡は手続きに合わせる（職場復帰支援の手引き 第1ステップ）
  templates: [
    { title: "体調のおうかがい", text: "その後、体調はいかがですか。無理のない範囲で過ごしてください。", noReply: true },
    {
      title: "傷病手当金の申請書",
      text: "傷病手当金の申請書をお送りします。主治医の記入が済んだら、送ってください。",
      noReply: false,
    },
    { title: "診断書のお願い", text: "休職の期間を延ばす場合は、主治医の診断書を送ってください。", noReply: false },
  ],
  templatesFromRecovery: [
    { title: "面談の日程", text: "面談の日程について、ご都合のよい日を教えてください。", noReply: false },
  ],
  subject: "件名",
  bodyLabel: "本文",
  noReply: "「返信は不要です」をつける",
  send: "送る",
  sendCheck: (name: string) => `${name}さんに、次の内容を送ります`,
  sendCheckSubject: (t: string) => `件名：${t}`,
  sendCheckNoReply: "「返信は不要です」をつけて送ります",
  sent: "送りました。本人の画面に届いています",
};

// 人事のデータ分析（数字はすべて見本）
export const ANALYTICS = {
  nav: { list: "休職者の一覧", analytics: "データ分析", settings: "会社の設定" },
  title: "データ分析",
  sample: "数字はすべて見本です（架空の会社・過去3年）",
  period: "過去3年",
  returnRate: "復職率",
  returnRateNote: (n: number) => `過去3年・休職した${n}人のうち`,
  relapse: "復職後1年以内の再休職率",
  relapseNote: (n: number) => `復職した${n}人のうち`,
  avgDays: "平均休職日数",
  avgDaysNote: "復職した人",
  thisYear: "今年度の休職発生",
  thisYearNote: "11月4日時点",
  // 「リワークの有無」ではなく、本人が選べる過ごし方ごとに並べる。会社が自社の数字で確かめるための画面
  pathTitle: "回復期の過ごし方と復職",
  pathNote: "自社の休職者の数字で、過ごし方ごとの違いを確かめられます（過去3年）",
  paths: { office: "通うリワーク", online: "オンラインのリワーク", self: "自分で準備" },
  peopleCount: (n: number) => `${n}人`,
  perfTitle: "復職後のパフォーマンス",
  perfNote: (n: number) => `復職6か月後の上司アンケート・回復期の過ごし方別（回答${n}人）`,
  perfLevels: ["期待以上", "期待どおり", "やや下回る", "下回る"],
  byDept: "部署別の休職発生数",
  byAge: "年代別",
  byJob: "職種別",
  notes: [
    "数字はすべて見本で、実際の会社のデータでも、支援の効果を示すものでもありません",
    "人数の少ない区分は、個人が特定されないよう、本番では表示の基準を設けます",
    "本人の日記・気分・休息モード、面談で話した内容は、集計にも使いません",
  ],
};

// 使い始め（本番の想定）：人事が招待を送り、本人は自分の個人アカウント（Google・Apple・LINE など）で始める。
// 会社のアカウントやパスワードは使わない（復職後も、会社から見えない形で使い続けられるようにするため）。
// デモでは本物のログインは作らず、見本の画面だけを置く
export const COMPANY_NAME = "サンプル株式会社";

export const WELCOME = {
  lead: (company: string) => `${company}の人事から、ご案内が届いています`,
  about: "休んでいるあいだの過ごし方と、会社との連絡を、ひとつにまとめておく場所です。",
  account: "ご自分のアカウントで始めてください。会社のアカウントは使いません。復職したあとも、会社からは見えない形で使い続けられます。",
  records: "休職中に会社に送った連絡や提出物は、会社の記録として残ります。日記や気分は、会社には届きません。",
  providers: ["Googleで始める", "Appleで始める", "LINEで始める"],
  demoNote: "デモなので、どれを押してもそのまま始まります（実際のログインはしません）",
};

export const INVITE = {
  open: "休職者を登録する",
  title: "休職者を登録する",
  note: "入力した内容で登録し、本人に使い始めの案内を送ります。本人は自分の個人アカウントで始めるので、会社がパスワードを発行・管理することはありません。",
  name: "氏名",
  dept: "部署",
  age: "年代",
  ages: ["20代", "30代", "40代", "50代以上"],
  job: "職種",
  jobs: ["技術職", "営業職", "事務職", "管理職"],
  leaveStart: "休職の開始日",
  leaveEnd: "休職期間の満了日",
  // 会社から見た、復職に向けた課題。会社の復職判断と、産業医との面談で参考にする。
  // オンラインのリワークを使う場合は、この見立てがプログラムに渡り、取り組みの土台になる
  issues: "復職に向けた課題（会社の見立て）",
  issuesNote: "休職に至った背景や、職場で気になっていたこと。本人の画面には出ません。会社の復職判断と、産業医との面談で参考にします。オンラインのリワークを使う場合は、プログラムのスタッフにも渡り、取り組みの土台になります",
  issuesExample: "例：業務が重なると、ひとりで抱え込み、相談が遅れがち",
  sendTo: "案内の送り先",
  sendToOptions: { mail: "本人の個人のメールアドレス", line: "本人のLINE" },
  sendToNote: "会社のメールアドレスには送りません。デモでは、実際には送りません。",
  send: "登録して案内を送る",
  sent: (name: string) => `${name}さんを登録し、案内を送りました。本人が始めると、段階が「急性期」になります`,
  back: "一覧に戻る",
  pendingTag: "まだ始めていません",
  pendingNote: "本人がまだ始めていません。始めると、ここに段階や連絡が出ます",
  event: "登録して案内を送った",
  issuesTitle: "復職に向けた課題（会社の見立て）",
  issuesNone: "登録のときに入力されていません",
  issuesRef: "登録のときに入力した課題を見る",
  issuesSharedRework: "オンラインのリワークを使っているので、この見立てはプログラムのスタッフにも渡り、取り組みの土台になっています",
};

// このアプリでできること（使い始めの画面と、上の「できること」から見られる）
export const ABOUT = {
  open: "できること",
  title: "このアプリでできること",
  items: [
    { name: "ホーム", body: "いまの段階で大事なことと、今日の日記の入口。届いたお知らせもここに出ます" },
    { name: "日記", body: "その日の睡眠・食事・気分を、タップで1分ほどで残せます。会社には届きません" },
    { name: "連絡", body: "人事からのお知らせを読み、返信できます。つらい時期は、例文を選ぶだけで返せます。コーディネーターや専門家からの日程の連絡も、ここに届きます（こちらは会社には見えません）" },
    { name: "相談", body: "復職コーディネーターや心理の専門家との面談を、ここから申し込めます" },
    { name: "今日はしんどい", body: "押すと、休むための表示だけになります。会社には伝わりません" },
  ],
  seenTitle: "会社に見えるもの・見えないもの",
  seen: "見える：あなたが送った連絡や提出物、面談を申し込んだこと",
  unseen: "見えない：日記、気分、「今日はしんどい」を使ったこと、面談で話した内容",
  close: "閉じる",
};

export const HOME = {
  diaryTitle: "今日の日記",
  diaryNote: "タップで1分ほど。書けない日は、書かなくて大丈夫です",
  diaryDone: "今日の分は書きました",
};
