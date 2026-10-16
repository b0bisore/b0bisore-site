// いのち時計:計算・たとえ・人物・歌詞(ブラウザ版の正本)。
// 2026-10-16 にスマホアプリ版(native/src/lib)から書き写した。以後はこのファイルを直す。
// 計算ルール:2/29生まれは平年2/28が誕生日、平均寿命の到達日=生年月日+年数×365.2425日、令和7年簡易生命表。

// native/src/lib/life.ts
var LIFE = { m: 81.35, f: 87.33 };
var DAY = 864e5;
var YEAR = 365.2425 * DAY;
var UNIT_ORDER = ["day", "week", "month", "year", "hour", "sec"];
var UNITS = {
  day: { ms: DAY, name: "日", dec: 5 },
  week: { ms: 7 * DAY, name: "週", dec: 6 },
  hour: { ms: 36e5, name: "時間", dec: 3 },
  month: { ms: YEAR / 12, name: "か月", dec: 6 },
  year: { ms: YEAR, name: "年", dec: 7 },
  sec: { ms: 1e3, name: "秒", dec: 0 }
};
function parseBirth(v) {
  const [y, m, d] = v.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
function lifeYears(p) {
  return p.sex === "c" ? p.custom : LIFE[p.sex];
}
function bdayIn(year, b) {
  const m = b.getMonth();
  const d = b.getDate();
  const last = new Date(year, m + 1, 0).getDate();
  return new Date(year, m, Math.min(d, last));
}
function ageAt(now, b) {
  let a = now.getFullYear() - b.getFullYear();
  if (now < bdayIn(now.getFullYear(), b)) a--;
  return a;
}
var startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
var sameDay = (a, b) => a.toDateString() === b.toDateString();
function dayNumber(now, b) {
  return Math.floor((startOfDay(now).getTime() - b.getTime()) / DAY + 0.5) + 1;
}
function dateOfDayNumber(n, b) {
  return new Date(b.getFullYear(), b.getMonth(), b.getDate() + n - 1);
}
function nextBirthday(now, b) {
  let nb = bdayIn(now.getFullYear(), b);
  if (nb <= startOfDay(now)) nb = bdayIn(now.getFullYear() + 1, b);
  return nb;
}
function isBirthday(now, b) {
  return sameDay(bdayIn(now.getFullYear(), b), now);
}
function lifeEnd(b, L) {
  return new Date(b.getTime() + L * YEAR);
}
function calendarDaysBetween(from, to) {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY);
}
function snapshot(now, b, L) {
  const age = ageAt(now, b);
  const dayNum = dayNumber(now, b);
  const nextBday = nextBirthday(now, b);
  const isBirthdayToday = isBirthday(now, b);
  const roundAge = (Math.floor(age / 10) + 1) * 10;
  const roundDate = bdayIn(b.getFullYear() + roundAge, b);
  const nextK = (Math.floor(dayNum / 1e3) + 1) * 1e3;
  const kDate = dateOfDayNumber(nextK, b);
  const end = lifeEnd(b, L);
  const livedMs = now.getTime() - b.getTime();
  return {
    now,
    birth: b,
    age,
    dayNum,
    livedMs,
    nextBday,
    nextBdayAge: age + 1,
    isBirthdayToday,
    roundAge,
    roundDate,
    nextK,
    kDate,
    L,
    end,
    leftMs: end.getTime() - now.getTime(),
    pct: Math.min(100, livedMs / (end.getTime() - b.getTime()) * 100)
  };
}
function seasons(now, b, L) {
  const leftY = Math.max(0, (b.getTime() + L * YEAR - now.getTime()) / YEAR);
  const m = now.getMonth() + 1;
  return {
    sakura: Math.max(0, Math.floor(leftY + (m < 4 ? 1 : 0))),
    summer: Math.max(0, Math.floor(leftY + (m < 8 ? 1 : 0))),
    autumn: Math.max(0, Math.floor(leftY + (m < 11 ? 1 : 0))),
    birthday: Math.max(0, Math.floor(leftY)),
    weekends: Math.max(0, Math.floor(leftY * 52.1775)),
    leftYears: leftY
  };
}
function currentWeekOfYear(now, b) {
  const age = ageAt(now, b);
  const thisBday = bdayIn(b.getFullYear() + age, b);
  return Math.min(51, Math.floor((now.getTime() - thisBday.getTime()) / (7 * DAY)));
}
var fmtDate = (d) => `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
// 数字の書き方。小数点と見分けやすいよう、3けたごとの「,」は付けない(2026-10-16 本人指示)
function comma(n, dec = 0) {
  return (n < 0 ? "-" : "") + Math.abs(n).toFixed(dec);
}
function fmtUnit(ms, unit) {
  const u = UNITS[unit];
  const v = Math.max(0, ms) / u.ms;
  return { value: comma(unit === "sec" ? Math.floor(v) : v, u.dec), name: u.name };
}
function daysUntil(now, target) {
  return Math.max(0, calendarDaysBetween(now, target));
}

// native/src/lib/analogies.ts
var POOL = [
  { k: "本", how: "毎日1時間、本を読むと", why: "1冊5時間として", unit: "冊", tail: "本を読めます", per: (d) => d / 5 },
  { k: "映画", how: "毎日1時間ずつ映画を見ると", why: "1本2時間として", unit: "本", tail: "映画を見られます", per: (d) => d / 2 },
  { k: "散歩", how: "毎日1時間、散歩をすると", why: "1時間で4km、地球1周は約4万km", unit: "周", tail: "地球を回れます", per: (d) => d * 4 / 40075, dec: true },
  { k: "習いごと", how: "毎日1時間、練習を続けると", why: "1万時間で一人前になるといわれます", unit: "個", tail: "新しいことが身につきます", per: (d) => d / 1e4, dec: true },
  { k: "外国語", how: "毎日1時間、外国語を学ぶと", why: "日本語話者が英語を身につけるのに約2200時間とされます", unit: "か国語", tail: "話せるようになります", per: (d) => d / 2200, dec: true },
  { k: "満月", how: "晴れた夜に空を見上げると", why: "月の満ち欠けは約29.5日", unit: "回", tail: "満月を見られます", per: (d) => d / 29.53 },
  { k: "週末", how: "カレンダーをめくると", why: "7日に1回として", unit: "回", tail: "週末があります", per: (d) => d / 7 },
  { k: "日記", how: "毎日1ページ日記を書くと", why: "1冊100ページとして", unit: "冊", tail: "日記帳がうまります", per: (d) => d / 100 },
  { k: "写真", how: "毎日1枚、写真を撮ると", why: "1日1枚として", unit: "枚", tail: "「今日の1枚」が撮れます", per: (d) => d },
  { k: "電話", how: "毎週1回、大切な人に電話すると", why: "週1回として", unit: "回", tail: "大切な人と話せます", per: (d) => d / 7 },
  { k: "マラソン", how: "毎日30分、ジョギングすると", why: "30分で5kmとして", unit: "回", tail: "フルマラソンを走った距離になります", per: (d) => d * 5 / 42.195 },
  { k: "日本縦断", how: "毎日7000歩あるくと", why: "歩幅70cm、日本縦断は約3000km", unit: "回", tail: "日本列島を縦断できます", per: (d) => d * 7e3 * 0.7 / 1e3 / 3e3, dec: true },
  { k: "料理", how: "毎週1品、新しいレシピに挑戦すると", why: "週1品として", unit: "品", tail: "新しい料理を覚えられます", per: (d) => d / 7 },
  { k: "旅", how: "年に2回、旅行に行くと", why: "半年に1回として", unit: "回", tail: "旅に出られます", per: (d) => d / 182.6 },
  { k: "音楽", how: "毎日1時間、音楽を聴くと", why: "1曲4分として", unit: "曲", tail: "好きな曲を聴けます", per: (d) => d * 15 },
  { k: "朝ごはん", how: "毎朝ちゃんと食べると", why: "1日1回として", unit: "回", tail: "朝ごはんを食べられます", per: (d) => d }
];
function fmt(v, dec) {
  return dec ? comma(Math.floor(v * 10) / 10, 1) : comma(Math.floor(v));
}
function spanInfo(now, b, L, key) {
  const s = snapshot(now, b, L);
  const ms = key === "life" ? s.leftMs : key === "round" ? s.roundDate.getTime() - now.getTime() : s.nextBday.getTime() - now.getTime();
  const name = key === "life" ? "平均寿命まで" : key === "round" ? `${s.roundAge}歳まで` : `${s.age + 1}歳の誕生日まで`;
  return { name, days: Math.max(0, ms) / DAY, s };
}
function analogyWith(rule, now, b, L, key) {
  const { name, days } = spanInfo(now, b, L, key);
  return {
    k: rule.k,
    span: name,
    lead: `${name}、${rule.how}`,
    value: fmt(rule.per(days), rule.dec),
    unit: rule.unit,
    tail: rule.tail,
    why: rule.why,
    days: Math.floor(days)
  };
}
function analogyForDay(day, b, L) {
  const { s } = spanInfo(day, b, L, "life");
  const spans = s.leftMs > 0 ? ["life", "round", "bday"] : ["round", "bday"];
  const rule = POOL[s.dayNum % POOL.length];
  const key = spans[Math.floor(s.dayNum / POOL.length) % spans.length];
  return analogyWith(rule, day, b, L, key);
}
var GRID_KEYS = ["本", "映画", "散歩", "習いごと", "満月", "朝ごはん"];
var GRID = GRID_KEYS.map((k) => POOL.find((r) => r.k === k));

// native/src/lib/people.ts
var RAW = [
  { name: "樋口一葉", b: "1872-05-02", d: "1896-11-23", did: "「たけくらべ」「にごりえ」などの代表作を、わずか1年あまりで書き上げた" },
  { name: "石川啄木", b: "1886-02-20", d: "1912-04-13", did: "歌集『一握の砂』で、暮らしの気持ちを短歌に詠んだ" },
  { name: "坂本龍馬", b: "1836-01-03", d: "1867-12-10", did: "薩長同盟の仲立ちをし、新しい時代への道を開いた" },
  { name: "シューベルト", b: "1797-01-31", d: "1828-11-19", did: "600曲以上の歌曲を作り「歌曲の王」と呼ばれた" },
  { name: "正岡子規", b: "1867-10-14", d: "1902-09-19", did: "病床にありながら、2万句以上の俳句を残した" },
  { name: "モーツァルト", b: "1756-01-27", d: "1791-12-05", did: "600曲を超える作品を残した" },
  { name: "宮沢賢治", b: "1896-08-27", d: "1933-09-21", did: "「銀河鉄道の夜」などを書き、生前に出した本は2冊だけだった" },
  { name: "ゴッホ", b: "1853-03-30", d: "1890-07-29", did: "画家として過ごした約10年で、2000点以上の作品を描いた" },
  { name: "ショパン", b: "1810-03-01", d: "1849-10-17", did: "「ピアノの詩人」と呼ばれ、今も弾き継がれる名曲を残した" },
  { name: "夏目漱石", b: "1867-02-09", d: "1916-12-09", did: "38歳で『吾輩は猫である』を書き、作家として過ごしたのは約10年だった" },
  { name: "野口英世", b: "1876-11-09", d: "1928-05-21", did: "世界を旅して、感染症の研究に打ち込んだ" },
  { name: "ベートーヴェン", b: "1770-12-16", d: "1827-03-26", did: "耳が聞こえにくくなってからも、交響曲第9番を完成させた" },
  { name: "マリー・キュリー", b: "1867-11-07", d: "1934-07-04", did: "ノーベル賞を2度受けた" },
  { name: "伊能忠敬", b: "1745-02-11", d: "1818-05-17", did: "50歳で天文学を学びはじめ、55歳から日本中を歩いて測量した" },
  { name: "アインシュタイン", b: "1879-03-14", d: "1955-04-18", did: "26歳で特殊相対性理論を発表した" },
  { name: "エジソン", b: "1847-02-11", d: "1931-10-18", did: "1000件以上の発明の特許をとった" },
  { name: "葛飾北斎", b: "1760-10-31", d: "1849-05-10", did: "70代で「富嶽三十六景」を描き、亡くなるまで画を描き続けた" },
  { name: "ナイチンゲール", b: "1820-05-12", d: "1910-08-13", did: "近代の看護の基礎をつくった" }
];
var PEOPLE = RAW.map((p) => {
  const b = parseBirth(p.b);
  const d = parseBirth(p.d);
  return { name: p.name, did: p.did, age: ageAt(d, b), days: Math.round((d.getTime() - b.getTime()) / DAY) + 1 };
});
var DEFAULT_PERSON = PEOPLE.findIndex((p) => p.name === "モーツァルト");
function compare(p, myDayNum, birth) {
  if (myDayNum < p.days) {
    const at = dateOfDayNumber(p.days, birth);
    return { ahead: false, text: `${p.name}が生きた日数まで、あと ${comma(p.days - myDayNum)} 日(${fmtDate(at)})`, diff: p.days - myDayNum };
  }
  if (myDayNum === p.days) return { ahead: true, text: `今日、${p.name}が生きた日数に並びました。`, diff: 0 };
  return { ahead: true, text: `あなたはもう、${p.name}が生きた日数を ${comma(myDayNum - p.days)} 日 越えて生きています`, diff: myDayNum - p.days };
}

// native/src/lib/songs.ts
var ARTIST = "アイスクリームネバーグラウンド";
var SONG_LINES = [
  // 2026-10-16 本人提供(チャットに貼られた文面そのまま)。例:{ song: '曲名', line: '1行目\n2行目', link: 'https://...' }
  { song: "2ステ3フン4ローイング", line: "なんと超一瞬な運動会\nそして君で完成 挑む 二回戦\nフォローするかフォローされるかは 今\n一生懸命 余命カウントダウン GO" },
  { song: "2ステ3フン4ローイング", line: "たった3分間の判断で\n揺らすSTEPSTEP 才能の可能性\n賭ける全身 如何せん世間体\nVANS蹴って 差別化" },
  { song: "2ステ3フン4ローイング", line: "されど半世紀秒で 変わる将来" },
  { song: "2ステ3フン4ローイング", line: "一生本番 刻限カウントダウン 轟" },
  { song: "2ステ3フン4ローイング", line: "一生懸命 余命カウントダウン GO" },
  { song: "必須GOGOAL", line: "COUNT UP COUNT UP\nひたすら数字を\nCOUNT UP COUNT UP\nただただ時分を\nCOUNT UP COUNT UP" },
  { song: "リビングステッパーズ", line: "毎日此処で 生きる為生きてる" },
  { song: "リビングステッパーズ", line: "勘繰るな 我が生\n世間の目 他人の目 目潰しかまして" },
  { song: "リビングステッパーズ", line: "明日も明後日も 我ら舞い生きる" },
  { song: "リビングステッパーズ", line: "Oh 価値観異常の挽回" },
  { song: "エンドレスリレー", line: "今世の生業 巡り合い時節\n腑抜けたままでは 時経る 期限減る" },
  { song: "エンドレスリレー", line: "手前の責務 果たせ天命" },
  { song: "エンドレスリレー", line: "ベスト燃焼 現世 完遂 この生" },
  { song: "エンドレスリレー", line: "強制永久レース 完遂この生\n上がれ二重螺旋 次のランナーへ" },
  { song: "遊ビバレボリューション", line: "止まらない\n時流の最中 ここが最前線\n現在の体感 五感が百感\n二度と来ない 時・場所・機会\nつちかわれた連鎖の中でロールを果たせ" },
  { song: "遊ビバレボリューション", line: "つちかわれた連鎖の中でロールを果たせ" },
  { song: "遊ビバレボリューション", line: "全人類 足元繋げるグラウンド\nいつか土還る それまで常に\n起こせ己の遊ビバレボリューション\n残せ手前の遊ビバレボリューション" },
  { song: "YARITAI KOTO YARE", line: "光を見ることは\n死を見ることだ" },
  { song: "YARITAI KOTO YARE", line: "Fuck 欺瞞！世間体＆アディクション\nFuck 欺瞞！フル無視レッツゴー" }
];
function songForDay(day, b, lines = SONG_LINES) {
  if (lines.length === 0) return null;
  return lines[dayNumber(day, b) % lines.length];
}

// native/src/lib/messages.ts
var TITLE = "いのちの残り時間";
function messageFor(day, b, L, opts) {
  const n = dayNumber(day, b);
  if (opts.milestones) {
    if (isBirthday(day, b)) {
      const age = ageAt(day, b);
      if (age > 0 && age % 10 === 0) {
        return { title: TITLE, kind: "roundAge", body: `今日で${age}歳。キリのいい節目の誕生日です。ここまでの${comma(n)}日に、おつかれさま。` };
      }
      return { title: TITLE, kind: "birthday", body: `お誕生日おめでとうございます。今日から${age}歳。新しい1年のはじまりです。` };
    }
    if (n % 1e3 === 0) {
      return { title: TITLE, kind: "kiloDay", body: `今日は人生の${comma(n)}日目。節目の一日です。` };
    }
    const in7 = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 7);
    if (isBirthday(in7, b)) {
      return { title: TITLE, kind: "reminder", body: `あと7日で、${ageAt(in7, b)}歳の誕生日です。` };
    }
    if (dayNumber(in7, b) % 1e3 === 0) {
      return { title: TITLE, kind: "reminder", body: `あと7日で、人生の${comma(dayNumber(in7, b))}日目です。` };
    }
  }
  if (!opts.daily) return null;
  const end = lifeEnd(b, L);
  const left = calendarDaysBetween(day, end);
  const r = n % 3;
  if (r === 2) {
    const a = analogyForDay(day, b, L);
    return { title: TITLE, kind: "daily", body: `今日のたとえ:${a.lead}、${a.value}${a.unit} ${a.tail}` };
  }
  if (left <= 0) {
    return { title: TITLE, kind: "daily", body: `今日は人生の${comma(n)}日目。平均の先にある、贈りものの一日です。` };
  }
  return r === 0 ? { title: TITLE, kind: "daily", body: `今日は人生の${comma(n)}日目。` } : { title: TITLE, kind: "daily", body: `平均寿命まで あと${comma(left)}日。今日も、そのうちの1日です。` };
}
function planMessages(now, b, L, opts, max = 60) {
  if (!opts.daily && !opts.milestones) return [];
  const out = [];
  const horizon = opts.daily ? max + 1 : 366 * 3;
  for (let i = 0; i < horizon && out.length < max; i++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, opts.hour, opts.minute);
    if (at <= now) continue;
    const msg = messageFor(at, b, L, opts);
    if (msg) out.push({ ...msg, date: at });
  }
  if (out.length > 0) {
    const last = out[out.length - 1];
    out[out.length - 1] = { ...last, body: `${last.body}
通知を続けるには、ときどきアプリを開いてください。` };
  }
  return out;
}
export {
  ARTIST,
  DAY,
  DEFAULT_PERSON,
  GRID,
  GRID_KEYS,
  LIFE,
  PEOPLE,
  POOL,
  SONG_LINES,
  UNITS,
  UNIT_ORDER,
  YEAR,
  ageAt,
  analogyForDay,
  analogyWith,
  bdayIn,
  calendarDaysBetween,
  comma,
  compare,
  currentWeekOfYear,
  dateOfDayNumber,
  dayNumber,
  daysUntil,
  fmtDate,
  fmtUnit,
  isBirthday,
  lifeEnd,
  lifeYears,
  messageFor,
  nextBirthday,
  parseBirth,
  planMessages,
  sameDay,
  seasons,
  snapshot,
  songForDay,
  spanInfo,
  startOfDay
};
