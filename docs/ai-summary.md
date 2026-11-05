# 経緯のまとめ（AI）の仕組みと準備

## 仕組み

```
会社の画面（GitHub Pages）
  └─「経緯を要約する（AI）」を押す
      └─ 見ている人が、もう画面で見られる経緯だけを送る（名前・部署は送らない）
          └─ 中継サーバー（worker/、Cloudflare Workers）
              ├─ 呼んでよい画面か・回数を確かめる
              ├─ AIの鍵はここにだけある（秘密の設定）
              └─ Claude に要約してもらい、要約といま会社がすることを返す（保存しない）
```

- 段階の流れと期間は、画面がデータから計算して出す（AIは使わない）
- AIが書くのは、2〜3文の要約と「いま会社がすること」（3つまで、根拠の日付を1つ付ける）
- 見立て・評価・病状は書かせない（「順調」なども使わせず、事実で書かせる）
- 回数の制限：同じIPから1分に5回、全体で1分に30回

## 準備（最初の1回だけ）

鍵やパスワードは、チャット・コード・この文書には書かない。

1. Claude の管理画面（platform.claude.com）で、APIキーを作る。使える金額の上限も決めておく
2. Cloudflare のアカウントを作る（無料プランでよい）
3. ターミナルで、中継サーバーを公開する

   ```bash
   cd worker
   npm install
   npx wrangler login
   npx wrangler deploy
   ```

4. APIキーを中継サーバーの秘密の設定に入れる（聞かれたら、キーを貼って Enter）

   ```bash
   npx wrangler secret put ANTHROPIC_API_KEY
   ```

5. 公開されたURL（`https://fukushoku-navi-summary.fukushoku-navi-summary.workers.dev`）を、`src/constants/ai.ts` に入れて公開版に送る（11/4 済み）

## 手元で試すとき

- `worker/.dev.vars` に `ANTHROPIC_API_KEY=...` を書き、`cd worker && npx wrangler dev`（`.dev.vars` は Git に入らない）
- 画面側は、`.env.local` に `VITE_SUMMARY_URL=http://127.0.0.1:8787` を書いて `npm run dev`

## 本番にするとき

デモ用のAIは、個人の組織のクレジットで動かしている。リヴァのサービスとして本番にするときは、リヴァの組織で契約し、データの扱い（学習に使わない、保存期間、要配慮個人情報）の取り決めをしてから、鍵を差し替える。コードは変えなくてよい。
