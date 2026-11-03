// mathelp.js – fælles hjælpefunktioner (tema, matematik, lærred) til matematiksiderne. Kræver fysikfag.js.
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

