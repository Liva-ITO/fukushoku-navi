// 経緯のまとめ（AI）の中継サーバーのURL。AIの鍵はサーバー側にだけあり、ここには置かない
// 手元で試すときは、.env.local に VITE_SUMMARY_URL=http://localhost:8787 と書く
export const SUMMARY_URL: string = import.meta.env.VITE_SUMMARY_URL || "https://fukushoku-navi-summary.fukushoku-navi-summary.workers.dev";
