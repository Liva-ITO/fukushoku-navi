// データ分析の見本の数字（架空）。割合は人数から計算し、数字どうしが食い違わないようにする
// 実際の会社のデータでも、リワークの効果を示すものでもない

export const PERIOD_PEOPLE = 42; // 過去3年に休職した人
export const RETURNED = 31; // そのうち復職した人
export const RELAPSED_1Y = 5; // 復職後1年以内に再休職した人
export const AVG_LEAVE_DAYS = 186; // 復職した人の平均休職日数
export const THIS_YEAR = 9; // 今年度の休職発生

export const REWORK = {
  yes: { people: 18, returned: 16, relapsed: 1 },
  no: { people: 24, returned: 15, relapsed: 4 },
};

// 復職6か月後の上司アンケート（期待以上／期待どおり／やや下回る／下回る の人数）
export const PERFORMANCE = {
  yes: [4, 7, 3, 0],
  no: [2, 5, 3, 2],
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
