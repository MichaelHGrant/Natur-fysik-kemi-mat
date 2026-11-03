// statistik.js – interaktive figurer til siden om statistiske fordelinger (da/en). Kræver fysikfag.js (LANG_EN, DEC, fmt, chips).
'use strict';
const L = (da, en) => (LANG_EN ? en : da);
(function () { const s = document.createElement('style'); s.textContent = '.svgsim canvas{display:block;width:100%;height:auto}'; document.head.appendChild(s); })();
let PR = false;
const TH = () => PR
  ? { bg: '#ffffff', ax: '#888', grid: '#e6e6e6', t: '#222', tm: '#555', gold: '#8a6420', ice: '#2b6cb0', red: '#c0392b', grn: '#2e8b57', vio: '#6b46c1', dim: '#b8c0cc', fg: 'rgba(138,100,32,.28)', fi: 'rgba(43,108,176,.22)', fr: 'rgba(192,57,43,.25)' }
  : { bg: '#05070b', ax: '#4a5878', grid: '#1c2438', t: '#cfd4df', tm: '#9ba4b6', gold: '#d8b46a', ice: '#9fd0ff', red: '#f08a7a', grn: '#7fd1b9', vio: '#c3a6ff', dim: '#3a4866', fg: 'rgba(216,180,106,.35)', fi: 'rgba(159,208,255,.28)', fr: 'rgba(240,138,122,.3)' };
const REDRAW = [];
(window.__printPrep = window.__printPrep || []).push(() => { PR = true; REDRAW.forEach(f => f(true)); });

// ---------- matematik ----------
function lgam(x) {
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgam(1 - x);
  x -= 1; let a = c[0]; const t = x + 7.5; for (let i = 1; i < 9; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
function erf(x) { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x);
  return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)); }
const npdf = (x, m = 0, s = 1) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
const ncdf = (x, m = 0, s = 1) => 0.5 * (1 + erf((x - m) / (s * Math.SQRT2)));
const binpmf = (k, n, p) => { if (k < 0 || k > n) return 0; if (p <= 0) return k === 0 ? 1 : 0; if (p >= 1) return k === n ? 1 : 0;
  return Math.exp(lgam(n + 1) - lgam(k + 1) - lgam(n - k + 1) + k * Math.log(p) + (n - k) * Math.log(1 - p)); };
const poipmf = (k, l) => Math.exp(k * Math.log(l) - l - lgam(k + 1));
function gammaP(a, x) {
  if (x <= 0) return 0;
  if (x < a + 1) { let s = 1 / a, t = s; for (let n = 1; n < 500; n++) { t *= x / (a + n); s += t; if (t < s * 1e-15) break; } return s * Math.exp(-x + a * Math.log(x) - lgam(a)); }
  let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
  for (let i = 1; i < 500; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-15) break; }
  return 1 - Math.exp(-x + a * Math.log(x) - lgam(a)) * h;
}
const chipdf = (x, k) => (x <= 0 ? 0 : Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.log(2) - lgam(k / 2)));
const tpdf = (t, v) => Math.exp(lgam((v + 1) / 2) - lgam(v / 2) - 0.5 * Math.log(v * Math.PI) - (v + 1) / 2 * Math.log(1 + t * t / v));
function tcdf(x, v) { const n = 400, h = x / n; let s = tpdf(0, v) + tpdf(x, v); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * tpdf(i * h, v); return 0.5 + s * h / 3; }
function tq(p, v) { let a = 0, b = 400; for (let i = 0; i < 60; i++) { const m = (a + b) / 2; tcdf(m, v) < p ? (a = m) : (b = m); } return (a + b) / 2; }
const randn = () => { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); };
const pct = (v, d = 1) => fmt(100 * v, d) + ' %';
function pfmt(p) { if (p >= 0.001) return fmt(p, 4); const e = Math.floor(Math.log10(p)); return fmt(p / 10 ** e, 2) + '·10' + sup(e); }

// ---------- lærred ----------
function mkcv(id, W, H) {
  const c = document.getElementById(id), d = Math.min(2, window.devicePixelRatio || 1);
  c.width = W * d; c.height = H * d; const x = c.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); x.W = W; x.H = H; return x;
}
function clr(x) { x.fillStyle = TH().bg; x.fillRect(0, 0, x.W, x.H); }
function cax(x, gx, gy, gw, gh, o) {
  const th = TH(), lg = o.logx;
  const lx = v => (lg ? Math.log10(v) : v);
  const X = v => gx + (lx(v) - lx(o.x0)) / (lx(o.x1) - lx(o.x0)) * gw, Y = v => gy + gh - (v - o.y0) / (o.y1 - o.y0) * gh;
  x.font = '11.5px system-ui,sans-serif'; x.lineWidth = 1;
  (o.yt || []).forEach(v => { x.strokeStyle = th.grid; x.beginPath(); x.moveTo(gx, Y(v)); x.lineTo(gx + gw, Y(v)); x.stroke(); x.fillStyle = th.tm; x.textAlign = 'right'; x.fillText(o.yf ? o.yf(v) : DEC(String(v)), gx - 6, Y(v) + 4); });
  (o.xt || []).forEach(v => { x.strokeStyle = th.grid; x.beginPath(); x.moveTo(X(v), gy); x.lineTo(X(v), gy + gh); x.stroke(); x.fillStyle = th.tm; x.textAlign = 'center'; x.fillText(o.xf ? o.xf(v) : DEC(String(v)), X(v), gy + gh + 16); });
  x.strokeStyle = th.ax; x.beginPath(); x.moveTo(gx, gy); x.lineTo(gx, gy + gh); x.lineTo(gx + gw, gy + gh); x.stroke();
  x.fillStyle = th.tm; if (o.xl) { x.textAlign = 'right'; x.fillText(o.xl, gx + gw, gy + gh + 32); } if (o.yl) { x.textAlign = 'left'; x.fillText(o.yl, gx + 6, gy + 12); }
  x.textAlign = 'left'; return { X, Y };
}
function ccurve(x, f, a, b, X, Y, col, w = 2, n = 300, dash) {
  x.strokeStyle = col; x.lineWidth = w; if (dash) x.setLineDash(dash); x.beginPath(); let pen = false;
  for (let i = 0; i <= n; i++) { const t = a + (b - a) * i / n, y = f(t); if (!isFinite(y)) { pen = false; continue; } pen ? x.lineTo(X(t), Y(y)) : x.moveTo(X(t), Y(y)); pen = true; }
  x.stroke(); x.setLineDash([]); x.lineWidth = 1;
}
function ctext(x, s, px, py, col, al = 'left', font = '12.5px system-ui,sans-serif') { x.font = font; x.fillStyle = col; x.textAlign = al; x.fillText(s, px, py); x.textAlign = 'left'; }
function visible(id) { let v = true; new IntersectionObserver(es => es.forEach(e => (v = e.isIntersecting))).observe(document.getElementById(id)); return () => v; }
const val = id => +document.getElementById(id).value;
function setv(id, s) { const e = document.getElementById(id); if (e) e.textContent = s; }

