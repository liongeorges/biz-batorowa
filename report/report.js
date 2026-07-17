'use strict';

const CONFIG = {
  GA_ID:    'G-XXXXXXX',
  LINE_URL: 'https://lin.ee/XXXX',
  SITE_URL: 'https://batorowa.hakoniwa.link/',
  QR_IMG:   '/assets/line_qr.png',
};

// パラメータの表示名。改称するときはここ1箇所だけを変更する。
const PARAM_LABELS = {
  gunner: '量的覚醒力',
  sniper: '精密照準力',
  golem:  '機構増幅力',
  sword:  '深層探究力',
  archer: '追風感応力',
  sage:   '累積複利力',
  shape:  '変異適応力',
  bard:   '共鳴共創力',
};

// 診断本体とレポートで共用するジョブデータ。
const JOBS = {
  gunner: {
    name: '連射のガンナー',
    english: 'The Volume Gunner',
    emoji: '🔫',
    catch: '圧倒的な手数が運を引き寄せ、成功をつかみとる量産アタッカー',
    body: 'あなたの最強スキルは「行動量」。失敗は自信を失う要因ではなく、ただのエラーデータ。誰かが1回悩む間に、あなたは3回試して市場の答えを先に掴む。',
    shareText: '私のジョブは「連射のガンナー」🔫\n圧倒的な手数が運を引き寄せ、成功をつかみとる量産アタッカー\nあなたのジョブは？\nビジネスバトロワ｜BBRJ',
  },
  sniper: {
    name: '鷹の目のスナイパー',
    english: 'The Hawkeye Sniper',
    emoji: '🎯',
    catch: '勝負の前に勝ち筋を見抜き、その一発に成功が宿る狙撃手',
    body: 'あなたの武器は「高解像度な予測力」。行動前の徹底シミュレーションで、失敗の時間・お金・心のダメージを最小化する。当たれば、一撃必殺。',
    shareText: '私のジョブは「鷹の目のスナイパー」🎯\n徹底シミュレーションで一撃必殺を狙うタイプ\nあなたのジョブは？\nビジネスバトロワ｜BBRJ',
  },
  golem: {
    name: '英知のゴーレムマスター',
    english: 'The Systemsmith',
    emoji: '⚙️',
    catch: '英知のゴーレムを召喚し、AIと仕組みで新時代を切り開く指揮官',
    body: 'あなたの才能は「レバレッジ設計力」。自分の手を動かすより、人・ツール・AIに動いてもらって成果を10倍にする。寝てても回る仕組みが、最高の報酬。',
    shareText: '私のジョブは「英知のゴーレムマスター」⚙️\n英知のゴーレムを召喚し、AIと仕組みで新時代を切り開く指揮官\nあなたのジョブは？\nビジネスバトロワ｜BBRJ',
  },
  sword: {
    name: '孤高のソードマスター',
    english: 'The Lone Swordmaster',
    emoji: '⚔️',
    catch: '磨き上げた唯一無二のスキルを武器に戦場を制する熟練者',
    body: 'あなたの脳が最も喜ぶのは「極める」こと。狭い領域を深掘りして、価格競争のない場所で"あなたへの指名"を勝ち取る。',
    shareText: '私のジョブは「孤高のソードマスター」⚔️\n磨き上げた唯一無二のスキルを武器に戦場を制する熟練者\nあなたのジョブは？\nビジネスバトロワ｜BBRJ',
  },
  archer: {
    name: '風読みのアーチャー',
    english: 'The Windread Archer',
    emoji: '🏹',
    catch: '時代の風を読み、最速の一矢で成功を射抜く戦略家',
    body: 'あなたの強みは「見極めと素直さ」。0→1の消耗を全部スキップして、伸びてる流れ・成功者の隣に最速で乗る。エゴがない者だけが使える最強戦術。',
    shareText: '私のジョブは「風読みのアーチャー」🏹\n時代の風を読み、最速の一矢で成功を射抜く戦略家\nあなたのジョブは？\nビジネスバトロワ｜BBRJ',
  },
  sage: {
    name: '複利の賢者',
    english: 'The Compounder Sage',
    emoji: '🐢',
    catch: '複利の錬金術で、時間を最強の味方に変える求道者',
    body: 'あなたの武器は「継続のレバレッジ」。短期の花火に振り回されず、淡々と経験と実績を積む。時間が経つほど信頼と資産が複利で膨らみ、後半で無双する。',
    shareText: '私のジョブは「複利の賢者」🐢\n複利の錬金術で、時間を最強の味方に変える求道者\nあなたのジョブは？\nビジネスバトロワ｜BBRJ',
  },
  shape: {
    name: '変幻のシェイプシフター',
    english: 'The Shapeshifter',
    emoji: '🦎',
    catch: '変化と混乱を勝機に変え、変革の先陣を切る適応者',
    body: 'あなたの才能は「環境適応力」。ガチガチの計画より、来た流れに自分を最適化させる。激変期に最も強く、変化そのものを生存の優位性に変える。',
    shareText: '私のジョブは「変幻のシェイプシフター」🦎\n変化と混乱を勝機に変え、変革の先陣を切る適応者\nあなたのジョブは？\nビジネスバトロワ｜BBRJ',
  },
  bard: {
    name: '導きの吟遊詩人',
    english: 'The Guiding Bard',
    emoji: '🎵',
    catch: '人を繋ぎ、チームを導き、輪の中心で勝利を分かち合う先導者',
    body: 'あなたの力は「チームを勝たせる力」。自分が突出するより、繋いで支援し信頼を貯める。敵を作らず、中長期的に最も脱落しにくい最強型。',
    shareText: '私のジョブは「導きの吟遊詩人」🎵\n人を繋ぎ、チームを導き、輪の中心で勝利を分かち合う先導者\nあなたのジョブは？\nビジネスバトロワ｜BBRJ',
  },
};

