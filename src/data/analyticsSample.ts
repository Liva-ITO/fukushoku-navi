// データ分析の見本の数字（架空）。割合は人数から計算し、数字どうしが食い違わないようにする
// 実際の会社のデータでも、支援の効果を示すものでもない

export const PERIOD_PEOPLE = 42; // 過去3年（2023〜2025年度）に休職した人
export const AVG_LEAVE_DAYS = 186; // 復職した人の平均休職日数
export const THIS_YEAR = 9; // 今年度の休職発生

// 回復期の過ごし方ごと（本人の画面の「準備の進め方」と同じ3つ）
export type PathKey = "office" | "online" | "self";
// people：休職した人／returned：復職した人／left：復職せずに休職が終わった人（退職・休職期間の満了）
// 残り（people − returned − left）は、まだ休職中の人。復職率の分母には入れない
export const BY_PATH: { key: PathKey; people: number; returned: number; left: number; relapsed: number }[] = [
  { key: "office", people: 10, returned: 9, left: 1, relapsed: 0 },
  { key: "online", people: 8, returned: 7, left: 1, relapsed: 1 },
  { key: "self", people: 24, returned: 16, left: 4, relapsed: 4 },
];
export const RETURNED = BY_PATH.reduce((a, p) => a + p.returned, 0);
export const LEFT = BY_PATH.reduce((a, p) => a + p.left, 0);
export const ENDED = RETURNED + LEFT; // 休職が終わった人（復職率の分母）
export const RELAPSED_1Y = BY_PATH.reduce((a, p) => a + p.relapsed, 0);

// 復職6か月後の上司アンケート（期待以上／期待どおり／やや下回る／下回る の人数）
export const PERFORMANCE: Record<PathKey, number[]> = {
  office: [3, 4, 1, 0],
  online: [2, 3, 1, 0],
  self: [2, 5, 3, 2],
};

export const BY_DEPT: [string, number][] = [
  ["営業部", 12],
  ["開発部", 10],
  ["製造部", 8],
  ["総務部", 7],
  ["企画部", 5],
];
export const BY_AGE: [string, number][] = [
  ["20代", 11],
  ["30代", 15],
  ["40代", 10],
  ["50代以上", 6],
];
export const BY_JOB: [string, number][] = [
  ["技術職", 14],
  ["営業職", 13],
  ["事務職", 10],
  ["管理職", 5],
];

export const percent = (part: number, whole: number) => Math.round((part / whole) * 100);

// 年度ごとの推移（見本）。2023〜2025年度の合計は、上の過去3年の数字と合わせてある
// started：その年度に休職した人／ended・returned：その年度に休職が終わった人と、そのうち復職した人
// relapsed：その年度に復職した人のうち、1年以内に再び休職した人（1年たっていない年度は null＝集計中）
export type YearRow = { year: number; started: number; ended: number; returned: number; relapsed: number | null; partial?: boolean };
export const BY_YEAR: YearRow[] = [
  { year: 2022, started: 12, ended: 11, returned: 8, relapsed: 2 },
  { year: 2023, started: 13, ended: 12, returned: 9, relapsed: 2 },
  { year: 2024, started: 14, ended: 13, returned: 11, relapsed: 2 },
  { year: 2025, started: 15, ended: 13, returned: 12, relapsed: null },
  { year: 2026, started: THIS_YEAR, ended: 6, returned: 5, relapsed: null, partial: true },
];
