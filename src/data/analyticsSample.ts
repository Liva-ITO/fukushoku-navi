// データ分析の見本の数字（架空）。割合は人数から計算し、数字どうしが食い違わないようにする
// 実際の会社のデータでも、支援の効果を示すものでもない

export const PERIOD_PEOPLE = 42; // 過去3年に休職した人
export const AVG_LEAVE_DAYS = 186; // 復職した人の平均休職日数
export const THIS_YEAR = 9; // 今年度の休職発生

// 回復期の過ごし方ごと（本人の画面の「準備の進め方」と同じ3つ）
export type PathKey = "office" | "online" | "self";
export const BY_PATH: { key: PathKey; people: number; returned: number; relapsed: number }[] = [
  { key: "office", people: 10, returned: 9, relapsed: 0 },
  { key: "online", people: 8, returned: 7, relapsed: 1 },
  { key: "self", people: 24, returned: 16, relapsed: 4 },
];
export const RETURNED = BY_PATH.reduce((a, p) => a + p.returned, 0);
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
