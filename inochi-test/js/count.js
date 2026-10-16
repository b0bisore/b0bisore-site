// アクセスの記録(ゲーム制作の正本・輪廻ガチャと同じ「Googleスプレッドシートに1操作1行」の方式)。
// ・LOG_URL に Apps Script のウェブアプリURLを入れると記録が始まる。空のあいだは何も送らない。
// ・送るのは action・mode・result・detail・lang・sid(ページを開くたびに作る使い捨てID)・version だけ。
//   生年月日・年齢・計算結果は送らない。
// ・action は輪廻ガチャとそろえる:visit=ページを開いた、roll=結果に到達(このアプリではメイン画面を見た)、share=共有ボタン。
//   このアプリだけの出来事は action「event」として detail に種類を入れる(setup_done・revisit・music_link・quiz:題材)。
//   クイズは result に correct / wrong を入れる。
// ・記録の項目を変えたら APP_VERSION を上げる。
// ・数は近似。使い捨てIDなので人数とは断定しない。共有ボタンは押した回数で、実際の投稿とは区別する。
const LOG_URL = 'https://script.google.com/macros/s/AKfycbxxV_vWSIvMjKbqEsyDW_e_3mM0A_VyHfK-SCCnnlP_0rI5aFs5CpiE0HKm969UVZKESQ/exec'; // いのち時計 プレイ記録(スプレッドシート)の Apps Script ウェブアプリURL
const APP_VERSION = 'v1.2.0'; // v1.2.0:見た目3種(ポップ/おちつき/ドット)を常時切り替え。v1.1.0:クイズの回答(event / detail=quiz:題材 / result=correct・wrong)を追加
// テスト版(/inochi-test/)では何も送らない(本番の記録を汚さない)
export const IS_TEST = /\/inochi-test\//.test(location.pathname);
const SID = Math.random().toString(36).slice(2, 10);
const DAY_KEY = 'inochi.lastday';

const MAP = {
  open: ['visit', ''],
  view_main: ['roll', 'main'],
  share_click: ['share', ''],
  setup_done: ['event', 'setup_done'],
  revisit: ['event', 'revisit'],
  music_link: ['event', 'music_link'],
  quiz: ['event', 'quiz'],
};
let viewed = false;

function version() {
  const h = location.hostname;
  return APP_VERSION + (/b0bisore\.com$/.test(h) ? '' : '-' + (/claude/.test(h) || !h ? 'claude' : h));
}

function send(type, extra = {}) {
  const m = MAP[type];
  if (!LOG_URL || !m || IS_TEST) return;
  if (type === 'view_main') { if (viewed) return; viewed = true; } // 1訪問1回
  const body = JSON.stringify({ action: m[0], mode: 'いのち時計', result: extra.result || '', detail: extra.detail || m[1], lang: 'ja', sid: SID, version: version() });
  try { if (navigator.sendBeacon && navigator.sendBeacon(LOG_URL, new Blob([body], { type: 'text/plain' }))) return; } catch { /* noop */ }
  try { fetch(LOG_URL, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain' }, body }); } catch { /* 記録できなくても、アプリはそのまま使える */ }
}

export function track(type, extra) {
  if (IS_TEST) return;
  if (type === 'open') {
    // 別の日にまた開いた(再訪)。日付だけをこの端末に覚えておく
    let last = null;
    const today = new Date().toLocaleDateString('sv-SE');
    try { last = localStorage.getItem(DAY_KEY); localStorage.setItem(DAY_KEY, today); } catch { /* noop */ }
    if (last && last !== today) send('revisit');
  }
  send(type, extra);
}

/** これまでに開かれた回数(画面下のアクセスカウンター)。記録用ウェブアプリが数を返す場合だけ表示する */
export async function loadCounter() {
  if (!LOG_URL || IS_TEST) return null;
  try {
    const r = await fetch(`${LOG_URL}?count=visit`, { cache: 'no-store' });
    const j = await r.json();
    return typeof j.visits === 'number' && j.visits > 0 ? j.visits : null;
  } catch { return null; }
}
