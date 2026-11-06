// 回復期の「きょうやること」。4つの種類 × 5つのステップの課題と、しんどい日の分。種類はいくつでも同時に選べる。
// リワークが通所でやっている「少しずつ負荷を上げて、きつかったら下げる」を、ひとりでも回せるようにする。
// ここは軽い版：その日の出し方は「いつもの／休み明け／ゆっくりの日」だけ。記録の数字から調子を読み取る出し方（ならし・お試しなど）は、あとで足す
export type PlanCat = "rhythm" | "out" | "work" | "reflect";
export type PlanResult = "good" | "ok" | "hard";
export type PlanEntry = { date: string; at: number; cat: PlanCat; step: number; task: string; easy: boolean; result: PlanResult };
export type Plan = {
  cats: PlanCat[]; // きょうやる種類（本人が選ぶ。いくつでも）
  steps: Record<PlanCat, number>; // 種類ごとの、いまのステップ（1〜5）
  since: Record<PlanCat, number>; // いまのステップになったときの、記録の件数（3回を数えなおすため）
  log: PlanEntry[];
  done: PlanCat[]; // きょう、やってみた結果を押した種類
  afterRest: number; // 休息モードを終えたあと、しんどい日の分だけを出す残りの日数
  offerUp: PlanCat[]; // 次のステップをすすめている種類
};

export const PLAN_CATS: PlanCat[] = ["rhythm", "out", "work", "reflect"];
export const MAX_STEP = 5;
// 次のステップをすすめるまでの回数（やってよかった・まあまあ）と、下げるまでの「きつかった」の回数
export const UP_AFTER = 3;
export const DOWN_AFTER = 2;
export const AFTER_REST_DAYS = 3;

type Step = { tasks: string[]; easy: string };
export const PLAN_TASKS: Record<PlanCat, { name: string; steps: Step[] }> = {
  rhythm: {
    name: "生活のリズム",
    steps: [
      { tasks: ["起きたらカーテンを開ける", "起きた時刻を日記に書く", "朝、コップ1杯の水を飲む"], easy: "布団の中でカーテンを開ける" },
      { tasks: ["目覚ましを、目標の時刻に1つだけかける", "朝に何か1口食べる（バナナ、ヨーグルト）", "寝る前に、スマホを枕元から離す"], easy: "目覚ましをセットするだけ" },
      { tasks: ["10時までに起きて、部屋着から着替える", "昼ごはんを座って食べる", "昼寝するなら15時までに、30分で"], easy: "10時に起きて、シャツだけ着替える" },
      { tasks: ["午前と午後に分けて、横にならずに6時間", "寝る1時間半前にお風呂に入る", "3食の時刻を、だいたいそろえる"], easy: "午前だけ、2時間起きている" },
      { tasks: ["通勤を想定した時刻（7時台）に起きる", "9時に外に出られる身支度を済ませる", "通勤を想定した時刻に起きるのを、平日5日続ける"], easy: "7時台に一度起きて、カーテンを開ける（二度寝してよい）" },
    ],
  },
  out: {
    name: "外に出る",
    steps: [
      { tasks: ["ポストまで郵便物を取りに行く", "玄関のドアを開けて、外の空気を1回吸う", "エレベーターで1階まで降りて、そのまま戻る"], easy: "ドアを開けて閉める" },
      { tasks: ["いちばん近い自販機で、好きな飲み物を1本買う", "コンビニで、飲み物かお菓子を1つ買う", "ゴミ出しのついでに、家の周りを1周"], easy: "自販機まで行って、買わずに戻る" },
      { tasks: ["近所を15分歩く", "公園のベンチに10分座って帰る", "スーパーで、夕飯の材料を3つ買う"], easy: "家の周りを5分" },
      { tasks: ["午前中にバスか電車で2駅、図書館かカフェで30分", "美容院や歯医者など、予約のある用事を1件", "友人か家族と、外で1時間"], easy: "駅まで行って、改札の前で戻る" },
      { tasks: ["通勤を想定した時間帯（8〜9時台）に家を出て、2〜3時間外で過ごす", "混んだ電車に、片道乗って戻る"], easy: "8時台に家を出て、コンビニで帰る" },
    ],
  },
  work: {
    name: "仕事に近いこと",
    steps: [
      { tasks: ["机に15分座る（何もしなくていい）", "本か雑誌を10分読む", "レシートを1枚、家計簿に写す"], easy: "机の上を拭く" },
      { tasks: ["ニュースを20分読んで、1行メモ", "パソコンを立ち上げて、メールを読むだけ", "数独やパズルを20分"], easy: "ニュースの見出しだけ5つ読む" },
      { tasks: ["図書館かカフェで1時間、読む・書く", "自分宛てに、仕事風のメールを1通書く", "表計算や資料を30分さわる"], easy: "図書館に入って、席を探すだけ" },
      { tasks: ["午前と午後に分けて3時間、決めた作業（資格の勉強、調べもの）", "オンライン講座を1コマ", "電話か窓口で、人と話す用事を1件"], easy: "午前の1時間だけ" },
      { tasks: ["図書館で、9〜17時のうち4時間作業する", "報告書を1枚書く（題材は何でも）"], easy: "午前と午後に1時間ずつ" },
    ],
  },
  reflect: {
    name: "休職をふり返る",
    steps: [
      { tasks: ["休む前にしんどかったことを、1行だけ書く", "当時の1日の流れを、思い出して書く"], easy: "しんどかったことを、単語で1つ" },
      { tasks: ["調子を崩す前のサインを3つ書く（眠れない、食事が減る、メールを開けない など）", "しんどさが増えた時期と出来事を並べる"], easy: "サインを1つだけ" },
      { tasks: ["サインが出たときの対処を1つ決める（休む、主治医に連絡、家族に言う など）", "決めた対処を、スマホのメモに残す"], easy: "対処の候補を1つ思い浮かべる" },
      { tasks: ["働き方で変えたいことを3つ書く", "誰に何を伝えるかを決める（主治医、会社、家族）"], easy: "変えたいことを1つ" },
      { tasks: ["戻ったあとの最初の1か月の過ごし方（勤務時間、残業、相談相手）を1枚にまとめる", "まとめたものを主治医に見せて、意見をもらう"], easy: "1か月の過ごし方を、箇条書きで3つ" },
    ],
  },
};

