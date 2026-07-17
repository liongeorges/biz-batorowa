#!/usr/bin/env node
/**
 * verify_scoring.mjs — スコアロジックの実行検算
 *
 * ★目視レビューでは絶対に見つからないバグを潰すためのスクリプト。
 *   index.html から純粋関数だけを抜き出して実行し、仕様書の値と突き合わせる。
 *
 * 検証項目
 *   1. QUESTIONS の meter 20件が加点マップ（仕様書 §2-2）と一致
 *   2. PRIORITY 配列の順序が仕様書 §2-3 と一致
 *   3. decideJob({}) が throw する（未初期化スコアの検出 / R26）
 *   4. 仕様書 §9 のテストケース8件が全て期待ジョブを返す
 *   5. 1024通り全探索の分布が仕様書 §2-4 の実測値と一致
 *
 * 使い方:  node scripts/verify_scoring.mjs
 */

import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SRC = 'index.html';

// ───────── 仕様書から転記した期待値（★ここを実装に合わせて書き換えない） ─────────

// 加点マップ（仕様書 §2-2）
const EXPECTED_MAP = {
  q1: { A: 'archer', B: 'sword',  C: 'sniper', D: 'gunner' },
  q2: { A: 'golem',  B: 'sage',   C: 'archer', D: 'shape'  },
  q3: { A: 'gunner', B: 'sword',  C: 'sniper', D: 'shape'  },
  q4: { A: 'bard',   B: 'gunner', C: 'archer', D: 'golem'  },
  q5: { A: 'golem',  B: 'sword',  C: 'sage',   D: 'bard'   },
};

// タイブレーク順位（仕様書 §2-3 / 全40320順列を総当たり探索して確定・変更禁止）
const EXPECTED_PRIORITY =
  ['shape', 'bard', 'sniper', 'sage', 'gunner', 'golem', 'sword', 'archer'];

// テストケース（仕様書 §9）
const TEST_CASES = [
  ['AAABB', 'gunner'],
  ['CACAB', 'sniper'],
  ['AAAAA', 'golem'],
  ['AABAB', 'sword'],
  ['AAACB', 'archer'],
  ['ABAAC', 'sage'],
  ['ADDAA', 'shape'],
  ['AAAAD', 'bard'],
];

// 1024通り全探索の分布（仕様書 §2-4）
const EXPECTED_DIST = {
  shape: 217, gunner: 142, bard: 137, golem: 131,
  sword: 124, archer: 113, sniper: 92, sage: 68,
};
const EXPECTED_RATIO = 3.19; // 格差（最大 ÷ 最小）

// ───────── ヘルパ ─────────

let failures = 0;
const ok   = (m) => console.log(`  ✅ ${m}`);
const bad  = (m) => { failures++; console.log(`  ❌ ${m}`); };
const head = (m) => console.log(`\n${m}`);

/** src の pos 位置から始まる括弧ブロックを、対応が取れるまで読んで返す */
function balanced(src, pos, open, close) {
  let depth = 0;
  for (let i = pos; i < src.length; i++) {
    if (src[i] === open) depth++;
    else if (src[i] === close) {
      depth--;
      if (depth === 0) return src.slice(pos, i + 1);
    }
  }
  throw new Error(`括弧が閉じていない（開始位置 ${pos}）`);
}

/** `const NAME = { … };` / `[ … ]` を丸ごと抜き出す */
function extractDecl(src, name) {
  const m = new RegExp(`const\\s+${name}\\s*=\\s*`).exec(src);
  if (!m) return null;
  const start = m.index + m[0].length;
  const open = src[start];
  const close = open === '{' ? '}' : open === '[' ? ']' : null;
  if (!close) return null;
  return `const ${name} = ${balanced(src, start, open, close)};`;
}

/** `function NAME(…) { … }` を丸ごと抜き出す */
function extractFn(src, name) {
  const m = new RegExp(`function\\s+${name}\\s*\\(`).exec(src);
  if (!m) return null;
  const brace = src.indexOf('{', m.index);
  return src.slice(m.index, brace) + balanced(src, brace, '{', '}');
}

// ───────── 1. index.html から純粋ロジックを抜き出す ─────────

console.log('════════ スコアロジック検算 ════════');

let html;
try {
  html = readFileSync(SRC, 'utf8');
} catch {
  console.log(`\n❌ ${SRC} が見つからない。リポジトリのルートで実行すること。`);
  process.exit(1);
}

const parts = [];
const missing = [];
for (const name of ['QUESTIONS', 'MAP', 'METERS', 'PRIORITY']) {
  const d = extractDecl(html, name);
  d ? parts.push(d) : missing.push(name);
}
for (const name of ['createScores', 'decideJob']) {
  const f = extractFn(html, name);
  f ? parts.push(f) : missing.push(name);
}

