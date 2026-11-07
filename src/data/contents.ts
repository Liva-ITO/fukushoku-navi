// コンテンツ（たたき台。スタッフがブラッシュアップする）。
// 医療の判断や、効き目・期間などの数字は書かない。迷ったら主治医へ、の形にする
import type { Stage } from "../constants/labels";
import { DEMO_TODAY } from "./demo";

export type Content = { id: string; title: string; minutes: number; stages: Stage[]; body: string[] };

export const CONTENTS: Content[] = [
  {
    id: "c-rest",
    title: "休んでいいと思えないときに",
    minutes: 3,
    stages: ["acute"],
    body: [
      "休むことに罪悪感が出るのは、まじめに働いてきた人ほど、よくあることです。",
      "いまは、休むことがいちばんの仕事です。何もしない日があっても、回復が止まっているわけではありません。",
    ],
  },
  {
    id: "c-wave",
    title: "回復には波がある（よくなったり、戻ったりの理由）",
    minutes: 2,
    stages: ["acute", "recovery"],
    body: [
      "調子は、まっすぐには上がっていきません。よくなったり、少し戻ったりをくり返しながら、ゆっくり上向いていきます。",
      "戻った日があっても、それまでの回復が消えるわけではありません。",
    ],
  },
  {
    id: "c-restdo",
    title: "「休む」と「何もしない」はちがう",
    minutes: 2,
    stages: ["acute"],
    body: [
      "休むことは、何もしないことではありません。体と頭を回復させている時間です。",
      "横になる、ぼんやりする、好きな音楽を流す。それも、立派な休み方です。",
    ],
  },
  {
    id: "c-medtalk",
    title: "薬のことで気になったら",
    minutes: 2,
    stages: ["acute", "recovery"],
    body: [
      "副作用がつらい、効いている気がしない、やめたい。そう感じることは、めずらしくありません。",
      "自分で決めずに、主治医に伝えるのがいちばんです。ホームの「主治医に伝えるメモ」に入れておくと、通院のときに見せられます。",
    ],
  },
  {
    id: "c-sleep",
    title: "眠れない夜に",
    minutes: 3,
    stages: ["acute", "recovery"],
    body: [
      "眠れない夜は、無理に眠ろうとしなくて大丈夫です。横になって目を閉じているだけでも、体は休まります。",
      "眠れない日が続くときは、主治医に伝えられます。",
    ],
  },
  {
    id: "c-family",
    title: "家族に、いまの状態を伝えるには",
    minutes: 4,
    stages: ["acute"],
    body: [
      "うまく説明できなくても大丈夫です。",
      "「いまは休むことが必要だと言われている」「声をかけてくれるのはうれしいけれど、急かされるとつらい」。一言だけでも伝わります。",
    ],
  },
  {
    id: "c-rhythm",
    title: "生活のリズムを、少しずつ整える",
    minutes: 3,
    stages: ["recovery"],
    body: [
      "起きる時間を、だいたい同じにするところから始めます。寝る時間より、起きる時間のほうがそろえやすいです。",
      "できなかった日があっても、次の日にまた戻せば大丈夫です。",
    ],
  },
  {
    id: "c-torisetsu",
    title: "自分の取扱説明書って、なに？",
    minutes: 3,
    stages: ["preReturn"],
    body: [
      "調子が崩れはじめるときのサインや、そのときに自分でできること、まわりにしてもらえると助かることを、短くまとめたものです。",
      "会社と話すときの土台になります。",
    ],
  },
  {
    id: "c-money",
    title: "休職中のお金と手続き（会社に聞いておけること）",
    minutes: 3,
    stages: ["acute", "recovery", "preReturn"],
    body: [
      "休職中の給与や手当、社会保険の手続きは、会社によって違います。",
      "分からないことは、会社からのお知らせや、人事の担当に聞くことができます。",
    ],
  },
];

// ホームの「余裕があるときに、少しだけ」に出す2本。週ごとに入れ替える
export function weeklyPicks(stage: Stage): Content[] {
  const list = CONTENTS.filter((c) => c.stages.includes(stage));
  if (list.length <= 2) return list;
  const week = Math.floor(new Date(`${DEMO_TODAY}T00:00:00`).getTime() / (7 * 24 * 3600 * 1000));
  const start = (week * 2) % list.length;
  return [list[start], list[(start + 1) % list.length]];
}
