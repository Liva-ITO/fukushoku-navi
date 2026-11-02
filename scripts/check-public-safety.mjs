#!/usr/bin/env node
// 公開前チェック：公開リポジトリに入れてはいけないものが、コミットに混ざっていないかを調べる。
//
// 調べるもの
//   1. APIキー・トークンらしき文字列、メールアドレス、金額
//   2. 社外秘の言葉（一覧はリポジトリの外に置く。一覧そのものを公開しないため）
//
// 使い方
//   --hook        Claude Code の PreToolUse フックから呼ぶ（git commit / git push のときだけ調べる）
//   --staged      git の pre-commit フックから呼ぶ（ステージされた変更を調べる）
//   --msg <file>  git の commit-msg フックから呼ぶ（コミットメッセージを調べる）
//
// 社外秘の言葉の一覧の場所は、環境変数 FUKUSHOKU_BLOCKLIST か
// `git config fukushoku.blocklist <パス>`（このPCだけの設定）で指定する。

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const PATTERNS = [
  { label: "APIキーらしき文字列", re: /\b(sk-ant-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{32,}|ghp_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16})\b/ },
  { label: "秘密の値の代入", re: /\b(api[_-]?key|secret|token|password)\s*[:=]\s*["'][^"']{8,}["']/i },
  { label: "メールアドレス", re: /[A-Za-z0-9._%+-]+@(?!users\.noreply\.github\.com|anthropic\.com)[A-Za-z0-9.-]+\.[A-Za-z]{2,}/ },
  { label: "金額", re: /(\d[\d,]*\s*(円|万円|億円)|[¥￥]\s*\d)/ },
];

function git(cmd) {
  try {
    return execSync(`git ${cmd}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
}

function loadBlocklist() {
  const path = process.env.FUKUSHOKU_BLOCKLIST || git("config --get fukushoku.blocklist").trim();
  if (!path || !existsSync(path)) {
    console.error("［公開前チェック］社外秘の言葉の一覧が見つかりません。キー・金額などの形だけを調べます。");
    return [];
  }
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

// ステージされた変更のうち、追加された行だけを { file, text } で返す
function stagedAddedLines() {
  const diff = git("diff --cached -U0 --no-color");
  const out = [];
  let file = "";
  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ ")) file = line.replace(/^\+\+\+ (b\/)?/, "");
    else if (line.startsWith("+") && !line.startsWith("+++")) out.push({ file, text: line.slice(1) });
  }
  return out;
}

function scan(lines, blocklist) {
  const hits = [];
  for (const { file, text } of lines) {
    // このチェック自身の中の正規表現は対象外
    if (file === "scripts/check-public-safety.mjs") continue;
    for (const p of PATTERNS) if (p.re.test(text)) hits.push(`${file}: ${p.label}: ${text.trim().slice(0, 80)}`);
    for (const word of blocklist) if (text.includes(word)) hits.push(`${file}: 社外秘の言葉「${word}」`);
  }
  return hits;
}

function report(hits) {
  console.error("［公開前チェック］公開リポジトリに入れてはいけないものが見つかりました：");
  for (const h of hits) console.error(`  - ${h}`);
  console.error("該当の箇所を直してから、もう一度コミットしてください。");
}

const mode = process.argv[2];
const blocklist = loadBlocklist();

if (mode === "--hook") {
  let command = "";
  try {
    const raw = readFileSync(0, "utf8").replace(/^﻿/, "");
    command = JSON.parse(raw || "{}")?.tool_input?.command ?? "";
  } catch {
    process.exit(0); // 読めない入力のときは、ほかのコマンドを止めない
  }
  if (!/\bgit\b[^|;&]*\b(commit|push)\b/.test(command)) process.exit(0);
  const hits = [...scan(stagedAddedLines(), blocklist), ...scan([{ file: "(コマンド)", text: command }], blocklist)];
  if (hits.length) {
    report(hits);
    process.exit(2); // 2 = Claude Code にコマンドを止めさせる
  }
} else if (mode === "--staged") {
  const hits = scan(stagedAddedLines(), blocklist);
  if (hits.length) {
    report(hits);
    process.exit(1);
  }
} else if (mode === "--msg") {
  const text = readFileSync(process.argv[3], "utf8");
  const lines = text.split(/\r?\n/).filter((l) => !l.startsWith("#")).map((t) => ({ file: "(コミットメッセージ)", text: t }));
  const hits = scan(lines, blocklist);
  if (hits.length) {
    report(hits);
    process.exit(1);
  }
} else {
  console.error("使い方: check-public-safety.mjs --hook | --staged | --msg <file>");
  process.exit(1);
}