// ===== 1. Galtons bræt =====
(function () {
  const x = mkcv('galcv', 900, 520), info = document.getElementById('galinfo'), vis = visible('galcv');
  let R = 12, p = 0.5, cnt = [], balls = [], queue = 0, qt = 0, N = 0;
  const cx = 450, top = 40;
  const dx = () => Math.min(40, 780 / (R + 1)), dy = () => 250 / R;
  function reset(pre) { cnt = new Array(R + 1).fill(0); balls = []; queue = 0; N = 0;
    for (let i = 0; i < pre; i++) { let k = 0; for (let r = 0; r < R; r++) if (Math.random() < p) k++; cnt[k]++; N++; } }
  function drop() { const d = []; for (let r = 0; r < R; r++) d.push(Math.random() < p ? 1 : 0); balls.push({ d, t: 0 }); }
  function pos(b) { const s = Math.min(R, Math.floor(b.t)), f = b.t - s; let k = 0; for (let i = 0; i < s; i++) k += b.d[i];
    const xa = cx + (k - s / 2) * dx(), ya = top + s * dy();
    if (s >= R) return [xa, ya + f * 40];
    const kb = k + b.d[s], xb = cx + (kb - (s + 1) / 2) * dx(), yb = top + (s + 1) * dy();
    return [xa + (xb - xa) * f, ya + (yb - ya) * f - Math.sin(Math.PI * f) * dy() * 0.45]; }
  function draw() {
    const th = TH(); clr(x); const DX = dx(), DY = dy();
    x.fillStyle = th.tm; for (let r = 0; r < R; r++) for (let j = 0; j <= r; j++) { x.beginPath(); x.arc(cx + (j - r / 2) * DX, top + r * DY + 6, 3, 0, 7); x.fill(); }
    const by = 505, bh = 180, mu = R * p, sg = Math.sqrt(R * p * (1 - p));
    let mx = Math.max(1, ...cnt, ...cnt.map((_, k) => N * binpmf(k, R, p)));
    x.strokeStyle = th.ax; x.beginPath(); x.moveTo(cx - (R / 2 + 0.7) * DX, by); x.lineTo(cx + (R / 2 + 0.7) * DX, by); x.stroke();
    for (let k = 0; k <= R; k++) { const bx = cx + (k - R / 2) * DX, h = cnt[k] / mx * bh;
      x.strokeStyle = th.dim; x.beginPath(); x.moveTo(bx - DX / 2, by); x.lineTo(bx - DX / 2, by - bh - 8); x.stroke();
      x.fillStyle = th.fi; x.fillRect(bx - DX / 2 + 2, by - h, DX - 4, h); x.strokeStyle = th.ice; x.strokeRect(bx - DX / 2 + 2, by - h, DX - 4, h);
      const e = N * binpmf(k, R, p) / mx * bh; x.fillStyle = th.gold; x.fillRect(bx - DX / 2 + 4, by - e - 1.5, DX - 8, 3); }
    if (sg > 0) ccurve(x, k => N * npdf(k, mu, sg) / mx * bh, -0.5, R + 0.5, k => cx + (k - R / 2) * DX, y => by - y, th.grn, 1.6, 300, [5, 4]);
    x.fillStyle = th.gold; balls.forEach(b => { const [px, py] = pos(b); x.beginPath(); x.arc(px, py, 4.5, 0, 7); x.fill(); });
    let m = 0, v = 0; cnt.forEach((c, k) => (m += c * k)); m /= Math.max(1, N); cnt.forEach((c, k) => (v += c * (k - m) ** 2)); v /= Math.max(1, N - 1);
    info.innerHTML = L(`<b>${N}</b> kugler · ${R} rækker søm · p = ${fmt(p, 2)}<br>Målt: middel ${fmt(m, 2)}, spredning ${fmt(Math.sqrt(v), 2)}<br>Teori: μ = np = ${fmt(mu, 2)}, σ = √(np(1−p)) = ${fmt(sg, 2)}<br><span style="color:${th.gold}">▬</span> binomialfordeling · <span style="color:${th.grn}">- -</span> normalfordeling`,
      `<b>${N}</b> balls · ${R} rows of pins · p = ${fmt(p, 2)}<br>Measured: mean ${fmt(m, 2)}, standard deviation ${fmt(Math.sqrt(v), 2)}<br>Theory: μ = np = ${fmt(mu, 2)}, σ = √(np(1−p)) = ${fmt(sg, 2)}<br><span style="color:${th.gold}">▬</span> binomial distribution · <span style="color:${th.grn}">- -</span> normal distribution`);
  }
  let last = performance.now();
  function loop(now) { const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
    if (vis() && (balls.length || queue)) { qt += dt; while (queue > 0 && qt > 0.03) { drop(); queue--; qt -= 0.03; }
      balls.forEach(b => (b.t += dt * 9)); balls = balls.filter(b => { if (b.t >= R + 1) { let k = 0; b.d.forEach(z => (k += z)); cnt[k]++; N++; return false; } return true; }); draw(); }
    requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  const pr = document.getElementById('galp'), rr = document.getElementById('galR');
  pr.oninput = () => { p = +pr.value; setv('galpv', fmt(p, 2)); reset(0); draw(); };
  rr.oninput = () => { R = +rr.value; setv('galRv', R); reset(0); draw(); };
  document.getElementById('gal1').onclick = () => { queue += 1; };
  document.getElementById('gal100').onclick = () => { queue += 100; };
  document.getElementById('gal1000').onclick = () => { reset(N + 1000 + balls.length); balls = []; draw(); };
  document.getElementById('gal0').onclick = () => { reset(0); draw(); };
  setv('galpv', fmt(p, 2)); setv('galRv', R); reset(400); draw(); REDRAW.push(draw);
})();

// ===== 2. Binomialfordelingen =====
(function () {
  const x = mkcv('bincv', 900, 400), info = document.getElementById('bininfo');
  let mode = 'le';
  const nS = document.getElementById('binn'), pS = document.getElementById('binp'), kS = document.getElementById('bink'), nc = document.getElementById('binN');
  function draw() {
    const th = TH(), n = +nS.value, p = +pS.value; kS.max = n; const k = Math.min(+kS.value, n);
    setv('binnv', n); setv('binpv', fmt(p, 2)); setv('binkv', k); clr(x);
    const P = []; let mx = 0; for (let i = 0; i <= n; i++) { P.push(binpmf(i, n, p)); mx = Math.max(mx, P[i]); }
    const ym = Math.min(1, mx * 1.15 + 1e-9), step = ym > 0.5 ? 0.1 : ym > 0.2 ? 0.05 : ym > 0.1 ? 0.02 : 0.01;
    const yt = []; for (let v = 0; v <= ym + 1e-9; v += step) yt.push(+v.toFixed(3));
    const xs = Math.max(1, Math.ceil(n / 20)), xt = []; for (let i = 0; i <= n; i += xs * (n > 40 ? 5 : 1)) xt.push(i);
    const { X, Y } = cax(x, 60, 20, 810, 320, { x0: -0.7, x1: n + 0.7, y0: 0, y1: ym, yt, xt, xl: L('k (antal succeser)', 'k (number of successes)'), yl: 'P(X = k)', yf: v => fmt(v, step < 0.1 ? 2 : 1) });
    const w = Math.max(1, (X(1) - X(0)) * 0.8); let S = 0;
    for (let i = 0; i <= n; i++) { const on = mode === 'eq' ? i === k : mode === 'le' ? i <= k : i >= k; if (on) S += P[i];
      x.fillStyle = on ? th.fg : th.fi; x.strokeStyle = on ? th.gold : th.ice; x.fillRect(X(i) - w / 2, Y(P[i]), w, Y(0) - Y(P[i])); if (w > 3) x.strokeRect(X(i) - w / 2, Y(P[i]), w, Y(0) - Y(P[i])); }
    const mu = n * p, sg = Math.sqrt(n * p * (1 - p)); let na = '';
    if (nc.checked && sg > 0) { ccurve(x, t => npdf(t, mu, sg), -0.7, n + 0.7, X, Y, th.grn, 2);
      const a = mode === 'eq' ? ncdf(k + 0.5, mu, sg) - ncdf(k - 0.5, mu, sg) : mode === 'le' ? ncdf(k + 0.5, mu, sg) : 1 - ncdf(k - 0.5, mu, sg);
      na = L(`<br><span style="color:${th.grn}">Normaltilnærmelse</span> (med ±½): ${pfmt(a)}`, `<br><span style="color:${th.grn}">Normal approximation</span> (with ±½): ${pfmt(a)}`); }
    const lab = mode === 'eq' ? `P(X = ${k})` : mode === 'le' ? `P(X ≤ ${k})` : `P(X ≥ ${k})`;
    info.innerHTML = L(`n = ${n}, p = ${fmt(p, 2)} · μ = np = ${fmt(mu, 2)} · σ = ${fmt(sg, 2)}<br><b>${lab} = ${pfmt(S)}</b>${na}`, `n = ${n}, p = ${fmt(p, 2)} · μ = np = ${fmt(mu, 2)} · σ = ${fmt(sg, 2)}<br><b>${lab} = ${pfmt(S)}</b>${na}`);
  }
  [nS, pS, kS, nc].forEach(e => (e.oninput = draw));
  chips('#binmode button', b => { mode = b.dataset.m; draw(); });
  document.querySelectorAll('#binpre button').forEach(b => (b.onclick = () => { nS.value = b.dataset.n; pS.value = b.dataset.p; kS.max = b.dataset.n; kS.value = b.dataset.k; mode = b.dataset.m;
    document.querySelectorAll('#binmode button').forEach(c => c.classList.toggle('on', c.dataset.m === mode)); draw(); }));
  draw(); REDRAW.push(draw);
})();

// ===== 3. Poissonfordelingen med historiske data =====
(function () {
  const x = mkcv('poicv', 900, 400), info = document.getElementById('poiinfo'), lS = document.getElementById('poil');
  const DATA = { bort: [109, 65, 22, 3, 1], rg: [57, 203, 383, 525, 532, 408, 273, 139, 45, 27, 10, 4, 0, 1, 1] };
  let ds = 'bort';
  function stats(d) { let N = 0, m = 0, q = 0; d.forEach((c, k) => { N += c; m += c * k; q += c * k * k; }); m /= N; return { N, m, v: q / N - m * m }; }
  function draw() {
    const th = TH(), lam = +lS.value; setv('poilv', fmt(lam, 2)); clr(x);
    const d = DATA[ds], st = d ? stats(d) : null;
    const kmax = Math.max(8, Math.ceil(lam + 4.5 * Math.sqrt(lam) + 2), d ? d.length : 0);
    let mx = 0; for (let k = 0; k <= kmax; k++) mx = Math.max(mx, poipmf(k, lam), d ? (d[k] || 0) / st.N : 0);
    const ym = mx * 1.15, step = ym > 0.5 ? 0.1 : ym > 0.2 ? 0.05 : 0.02; const yt = []; for (let v = 0; v <= ym + 1e-9; v += step) yt.push(+v.toFixed(3));
    const xt = []; for (let k = 0; k <= kmax; k += kmax > 25 ? 5 : kmax > 14 ? 2 : 1) xt.push(k);
    const { X, Y } = cax(x, 60, 20, 810, 320, { x0: -0.7, x1: kmax + 0.7, y0: 0, y1: ym, yt, xt, yf: v => fmt(v, 2), xl: L('k (antal hændelser)', 'k (number of events)'), yl: L('sandsynlighed / relativ hyppighed', 'probability / relative frequency') });
    const w = (X(1) - X(0)) * 0.36;
    for (let k = 0; k <= kmax; k++) { const P = poipmf(k, lam); x.fillStyle = th.fg; x.strokeStyle = th.gold; x.fillRect(X(k) - (d ? w : w * 1.6), Y(P), d ? w : w * 2.2, Y(0) - Y(P)); x.strokeRect(X(k) - (d ? w : w * 1.6), Y(P), d ? w : w * 2.2, Y(0) - Y(P));
      if (d) { const f = (d[k] || 0) / st.N; x.fillStyle = th.fr; x.strokeStyle = th.red; x.fillRect(X(k), Y(f), w, Y(0) - Y(f)); x.strokeRect(X(k), Y(f), w, Y(0) - Y(f)); } }
    let t = L(`λ = ${fmt(lam, 2)} · middelværdi = varians = λ · σ = √λ = ${fmt(Math.sqrt(lam), 2)}`, `λ = ${fmt(lam, 2)} · mean = variance = λ · σ = √λ = ${fmt(Math.sqrt(lam), 2)}`);
    if (d) { let chi = 0; d.forEach((c, k) => { const e = st.N * poipmf(k, lam); if (e > 0) chi += (c - e) ** 2 / e; });
      t += L(`<br><span style="color:${th.red}">■</span> data: ${st.N} observationer, middel ${fmt(st.m, 3)}, varians ${fmt(st.v, 3)}<br><span style="color:${th.gold}">■</span> Poisson med samme λ passer – middel og varians er næsten ens`,
        `<br><span style="color:${th.red}">■</span> data: ${st.N} observations, mean ${fmt(st.m, 3)}, variance ${fmt(st.v, 3)}<br><span style="color:${th.gold}">■</span> Poisson with the same λ fits – mean and variance are nearly equal`); }
    info.innerHTML = t;
  }
  lS.oninput = draw;
  chips('#poisel button', b => { ds = b.dataset.d; if (DATA[ds]) lS.value = stats(DATA[ds]).m.toFixed(2); draw(); });
  lS.value = stats(DATA.bort).m.toFixed(2); draw(); REDRAW.push(draw);
})();

// ===== 4. Poisson-processen: tællinger og ventetider =====
(function () {
  const x = mkcv('procv', 900, 470), info = document.getElementById('proinfo'), vis = visible('procv'), rS = document.getElementById('pror');
  let r, T, next, ev, cnts, waits, cur, lastEv, bucket;
  function reset() { r = +rS.value; setv('prorv', fmt(r, 1)); T = 0; ev = []; cnts = []; waits = []; cur = 0; bucket = 0; lastEv = 0; next = -Math.log(1 - Math.random()) / r; }
  function adv(dt) { const T1 = T + dt;
    while (next < T1) { while (next >= bucket + 1) { cnts.push(cur); cur = 0; bucket++; } cur++; ev.push(next); waits.push(next - lastEv); lastEv = next; next += -Math.log(1 - Math.random()) / r; }
    while (T1 >= bucket + 1) { cnts.push(cur); cur = 0; bucket++; } T = T1; if (ev.length > 4000) ev.splice(0, 2000); }
  function draw() {
    const th = TH(); clr(x);
    // tidslinje
    const W0 = 60, W1 = 870, span = 20, t0 = Math.max(0, T - span);
    ctext(x, L(`Tidslinje (sidste ${span} s) – hver streg er et henfald`, `Timeline (last ${span} s) – each tick is a decay`), W1, 78, th.tm, 'right', '12px system-ui');
    x.strokeStyle = th.ax; x.beginPath(); x.moveTo(W0, 112); x.lineTo(W1, 112); x.stroke();
    for (let s = Math.ceil(t0); s <= T; s++) { const px = W0 + (s - t0) / span * (W1 - W0); x.strokeStyle = th.grid; x.beginPath(); x.moveTo(px, 86); x.lineTo(px, 116); x.stroke(); }
    x.strokeStyle = th.gold; x.lineWidth = 2; ev.forEach(e => { if (e >= t0) { const px = W0 + (e - t0) / span * (W1 - W0); x.beginPath(); x.moveTo(px, 88); x.lineTo(px, 112); x.stroke(); } }); x.lineWidth = 1;
    // tællinger pr. sekund
    const km = Math.max(6, Math.ceil(r + 4 * Math.sqrt(r) + 1)); const h = new Array(km + 1).fill(0); cnts.forEach(c => { if (c <= km) h[c]++; });
    const Nc = Math.max(1, cnts.length); let mx = 0; for (let k = 0; k <= km; k++) mx = Math.max(mx, h[k] / Nc, poipmf(k, r));
    const A = cax(x, 60, 150, 360, 270, { x0: -0.7, x1: km + 0.7, y0: 0, y1: mx * 1.15, yt: [0, 0.1, 0.2, 0.3, 0.4].filter(v => v <= mx * 1.15), xt: Array.from({ length: km + 1 }, (_, i) => i).filter(i => i % Math.ceil(km / 10) === 0), yf: v => fmt(v, 1), xl: L('henfald pr. sekund', 'decays per second') });
    const w = (A.X(1) - A.X(0)) * 0.7;
    for (let k = 0; k <= km; k++) { const f = h[k] / Nc; x.fillStyle = th.fi; x.strokeStyle = th.ice; x.fillRect(A.X(k) - w / 2, A.Y(f), w, A.Y(0) - A.Y(f)); x.strokeRect(A.X(k) - w / 2, A.Y(f), w, A.Y(0) - A.Y(f));
      x.fillStyle = th.gold; x.fillRect(A.X(k) - w / 2, A.Y(poipmf(k, r)) - 1.5, w, 3); }
    ctext(x, L('Poisson-fordelingen', 'Poisson distribution'), 70, 168, th.gold, 'left', '12px system-ui');
    // ventetider
    const tm = 4 / r, nb = 30, hb = new Array(nb).fill(0); waits.forEach(wt => { const i = Math.floor(wt / tm * nb); if (i < nb) hb[i]++; });
    const Nw = Math.max(1, waits.length), bw = tm / nb;
    const B = cax(x, 500, 150, 370, 270, { x0: 0, x1: tm, y0: 0, y1: r * 1.15, yt: [], xt: [0, 1, 2, 3, 4].map(v => v / r), xf: v => fmt(v, v * r < 0.5 ? 0 : 2), xl: L('ventetid til næste henfald (s)', 'waiting time to next decay (s)') });
    for (let i = 0; i < nb; i++) { const f = hb[i] / Nw / bw; x.fillStyle = th.fi; x.strokeStyle = th.ice; x.fillRect(B.X(i * bw) + 1, B.Y(f), B.X(bw) - B.X(0) - 2, B.Y(0) - B.Y(f)); }
    ccurve(x, t => r * Math.exp(-r * t), 0, tm, B.X, B.Y, th.gold, 2.2);
    ctext(x, L('eksponentialfordelingen r·e^(−rt)', 'exponential distribution r·e^(−rt)'), 600, 168, th.gold, 'left', '12px system-ui');
    let mw = 0; waits.forEach(w2 => (mw += w2)); mw /= Nw;
    info.innerHTML = L(`r = ${fmt(r, 1)} henfald/s · ${ev.length > 0 ? cnts.length : 0} sekunder simuleret<br>Middelventetid: målt ${fmt(mw, 3)} s, teori 1/r = ${fmt(1 / r, 3)} s`, `r = ${fmt(r, 1)} decays/s · ${cnts.length} seconds simulated<br>Mean waiting time: measured ${fmt(mw, 3)} s, theory 1/r = ${fmt(1 / r, 3)} s`);
  }
  let last = performance.now();
  function loop(now) { const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; if (vis()) { adv(dt * 4); draw(); } requestAnimationFrame(loop); }
  rS.oninput = () => { reset(); adv(600); draw(); };
  document.getElementById('pro0').onclick = () => { reset(); draw(); };
  reset(); adv(1500); draw(); REDRAW.push(draw); requestAnimationFrame(loop);
})();

// ===== 5. Normalfordelingen =====
(function () {
  const x = mkcv('norcv', 900, 380), info = document.getElementById('norinfo'), aS = document.getElementById('nora'), bS = document.getElementById('norb');
  const PRE = { std: [0, 1, ''], hoejde: [181, 7, ' cm'], iq: [100, 15, ''], maal: [9.82, 0.05, ' m/s²'] };
  let pre = 'hoejde';
  function draw() {
    const th = TH(), [mu, sg, u] = PRE[pre]; let a = +aS.value, b = +bS.value; if (a > b) [a, b] = [b, a]; clr(x);
    const d = sg < 0.1 ? 2 : sg < 1 ? 1 : 0, f = v => fmt(v, d);
    const { X, Y } = cax(x, 60, 20, 810, 290, { x0: -4, x1: 4, y0: 0, y1: 0.45, yt: [0, 0.1, 0.2, 0.3, 0.4], xt: [-4, -3, -2, -1, 0, 1, 2, 3, 4], yf: v => fmt(v, 1),
      xf: v => (pre === 'std' ? DEC(String(v)) : f(mu + v * sg)) });
    x.fillStyle = th.fg; x.beginPath(); x.moveTo(X(a), Y(0)); for (let i = 0; i <= 200; i++) { const t = a + (b - a) * i / 200; x.lineTo(X(t), Y(npdf(t))); } x.lineTo(X(b), Y(0)); x.closePath(); x.fill();
    ccurve(x, t => npdf(t), -4, 4, X, Y, th.ice, 2.2);
    [-3, -2, -1, 1, 2, 3].forEach(z => ctext(x, (z > 0 ? '+' : '−') + Math.abs(z) + 'σ', X(z), Y(0) + 32, th.tm, 'center', '11px system-ui'));
    ctext(x, 'μ', X(0), Y(0) + 32, th.tm, 'center', '11px system-ui');
    [a, b].forEach(z => { x.strokeStyle = th.gold; x.lineWidth = 2; x.beginPath(); x.moveTo(X(z), Y(0)); x.lineTo(X(z), Y(npdf(z)) - 6); x.stroke(); x.lineWidth = 1; });
    const P = ncdf(b) - ncdf(a), lo = ncdf(a), hi = 1 - ncdf(b);
    setv('norav', DEC(a.toFixed(2))); setv('norbv', DEC(b.toFixed(2)));
    const rng = pre === 'std' ? `${fmt(a, 2)} &lt; Z &lt; ${fmt(b, 2)}` : `${f(mu + a * sg)}${u} &lt; X &lt; ${f(mu + b * sg)}${u}`;
    info.innerHTML = L(`μ = ${f(mu)}${u}, σ = ${f(sg)}${u}<br><b>P(${rng}) = ${pct(P, 2)}</b><br>Under: ${pct(lo, 2)} · Over: ${pct(hi, 2)}${hi > 0 && hi < 0.01 ? ' (1 ud af ' + Math.round(1 / hi).toLocaleString('da-DK') + ')' : ''}`,
      `μ = ${f(mu)}${u}, σ = ${f(sg)}${u}<br><b>P(${rng}) = ${pct(P, 2)}</b><br>Below: ${pct(lo, 2)} · Above: ${pct(hi, 2)}${hi > 0 && hi < 0.01 ? ' (1 in ' + Math.round(1 / hi).toLocaleString('en-GB') + ')' : ''}`);
  }
  aS.oninput = bS.oninput = draw;
  chips('#norpre button', bt => { pre = bt.dataset.p; draw(); });
  document.querySelectorAll('#norint button').forEach(bt => (bt.onclick = () => { aS.value = bt.dataset.a; bS.value = bt.dataset.b; draw(); }));
  draw(); REDRAW.push(draw);
})();

// ===== 6. De store tals lov =====
(function () {
  const x = mkcv('llncv', 900, 380), info = document.getElementById('llninfo');
  let typ = 'die', series = [];
  const N = 5000, GEN = { die: () => 1 + Math.floor(6 * Math.random()), coin: () => (Math.random() < 0.5 ? 1 : 0), cauchy: () => Math.tan(Math.PI * (Math.random() - 0.5)) };
  const MU = { die: 3.5, coin: 0.5, cauchy: 0 }, YR = { die: [1, 6], coin: [0, 1], cauchy: [-6, 6] };
  function newSeries() { series = []; for (let s = 0; s < 6; s++) { const a = new Float32Array(N); let S = 0; for (let i = 0; i < N; i++) { S += GEN[typ](); a[i] = S / (i + 1); } series.push(a); } draw(); }
  function draw() {
    const th = TH(); clr(x); const [y0, y1] = YR[typ];
    const yt = typ === 'die' ? [1, 2, 3, 3.5, 4, 5, 6] : typ === 'coin' ? [0, 0.25, 0.5, 0.75, 1] : [-6, -4, -2, 0, 2, 4, 6];
    const { X, Y } = cax(x, 60, 20, 810, 300, { logx: true, x0: 1, x1: N, y0, y1, yt, xt: [1, 10, 100, 1000, 5000], xf: v => v.toLocaleString(LANG_EN ? 'en-GB' : 'da-DK'), yf: v => DEC(String(v)), xl: L('antal forsøg n (logaritmisk akse)', 'number of trials n (logarithmic axis)'), yl: L('gennemsnit af de første n', 'average of the first n') });
    if (typ !== 'cauchy') { const sg = typ === 'die' ? Math.sqrt(35 / 12) : 0.5; x.fillStyle = th.fg; x.globalAlpha = 0.45; x.beginPath();
      for (let i = 1; i <= N; i *= 1.05) x.lineTo(X(i), Y(Math.min(y1, MU[typ] + 2 * sg / Math.sqrt(i)))); for (let i = N; i >= 1; i /= 1.05) x.lineTo(X(i), Y(Math.max(y0, MU[typ] - 2 * sg / Math.sqrt(i)))); x.fill(); x.globalAlpha = 1; }
    x.strokeStyle = th.gold; x.setLineDash([5, 4]); x.beginPath(); x.moveTo(X(1), Y(MU[typ])); x.lineTo(X(N), Y(MU[typ])); x.stroke(); x.setLineDash([]);
    const cols = [th.ice, th.red, th.grn, th.vio, th.gold, th.tm];
    x.save(); x.beginPath(); x.rect(60, 20, 810, 300); x.clip();
    series.forEach((a, s) => { x.strokeStyle = cols[s]; x.lineWidth = 1.4; x.beginPath(); for (let i = 0; i < N; i++) { const px = X(i + 1), py = Y(Math.max(y0 - 1, Math.min(y1 + 1, a[i]))); i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); });
    x.restore(); x.lineWidth = 1;
    const fin = series.map(a => fmt(a[N - 1], 3)).join(' · ');
    info.innerHTML = typ === 'cauchy' ? L(`<b>Cauchy-fordelingen</b> har ingen middelværdi. Gennemsnittene konvergerer aldrig – et enkelt ekstremt udfald kan flytte dem når som helst.<br>Efter ${N} forsøg: ${fin}`, `<b>The Cauchy distribution</b> has no mean. The averages never converge – a single extreme outcome can move them at any time.<br>After ${N} trials: ${fin}`)
      : L(`Seks serier · sand middelværdi ${fmt(MU[typ], 1)} (stiplet) · gult bånd: ±2σ/√n<br>Efter ${N} forsøg: ${fin}`, `Six series · true mean ${fmt(MU[typ], 1)} (dashed) · gold band: ±2σ/√n<br>After ${N} trials: ${fin}`);
  }
  chips('#llnsel button', b => { typ = b.dataset.t; newSeries(); });
  document.getElementById('llnnew').onclick = newSeries;
  newSeries(); REDRAW.push(draw);
})();

// ===== 7. Den centrale grænseværdisætning =====
(function () {
  const x = mkcv('cltcv', 900, 420), info = document.getElementById('cltinfo'), vis = visible('cltcv'), nS = document.getElementById('cltn');
  const P = {
    uni: { g: () => Math.random(), pdf: t => (t >= 0 && t <= 1 ? 1 : 0), r: [-0.1, 1.1], mu: 0.5, sg: Math.sqrt(1 / 12), pm: 1.4 },
    exp: { g: () => -Math.log(1 - Math.random()), pdf: t => (t >= 0 ? Math.exp(-t) : 0), r: [0, 4], mu: 1, sg: 1, pm: 1.1 },
    die: { g: () => 1 + Math.floor(6 * Math.random()), r: [0.5, 6.5], mu: 3.5, sg: Math.sqrt(35 / 12), disc: true },
    u: { g: () => Math.sin(Math.PI * Math.random() / 2) ** 2, pdf: t => (t > 0 && t < 1 ? 1 / (Math.PI * Math.sqrt(t * (1 - t))) : NaN), r: [-0.1, 1.1], mu: 0.5, sg: Math.sqrt(1 / 8), pm: 3 },
    cau: { g: () => Math.tan(Math.PI * (Math.random() - 0.5)), pdf: t => 1 / (Math.PI * (1 + t * t)), r: [-6, 6], mu: 0, sg: NaN, pm: 0.4 }
  };
  let typ = 'exp', n = 5, means = [], target = 4000;
  const NB = 70;
  function reset() { n = +nS.value; setv('cltnv', n); means = []; }
  function add(k) { const p = P[typ]; for (let j = 0; j < k && means.length < target; j++) { let s = 0; for (let i = 0; i < n; i++) s += p.g(); means.push(s / n); } }
  function draw() {
    const th = TH(), p = P[typ]; clr(x);
    // moderfordeling
    ctext(x, L('Fordelingen af ét enkelt udfald', 'Distribution of a single outcome'), 40, 22, th.tm, 'left', '12px system-ui');
    const A = cax(x, 40, 40, 230, 160, { x0: p.r[0], x1: p.r[1], y0: 0, y1: p.disc ? 0.25 : p.pm, yt: [], xt: [] });
    if (p.disc) { for (let k = 1; k <= 6; k++) { x.fillStyle = th.fi; x.strokeStyle = th.ice; x.fillRect(A.X(k) - 8, A.Y(1 / 6), 16, A.Y(0) - A.Y(1 / 6)); x.strokeRect(A.X(k) - 8, A.Y(1 / 6), 16, A.Y(0) - A.Y(1 / 6)); ctext(x, String(k), A.X(k), A.Y(0) + 14, th.tm, 'center', '11px system-ui'); } }
    else ccurve(x, t => Math.min(p.pm * 0.98, p.pdf(t)), p.r[0], p.r[1], A.X, A.Y, th.ice, 2, 400);
    ctext(x, typ === 'cau' ? L('ingen middelværdi, ingen spredning', 'no mean, no standard deviation') : `μ = ${fmt(p.mu, 2)}, σ = ${fmt(p.sg, 3)}`, 40, 232, th.tm, 'left', '12px system-ui');
    // gennemsnit
    const r = p.r, bw = (r[1] - r[0]) / NB, h = new Array(NB).fill(0); means.forEach(m => { const i = Math.floor((m - r[0]) / bw); if (i >= 0 && i < NB) h[i]++; });
    const Nm = Math.max(1, means.length);
    const sgn = p.sg / Math.sqrt(n); const pk = typ === 'cau' ? 1 / Math.PI : p.disc && n === 1 ? (1 / 6) / bw : 1 / (sgn * Math.sqrt(2 * Math.PI));
    let mx = pk; h.forEach(c => (mx = Math.max(mx, c / Nm / bw)));
    ctext(x, L(`Fordelingen af gennemsnittet af n = ${n} udfald`, `Distribution of the average of n = ${n} outcomes`), 330, 22, th.tm, 'left', '12px system-ui');
    const xt = typ === 'cau' ? [-6, -4, -2, 0, 2, 4, 6] : typ === 'die' ? [1, 2, 3, 4, 5, 6] : typ === 'exp' ? [0, 1, 2, 3, 4] : [0, 0.25, 0.5, 0.75, 1];
    const B = cax(x, 330, 40, 540, 330, { x0: r[0], x1: r[1], y0: 0, y1: mx * 1.1, yt: [], xt, xf: v => DEC(String(v)), xl: L('gennemsnit', 'average') });
    for (let i = 0; i < NB; i++) { const f = h[i] / Nm / bw; x.fillStyle = th.fi; x.strokeStyle = th.ice; x.fillRect(B.X(r[0] + i * bw) + 0.5, B.Y(f), B.X(bw) - B.X(0) - 1, B.Y(0) - B.Y(f)); }
    if (typ === 'cau') ccurve(x, p.pdf, r[0], r[1], B.X, B.Y, th.red, 2.2, 300);
    else if (!(p.disc && n === 1)) ccurve(x, t => npdf(t, p.mu, sgn), r[0], r[1], B.X, B.Y, th.gold, 2.2, 400);
    info.innerHTML = typ === 'cau'
      ? L(`${means.length} gennemsnit · Gennemsnittet af n Cauchy-tal er <i>selv</i> Cauchy-fordelt (rød) – det bliver aldrig smallere. Sætningen gælder kun, når σ er endelig.`, `${means.length} averages · The average of n Cauchy numbers is <i>itself</i> Cauchy-distributed (red) – it never gets narrower. The theorem only holds when σ is finite.`)
      : L(`${means.length} gennemsnit · <span style="color:${th.gold}">guld:</span> normalfordeling med μ = ${fmt(p.mu, 2)} og σ/√n = ${fmt(sgn, 3)}`, `${means.length} averages · <span style="color:${th.gold}">gold:</span> normal distribution with μ = ${fmt(p.mu, 2)} and σ/√n = ${fmt(sgn, 3)}`);
  }
  function loop() { if (vis() && means.length < target) { add(60); draw(); } requestAnimationFrame(loop); }
  nS.oninput = () => { reset(); draw(); };
  chips('#cltsel button', b => { typ = b.dataset.t; reset(); draw(); });
  document.getElementById('cltnew').onclick = () => { reset(); draw(); };
  reset(); add(4000); draw(); REDRAW.push(draw); requestAnimationFrame(loop);
})();

// ===== 8. Konfidensintervaller =====
(function () {
  const x = mkcv('cicv', 900, 460), info = document.getElementById('ciinfo'), nS = document.getElementById('cin');
  const MU = 100, SG = 15; let lev = 0.95, iv = [], tot = 0, hit = 0;
  function draw() {
    const th = TH(), n = +nS.value; clr(x);
    const { X, Y } = cax(x, 60, 20, 810, 390, { x0: 70, x1: 130, y0: 0, y1: 54, yt: [], xt: [70, 80, 90, 100, 110, 120, 130], xl: L('estimat af μ', 'estimate of μ') });
    x.strokeStyle = th.gold; x.setLineDash([5, 4]); x.beginPath(); x.moveTo(X(MU), Y(0)); x.lineTo(X(MU), Y(54)); x.stroke(); x.setLineDash([]);
    ctext(x, L('sand μ = 100', 'true μ = 100'), X(MU) + 6, 34, th.gold, 'left', '12px system-ui');
    iv.forEach((c, i) => { const ok = c[0] <= MU && MU <= c[1], col = ok ? th.ice : th.red; x.strokeStyle = col; x.lineWidth = ok ? 1.6 : 2.6;
      x.beginPath(); x.moveTo(X(Math.max(70, c[0])), Y(i + 1)); x.lineTo(X(Math.min(130, c[1])), Y(i + 1)); x.stroke(); x.fillStyle = col; x.beginPath(); x.arc(X(c[2]), Y(i + 1), 2.5, 0, 7); x.fill(); });
    x.lineWidth = 1;
    const k = iv.filter(c => c[0] <= MU && MU <= c[1]).length, ts = tq(0.5 + lev / 2, n - 1);
    info.innerHTML = L(`n = ${n} · ${Math.round(lev * 100)} %-intervaller: x̄ ± t*·s/√n med t* = ${fmt(ts, 3)}<br><b>${k} af ${iv.length}</b> rammer μ · i alt ${hit} af ${tot} = ${tot ? pct(hit / tot, 1) : '–'}`,
      `n = ${n} · ${Math.round(lev * 100)} % intervals: x̄ ± t*·s/√n with t* = ${fmt(ts, 3)}<br><b>${k} of ${iv.length}</b> contain μ · in total ${hit} of ${tot} = ${tot ? pct(hit / tot, 1) : '–'}`);
  }
  function gen() { const n = +nS.value; setv('cinv', n); const ts = tq(0.5 + lev / 2, n - 1); iv = [];
    for (let j = 0; j < 50; j++) { let s = 0, q = 0; const a = []; for (let i = 0; i < n; i++) { const v = MU + SG * randn(); a.push(v); s += v; } const m = s / n; a.forEach(v => (q += (v - m) ** 2)); const sd = Math.sqrt(q / (n - 1)), e = ts * sd / Math.sqrt(n);
      iv.push([m - e, m + e, m]); tot++; if (m - e <= MU && MU <= m + e) hit++; }
    draw(); }
  nS.oninput = () => { tot = hit = 0; gen(); };
  chips('#cilev button', b => { lev = +b.dataset.l; tot = hit = 0; gen(); });
  document.getElementById('cinew').onclick = gen;
  gen(); REDRAW.push(draw);
})();

// ===== 9. Students t-fordeling =====
(function () {
  const x = mkcv('tcv', 900, 340), info = document.getElementById('tinfo'), vS = document.getElementById('tv');
  function draw() {
    const th = TH(), v = +vS.value; setv('tvv', v); clr(x);
    const { X, Y } = cax(x, 60, 20, 810, 270, { x0: -5, x1: 5, y0: 0, y1: 0.42, yt: [0, 0.1, 0.2, 0.3, 0.4], xt: [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5], yf: z => fmt(z, 1), xl: 't' });
    const ts = tq(0.975, v);
    x.fillStyle = th.fg; [[-5, -ts], [ts, 5]].forEach(([a, b]) => { x.beginPath(); x.moveTo(X(a), Y(0)); for (let i = 0; i <= 100; i++) { const t = a + (b - a) * i / 100; x.lineTo(X(t), Y(tpdf(t, v))); } x.lineTo(X(b), Y(0)); x.fill(); });
    ccurve(x, t => npdf(t), -5, 5, X, Y, th.ice, 1.8, 300, [6, 4]);
    ccurve(x, t => tpdf(t, v), -5, 5, X, Y, th.gold, 2.4);
    ctext(x, L('normalfordeling', 'normal distribution'), X(0.9), Y(0.37), th.ice, 'left', '12px system-ui');
    ctext(x, L(`t-fordeling, ${v} frihedsgrader`, `t distribution, ${v} degrees of freedom`), X(1.6), Y(0.26), th.gold, 'left', '12px system-ui');
    info.innerHTML = L(`ν = ${v} frihedsgrader (n = ${v + 1})<br>95 %-grænse: <b>t* = ${fmt(ts, 3)}</b> mod z* = 1,960<br>Halerne (guld) rummer tilsammen 5 %`, `ν = ${v} degrees of freedom (n = ${v + 1})<br>95 % limit: <b>t* = ${fmt(ts, 3)}</b> versus z* = 1.960<br>The tails (gold) hold 5 % between them`);
  }
  vS.oninput = draw; draw(); REDRAW.push(draw);
})();

// ===== 10. χ²-test af en terning =====
(function () {
  const x = mkcv('chicv', 900, 380), info = document.getElementById('chiinfo'), nS = document.getElementById('chin');
  let fair = true, obs = [0, 0, 0, 0, 0, 0];
  function roll() { const N = +nS.value; setv('chinv', N); obs = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < N; i++) { let k; if (fair) k = Math.floor(6 * Math.random()); else { const u = Math.random(); k = u < 0.25 ? 5 : Math.min(4, Math.floor((u - 0.25) / 0.15)); } obs[k]++; } draw(); }
  function draw() {
    const th = TH(), N = obs.reduce((a, b) => a + b, 0), E = N / 6; clr(x);
    let chi = 0; obs.forEach(o => (chi += (o - E) ** 2 / E)); const p = 1 - gammaP(2.5, chi / 2);
    const ym = Math.max(...obs, E) * 1.2;
    const A = cax(x, 50, 90, 330, 230, { x0: 0.4, x1: 6.6, y0: 0, y1: ym, yt: [], xt: [1, 2, 3, 4, 5, 6], xl: L('øjne', 'pips') });
    ctext(x, L('Observeret (blå) og forventet (guld)', 'Observed (blue) and expected (gold)'), 50, 80, th.tm, 'left', '12px system-ui');
    obs.forEach((o, i) => { const k = i + 1; x.fillStyle = th.fi; x.strokeStyle = th.ice; x.fillRect(A.X(k) - 18, A.Y(o), 36, A.Y(0) - A.Y(o)); x.strokeRect(A.X(k) - 18, A.Y(o), 36, A.Y(0) - A.Y(o)); ctext(x, String(o), A.X(k), A.Y(o) - 5, th.t, 'center', '11.5px system-ui'); });
    x.strokeStyle = th.gold; x.lineWidth = 2; x.setLineDash([6, 4]); x.beginPath(); x.moveTo(A.X(0.5), A.Y(E)); x.lineTo(A.X(6.5), A.Y(E)); x.stroke(); x.setLineDash([]); x.lineWidth = 1;
    const xm = Math.max(20, chi * 1.15);
    const B = cax(x, 450, 30, 420, 290, { x0: 0, x1: xm, y0: 0, y1: 0.17, yt: [0, 0.05, 0.1, 0.15], xt: [0, 5, 10, 15, 20, 30, 40, 60, 80, 100, 150, 200].filter(v => v <= xm), yf: v => fmt(v, 2), xl: 'χ²' });
    ctext(x, L('χ²-fordelingen med 5 frihedsgrader', 'χ² distribution with 5 degrees of freedom'), 450, 20, th.tm, 'left', '12px system-ui');
    x.fillStyle = th.fr; x.beginPath(); x.moveTo(B.X(Math.min(chi, xm)), B.Y(0)); for (let i = 0; i <= 120; i++) { const t = chi + (xm - chi) * i / 120; x.lineTo(B.X(t), B.Y(chipdf(t, 5))); } x.lineTo(B.X(xm), B.Y(0)); x.fill();
    ccurve(x, t => chipdf(t, 5), 0.01, xm, B.X, B.Y, th.gold, 2.2);
    x.strokeStyle = th.grn; x.setLineDash([4, 4]); x.beginPath(); x.moveTo(B.X(11.07), B.Y(0)); x.lineTo(B.X(11.07), B.Y(0.15)); x.stroke(); x.setLineDash([]);
    ctext(x, L('5 %-grænse 11,07', '5 % limit 11.07'), B.X(11.07) + 4, B.Y(0.15), th.grn, 'left', '11.5px system-ui');
    x.strokeStyle = th.red; x.lineWidth = 2.5; x.beginPath(); x.moveTo(B.X(chi), B.Y(0)); x.lineTo(B.X(chi), B.Y(0.12)); x.stroke(); x.lineWidth = 1;
    ctext(x, 'χ² = ' + fmt(chi, 2), B.X(chi) + 4, B.Y(0.125) - 4, th.red, 'left', '12px system-ui');
    const rej = p < 0.05;
    info.innerHTML = L(`${N} kast · χ² = Σ(O − E)²/E = <b>${fmt(chi, 2)}</b> · p = <b>${pfmt(p)}</b><br>${rej ? '<span class="warn">p &lt; 0,05: hypotesen om en fair terning forkastes</span>' : '<span class="msg">p ≥ 0,05: data er forenelige med en fair terning</span>'}`,
      `${N} throws · χ² = Σ(O − E)²/E = <b>${fmt(chi, 2)}</b> · p = <b>${pfmt(p)}</b><br>${rej ? '<span class="warn">p &lt; 0.05: the hypothesis of a fair die is rejected</span>' : '<span class="msg">p ≥ 0.05: the data are consistent with a fair die</span>'}`);
  }
  nS.oninput = roll; document.getElementById('chiroll').onclick = roll;
  chips('#chisel button', b => { fair = b.dataset.f === '1'; roll(); });
  roll(); REDRAW.push(draw);
})();