export const INITIAL_PLAN: Plan = {
  cats: ["rhythm"],
  steps: { rhythm: 1, out: 1, work: 1, reflect: 1 },
  since: { rhythm: 0, out: 0, work: 0, reflect: 0 },
  log: [],
  done: [],
  afterRest: 0,
  offerUp: [],
};

// 1つずつ選ぶ形のときに保存したデータも、いまの形に直して読む
type OldPlan = { cat?: PlanCat; doneToday?: boolean; offerUp?: PlanCat[] | PlanCat | null };
export function normalizePlan(p: (Partial<Plan> & OldPlan) | undefined): Plan {
  if (!p) return INITIAL_PLAN;
  const cats = Array.isArray(p.cats) && p.cats.length > 0 ? p.cats : p.cat ? [p.cat] : INITIAL_PLAN.cats;
  const done = Array.isArray(p.done) ? p.done : p.doneToday && p.cat ? [p.cat] : [];
  const offerUp = Array.isArray(p.offerUp) ? p.offerUp : p.offerUp ? [p.offerUp] : [];
  return {
    cats,
    steps: p.steps ?? INITIAL_PLAN.steps,
    since: p.since ?? INITIAL_PLAN.since,
    log: p.log ?? [],
    done,
    afterRest: p.afterRest ?? 0,
    offerUp,
  };
}

export type PlanMode = "usual" | "afterRest" | "gentle";
export type PlanToday = { mode: PlanMode; cat: PlanCat; step: number; task: string; easy: string };

// きょう出す課題（種類ごと）。休み明けは、しんどい日の分だけ。その種類の前の回が「きつかった」なら、1つやさしいステップにする（その日だけ）
export function planToday(plan: Plan, cat: PlanCat): PlanToday {
  const last = [...plan.log].reverse().find((e) => e.cat === cat);
  const mode: PlanMode = plan.afterRest > 0 ? "afterRest" : last?.result === "hard" ? "gentle" : "usual";
  const step = mode === "gentle" ? Math.max(1, plan.steps[cat] - 1) : plan.steps[cat];
  const s = PLAN_TASKS[cat].steps[step - 1];
  // 同じステップの課題を順番に出す（同じものばかりにならないよう）
  const n = plan.log.filter((e) => e.cat === cat && e.step === step).length;
  return { mode, cat, step, task: s.tasks[n % s.tasks.length], easy: s.easy };
}

// やってみた結果を残し、ステップを上げ下げする。上げるのは本人が決める（すすめるだけ）。下げるのは黙って下げる
export function answerPlan(plan: Plan, today: PlanToday, result: PlanResult, easy: boolean, date: string): Plan {
  const cat = today.cat;
  if (plan.done.includes(cat)) return plan;
  const entry: PlanEntry = { date, at: Date.now(), cat, step: today.step, task: easy ? today.easy : today.task, easy, result };
  const log = [...plan.log, entry];
  const now = plan.steps[cat];
  const mine = log.slice(plan.since[cat]).filter((e) => e.cat === cat);
  const lastHard = mine.slice(-DOWN_AFTER);
  let { steps, since, offerUp } = plan;
  if (lastHard.length === DOWN_AFTER && lastHard.every((e) => e.result === "hard") && now > 1) {
    steps = { ...steps, [cat]: now - 1 };
    since = { ...since, [cat]: log.length };
    offerUp = offerUp.filter((c) => c !== cat);
  } else if (now < MAX_STEP && mine.filter((e) => e.step === now && !e.easy && e.result !== "hard").length >= UP_AFTER) {
    if (!offerUp.includes(cat)) offerUp = [...offerUp, cat];
  }
  return { ...plan, log, steps, since, offerUp, done: [...plan.done, cat] };
}

// 次のステップをすすめられて、本人が答えたとき。どちらでも数えなおす
export function decideUp(plan: Plan, cat: PlanCat, up: boolean): Plan {
  if (!plan.offerUp.includes(cat)) return plan;
  const step = up ? Math.min(MAX_STEP, plan.steps[cat] + 1) : plan.steps[cat];
  return {
    ...plan,
    steps: { ...plan.steps, [cat]: step },
    since: { ...plan.since, [cat]: plan.log.length },
    offerUp: plan.offerUp.filter((c) => c !== cat),
  };
}

// 次の日になったとき（デモでは押して進める）。休み明けの残り日数は、1日に1つ減らす
export function nextDay(plan: Plan): Plan {
  return { ...plan, done: [], afterRest: Math.max(0, plan.afterRest - 1) };
}
