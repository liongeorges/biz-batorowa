#!/usr/bin/env node
/**
 * verify_colors.mjs — ジョブのアクセント色が theme.css 以外に書かれていないか
 *
 * ★色は後日ぜんぶ差し替える（納品済みジョブ画像8枚・OGP画像10枚と揃える）。
 *   2箇所以上に書かれた時点で、差し替え不能になる。
 *   使う側は必ず var(--job-accent) を参照すること（仕様書 §0-4c）。
 *
 * 使い方:  node scripts/verify_colors.mjs
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const THEME = 'theme.css';
const JOBS = ['gunner', 'sniper', 'golem', 'sword', 'archer', 'sage', 'shape', 'bard'];
const SKIP_DIRS = new Set(['spec', 'scripts', 'assets', 'node_modules', '.git']);
const EXTS = ['.html', '.css', '.js'];

let fail = 0;
const ok  = (m) => console.log(`  ✅ ${m}`);
const bad = (m) => { fail = 1; console.log(`  ❌ ${m}`); };

console.log('════════ アクセント色の単一情報源チェック ════════');

// ───────── 1. theme.css に8ジョブ分の定義があるか ─────────

if (!existsSync(THEME)) {
  console.log(`\n❌ ${THEME} が無い。色の唯一の定義場所（仕様書 §0-4c）。`);
  process.exit(1);
}
const theme = readFileSync(THEME, 'utf8');
const defined = JOBS.filter(j => new RegExp(`\\[data-job=["']${j}["']\\]`).test(theme));

defined.length === 8
  ? ok(`${THEME} に [data-job] の定義が 8件`)
  : bad(`${THEME} の定義が ${defined.length}件。不足: ${JOBS.filter(j => !defined.includes(j)).join(', ')}`);

if (!/--job-accent/.test(theme)) bad(`${THEME} に --job-accent が無い`);

// ───────── 2. theme.css 以外に HEX が書かれていないか ─────────

const walk = (dir, out = []) => {
  for (const e of readdirSync(dir)) {
    if (SKIP_DIRS.has(e) || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXTS.some(x => e.endsWith(x))) out.push(p);
  }
  return out;
};

console.log(`\n【HEXの直書きチェック】${THEME} 以外の HTML/CSS/JS`);
const HEX = /#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b/;
let hits = 0;
for (const f of walk('.').filter(f => f.replace(/\\/g, '/').replace(/^\.\//, '') !== THEME)) {
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    if (HEX.test(line)) {
      bad(`${f}:${i + 1}  ${line.trim().slice(0, 80)}`);
      hits++;
    }
  });
}
if (!hits) ok('HEXの直書きなし');
else console.log(`\n     → 使う側は var(--job-accent) を参照する（仕様書 §0-4c）。\n     → 背景・文字色など全ページ共通の色も ${THEME} の :root に置く。`);

// ───────── 3. data-job が実際に付与されているか ─────────

console.log('\n【data-job の付与チェック】');
const users = walk('.').filter(f => f.replace(/\\/g, '/').replace(/^\.\//, '') !== THEME && /data-job|dataset\.job/.test(readFileSync(f, 'utf8')));
users.length
  ? ok(`data-job を付与しているファイル: ${users.length}件`)
  : bad('data-job がどこにも無い。色が切り替わらない。');

// ───────── 4. var(--job-accent) が実際に使われているか ─────────

console.log('\n【var(--job-accent) の参照チェック】');
const refs = walk('.').filter(f => f.replace(/\\/g, '/').replace(/^\.\//, '') !== THEME && /var\(\s*--job-accent/.test(readFileSync(f, 'utf8')));
refs.length
  ? ok(`var(--job-accent) を参照しているファイル: ${refs.length}件`)
  : bad('var(--job-accent) がどこからも参照されていない。色定義が死んでいる。');

// ───────── 結果 ─────────

console.log('\n' + '═'.repeat(38));
if (fail) {
  console.log('❌ 不合格：色が複数箇所に存在する（＝後から差し替えられない）。');
  process.exit(1);
}
console.log(`✅ 合格：色は ${THEME} の1ブロックにのみ存在する。`);