head('【0】必要な宣言が index.html に存在するか');
if (missing.length) {
  bad(`見つからない: ${missing.join(', ')}`);
  console.log('\n     → 仕様書 §2・§3 の名前のまま宣言すること（リネーム禁止）。');
  process.exit(1);
}
ok('QUESTIONS / MAP / METERS / PRIORITY / createScores / decideJob をすべて検出');

// ⚠️ const はレキシカル宣言なので sandbox オブジェクトには生えない。
//    最後に評価する式の値として受け取る。
const EXPORT = '\n;({ QUESTIONS, MAP, METERS, PRIORITY, createScores, decideJob });';
let logic;
try {
  const sandbox = vm.createContext({});
  logic = vm.runInContext(parts.join('\n\n') + EXPORT, sandbox);
} catch (e) {
  bad(`抜き出したロジックが実行できない: ${e.message}`);
  process.exit(1);
}
const { QUESTIONS, MAP, METERS, PRIORITY, createScores, decideJob } = logic;

// ───────── 2. QUESTIONS の meter が加点マップと一致するか ─────────

head('【1】QUESTIONS の meter が加点マップ（§2-2）と一致するか');
for (const q of QUESTIONS) {
  for (const c of q.choices) {
    const exp = EXPECTED_MAP[q.id]?.[c.label];
    if (c.meter !== exp) bad(`${q.id}-${c.label}: 実装 ${c.meter} / 仕様 ${exp}`);
  }
}
const truncated = QUESTIONS.flatMap(q => q.choices).filter(c => /…|\.\.\./.test(c.text));
if (truncated.length) {
  bad(`選択肢が省略されたまま実装されている（${truncated.length}件）:`);
  truncated.forEach(c => console.log(`       ${c.label}: ${c.text}`));
}
if (!failures) ok('20件すべて一致・省略なし');

// ───────── 3. PRIORITY の順序 ─────────

head('【2】PRIORITY 配列の順序（§2-3・変更禁止）');
JSON.stringify(PRIORITY) === JSON.stringify(EXPECTED_PRIORITY)
  ? ok(PRIORITY.join(' > '))
  : bad(`実装 [${PRIORITY}]\n     仕様 [${EXPECTED_PRIORITY}]\n     → この順序は全40320順列の総当たり探索で確定した。触ると分布が壊れる。`);

// ───────── 4. 未初期化スコアで throw するか（R26） ─────────

head('【3】decideJob({}) が throw するか（R26 / 未初期化 → 全員shape の無言バグ）');
let threw = false;
try { decideJob({}); } catch { threw = true; }
threw
  ? ok('throw した（防御的チェックが効いている）')
  : bad('throw しない。createScores() による8キー0初期化と防御的 throw を実装すること。');

// ───────── 5. テストケース（§9） ─────────

const run = (ans) => {
  const s = createScores();
  ['q1','q2','q3','q4','q5'].forEach((q, i) => { s[MAP[q][ans[i]]] += 1; });
  return decideJob(s);
};

head('【4】テストケース8件（§9）');
for (const [ans, exp] of TEST_CASES) {
  const got = run(ans);
  got === exp
    ? ok(`${ans.split('').join(',')} → ${got}`)
    : bad(`${ans.split('').join(',')} → 実装 ${got} / 期待 ${exp}`);
}

// ───────── 6. 1024通り全探索の分布（§2-4） ─────────

head('【5】1024通り全探索の分布（§2-4）');
const dist = Object.fromEntries(METERS.map(k => [k, 0]));
const L = 'ABCD';
for (const a of L) for (const b of L) for (const c of L) for (const d of L) for (const e of L) {
  dist[run(a + b + c + d + e)]++;
}
const total = Object.values(dist).reduce((x, y) => x + y, 0);
if (total !== 1024) bad(`総数が ${total}（期待 1024）`);

for (const [job, exp] of Object.entries(EXPECTED_DIST)) {
  const got = dist[job];
  const pct = (got / 1024 * 100).toFixed(1);
  got === exp
    ? ok(`${job.padEnd(7)} ${String(got).padStart(4)} (${pct}%)`)
    : bad(`${job.padEnd(7)} 実装 ${got} / 期待 ${exp}`);
}

const ratio = Math.max(...Object.values(dist)) / Math.min(...Object.values(dist));
Math.abs(ratio - EXPECTED_RATIO) < 0.01
  ? ok(`格差 ${ratio.toFixed(2)}倍（期待 ${EXPECTED_RATIO}倍）`)
  : bad(`格差 ${ratio.toFixed(2)}倍（期待 ${EXPECTED_RATIO}倍）`);

// ───────── 結果 ─────────

console.log('\n' + '═'.repeat(38));
if (failures) {
  console.log(`❌ 不合格：${failures}件の不一致。仕様書 §2・§3・§9 を確認すること。`);
  process.exit(1);
}
console.log('✅ 合格：スコアロジックは仕様書どおり。');
