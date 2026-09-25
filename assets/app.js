/* 楊梅高中70週年校慶專刊 — 網站互動程式（無外部資源） */
(() => {
'use strict';
const B = window.BOOK;
const TOTAL = B.total;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const main = $('#main');
const pad = n => String(n).padStart(3, '0');
const pageImg = n => `pages/p${pad(n)}.jpg`;
const thumbImg = n => `thumbs/t${pad(n)}.jpg`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- 安全的本機儲存 ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('ym70.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('ym70.' + k, JSON.stringify(v)); } catch {} }
};

/* ---------- 篇目資料 ---------- */
const ARTS = [];
B.sections.forEach(sec => {
  sec.items.forEach((it, i) => {
    const next = sec.items[i + 1];
    ARTS.push({ start: it[0], end: next ? next[0] - 1 : sec.range[1], title: it[1], author: it[2], sec });
  });
});
const secOf = n => B.sections.find(s => n >= s.range[0] && n <= s.range[1]);
const artOf = n => ARTS.find(a => n >= a.start && n <= a.end);

/* ---------- 圖示 ---------- */
const ICONS = {
  book: '<path d="M4 5a2 2 0 0 1 2-2h5v17H6a2 2 0 0 0-2 2z M20 5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 1 2 2z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  school: '<path d="M3 10l9-6 9 6-9 6z"/><path d="M6 12v5c3 2.5 9 2.5 12 0v-5"/>',
  people: '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c0-3.5 2.7-6 6-6s6 2.5 6 6M14 20c.3-3 1.8-5 4-5s3.7 2 4 5"/>',
  medal: '<circle cx="12" cy="15" r="6"/><path d="M8 3l4 6 4-6M12 12.5l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  camera: '<path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="4"/>'
};
const icon = (k, c = 'currentColor') => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k] || ''}</svg>`;

/* ---------- 音效（Web Audio 合成，不需外部檔案） ---------- */
const Sound = (() => {
  let ctx = null, on = store.get('sound', true);
  const ac = () => { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } } if (ctx.state === 'suspended') ctx.resume(); return ctx; };
  function tone(freq, dur = .12, type = 'sine', vol = .15, delay = 0, slide = 0) {
    const c = on && ac(); if (!c) return;
    const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + .05);
  }
  function noise(dur = .3, vol = .2, from = 3000, to = 600) {
    const c = on && ac(); if (!c) return;
    const t = c.currentTime, len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; f.type = 'bandpass'; f.Q.value = .8;
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(c.destination); src.start(t);
  }
  return {
    get on() { return on; },
    toggle() { on = !on; store.set('sound', on); if (on) this.click(); return on; },
    click() { tone(880, .07, 'triangle', .1); },
    hover() { tone(1320, .04, 'sine', .03); },
    flip() { noise(.28, .25, 4200, 700); tone(300, .08, 'sine', .04, .05); },
    chime() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .35, 'triangle', .12, i * .09)); },
    right() { tone(660, .12, 'triangle', .14); tone(990, .25, 'triangle', .14, .1); },
    wrong() { tone(220, .25, 'sawtooth', .07, 0, .7); },
    whoosh() { noise(.35, .12, 800, 3500); },
    pop() { tone(500, .1, 'sine', .15, 0, 2.2); },
    fanfare() { [[523,0],[659,.12],[784,.24],[1047,.36],[784,.52],[1047,.64]].forEach(([f, d]) => { tone(f, .3, 'square', .05, d); tone(f / 2, .3, 'triangle', .08, d); }); }
  };
})();
const soundBtn = $('#soundBtn');
const paintSound = () => { soundBtn.textContent = Sound.on ? '🔊' : '🔇'; soundBtn.title = Sound.on ? '音效：開（點擊關閉）' : '音效：關（點擊開啟）'; };
paintSound();
soundBtn.addEventListener('click', () => { Sound.toggle(); paintSound(); toast(Sound.on ? '🔊 音效已開啟' : '🔇 音效已關閉'); });

/* ---------- 特效：彩帶與梅花 ---------- */
const fx = $('#fx'), fctx = fx.getContext('2d');
let parts = [], fxRun = false;
const COLORS = ['#8E5FB5', '#E0202E', '#C8357F', '#F4B400', '#3FA9F5', '#2BB673', '#FF8FC8'];
function sizeFx() { const r = devicePixelRatio || 1; fx.width = innerWidth * r; fx.height = innerHeight * r; fctx.setTransform(r, 0, 0, r, 0, 0); }
sizeFx(); addEventListener('resize', sizeFx);
function drawBlossom(c, x, y, r, rot, col) {
  c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col;
  for (let i = 0; i < 5; i++) { c.rotate(Math.PI * 2 / 5); c.beginPath(); c.ellipse(0, -r * .62, r * .42, r * .55, 0, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = '#FFE066'; c.beginPath(); c.arc(0, 0, r * .25, 0, Math.PI * 2); c.fill(); c.restore();
}
function burst(x = innerWidth / 2, y = innerHeight / 3, n = 110) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 4 + Math.random() * 9;
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 4, r: 4 + Math.random() * 6, rot: Math.random() * 6, vr: (Math.random() - .5) * .3,
      col: COLORS[i % COLORS.length], life: 1, kind: Math.random() < .35 ? 'flower' : 'rect' });
  }
  if (!fxRun) { fxRun = true; requestAnimationFrame(fxLoop); }
}
function fxLoop() {
  fctx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter(p => p.life > 0);
  parts.forEach(p => {
    p.vy += .22; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= .009;
    fctx.globalAlpha = Math.max(p.life, 0);
    if (p.kind === 'flower') drawBlossom(fctx, p.x, p.y, p.r * 1.3, p.rot, p.col);
    else { fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.rot); fctx.fillStyle = p.col; fctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); fctx.restore(); }
  });
  fctx.globalAlpha = 1;
  if (parts.length) requestAnimationFrame(fxLoop); else { fxRun = false; fctx.clearRect(0, 0, innerWidth, innerHeight); }
}
function celebrate(e) {
  const x = e && e.clientX ? e.clientX : innerWidth / 2, y = e && e.clientY ? e.clientY : innerHeight / 3;
  burst(x, y); setTimeout(() => burst(x - 160, y + 40, 60), 250); setTimeout(() => burst(x + 160, y + 40, 60), 420);
  Sound.fanfare();
}

// 首頁飄落梅花
let petalStop = null;
function startPetals(canvas) {
  if (petalStop) petalStop();
  const c = canvas.getContext('2d'); let W, H, alive = true;
  const resize = () => { const r = devicePixelRatio || 1; W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W * r; canvas.height = H * r; c.setTransform(r, 0, 0, r, 0, 0); };
  resize(); addEventListener('resize', resize);
  const cols = ['rgba(255,255,255,.85)', 'rgba(255,200,225,.9)', 'rgba(255,120,150,.8)', 'rgba(230,210,255,.85)'];
  const ps = Array.from({ length: 34 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 5 + Math.random() * 9, vy: .4 + Math.random() * .9, sw: Math.random() * 6, rot: Math.random() * 6, vr: (Math.random() - .5) * .02, col: cols[Math.floor(Math.random() * cols.length)] }));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  (function loop(t) {
    if (!alive) return;
    c.clearRect(0, 0, W, H);
    ps.forEach(p => {
      if (!reduce) { p.y += p.vy; p.x += Math.sin(t / 1400 + p.sw) * .5; p.rot += p.vr; }
      if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
      drawBlossom(c, p.x, p.y, p.r, p.rot, p.col);
    });
    requestAnimationFrame(loop);
  })(0);
  petalStop = () => { alive = false; removeEventListener('resize', resize); petalStop = null; };
}

/* ---------- 小工具 ---------- */
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1900); }
function reveal() {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  $$('.reveal').forEach(el => io.observe(el));
}
function countUp() {
  $$('[data-count]').forEach(el => {
    const to = +el.dataset.count, dur = 1400, t0 = performance.now();
    (function step(t) { const k = Math.min((t - t0) / dur, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); })(t0);
  });
}
const bookmarks = () => store.get('bm', []);
function toggleBm(n) {
  let b = bookmarks(); const has = b.includes(n);
  b = has ? b.filter(x => x !== n) : [...b, n].sort((a, c) => a - c); store.set('bm', b);
  has ? Sound.click() : Sound.pop(); toast(has ? `已移除第 ${n} 頁書籤` : `🔖 已將第 ${n} 頁加入書籤`); return !has;
}

/* ---------- 大事紀資料（內容取自專刊第 9、16–33 頁） ---------- */
const TIMELINE = [
  [1948, '民國37年8月', '縣立楊梅初級中學創校', '首任校長張芳杰先生，招收新生三班。', 16],
  [1951, '民國40年8月', '增設高中部，更名縣立楊梅中學', '招收高中部新生一班。', 16],
  [1968, '民國57年5月17日', '省立楊梅高中奉准籌備', '配合九年國民義務教育「省辦高中、縣辦初中」政策，並訂此日為校慶日。', 16],
  [1969, '民國58年8月', '省立楊梅高中正式創校', '史振鼎校長到任，全校學生11班、530人。', 16],
  [1970, '民國59年', '訂定校訓', '史振鼎校長訂校訓為「愛自己、愛學校、愛國家」。', 16],
  [1974, '民國63年', '增設電工科、電子設備修護科', '成立職業類科，成為具多元教育目標的綜合高中。', 17],
  [1975, '民國64年1月', '設置梅岡精神堡壘', '基座刻有梅高建校史與梅高精神。', 17],
  [1977, '民國66年5月', '禮堂（兼體育館）落成', '同年代陸續完成圖書館與行政大樓整建。', 17],
  [1983, '民國72年8月', '附設高級進修補校', '新設家庭電器修護科、電子自動控制科。', 18],
  [1986, '民國75年8月', '創設體育班', '電工科易名為電機科，電子設備修護科易名為電子科。', 18],
  [1988, '民國77年9月', '試辦綜合高中課程', '試行普通科學生選修職業類科課程。', 18],
  [2000, '民國89年2月', '更名國立楊梅高級中學', '因政府精省，由省立改為國立。', 9],
  [2011, '民國100年', '榮獲教育部「教學卓越獎」', '以「人與地的對話」獲獎。', 24],
  [2018, '民國107年1月1日', '改制桃園市立楊梅高級中學', '高中職管轄權下放六都，校名改為桃園市立楊梅高級中學。', 33],
  [2018, '民國107年', '創校70週年', '梅高七十，迎曦而起、御風飛揚！', 2]
];
const PRINCIPALS = [['史振鼎','57～64'],['馮堯春','64～67'],['董寶鏡','67～72'],['欒澤秋','72～75'],['郭治華','75～83'],['孔建國','83～86'],['鍾香華','86～94'],['蘇景進','94～99'],['林桂鳳','99～106']];
const TL_COLORS = ['#8E5FB5', '#C8357F', '#E0202E', '#EE9A0B', '#1E9E55', '#0FA3C7', '#2466B8'];

/* ---------- 小學堂題庫 ---------- */
const QUIZ = [
  { q: '楊梅高中的前身「縣立楊梅初級中學」是在哪一年創校的？', o: ['民國37年（1948）', '民國47年（1958）', '民國57年（1968）', '民國67年（1978）'], a: 0, p: 16, why: '民國37年8月縣立楊梅初中創校，到民國107年正好70週年。' },
  { q: '梅高的校訓是什麼？', o: ['禮義廉恥', '愛自己、愛學校、愛國家', '誠正勤樸', '自強不息'], a: 1, p: 8, why: '民國59年史振鼎校長訂定校訓「愛自己、愛學校、愛國家」。' },
  { q: '校徽上大下小的三角形分成三個區塊，象徵什麼？', o: ['德、智、體', '過去、現在、未來', '校訓「愛自己、愛學校、愛國家」', '三棟教學大樓'], a: 2, p: 10, why: '三個區塊隱含校訓，從愛自己做起，進而愛梅高、愛國家。' },
  { q: '校徽的底色是什麼顏色？', o: ['紫色', '藍色', '綠色', '咖啡色'], a: 0, p: 10, why: '校徽延續傳統，以紫色為底，配以象徵本校的梅花。' },
  { q: '學生戲稱目前的咖啡色系校服為什麼？', o: ['巧克力裝', '蟑螂裝', '咖啡裝', '泥土裝'], a: 1, p: 14, why: '雖是玩笑話但很傳神——象徵梅高人強韌的生命力與適應力。' },
  { q: '梅高校歌的作詞者是哪一位？', o: ['李永剛', '史振鼎', '馮堯春', '李子恆'], a: 1, p: 12, why: '校歌由史振鼎校長作詞、李永剛作曲。' },
  { q: '學校在哪一天改制為「桃園市立楊梅高級中學」？', o: ['民國89年2月', '民國100年8月', '民國107年1月1日', '民國107年5月26日'], a: 2, p: 9, why: '因高中職管轄權下放六都，民國107年1月1日改為桃園市立。' },
  { q: '楊梅高中的校址在哪裡？', o: ['楊梅區高獅路5號', '楊梅區大成路10號', '中壢區中央西路', '楊梅區環東路'], a: 0, p: 9, why: '學校座落於桃園市楊梅區高山里高獅路五號，占地約5.4公頃。' },
  { q: '70週年 Logo 的主色調「桃紅色」象徵什麼？', o: ['梅花盛開', '本校位處桃園', '青春熱情', '夕陽晚霞'], a: 1, p: 1, why: '主色調以桃紅色象徵本校位處桃園，搭配紅色代表慶賀週年之喜。' }
];

/* ---------- 路由 ---------- */
const routes = {
  home: renderHome, toc: renderToc, section: renderSection, page: renderPage, browse: renderBrowse,
  search: renderSearch, timeline: renderTimeline, quiz: renderQuiz, bookmarks: renderBookmarks
};
let lastPage = null;
function router() {
  const h = location.hash.replace(/^#\/?/, '') || 'home';
  const [path, qs] = h.split('?');
  const [name, arg] = path.split('/');
  const params = new URLSearchParams(qs || '');
  const fn = routes[name] || renderHome;
  if (petalStop && name !== 'home') petalStop();
  $$('.mainnav a').forEach(a => a.classList.toggle('active', a.dataset.nav === name));
  $('#mainnav').classList.remove('open');
  const prevPage = lastPage;
  lastPage = name === 'page' ? +arg : null;
  fn(arg, params, prevPage);
  if (!(name === 'page' && prevPage)) scrollTo({ top: 0, behavior: 'instant' });
  main.classList.remove('fade-in'); void main.offsetWidth; main.classList.add('fade-in');
  reveal();
}
addEventListener('hashchange', router);
const go = h => { location.hash = h; };

/* ---------- 首頁 ---------- */
function renderHome() {
  const last = store.get('last', 0);
  const secCards = B.sections.map((s, i) => `
    <a class="card sec-card reveal" href="#/section/${s.id}" style="--c:${s.color};transition-delay:${i * 60}ms" data-snd="hover">
      <div class="cover"><img src="${thumbImg(s.id === 'open' ? 1 : s.range[0])}" alt="${esc(s.name)}封面" loading="lazy"><span class="tag">第 ${pad(s.range[0])}–${pad(s.range[1])} 頁</span></div>
      <div class="body"><h3>${icon(s.icon, s.color)} ${esc(s.name)}</h3><p>${esc(s.desc)}</p>
      <div class="meta">${s.items.filter(x => x[1] !== '篇章扉頁').length} 篇 · ${s.range[1] - s.range[0] + 1} 頁 →</div></div>
    </a>`).join('');
  const mini = TIMELINE.filter((_, i) => [0, 3, 4, 7, 11, 13].includes(i)).map((t, i) =>
    `<a href="#/page/${t[4]}" style="--c:${TL_COLORS[i % 7]}"><b>${t[0]}</b><span>${esc(t[2])}</span></a>`).join('');
  main.innerHTML = `
  <section class="hero">
    <canvas id="petals"></canvas>
    <div class="hero-inner">
      <div class="hero-badge" id="heroBadge" role="button" tabindex="0" aria-label="點擊校徽慶祝"><img src="assets/badge.png" alt="楊梅高中校徽"></div>
      <div>
        <p class="hero-kicker">SINCE 1948 · 梅岡 · 桃園市立楊梅高級中學</p>
        <h1>楊梅高中<span class="big70">70</span>週年<br>校慶專刊</h1>
        <p class="hero-slogan"><span>🌸 梅高七十</span><span>☀️ 迎曦御風</span><span>💜 從心出發</span></p>
        <div class="hero-actions">
          <a class="btn gold" href="#/page/1" data-snd="flip">📖 開始翻閱</a>
          ${last > 1 ? `<a class="btn" href="#/page/${last}" data-snd="flip">⏩ 繼續閱讀（第 ${last} 頁）</a>` : ''}
          <a class="btn ghost" href="#/toc">📑 目次</a>
          <button class="btn ghost" id="randBtn">🎲 隨機翻一頁</button>
        </div>
      </div>
    </div>
    <svg class="hero-wave" viewBox="0 0 1440 70" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40 C 240 80 480 0 720 30 S 1200 70 1440 25 V70 H0z" fill="#FFF8FC"/></svg>
  </section>
  <div class="wrap" style="padding-top:0">
    <div class="stats">
      <div class="stat" style="--c:#8E5FB5"><b data-count="70">0</b><span>週年校慶</span></div>
      <div class="stat" style="--c:#E0202E"><b data-count="1948">0</b><span>創校年份</span></div>
      <div class="stat" style="--c:#C8357F"><b data-count="${TOTAL}">0</b><span>專刊頁數</span></div>
      <div class="stat" style="--c:#EE9A0B"><b data-count="${ARTS.filter(a => a.title !== '篇章扉頁').length}">0</b><span>收錄篇目</span></div>
    </div>

    <section class="block">
      <div class="block-head reveal"><h2>七大篇章</h2><a class="btn sm ghost" href="#/toc">查看完整目次 →</a></div>
      <div class="sec-grid">${secCards}</div>
    </section>

    <section class="block">
      <div class="card quote reveal">
        <div class="qimg" data-zoom="2"><img src="${pageImg(2)}" alt="校長序第2頁" loading="lazy"></div>
        <div class="qtxt">
          <h2 style="margin:0;color:var(--purple-d)">校長序｜梅高70 從心出發</h2>
          <blockquote>我們要打造一所「多元卓越、創新躍升」的溫馨幸福校園……使梅高成為社區高中的典範學校。</blockquote>
          <cite>— 校長 鄒岳廷</cite>
          <p style="margin-top:20px"><a class="btn sm" href="#/page/2" data-snd="flip">閱讀全文 →</a></p>
        </div>
      </div>
    </section>

    <section class="block">
      <div class="block-head reveal"><h2>校徽的故事｜互動解說</h2><a class="btn sm ghost" href="#/page/10">看原文（第10頁）→</a></div>
      <div class="card badge-lab reveal">
        ${badgeSVG()}
        <div class="badge-info">
          <h3>點一點校徽的不同部位 👆</h3>
          <p style="margin:0">民國66年由美術老師兼訓育組長戴武光老師繪製，103年以電腦重新繪製。</p>
          <div class="pill-row">
            <button class="chip" data-part="bg" style="--c:#8E5FB5">💜 紫色底</button>
            <button class="chip" data-part="flower" style="--c:#E0202E">🌸 梅花</button>
            <button class="chip" data-part="white" style="--c:#6b6b6b">🤍 白色部分</button>
            <button class="chip" data-part="tri" style="--c:#C8357F">🔺 三個區塊</button>
            <button class="chip" data-part="word" style="--c:#2466B8">✍️ 梅高二字</button>
          </div>
          <div class="explain" id="explain">請選擇上方按鈕，或直接點擊左側校徽的各個部位。</div>
        </div>
      </div>
    </section>

    <section class="block">
      <div class="block-head reveal"><h2>梅岡七十年</h2><a class="btn sm ghost" href="#/timeline">完整大事紀 →</a></div>
      <div class="mini-tl reveal">${mini}</div>
    </section>

    <section class="block">
      <div class="card reveal" style="padding:28px;display:flex;gap:24px;align-items:center;flex-wrap:wrap;background:linear-gradient(135deg,#FFF1F8,#F1E8FF)">
        <div style="font-size:4rem">🎯</div>
        <div style="flex:1;min-width:240px"><h2 style="margin:0;color:var(--purple-d)">梅岡小學堂</h2><p style="margin:4px 0 0">讀完專刊了嗎？來挑戰 ${QUIZ.length} 題梅高知識問答，答對會有驚喜喔！</p></div>
        <a class="btn red" href="#/quiz">開始挑戰 🚀</a>
      </div>
    </section>
  </div>`;
  startPetals($('#petals'));
  countUp();
  const hb = $('#heroBadge');
  hb.addEventListener('click', celebrate);
  hb.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); celebrate(); } });
  $('#randBtn').addEventListener('click', () => { Sound.whoosh(); go('#/page/' + (1 + Math.floor(Math.random() * TOTAL))); });
  bindBadge();
}

function badgeSVG() {
  return `<svg class="badge-svg" viewBox="0 0 300 290" role="img" aria-label="楊梅高中校徽示意圖">
    <defs><linearGradient id="bgp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9C6CC4"/><stop offset="1" stop-color="#7E4FA8"/></linearGradient></defs>
    <path class="hot" data-part="tri" d="M22 20 H278 Q292 20 284 34 L162 262 Q150 282 138 262 L16 34 Q8 20 22 20Z" fill="#1d1024"/>
    <path class="hot" data-part="bg" d="M34 30 H266 Q276 30 270 40 L158 248 Q150 262 142 248 L30 40 Q24 30 34 30Z" fill="url(#bgp)"/>
    <path class="hot" data-part="white" d="M150 40 L162 190 L150 250 L138 190Z" fill="#fff"/>
    <g class="hot" data-part="word" fill="#fff" font-size="46" font-weight="800" font-family="Microsoft JhengHei, sans-serif">
      <text x="62" y="92">梅</text><text x="192" y="92">高</text></g>
    <g class="hot" data-part="flower"><g class="petals">
      ${[0, 72, 144, 216, 288].map(r => `<ellipse cx="150" cy="148" rx="14" ry="20" fill="#E0202E" transform="rotate(${r} 150 170)"/>`).join('')}
      <circle cx="150" cy="170" r="8" fill="#fff"/></g></g>
  </svg>`;
}
const BADGE_TXT = {
  bg: '💜 <b>紫色為底</b>：校徽重新繪製時「仍延續傳統，以紫色為底」，這也是本網站的主色調。',
  flower: '🌸 <b>梅花</b>：紫色底上「配以象徵本校的梅花」——梅岡上的梅高。',
  white: '🤍 <b>白色部分</b>：代表「鼎園精神堡壘」，民國64年史振鼎校長任內設置，基座刻有梅高建校史與梅高精神。',
  tri: '🔺 <b>上大下小的三角形</b>：共分三個區塊，隱含校訓「愛自己、愛學校、愛國家」——從愛自己做起，進而發揮大愛，愛梅高、愛國家。',
  word: '✍️ <b>「梅高」二字</b>：103年重新繪製時，因應橫寫由左至右的習慣而調整書寫方向，其餘仍延續傳統。'
};
function bindBadge() {
  const ex = $('#explain');
  const pick = part => {
    ex.innerHTML = BADGE_TXT[part]; ex.classList.remove('flash'); void ex.offsetWidth; ex.classList.add('flash');
    $$('.badge-svg .hot').forEach(h => h.classList.toggle('sel', h.dataset.part === part));
    $$('.badge-info .chip').forEach(c => c.classList.toggle('on', c.dataset.part === part));
    Sound.chime();
  };
  $$('[data-part]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); pick(el.dataset.part); }));
}

/* ---------- 目次 ---------- */
function renderToc() {
  main.innerHTML = `<div class="wrap">
    <h1 class="h-title">📑 目次 Contents</h1>
    <p class="h-sub">依專刊第 4–5 頁目次編排。點選篇名即可直接翻到該頁。</p>
    <div class="toc-grid">${B.sections.map((s, i) => `
      <section class="card toc-sec reveal" style="--c:${s.color};transition-delay:${(i % 2) * 80}ms">
        <h2><a href="#/section/${s.id}">${icon(s.icon, s.color)} ${esc(s.name)}</a> <small>${s.en.toUpperCase()}</small></h2>
        <ul class="toc-list">${s.items.map(it => `<li><a href="#/page/${it[0]}" data-snd="flip"><span class="pn">${pad(it[0])}</span><span>${esc(it[1])}${it[2] ? ` <span class="au">(${esc(it[2])})</span>` : ''}</span></a></li>`).join('')}</ul>
      </section>`).join('')}</div>
    <div class="toc-orig reveal">
      <a class="thumb" href="#/page/4" style="--c:#C8357F"><div class="im"><img src="${thumbImg(4)}" alt="原始目次第4頁"></div><b>原始目次 004</b></a>
      <a class="thumb" href="#/page/5" style="--c:#C8357F"><div class="im"><img src="${thumbImg(5)}" alt="原始目次第5頁"></div><b>原始目次 005</b></a>
    </div></div>`;
}

/* ---------- 篇章頁 ---------- */
function renderSection(id) {
  const s = B.sections.find(x => x.id === id) || B.sections[0];
  const idx = B.sections.indexOf(s), prev = B.sections[idx - 1], next = B.sections[idx + 1];
  const arts = ARTS.filter(a => a.sec === s);
  const pages = []; for (let n = s.range[0]; n <= s.range[1]; n++) pages.push(n);
  main.innerHTML = `
  <section class="sec-hero" style="--c:${s.color}">
    <img class="bg" src="${pageImg(s.id === 'open' ? 1 : s.range[0])}" alt="">
    <div class="in">
      <div class="crumb"><a href="#/home">首頁</a> › <a href="#/toc">目次</a> › ${esc(s.name)}</div>
      <h1>${icon(s.icon, '#fff')} ${esc(s.name)} <small style="font-size:.45em;letter-spacing:.2em;opacity:.85">${s.en.toUpperCase()}</small></h1>
      <p>${esc(s.desc)}</p>
      <p style="margin-top:18px"><a class="btn gold" href="#/page/${s.range[0]}" data-snd="flip">📖 從第 ${s.range[0]} 頁開始閱讀</a></p>
    </div>
  </section>
  <div class="wrap" style="--c:${s.color}">
    <div class="block-head"><h2>篇目</h2></div>
    <div class="art-list">${arts.map((a, i) => `
      <a class="card art reveal" href="#/page/${a.start}" style="transition-delay:${(i % 4) * 60}ms" data-snd="flip">
        <div class="th"><img src="${thumbImg(a.start)}" alt="" loading="lazy"><span class="pg">P.${pad(a.start)}${a.end > a.start ? '–' + pad(a.end) : ''}</span></div>
        <div class="tx"><h3>${esc(a.title)}</h3>${a.author ? `<small>✍️ ${esc(a.author)}</small>` : '<small>&nbsp;</small>'}</div>
      </a>`).join('')}</div>
    <div class="block"><div class="block-head"><h2>本篇全部頁面（${pages.length} 頁）</h2></div>
      <div class="thumbs">${pages.map(n => thumbHTML(n)).join('')}</div></div>
    <div class="sec-nav">
      ${prev ? `<a class="btn ghost" href="#/section/${prev.id}">← ${esc(prev.name)}</a>` : '<span></span>'}
      ${next ? `<a class="btn" href="#/section/${next.id}">${esc(next.name)} →</a>` : ''}
    </div>
  </div>`;
}
const thumbHTML = n => { const s = secOf(n); return `<a class="thumb" href="#/page/${n}" style="--c:${s.color}" title="${esc(artOf(n).title)}"><div class="im"><img src="${thumbImg(n)}" alt="第${n}頁縮圖" loading="lazy"></div><b>${pad(n)}</b></a>`; };

/* ---------- 全頁瀏覽 ---------- */
function renderBrowse(_, params) {
  const f = params.get('s') || 'all';
  const list = []; for (let n = 1; n <= TOTAL; n++) if (f === 'all' || secOf(n).id === f) list.push(n);
  main.innerHTML = `<div class="wrap">
    <h1 class="h-title">🖼️ 全頁瀏覽</h1>
    <p class="h-sub">專刊共 ${TOTAL} 頁，完整收錄。可依篇章篩選，點縮圖進入閱讀模式。</p>
    <div class="filters">
      <a class="chip ${f === 'all' ? 'on' : ''}" href="#/browse">全部（${TOTAL}）</a>
      ${B.sections.map(s => `<a class="chip ${f === s.id ? 'on' : ''}" style="--c:${s.color}" href="#/browse?s=${s.id}">${icon(s.icon)} ${esc(s.name)}（${s.range[1] - s.range[0] + 1}）</a>`).join('')}
    </div>
    <div class="thumbs">${list.map(thumbHTML).join('')}</div></div>`;
}

/* ---------- 閱讀器 ---------- */
let spread = store.get('spread', innerWidth >= 1100);
function spreadPair(n) { if (n === 1) return [1]; const l = n % 2 === 0 ? n : n - 1; return l + 1 <= TOTAL ? [l, l + 1] : [l]; }
function renderPage(arg, params, prevPage) {
  let n = Math.min(Math.max(parseInt(arg, 10) || 1, 1), TOTAL);
  const hl = params.get('q') || '';
  const useSpread = spread && innerWidth >= 900;
  const shown = useSpread ? spreadPair(n) : [n];
  const s = secOf(n), a = artOf(n);
  store.set('last', n);
  const first = shown[0], lastShown = shown[shown.length - 1];
  const prevN = first - 1 >= 1 ? (useSpread ? spreadPair(first - 1)[0] : first - 1) : null;
  const nextN = lastShown + 1 <= TOTAL ? lastShown + 1 : null;
  const bm = bookmarks().includes(n);
  const dir = prevPage ? (n > prevPage ? 'flip-next' : n < prevPage ? 'flip-prev' : '') : '';
  const stripFrom = Math.max(1, n - 12), stripTo = Math.min(TOTAL, n + 12);
  const strip = []; for (let i = stripFrom; i <= stripTo; i++) strip.push(`<a href="#/page/${i}" class="${shown.includes(i) ? 'cur' : ''}"><img src="${thumbImg(i)}" alt="第${i}頁" loading="lazy"><span>${i}</span></a>`);
  const txt = shown.map(p => {
    let t = esc(B.text[p - 1] || '（本頁以圖像為主，無可辨識文字）');
    if (hl) t = highlight(t, hl);
    return `<span class="pgl">第 ${pad(p)} 頁</span>\n${t}`;
  }).join('\n\n');
  main.innerHTML = `<div class="reader-wrap" style="--c:${s.color}">
    <div class="reader-head">
      <div class="where">
        <a class="s" href="#/section/${s.id}">${icon(s.icon, '#fff')} ${esc(s.name)}</a>
        <h1>${esc(a.title)}${a.author ? ` <small style="color:var(--ink-2);font-weight:400;font-size:.8em">／${esc(a.author)}</small>` : ''}</h1>
      </div>
      <div class="rtools">
        <button id="bmBtn" class="${bm ? 'on' : ''}" aria-pressed="${bm}">${bm ? '🔖 已加書籤' : '🔖 加入書籤'}</button>
        <button id="spreadBtn" class="${useSpread ? 'on' : ''}" title="切換單頁／跨頁">${useSpread ? '📖 跨頁' : '📄 單頁'}</button>
        <button id="zoomBtn">🔍 放大</button>
        <button id="fsBtn">⛶ 全螢幕</button>
        <a href="${pageImg(n)}" target="_blank" rel="noopener">🖼️ 原圖</a>
      </div>
    </div>
    <div class="stage" id="stage">
      <button class="navbtn prev" id="prevBtn" ${prevN ? '' : 'disabled'} aria-label="上一頁">‹</button>
      <div class="book ${shown.length > 1 ? 'spread' : ''} ${dir}" id="book">
        ${shown.map(p => `<img src="${pageImg(p)}" alt="專刊第${p}頁" data-zoom="${p}" draggable="false">`).join('')}
      </div>
      <button class="navbtn next" id="nextBtn" ${nextN ? '' : 'disabled'} aria-label="下一頁">›</button>
    </div>
    <div class="slider-row">
      <span style="font-weight:700;color:var(--c);white-space:nowrap">第 ${shown.join('–')} 頁 / 共 ${TOTAL} 頁</span>
      <input type="range" id="pgRange" min="1" max="${TOTAL}" value="${n}" aria-label="頁碼滑桿">
      <form class="jump" id="jumpF"><label for="jumpI">跳至</label><input id="jumpI" type="number" min="1" max="${TOTAL}" value="${n}"><button class="btn sm" type="submit">Go</button></form>
    </div>
    <div class="kbd-hint">小技巧：使用 <kbd>←</kbd> <kbd>→</kbd> 翻頁、<kbd>B</kbd> 加書籤、<kbd>Z</kbd> 放大；手機可左右滑動翻頁。</div>
    <div class="strip" id="strip">${strip.join('')}</div>
    <div class="ocr"><details ${hl ? 'open' : ''}><summary>📝 本頁文字內容（可複製／供檢索）</summary>
      <div class="txt">${txt}</div>
      <p class="note">※ 文字由光學字元辨識（OCR）自動產生，可能有少數錯字，請以頁面圖像為準。</p></details></div>
  </div>`;
  const cur = $('#strip .cur'); if (cur) $('#strip').scrollLeft = cur.offsetLeft - $('#strip').clientWidth / 2 + 32;
  $('#prevBtn').onclick = () => prevN && (Sound.flip(), go('#/page/' + prevN));
  $('#nextBtn').onclick = () => nextN && (Sound.flip(), go('#/page/' + nextN));
  $('#bmBtn').onclick = () => { const on = toggleBm(n); const b = $('#bmBtn'); b.classList.toggle('on', on); b.textContent = on ? '🔖 已加書籤' : '🔖 加入書籤'; };
  $('#spreadBtn').onclick = () => { spread = !useSpread; store.set('spread', spread); Sound.click(); if (spread && innerWidth < 900) toast('螢幕較窄，跨頁模式需寬螢幕'); router(); };
  $('#zoomBtn').onclick = () => openZoom(n);
  $('#fsBtn').onclick = () => { const el = $('#stage'); if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen().catch(() => {}); Sound.click(); };
  const rg = $('#pgRange');
  rg.oninput = () => { rg.title = '第 ' + rg.value + ' 頁'; };
  rg.onchange = () => { Sound.flip(); go('#/page/' + rg.value); };
  $('#jumpF').onsubmit = e => { e.preventDefault(); Sound.flip(); go('#/page/' + $('#jumpI').value); };
  // 預載前後頁
  [nextN, prevN, nextN && nextN + 1].forEach(p => { if (p && p <= TOTAL) { const i = new Image(); i.src = pageImg(p); } });
  // 滑動翻頁
  let sx = null;
  const stage = $('#stage');
  stage.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', e => {
    if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) { if (dx < 0 && nextN) { Sound.flip(); go('#/page/' + nextN); } else if (dx > 0 && prevN) { Sound.flip(); go('#/page/' + prevN); } }
  });
  if (prevPage) window.scrollTo({ top: Math.min(scrollY, $('.reader-wrap').offsetTop), behavior: 'instant' });
  readerKeys = { prevN, nextN, n };
}
let readerKeys = null;
function highlight(escaped, q) {
  const k = norm(q); if (!k) return escaped;
  const chars = [...k].map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  try { return escaped.replace(new RegExp(chars.join('\\s*'), 'g'), m => `<mark>${m}</mark>`); } catch { return escaped; }
}

/* ---------- 放大檢視 ---------- */
let zoomScale = 1, zoomN = 1;
function openZoom(n) {
  zoomN = n; zoomScale = 1; const z = $('#zoom'); z.hidden = false;
  const img = $('#zoomImg'); img.src = pageImg(n); img.alt = `專刊第${n}頁放大`;
  $('#zoomTitle').textContent = `第 ${n} 頁 · ${artOf(n).title}`;
  setZoom(1); Sound.whoosh(); document.body.style.overflow = 'hidden'; $('#zoomClose').focus();
}
function setZoom(s) {
  zoomScale = Math.min(Math.max(s, .5), 3);
  const base = Math.min(innerWidth - 32, 1000);
  $('#zoomImg').style.width = Math.round(base * zoomScale) + 'px';
  $('#zoomPct').textContent = Math.round(zoomScale * 100) + '%';
}
function closeZoom() { $('#zoom').hidden = true; document.body.style.overflow = ''; }
$('#zoomIn').onclick = () => { setZoom(zoomScale + .25); Sound.click(); };
$('#zoomOut').onclick = () => { setZoom(zoomScale - .25); Sound.click(); };
$('#zoomClose').onclick = closeZoom;
(() => {
  const st = $('#zoomStage'); let d = null;
  st.addEventListener('mousedown', e => { d = { x: e.clientX, y: e.clientY, l: st.scrollLeft, t: st.scrollTop }; st.classList.add('drag'); e.preventDefault(); });
  addEventListener('mousemove', e => { if (d) { st.scrollLeft = d.l - (e.clientX - d.x); st.scrollTop = d.t - (e.clientY - d.y); } });
  addEventListener('mouseup', () => { d = null; st.classList.remove('drag'); });
  st.addEventListener('wheel', e => { if (e.ctrlKey) { e.preventDefault(); setZoom(zoomScale + (e.deltaY < 0 ? .1 : -.1)); } }, { passive: false });
  st.addEventListener('dblclick', () => setZoom(zoomScale >= 2 ? 1 : 2));
})();

/* ---------- 檢索 ---------- */
const norm = s => String(s).replace(/\s+/g, '').replace(/臺/g, '台').toLowerCase();
const INDEX = B.text.map(t => {
  // 去除空白後的文字，以及對應回原文的位置表
  const map = []; let flat = '';
  for (let i = 0; i < t.length; i++) { const c = t[i]; if (/\s/.test(c)) continue; flat += c === '臺' ? '台' : c.toLowerCase(); map.push(i); }
  return { flat, map };
});
function search(q) {
  const k = norm(q); if (!k) return { arts: [], pages: [], total: 0 };
  const arts = ARTS.filter(a => norm(a.title + a.author + a.sec.name).includes(k) && a.title !== '篇章扉頁');
  const pages = []; let total = 0;
  INDEX.forEach((ix, i) => {
    let pos = ix.flat.indexOf(k), hits = [];
    while (pos !== -1) { hits.push(pos); pos = ix.flat.indexOf(k, pos + k.length); }
    if (hits.length) {
      total += hits.length;
      const raw = B.text[i];
      const snips = hits.slice(0, 2).map(h => {
        const st = ix.map[h], en = ix.map[h + k.length - 1] + 1;
        const a = Math.max(0, st - 36), b = Math.min(raw.length, en + 36);
        return (a > 0 ? '…' : '') + esc(raw.slice(a, st)).replace(/\n/g, ' ') + '<mark>' + esc(raw.slice(st, en)).replace(/\n/g, ' ') + '</mark>' + esc(raw.slice(en, b)).replace(/\n/g, ' ') + (b < raw.length ? '…' : '');
      });
      pages.push({ n: i + 1, count: hits.length, snips });
    }
  });
  return { arts, pages, total };
}
function renderSearch(_, params) {
  const q = params.get('q') || '';
  const hot = ['校訓', '校徽', '校歌', '梅花', '史振鼎', '綜合高中', '美術班', '管樂', '射箭', '校友會', '科展', '畢業', '圖書館', '校舍'];
  main.innerHTML = `<div class="wrap">
    <h1 class="h-title">🔍 全文檢索</h1>
    <p class="h-sub">可搜尋篇名、作者以及 220 頁的全部內文文字。</p>
    <form class="search-big" id="bigS" role="search"><input type="search" id="bigQ" value="${esc(q)}" placeholder="輸入關鍵字，例如：校徽、射箭、畢業典禮" aria-label="關鍵字"><button class="btn" type="submit">搜尋</button></form>
    <div class="hot-words"><span>🔥 熱門關鍵字：</span>${hot.map(h => `<a class="chip" href="#/search?q=${encodeURIComponent(h)}">${h}</a>`).join('')}</div>
    <div id="results"></div></div>`;
  $('#bigS').onsubmit = e => { e.preventDefault(); const v = $('#bigQ').value.trim(); Sound.whoosh(); go('#/search?q=' + encodeURIComponent(v)); };
  const box = $('#results');
  if (!q) { box.innerHTML = `<div class="empty"><div class="big">📚</div><p>輸入關鍵字開始探索梅岡七十年的故事吧！</p></div>`; setTimeout(() => $('#bigQ').focus(), 50); return; }
  const r = search(q);
  if (!r.pages.length && !r.arts.length) { box.innerHTML = `<div class="empty"><div class="big">🤔</div><p>找不到「${esc(q)}」，試試更短的關鍵字或其他同義詞。</p></div>`; Sound.wrong(); return; }
  Sound.chime();
  box.innerHTML = `
    <p class="res-sum">「${esc(q)}」共找到 <b>${r.total}</b> 處，分布於 <b>${r.pages.length}</b> 頁${r.arts.length ? `，符合篇名 <b>${r.arts.length}</b> 篇` : ''}。</p>
    ${r.arts.length ? `<h2 style="font-size:1.2rem;color:var(--purple-d)">📌 相符篇目</h2><div class="res-art">${r.arts.map(a => `<a href="#/page/${a.start}" style="--c:${a.sec.color}"><b>${esc(a.title)}</b> ${a.author ? `<small>(${esc(a.author)})</small>` : ''} · P.${pad(a.start)}</a>`).join('')}</div>` : ''}
    ${r.pages.length ? `<h2 style="font-size:1.2rem;color:var(--purple-d)">📄 內文出現頁面</h2>` : ''}
    ${r.pages.map(p => { const s = secOf(p.n), a = artOf(p.n); return `
      <a class="card res reveal" href="#/page/${p.n}?q=${encodeURIComponent(q)}" style="--c:${s.color}" data-snd="flip">
        <img src="${thumbImg(p.n)}" alt="" loading="lazy">
        <div><h3>第 ${pad(p.n)} 頁 · ${esc(a.title)}</h3><span class="s">${esc(s.name)}</span><small>出現 ${p.count} 次</small>
        ${p.snips.map(sn => `<p>${sn}</p>`).join('')}</div>
      </a>`; }).join('')}`;
  reveal();
}

/* ---------- 大事紀 ---------- */
function renderTimeline() {
  main.innerHTML = `<div class="wrap">
    <h1 class="h-title">⏳ 梅岡七十年大事紀</h1>
    <p class="h-sub">精選專刊「楊梅高中大事紀」（第 16–33 頁）重要里程碑，點卡片可翻到原文頁面。</p>
    <div class="timeline">${TIMELINE.map((t, i) => `
      <div class="tl-item reveal" style="--c:${TL_COLORS[i % 7]}">
        <a class="tl-card" href="#/page/${t[4]}" data-snd="flip">
          <div class="yr">${t[0]}</div><div class="roc">${esc(t[1])}</div>
          <h3>${esc(t[2])}</h3><p>${esc(t[3])}</p><div class="go">📖 第 ${t[4]} 頁 →</div>
        </a></div>`).join('')}</div>
    <section class="block">
      <div class="block-head"><h2>歷任校長（省立創校後）</h2><a class="btn sm ghost" href="#/page/15">看原文（第15頁）→</a></div>
      <div class="principals">${PRINCIPALS.map((p, i) => `<div class="principal reveal" style="transition-delay:${i * 50}ms"><div class="n">${i + 1}</div><b>${p[0]}</b><small>民國 ${p[1]} 年</small></div>`).join('')}
        <div class="principal reveal"><div class="n" style="background:linear-gradient(135deg,var(--red),var(--gold))">★</div><b>鄒岳廷</b><small>現任校長（70週年）</small></div></div>
    </section>
    <p style="text-align:center"><a class="btn" href="#/page/16" data-snd="flip">閱讀完整大事紀 →</a></p></div>`;
}

/* ---------- 小學堂 ---------- */
function renderQuiz() {
  let i = 0, score = 0;
  const qs = QUIZ.slice().sort(() => Math.random() - .5).slice(0, 6);
  main.innerHTML = `<div class="wrap"><h1 class="h-title">🎯 梅岡小學堂</h1><p class="h-sub">答案都藏在專刊裡！每題答完可以點「看原文」翻到出處。</p><div class="card quiz" id="quiz"></div></div>`;
  const box = $('#quiz');
  const show = () => {
    if (i >= qs.length) return end();
    const q = qs[i];
    box.innerHTML = `<div class="quiz-top"><span>第 ${i + 1} / ${qs.length} 題</span><span>⭐ 得分 ${score}</span></div>
      <div class="quiz-bar"><i style="width:${i / qs.length * 100}%"></i></div>
      <h2>${esc(q.q)}</h2>
      <div class="opts">${q.o.map((o, k) => `<button class="opt" data-k="${k}"><span class="k">${'ABCD'[k]}</span>${esc(o)}</button>`).join('')}</div>
      <div id="fb"></div>`;
    $$('.opt', box).forEach(b => b.onclick = () => {
      const k = +b.dataset.k, ok = k === q.a;
      $$('.opt', box).forEach(x => { x.disabled = true; if (+x.dataset.k === q.a) x.classList.add('ok'); });
      if (ok) { score++; Sound.right(); const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, 40); } else { b.classList.add('no'); Sound.wrong(); }
      $('#fb').innerHTML = `<div class="feedback">${ok ? '🎉 答對了！' : '💡 差一點！'} ${esc(q.why)}
        <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap"><a class="btn sm ghost" href="#/page/${q.p}" target="_blank">📖 看原文（第${q.p}頁）</a><button class="btn sm" id="nextQ">${i + 1 < qs.length ? '下一題 →' : '看成績 🏆'}</button></div></div>`;
      $('#nextQ').onclick = () => { i++; Sound.click(); show(); };
      $('#nextQ').focus();
    });
  };
  const end = () => {
    const pct = score / qs.length;
    const title = pct === 1 ? '梅岡學霸 🏆' : pct >= .66 ? '梅高達人 🌟' : pct >= .34 ? '梅岡新鮮人 🌱' : '再翻翻專刊吧 📖';
    box.innerHTML = `<div class="quiz-end"><div class="quiz-bar"><i style="width:100%"></i></div>
      <div class="score">${score} / ${qs.length}</div><h2>${title}</h2>
      <p>${pct === 1 ? '太厲害了！你是真正的梅高人！' : '專刊裡還有更多梅岡故事等著你發現。'}</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:18px"><button class="btn red" id="again">🔄 再玩一次</button><a class="btn ghost" href="#/toc">📑 去讀專刊</a></div></div>`;
    $('#again').onclick = () => { Sound.click(); renderQuiz(); };
    if (pct >= .66) celebrate(); else Sound.chime();
  };
  show();
}