const JOB_STATUS = {
  gunner: { gunner:5, sniper:1, golem:1, sword:2, archer:4, sage:2, shape:4, bard:2 },
  sniper: { gunner:1, sniper:5, golem:3, sword:4, archer:1, sage:3, shape:2, bard:2 },
  golem:  { gunner:1, sniper:3, golem:5, sword:2, archer:3, sage:4, shape:2, bard:1 },
  sword:  { gunner:2, sniper:4, golem:2, sword:5, archer:1, sage:4, shape:2, bard:1 },
  archer: { gunner:3, sniper:3, golem:2, sword:1, archer:5, sage:1, shape:4, bard:2 },
  sage:   { gunner:2, sniper:1, golem:3, sword:4, archer:1, sage:5, shape:2, bard:3 },
  shape:  { gunner:3, sniper:2, golem:2, sword:1, archer:4, sage:1, shape:5, bard:3 },
  bard:   { gunner:2, sniper:2, golem:1, sword:1, archer:4, sage:4, shape:2, bard:5 },
};

window.dataLayer = window.dataLayer || [];

function gtag() {
  window.dataLayer.push(arguments);
}

function initAnalytics() {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(CONFIG.GA_ID)}`;
  document.head.append(script);
  gtag('js', new Date());
  gtag('config', CONFIG.GA_ID);
}

function buildShareUrl(jobKey) {
  const text = encodeURIComponent(JOBS[jobKey].shareText);
  const url = encodeURIComponent(CONFIG.SITE_URL);
  return `https://x.com/intent/post?text=${text}&url=${url}`;
}

function openShare(jobKey, location) {
  gtag('event', 'share_x_click', { job_type: jobKey, location: location });
  window.open(buildShareUrl(jobKey), 'share_x', 'width=600,height=500,noopener');
}

async function goLine(jobKey, location) {
  const name = JOBS[jobKey].name;
  gtag('event', 'line_cta_click', {
    job_type: jobKey,
    location: location,
    variant: location === 'result' ? 'text_link' : 'button',
  });

  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API is unavailable');
    await navigator.clipboard.writeText(name);
    window.location.href = CONFIG.LINE_URL;
  } catch (error) {
    showFallback(name);
  }
}

function showFallback(name) {
  const dialog = document.querySelector('#fallbackDialog');
  const input = document.querySelector('#fallbackInput');
  const lineLink = document.querySelector('#fallbackLineLink');
  if (!dialog || !input || !lineLink) return;
  input.value = name;
  lineLink.href = CONFIG.LINE_URL;
  dialog.hidden = false;
  input.focus();
  input.select();
}

function fillParamLabels(root = document) {
  root.querySelectorAll('[data-param]').forEach((element) => {
    const key = element.dataset.param;
    if (!(key in PARAM_LABELS)) throw new Error(`PARAM_LABELS["${key}"] が見つかりません。`);
    element.textContent = PARAM_LABELS[key];
  });
}

function renderStatusChart(container, jobKey) {
  const values = JOB_STATUS[jobKey];
  if (!values) throw new Error(`JOB_STATUS["${jobKey}"] が見つかりません。`);
  const total = Object.values(values).reduce((sum, value) => sum + value, 0);
  if (total !== 21) throw new Error(`${jobKey} のステータス合計が21ではありません。`);

  container.replaceChildren();
  for (const key of Object.keys(PARAM_LABELS)) {
    const value = values[key];
    const row = document.createElement('div');
    const label = document.createElement('span');
    const track = document.createElement('div');
    const fill = document.createElement('div');
    const score = document.createElement('span');
    row.className = value === 1 ? 'status-row is-low' : 'status-row';
    label.className = 'status-label';
    track.className = 'status-track';
    fill.className = 'status-fill';
    score.className = 'status-value';
    label.textContent = PARAM_LABELS[key];
    fill.style.width = `${value * 20}%`;
    score.textContent = value * 20;
    track.append(fill);
    row.append(label, track, score);
    container.append(row);
  }
}
