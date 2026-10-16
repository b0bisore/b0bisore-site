// いのち時計(ブラウザ版)の画面。計算は core.js、数える仕組みは count.js。
import {
  analogyForDay, analogyWith, ARTIST, comma, compare, currentWeekOfYear, DAY, fmtDate, fmtUnit, GRID, LIFE,
  lifeYears, makeQuizzes, messageFor, parseBirth, PEOPLE, seasons, snapshot, songForDay, UNIT_ORDER, UNITS, YEAR, ageAt, bdayIn,
} from './core.js';
import { track, loadCounter } from './count.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const br = (s) => esc(s).replace(/\n/g, '<br>');
const app = $('#app');

// ── 保存(この端末のブラウザの中だけ)。スマホアプリ版のブラウザ表示と同じ名前・形で保存する ──
const KEY = 'inochi.settings.v1';
const DEFAULTS = { birth: '', sex: 'm', custom: 90, unit: 'day', look: 'pop', person: 5 };
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 保存できない環境でも表示は続ける */ } },
  clear() { try { localStorage.clear(); } catch { /* noop */ } },
};
let S = { ...DEFAULTS, ...(store.get(KEY) || {}) };
const save = () => store.set(KEY, S);
const B = () => parseBirth(S.birth);
const L = () => lifeYears(S);
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const LOOKS = ['pop', 'calm', 'dot'];
const applyLook = (look) => {
  if (look === 'calm' || look === 'dot') document.documentElement.dataset.style = look; else delete document.documentElement.dataset.style;
  $$('#looks button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.v === (LOOKS.includes(look) ? look : 'pop'))));
};
applyLook(S.look);
// 見た目の切り替えは画面上部に常に表示(設定の中には置かない)
$$('#looks button').forEach((btn) => btn.addEventListener('click', () => {
  S.look = btn.dataset.v; save(); applyLook(S.look);
  if (view === 'main') drawWeeks();
}));

let view = parseBirth(S.birth) ? 'main' : 'setup';
let timer = null;

function render() {
  clearInterval(timer);
  if (view === 'setup' || view === 'settings') renderForm();
  else renderMain();
  window.scrollTo(0, 0);
}

// ════════ 初回設定・設定 ════════
function renderForm() {
  const isSetup = view === 'setup';
  const f = { ...S };
  app.innerHTML = `
    <div class="stack">
      ${isSetup
        ? `<div class="group"><h1 style="font-size:30px">いのちの残り時間</h1>
           <p class="sub">生年月日を入れると、今日が人生の何日目か、次の節目まであとどれくらいかを数えます。<br>今日という一日を、少し大事にするための暦です。</p></div>`
        : `<div class="sheet-head"><h1 style="font-size:24px">設定</h1><button class="link" id="close" type="button">閉じる</button></div>`}
      <div class="group"><label class="label" for="fBirth">生年月日</label>
        <input class="input" type="date" id="fBirth" min="1900-01-01" max="${iso(new Date())}" value="${esc(f.birth)}"></div>
      <div class="group">
        <span class="label">平均寿命の基準</span>
        <div class="seg" role="group" aria-label="平均寿命の基準" id="fSex">
          ${[['m', '男性'], ['f', '女性'], ['c', '自分で決める']].map(([v, n]) => `<button type="button" data-v="${v}" aria-pressed="${f.sex === v}">${n}</button>`).join('')}
        </div>
        <div id="fCustomWrap" class="switch-row" style="justify-content:flex-start" ${f.sex === 'c' ? '' : 'hidden'}>
          <label class="label" for="fCustom">目標年齢</label><input class="input short" type="number" inputmode="numeric" id="fCustom" min="1" max="130" value="${f.custom}"><span>歳</span>
        </div>
        <p class="note" id="fBasis"></p>
      </div>
      <p class="note">生年月日などは、このブラウザの中だけに保存します。どこにも送信しません。アカウント登録もありません。</p>
      <button class="primary" type="button" id="submit">${isSetup ? 'はじめる' : '保存する'}</button>
      ${isSetup ? '' : `
        <div class="section">
          <h2 style="font-size:16px">ホーム画面に置く</h2>
          <p class="note">iPhone(Safari):画面下の共有ボタン(四角から矢印が出たマーク)→「ホーム画面に追加」。<br>Android(Chrome):右上の「︙」→「ホーム画面に追加」。<br>アプリのように、アイコンから開けるようになります。</p>
        </div>
        <div class="section">
          <h2 style="font-size:16px">データ</h2>
          <p class="note">生年月日・設定をすべて消して、最初の画面に戻ります。</p>
          <div id="wipeBox"><button class="danger" type="button" id="wipe">すべてのデータを消す</button></div>
        </div>
        <div class="section">
          <h2 style="font-size:16px">この数字について</h2>
          <p class="note">平均寿命は、厚生労働省「令和7年簡易生命表」の0歳時点の平均余命(男性${LIFE.m}年、女性${LIFE.f}年)です。一人ひとりの寿命を予測するものではありません。到達日は「生年月日+平均寿命×365.2425日」で計算しています。2月29日生まれの方は、平年は2月28日を誕生日として数えます。</p>
          <p class="note"><a href="./privacy.html">プライバシーポリシー</a></p>
        </div>`}
    </div>`;

  const sync = () => {
    $('#fBasis').textContent = f.sex === 'c'
      ? `目標年齢 ${f.custom || '—'}歳で計算します。`
      : `令和7年簡易生命表(厚生労働省)の${f.sex === 'm' ? `男性 ${LIFE.m}歳` : `女性 ${LIFE.f}歳`}。これは0歳時点の平均余命で、今の年齢からの見込みとは少し違います。`;
    $('#fCustomWrap').hidden = f.sex !== 'c';
    const b = parseBirth(f.birth);
    $('#submit').disabled = !(b && b <= new Date() && (f.sex !== 'c' || (f.custom >= 1 && f.custom <= 130)));
  };
  $('#fBirth').addEventListener('input', (e) => { f.birth = e.target.value; sync(); });
  $$('#fSex button').forEach((btn) => btn.addEventListener('click', () => {
    f.sex = btn.dataset.v; $$('#fSex button').forEach((x) => x.setAttribute('aria-pressed', String(x === btn))); sync();
  }));
  $('#fCustom').addEventListener('input', (e) => { f.custom = Math.round(Number(e.target.value)); sync(); });
  $('#submit').addEventListener('click', () => {
    if (f.sex !== 'c') f.custom = S.custom || 90;
    S = { ...S, ...f, look: S.look }; save();
    if (isSetup) track('setup_done');
    view = 'main'; render();
  });
  $('#close')?.addEventListener('click', () => { view = 'main'; render(); });
  $('#wipe')?.addEventListener('click', () => {
    $('#wipeBox').innerHTML = `<p style="font-weight:800">本当に消しますか?元に戻せません。</p>
      <div class="group" style="margin-top:8px"><button class="danger fill" type="button" id="wipeYes">消す</button><button class="ghost" type="button" id="wipeNo">やめる</button></div>`;
    $('#wipeNo').addEventListener('click', () => renderForm());
    $('#wipeYes').addEventListener('click', () => { store.clear(); S = { ...DEFAULTS }; applyLook('pop'); view = 'setup'; render(); });
  });
  sync();
}

// ════════ メイン画面 ════════
function renderMain() {
  track('view_main');
  const b = B(), Lv = L(), now = new Date();
  const s = snapshot(now, b, Lv);
  const se = seasons(now, b, Lv);
  const a = analogyForDay(now, b, Lv);
  const song = songForDay(now, b);
  const p = PEOPLE[Math.min(PEOPLE.length - 1, Math.max(0, S.person ?? 5))];
  const hitokoto = todaysHitokoto(now, b, Lv);

  app.innerHTML = `
    <div class="stack">
      <div class="top"><span class="label">TODAY</span><button class="link" id="openSettings" type="button">設定</button></div>
      ${hitokoto ? `<div class="hitokoto" role="status"><p><b>今日のひとこと</b>${esc(hitokoto)}</p><button type="button" id="hitokotoClose" aria-label="閉じる">×</button></div>` : ''}
      <div class="hero">
        <div class="today">今日は、人生の<br><span class="big num" id="dayN">${comma(s.dayNum)}</span> 日目。</div>
        <p class="sub">生まれてから <span class="num" id="aliveSec"></span> 秒が過ぎました。</p>
      </div>

      <div class="card ta" aria-label="今日のたとえ">
        <div class="ta-top"><span class="eyebrow">今日のたとえ</span><span class="chip">${esc(a.k)}</span></div>
        <p class="ta-lead">${esc(a.lead)}</p>
        <p class="ta-main"><span class="ta-v">${esc(a.value)}</span><span class="ta-u">${esc(a.unit)}</span>${esc(a.tail)}</p>
        <p class="ta-why">${esc(a.span)} あと${comma(a.days)}日 ・ ${esc(a.why)}</p>
      </div>

      <div class="group"><span class="label">数え方</span>
        <div class="seg" role="group" aria-label="数え方" id="units">
          ${UNIT_ORDER.map((u) => `<button type="button" data-u="${u}" aria-pressed="${S.unit === u}">${UNITS[u].name}</button>`).join('')}
        </div>
      </div>

      <div class="rows">
        ${row('bday', '次の誕生日まで', 'var(--pink)')}
        ${row('round', 'キリのいい年齢まで', 'var(--kin)')}
        ${row('kday', '次の節目の日まで', 'var(--natsu)')}
        <div class="row card main" style="--c:var(--ai)"><h3>平均寿命まで</h3><div class="v num" id="life-v"></div><div class="when" id="life-w"></div>
          <div class="bar"><i id="life-bar"></i></div><p class="frac" id="life-frac"></p><div class="ruler" id="life-ruler"></div></div>
      </div>
      <p class="note" style="margin-top:-18px">${S.sex === 'c' ? `目標年齢 ${S.custom}歳で計算しています。` : '平均寿命は令和7年簡易生命表(厚生労働省)による0歳時点の平均余命です。一人ひとりの寿命を予測するものではありません。'}</p>

      <div id="quiz-0"></div>

      <div class="group"><span class="label">あと何回、めぐってくるか</span>
        <div class="seasons">
          ${[['桜', se.sakura, 'sakura'], ['夏', se.summer, 'natsu'], ['紅葉', se.autumn, 'momiji'], ['誕生日', se.birthday, 'bd']]
            .map(([k, n, c]) => `<div class="season" style="--sb:var(--${c}Bg);--sc:var(--${c})"><span class="k">${k}</span><span class="v num">${n}<small>回</small></span></div>`).join('')}
        </div>
      </div>

      <div class="group">
        <h2 style="font-size:20px">のこりの時間を、たとえると</h2>
        <div class="seg" role="group" aria-label="どの時間をたとえるか" id="anaSeg">
          ${[['bday', '次の誕生日まで'], ['round', 'キリのいい年齢まで'], ['life', '平均寿命まで']].map(([k, n]) => `<button type="button" data-a="${k}" aria-pressed="${k === anaKey}">${n}</button>`).join('')}
        </div>
        <p class="note" id="anaLead"></p>
        <div class="grid" id="ana"></div>
      </div>

      <div id="quiz-1"></div>

      <div class="group">
        <h2 style="font-size:20px">同じ年齢で亡くなった人と比べる</h2>
        <select class="input" id="person" aria-label="比べる人">${PEOPLE.map((q, i) => `<option value="${i}" ${q === p ? 'selected' : ''}>${esc(q.name)}(${q.age}歳)</option>`).join('')}</select>
        <div class="card cmp" id="cmp"></div>
        <p class="note">年齢は満年齢、生きた日数は西暦の生年月日・没年月日から数えたものです。歴史上の日付には諸説あります。</p>
      </div>

      <div id="quiz-2"></div>

      <div class="group" style="gap:4px">
        <h2 style="font-size:20px">一生を、週で並べる</h2>
        <div class="legend"><span style="--c:var(--ai)">過ぎた週</span><span style="--c:var(--now)">今週</span><span style="--c:var(--future)">これからの週</span></div>
        <p class="note">1行が1年(52週)。マスを押すと、その週がいつかを表示します。</p>
        <div class="grid-box" id="gridBox"><canvas id="weeks" aria-label="人生の週の方眼"></canvas></div>
      </div>

      <p class="words">${se.leftYears > 0 ? `平均どおりなら、あと週末は約 <span class="num">${comma(se.weekends)}</span> 回。<br>今週も、そのうちの1回です。` : 'ここからの一日一日は、平均の先にある贈りものです。'}</p>

      ${song ? `<div class="card song" aria-label="今日のうた">
        <span class="eyebrow">今日のうた</span>
        <p class="song-line">${br(song.line)}</p>
        <p class="song-credit">— ${esc(ARTIST)}「${esc(song.song)}」</p>
        ${song.link ? `<p class="song-credit"><a href="${esc(song.link)}" target="_blank" rel="noopener" data-track="music_link">この曲を聴く</a></p>` : ''}
      </div>` : ''}

      <div class="group" style="justify-items:center">
        <button class="ghost" type="button" id="share">このページを友だちに教える</button>
        <p class="note" id="shareMsg" role="status"></p>
      </div>
      <footer class="foot">
        <p id="counter"></p>
        <p>通知とウィジェットは、スマホアプリ版で使えるようになります(準備中)。</p>
        <p><a href="./privacy.html">プライバシーポリシー</a></p>
      </footer>
    </div>`;

  $('#openSettings').addEventListener('click', () => { view = 'settings'; render(); });
  $('#hitokotoClose')?.addEventListener('click', (e) => e.target.closest('.hitokoto').remove());
  $$('#units button').forEach((btn) => btn.addEventListener('click', () => {
    S.unit = btn.dataset.u; save(); $$('#units button').forEach((x) => x.setAttribute('aria-pressed', String(x === btn))); tick();
  }));
  $$('#anaSeg button').forEach((btn) => btn.addEventListener('click', () => {
    anaKey = btn.dataset.a; $$('#anaSeg button').forEach((x) => x.setAttribute('aria-pressed', String(x === btn))); renderAna();
  }));
  $('#person').addEventListener('change', (e) => { S.person = Number(e.target.value); save(); renderCompare(); });
  $('#share').addEventListener('click', share);
  $$('[data-track]').forEach((el) => el.addEventListener('click', () => track(el.dataset.track)));
  $('#weeks').addEventListener('click', onGridTap);
  renderAna();
  renderCompare();
  quizzes = makeQuizzes(now, b, Lv);
  quizzes.forEach((_, i) => renderQuiz(i));
  drawWeeks();
  loadCounter().then((n) => { if (n) $('#counter').textContent = `これまでに ${comma(n)} 回ひらかれました`; });
  tick();
  timer = setInterval(tick, S.unit === 'sec' || S.unit === 'hour' ? 100 : 200);
}

const row = (id, title, color) =>
  `<div class="row card" style="--c:${color}"><h3>${title}</h3><div class="v num" id="${id}-v"></div><div class="when" id="${id}-w"></div></div>`;

function tick() {
  if (view !== 'main' || !$('#dayN')) return;
  const b = B(), Lv = L(), now = new Date(), s = snapshot(now, b, Lv);
  if (iso(now) !== renderedDay) { renderedDay = iso(now); return render(); } // 日付が変わったら描き直す
  const f = (ms) => { const v = fmtUnit(ms, S.unit); return `${v.value}<small>${v.name}</small>`; };
  $('#aliveSec').textContent = comma(Math.floor(s.livedMs / 1000));
  $('#bday-v').innerHTML = f(s.nextBday - now);
  $('#bday-w').textContent = s.isBirthdayToday ? `今日は${s.age}歳の誕生日です。次は${fmtDate(s.nextBday)}(${s.age + 1}歳)` : `${fmtDate(s.nextBday)} に ${s.age + 1}歳`;
  $('#round-v').innerHTML = f(s.roundDate - now);
  $('#round-w').textContent = `${fmtDate(s.roundDate)} に ${s.roundAge}歳`;
  $('#kday-v').innerHTML = f(s.kDate - now);
  $('#kday-w').textContent = `${fmtDate(s.kDate)} が人生の ${comma(s.nextK)} 日目`;
  $('#life-v').innerHTML = s.leftMs > 0 ? f(s.leftMs) : '<small style="margin:0">平均寿命を超えて生きています</small>';
  $('#life-w').textContent = s.leftMs > 0 ? `${Lv}歳(${fmtDate(s.end)}ごろ)まで。いま一生の ${s.pct.toFixed(2)}% の地点` : `${Lv}歳の地点を越えた毎日です`;
  $('#life-bar').style.width = `${s.pct}%`;
  // 分母:一生を年・か月・週・日で
  const total = s.end - b, past = Math.min(s.livedMs, total), rest = Math.max(0, s.leftMs);
  const u = fmtUnit(total, S.unit), r = fmtUnit(rest, S.unit);
  $('#life-frac').innerHTML = `一生 <span class="num">${u.value}${u.name}</span> のうち、のこり <span class="num ai">${r.value}${r.name}</span>`;
  const n = (ms, per, dec) => (dec ? comma(Math.floor((ms / per) * 10) / 10, 1) : comma(Math.floor(ms / per)));
  $('#life-ruler').innerHTML = '<span></span><span>一生</span><span>過ぎた</span><span>のこり</span>' +
    [['年', YEAR, true], ['か月', YEAR / 12, false], ['週', 7 * DAY, false], ['日', DAY, false]]
      .map(([k, per, dec]) => `<span class="u">${k}</span><span class="num">${n(total, per, dec)}</span><span class="num">${n(past, per, dec)}</span><span class="num ai">${n(rest, per, dec)}</span>`).join('');
}
let renderedDay = iso(new Date());

// ── たとえ一覧 ──
let anaKey = 'life';
function renderAna() {
  const b = B(), Lv = L(), now = new Date();
  const items = GRID.map((r) => analogyWith(r, now, b, Lv, anaKey));
  const days = items[0]?.days ?? 0;
  $('#anaLead').textContent = days > 0 ? `${items[0].span} あと${comma(days)}日。毎日1時間を使うとしたら…` : 'ここからの毎日は、平均の先の時間です。';
  $('#ana').innerHTML = days > 0
    ? items.map((a) => `<div class="card gcard"><span class="k">${esc(a.k)}</span><span class="v num">${esc(a.value)}</span><span class="u">${esc(a.unit)} ${esc(a.tail)}</span><span class="why">${esc(a.why)}</span></div>`).join('')
    : '';
}

// ── クイズ:のこりの時間で何回できるか(画面に3問を散りばめる。答えはその日のあいだ覚えておく) ──
let quizzes = [];
function quizState() {
  const today = iso(new Date());
  const st = store.get('inochi.quiz');
  return st && st.day === today ? st : { day: today, answers: {} };
}
function renderQuiz(i) {
  const box = $(`#quiz-${i}`), q = quizzes[i];
  if (!box || !q) return;
  const st = quizState();
  const picked = st.answers[q.id];
  const done = picked !== undefined;
  const answered = quizzes.filter((x) => st.answers[x.id] !== undefined);
  const right = answered.filter((x) => st.answers[x.id] === x.answer).length;
  box.innerHTML = `<div class="card quiz" aria-label="クイズ ${i + 1}">
    <div class="ta-top"><span class="eyebrow">クイズ ${i + 1}/${quizzes.length}</span>${answered.length ? `<span class="chip">今日の正解 ${right}/${answered.length}</span>` : ''}</div>
    <p class="quiz-premise">${esc(q.premise)}</p>
    <p class="quiz-q">${esc(q.q)}</p>
    <div class="choices" role="group" aria-label="答えを選ぶ">
      ${q.choices.map((c, j) => `<button type="button" class="choice${done && j === q.answer ? ' ok' : ''}${done && j === picked && j !== q.answer ? ' ng' : ''}" data-j="${j}" ${done ? 'disabled' : ''}>約${esc(c)}<small>${esc(q.unit)}</small></button>`).join('')}
    </div>
    ${done ? `<p class="quiz-result">${picked === q.answer ? '正解!' : `ざんねん。正解は 約${esc(q.choices[q.answer])}${esc(q.unit)}`}<span>ちょうどだと ${esc(q.exact)}${esc(q.unit)}</span></p><p class="ta-why">${esc(q.why)}</p>` : ''}
  </div>`;
  $$('.choice', box).forEach((btn) => btn.addEventListener('click', () => {
    const j = Number(btn.dataset.j);
    const s2 = quizState();
    s2.answers[q.id] = j;
    store.set('inochi.quiz', s2);
    track('quiz', { result: j === q.answer ? 'correct' : 'wrong', detail: `quiz:${q.k}` });
    quizzes.forEach((_, k) => renderQuiz(k)); // 得点の表示をそろえる
  }));
}

// ── 人物との比較 ──
function renderCompare() {
  const b = B(), p = PEOPLE[S.person ?? 5] || PEOPLE[5];
  const mine = snapshot(new Date(), b, L()).dayNum;
  const c = compare(p, mine, b);
  const max = Math.max(mine, p.days);
  const head = esc(c.text).replace(/([\d,]+) 日/, '<span class="num">$1</span> 日');
  $('#cmp').innerHTML = `<p class="cmp-head">${head}</p>
    <div class="cbars">
      <span>${esc(p.name)}</span><div class="cbar"><i style="width:${(p.days / max) * 100}%;background:var(--pink)"></i></div><span class="num">${comma(p.days)}日</span>
      <span>あなた</span><div class="cbar"><i style="width:${(mine / max) * 100}%;background:var(--ai)"></i></div><span class="num">${comma(mine)}日</span>
    </div>
    <p class="note" style="font-size:13px">${esc(p.name)}は${p.age}歳までに、${esc(p.did)}。</p>`;
}

// ── 週の方眼 ──
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
let geom = null;
function drawWeeks() {
  const cv = $('#weeks'); if (!cv) return;
  const b = B(), now = new Date(), Lv = L();
  const W = cv.parentElement.clientWidth, years = Math.max(Math.ceil(Lv), ageAt(now, b) + 1);
  const labelW = 26, gap = 1, cell = Math.max(3, Math.floor((W - labelW - gap * 51) / 52)), H = years * (cell + gap) + 4;
  const dpr = window.devicePixelRatio || 1;
  cv.width = W * dpr; cv.height = H * dpr; cv.style.height = `${H}px`;
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr); ctx.clearRect(0, 0, W, H);
  const r = S.look === 'pop' || !LOOKS.includes(S.look) ? cell / 2.6 : 0;
  const cPast = css('--ai'), cNow = css('--now'), cFut = css('--future'), cMuted = css('--muted');
  const age = ageAt(now, b), cur = currentWeekOfYear(now, b);
  ctx.font = `10px ${css('--f-num')}`; ctx.textBaseline = 'middle';
  const sq = (x, y) => { if (r > 0.5 && ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, cell, cell, r); ctx.fill(); } else ctx.fillRect(x, y, cell, cell); };
  for (let y = 0; y < years; y++) {
    const top = y * (cell + gap);
    if (y % 10 === 0) { ctx.globalAlpha = 1; ctx.fillStyle = cMuted; ctx.fillText(String(y), 0, top + cell / 2); }
    for (let w = 0; w < 52; w++) {
      const past = y < age || (y === age && w < cur), isCur = y === age && w === cur;
      ctx.globalAlpha = y + w / 52 >= Lv && !past && !isCur ? 0.35 : 1; // 平均寿命を超える部分は薄く
      ctx.fillStyle = isCur ? cNow : past ? cPast : cFut;
      sq(labelW + w * (cell + gap), top);
    }
  }
  ctx.globalAlpha = 1;
  geom = { labelW, gap, cell, years };
}
function onGridTap(e) {
  $$('.tip').forEach((t) => t.remove());
  if (!geom) return;
  const cv = e.currentTarget, rect = cv.getBoundingClientRect(), x = e.clientX - rect.left, y = e.clientY - rect.top;
  const w = Math.floor((x - geom.labelW) / (geom.cell + geom.gap)), yr = Math.floor(y / (geom.cell + geom.gap));
  if (w < 0 || w > 51 || yr < 0 || yr >= geom.years) return;
  const b = B(), start = new Date(bdayIn(b.getFullYear() + yr, b).getTime() + w * 7 * DAY);
  const tip = document.createElement('div');
  tip.className = 'tip';
  tip.textContent = `${yr}歳 ${w + 1}週目(${start.getFullYear()}年${start.getMonth() + 1}月ごろ)`;
  tip.style.left = `${Math.min(Math.max(x, 90), rect.width - 90)}px`;
  tip.style.top = `${y}px`;
  $('#gridBox').appendChild(tip);
}

// ── 今日のひとこと(その日はじめて開いたときだけ) ──
function todaysHitokoto(now, b, Lv) {
  const today = iso(now);
  if (store.get('inochi.hitokoto.day') === today) return null;
  store.set('inochi.hitokoto.day', today);
  const m = messageFor(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12), b, Lv, { daily: true, milestones: true });
  return m ? m.body : null;
}

// ── 共有(ボタンを押した回数を数える。実際に投稿されたかは分からない) ──
async function share() {
  track('share_click');
  const data = { title: 'いのち時計', text: '今日は人生の何日目?のこりの時間を、毎日ちがうたとえで。', url: 'https://b0bisore.com/inochi/' };
  try {
    if (navigator.share) { await navigator.share(data); return; }
    await navigator.clipboard.writeText(data.url);
    $('#shareMsg').textContent = 'アドレスをコピーしました。';
  } catch { $('#shareMsg').textContent = `アドレス:${data.url}`; }
}

window.addEventListener('resize', () => { clearTimeout(window.__rt); window.__rt = setTimeout(() => view === 'main' && drawWeeks(), 150); });
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => view === 'main' && drawWeeks());

// 起動
track('open');
render();

// 一度開けば、電波がなくても開けるように
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