/* ---------- 書籤 ---------- */
function renderBookmarks() {
  const b = bookmarks();
  main.innerHTML = `<div class="wrap"><h1 class="h-title">🔖 我的書籤</h1>
    <p class="h-sub">在閱讀頁點「加入書籤」即可收藏（儲存在這台裝置的瀏覽器中）。</p>
    ${b.length ? `<div class="thumbs">${b.map(n => thumbHTML(n)).join('')}</div>
      <p style="margin-top:24px"><button class="btn ghost sm" id="clrBm">🗑️ 清除全部書籤</button></p>`
      : `<div class="card empty bm-empty"><div class="big">🔖</div><p>還沒有書籤喔！去<a href="#/browse">全頁瀏覽</a>挑選喜歡的頁面吧。</p></div>`}</div>`;
  const c = $('#clrBm'); if (c) c.onclick = () => { if (confirm('確定要清除全部書籤嗎？')) { store.set('bm', []); Sound.click(); renderBookmarks(); } };
}

/* ---------- 全域事件 ---------- */
$('#topSearch').addEventListener('submit', e => { e.preventDefault(); const v = $('#topQ').value.trim(); Sound.whoosh(); go('#/search?q=' + encodeURIComponent(v)); $('#topQ').blur(); });
$('#menuBtn').addEventListener('click', () => { $('#mainnav').classList.toggle('open'); Sound.click(); });
document.addEventListener('click', e => {
  const z = e.target.closest('[data-zoom]');
  if (z && !e.target.closest('.hero-badge')) { openZoom(+z.dataset.zoom); return; }
  const s = e.target.closest('[data-snd]');
  if (s) { s.dataset.snd === 'flip' ? Sound.flip() : Sound.click(); return; }
  if (e.target.closest('a')) Sound.click();
});
let lastHover = 0;
document.addEventListener('mouseover', e => {
  const h = e.target.closest('[data-snd="hover"]');
  if (h && !h.contains(e.relatedTarget) && performance.now() - lastHover > 120) { lastHover = performance.now(); Sound.hover(); }
});
document.addEventListener('keydown', e => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if (!$('#zoom').hidden) {
    if (e.key === 'Escape') closeZoom();
    if (e.key === '+' || e.key === '=') setZoom(zoomScale + .25);
    if (e.key === '-') setZoom(zoomScale - .25);
    return;
  }
  if (typing) { if (e.key === 'Escape') document.activeElement.blur(); return; }
  if (e.key === '/') { e.preventDefault(); const t = $('#topQ'); if (t.offsetParent) t.focus(); else go('#/search'); return; }
  if (readerKeys && location.hash.startsWith('#/page/')) {
    if (e.key === 'ArrowRight' && readerKeys.nextN) { Sound.flip(); go('#/page/' + readerKeys.nextN); }
    else if (e.key === 'ArrowLeft' && readerKeys.prevN) { Sound.flip(); go('#/page/' + readerKeys.prevN); }
    else if (e.key.toLowerCase() === 'b') $('#bmBtn').click();
    else if (e.key.toLowerCase() === 'z') openZoom(readerKeys.n);
  }
});
const toTop = $('#toTop');
addEventListener('scroll', () => toTop.classList.toggle('show', scrollY > 600), { passive: true });
toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
let rsT, wasWide = innerWidth >= 900;
addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(() => { const w = innerWidth >= 900; if (w !== wasWide) { wasWide = w; if (location.hash.startsWith('#/page/') && spread) { lastPage = null; router(); } } }, 300); });

router();
})();
