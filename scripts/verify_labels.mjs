#!/usr/bin/env node
/**
 * verify_labels.mjs — パラメータの日本語表示名が PARAM_LABELS 以外に無いか
 *
 * ★パラメータ名は改称保留中（案A・5字統一）。
 *   差し替えを1箇所で完結させるため、日本語ラベルを直書きさせない。
 *
 * ⚠️ 設問文・結果カード本文・レポート本文には、ラベルと同じ語が
 *    「普通の日本語」として出てくる（例：「スナイパーライフル（一発必中）」）。
 *    これは不変のコピーであって直書きではない。→ 検査対象から除外する。
 *
 * 使い方:  node scripts/verify_labels.mjs
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DEF = 'report/report.js';
const LABELS = ['3倍量', '一発必中', 'レバレッジ', '深耕', '便乗', '複利', '偶然適応', '共感共創'];
const SKIP_DIRS = new Set(['spec', 'scripts', 'assets', 'node_modules', '.git']);
const EXTS = ['.html', '.css', '.js'];

let fail = 0;
const ok  = (m) => console.log(`  ✅ ${m}`);
const bad = (m) => { fail = 1; console.log(`  ❌ ${m}`); };

console.log('════════ PARAM_LABELS の単一情報源チェック ════════');

// ───────── 1. PARAM_LABELS が定義されているか ─────────

let def;
try { def = readFileSync(DEF, 'utf8'); }
catch { console.log(`\n❌ ${DEF} が無い（仕様書 §0-4b）`); process.exit(1); }

const m = /PARAM_LABELS\s*=\s*\{([\s\S]*?)\}/.exec(def);
if (!m) { console.log(`\n❌ ${DEF} に PARAM_LABELS が無い（仕様書 §0-4b）`); process.exit(1); }
ok(`${DEF} に PARAM_LABELS を検出`);

// ───────── 2. ラベルの直書きチェック ─────────
//
// 「不変のコピー」（設問文・結果カード本文・レポート本文）は除外する。
// 除外するのは "…" / '…' / `…` で囲まれた 10文字以上の文字列リテラルと、
// HTML の本文テキスト（<p> <li> 等の中身）ではなく、
// より安全に「QUESTIONS 宣言ブロック全体」と「20文字以上の文字列リテラル」を落とす。

const stripLongLiterals = (src) =>
  src
    // QUESTIONS 宣言（設問文・選択肢文の塊）を丸ごと落とす
    .replace(/const\s+QUESTIONS\s*=\s*\[[\s\S]*?\n\];/g, '/*QUESTIONS*/')
    // 20文字以上の文字列リテラル＝コピー本文とみなす（ラベルは最大5字）
    .replace(/'[^'\n]{20,}'/g, "''")
    .replace(/"[^"\n]{20,}"/g, '""')
    .replace(/`[^`]{20,}`/g, '``');

const walk = (dir, out = []) => {
  for (const e of readdirSync(dir)) {
    if (SKIP_DIRS.has(e) || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXTS.some(x => e.endsWith(x))) out.push(p);
  }
  return out;
};

console.log(`\n【ラベル直書きチェック】${DEF} 以外の HTML/CSS/JS`);
console.log('  （設問文・本文コピーに含まれる同じ語は除外して判定する）');

const files = walk('.').filter(f => relative('.', f).replace(/\\/g, '/') !== DEF);
let hits = 0;
for (const f of files) {
  const src = stripLongLiterals(readFileSync(f, 'utf8'));
  src.split('\n').forEach((line, i) => {
    for (const w of LABELS) {
      if (line.includes(w)) {
        bad(`${f}:${i + 1}  「${w}」が直書きされている`);
        console.log(`       ${line.trim().slice(0, 90)}`);
        hits++;
      }
    }
  });
}
if (!hits) ok('直書きなし（8ラベルすべて）');

// ───────── 3. 5字制約（★文字数で数える。バイト数ではない） ─────────

console.log('\n【5字制約チェック】6字超はスマホの横棒グラフで折り返して崩れる');
const entries = [...m[1].matchAll(/(\w+)\s*:\s*['"`]([^'"`]+)['"`]/g)];
if (entries.length !== 8) bad(`PARAM_LABELS の項目数が ${entries.length}（期待 8）`);

const over = entries.filter(([, , v]) => [...v].length > 5);
over.length
  ? over.forEach(([, k, v]) => bad(`${k}: 「${v}」は ${[...v].length}字（上限5字）`))
  : ok(`すべて5字以内（${entries.map(([, k, v]) => `${k}:${v}`).join(' / ')}）`);

// ───────── 結果 ─────────

console.log('\n' + '═'.repeat(38));
if (fail) {
  console.log('❌ 不合格：日本語ラベルが複数箇所に存在する（＝後から改称できない）。');
  process.exit(1);
}
console.log('✅ 合格：パラメータ表示名は PARAM_LABELS にのみ存在する。');