// ===== 11. 3D: den todimensionale normalfordeling =====
(function () {
  if (typeof scene3d !== 'function' || !document.getElementById('bvn3d')) return;
  const S = scene3d('bvn3d', { cam: [3.6, 5.2, 4.4], target: [0, 0.3, 0] });
  const info = document.getElementById('bvn3dinfo'), rS = document.getElementById('bvnr');
  const n = 70, R = 3, sc = 1.2, geo = new THREE.PlaneGeometry(2 * R, 2 * R, n, n); geo.rotateX(-Math.PI / 2);
  const col = new Float32Array(geo.attributes.position.count * 3); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.72, depthWrite: false })); S.scene.add(mesh);
  const wire = new THREE.LineSegments(new THREE.WireframeGeometry(geo), new THREE.LineBasicMaterial({ color: 0x4a5878, transparent: true, opacity: 0.25 })); S.scene.add(wire);
  const grid = new THREE.GridHelper(2 * R, 12, 0x33405e, 0x1c2438); S.scene.add(grid);
  const ax = axes3(R + 0.2, ['x', '', 'y']); S.scene.add(ax);
  const pg = new THREE.BufferGeometry(), NP = 500, pp = new Float32Array(3 * NP); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  S.scene.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xf08a7a, size: 0.08 })));
  const ell = new THREE.Group(); S.scene.add(ell);
  const c = new THREE.Color();
  function build() {
    const r = +rS.value; setv('bvnrv', fmt(r, 2)); const P = geo.attributes.position, k = 1 / (2 * Math.PI * Math.sqrt(1 - r * r)), pk = k;
    for (let i = 0; i < P.count; i++) { const X = P.getX(i), Z = P.getZ(i), q = (X * X - 2 * r * X * Z + Z * Z) / (1 - r * r), f = k * Math.exp(-q / 2);
      P.setY(i, 1.5 * f / pk); c.setHSL(0.62 - 0.55 * Math.min(1, f / pk), 0.6, 0.18 + 0.32 * f / pk); col[3 * i] = c.r; col[3 * i + 1] = c.g; col[3 * i + 2] = c.b; }
    P.needsUpdate = true; geo.attributes.color.needsUpdate = true; geo.computeVertexNormals();
    wire.geometry.dispose(); wire.geometry = new THREE.WireframeGeometry(geo);
    for (let i = 0; i < NP; i++) { const u = randn(), v = randn(); pp[3 * i] = u; pp[3 * i + 2] = r * u + Math.sqrt(1 - r * r) * v; pp[3 * i + 1] = 0.01; }
    pg.attributes.position.needsUpdate = true;
    clear3(ell); [1, 2].forEach(s => { const pts = []; for (let j = 0; j <= 96; j++) { const a = 2 * Math.PI * j / 96, u = Math.cos(a), v = Math.sin(a);
      const X = s * (Math.sqrt((1 + r) / 2) * u - Math.sqrt((1 - r) / 2) * v), Z = s * (Math.sqrt((1 + r) / 2) * u + Math.sqrt((1 - r) / 2) * v); pts.push([X, 0.02, Z]); } ell.add(line3(pts, 0xd8b46a, 0.9)); });
    info.innerHTML = T3(`Korrelationskoefficient <b>ρ = ${F3(r, 2)}</b> · σ<sub>x</sub> = σ<sub>y</sub> = 1<br>Guld: 1σ- og 2σ-ellipser · røde punkter: 500 trækninger`, `Correlation coefficient <b>ρ = ${F3(r, 2)}</b> · σ<sub>x</sub> = σ<sub>y</sub> = 1<br>Gold: 1σ and 2σ ellipses · red points: 500 draws`);
  }
  rS.oninput = build; build();
})();
