// le-chatelier.js – simulationer til le-chatelier.html og le-chatelier-en.html
// Tekster kommer fra objektet L, som defineres på siden.
'use strict';
const R = 8.314;
const fmt = (v, d = 2) => (isFinite(v) ? v.toFixed(d) : '–').replace('.', L.dec);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function bisect(f, lo, hi, n = 80) {
  let flo = f(lo);
  for (let k = 0; k < n; k++) {
    const m = (lo + hi) / 2, fm = f(m);
    if ((fm < 0) === (flo < 0)) { lo = m; flo = fm; } else hi = m;
  }
  return (lo + hi) / 2;
}

function setupCanvas(cv) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const r = cv.getBoundingClientRect();
  const w = Math.max(10, r.width), h = Math.max(10, r.height);
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  }
  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { c, w, h };
}

const sims = [];
function visible(el) {
  const r = el.getBoundingClientRect();
  return r.bottom > -50 && r.top < innerHeight + 50;
}
let last = performance.now();
function loop(t) {
  const dt = Math.min(0.05, (t - last) / 1000); last = t;
  for (const s of sims) if (visible(s.cv)) s.frame(dt);
  requestAnimationFrame(loop);
}

// --- fælles tegnehjælp ---
function axes(c, x0, y0, w, h, opt) {
  c.strokeStyle = '#33405e'; c.lineWidth = 1;
  c.strokeRect(x0, y0, w, h);
  c.fillStyle = '#9ba4b6'; c.font = '11px system-ui,sans-serif';
  if (opt.xlab) { c.textAlign = 'center'; c.fillText(opt.xlab, x0 + w / 2, y0 + h + 28); }
  if (opt.ylab) { c.save(); c.translate(x0 - 34, y0 + h / 2); c.rotate(-Math.PI / 2); c.textAlign = 'center'; c.fillText(opt.ylab, 0, 0); c.restore(); }
  c.textAlign = 'left';
}

// ===================================================================
// 1. H2 + I2 <=> 2HI
// ===================================================================
(function () {
  const cv = document.getElementById('cv1'); if (!cv) return;
  const hud = document.getElementById('hud1');
  const K = 50, S = 48; // molekyler pr. mol/L
  let base, x, xeq, ref, lastMsg;
  const mols = [];
  function conc() { return [base[0] - x, base[1] - x, base[2] + 2 * x]; }
  function solve() {
    const [h, i, hi] = base;
    const f = x => (hi + 2 * x) ** 2 - K * (h - x) * (i - x);
    return bisect(f, -hi / 2 + 1e-12, Math.min(h, i) - 1e-12);
  }
  function reset() {
    base = [0.1, 0.1, Math.sqrt(K) * 0.1]; x = 0; xeq = 0; ref = conc(); mols.length = 0; lastMsg = null;
  }
  function disturb(d) {
    const c = conc();
    ref = c.slice();
    base = [c[0] + d[0], c[1] + d[1], c[2] + d[2]];
    x = 0; xeq = solve(); lastMsg = d;
  }
  reset();
  document.getElementById('b1h2').onclick = () => disturb([0.1, 0, 0]);
  document.getElementById('b1i2').onclick = () => disturb([0, 0.1, 0]);
  document.getElementById('b1hi').onclick = () => disturb([0, 0, 0.2]);
  document.getElementById('b1rm').onclick = () => { const c = conc(); disturb([0, 0, -c[2] / 2]); };
  document.getElementById('b1reset').onclick = reset;

  function spawn(type, W, H) {
    mols.push({ t: type, x: Math.random() * W, y: Math.random() * H, a: Math.random() * 6.28,
      vx: (Math.random() - .5) * 60, vy: (Math.random() - .5) * 60, va: (Math.random() - .5) * 4, flash: 0 });
  }
  function reconcile(W, H) {
    const c = conc(), tgt = c.map(v => Math.max(0, Math.round(v * S)));
    const cnt = () => [0, 1, 2].map(k => mols.filter(m => m.t === k).length);
    let n = cnt();
    // reaktion: H2 + I2 -> 2HI  (ét H2 og ét I2 bliver til to HI)
    while (n[2] + 2 <= tgt[2] + 1 && n[0] > tgt[0] && n[1] > tgt[1]) {
      const a = mols.find(m => m.t === 0), b = mols.find(m => m.t === 1);
      a.t = 2; b.t = 2; a.flash = b.flash = 1; n = cnt();
    }
    while (n[2] - 2 >= tgt[2] - 1 && n[0] < tgt[0] && n[1] < tgt[1]) {
      const hs = mols.filter(m => m.t === 2); hs[0].t = 0; hs[1].t = 1; hs[0].flash = hs[1].flash = 1; n = cnt();
    }
    for (let k = 0; k < 3; k++) {
      while (n[k] < tgt[k]) { spawn(k, W, H); n[k]++; }
      while (n[k] > tgt[k]) { const idx = mols.findIndex(m => m.t === k); mols.splice(idx, 1); n[k]--; }
    }
  }
  const col = ['#f4f6fb', '#b07cf0'];
  function drawMol(c, m) {
    const rH = 3.4, rI = 6.2;
    const atoms = m.t === 0 ? [[0, rH], [0, rH]] : m.t === 1 ? [[1, rI], [1, rI]] : [[1, rI], [0, rH]];
    const d = (atoms[0][1] + atoms[1][1]) * 0.75;
    const ca = Math.cos(m.a), sa = Math.sin(m.a);
    const p = [[m.x - ca * d / 2, m.y - sa * d / 2], [m.x + ca * d / 2, m.y + sa * d / 2]];
    if (m.flash > 0) { c.fillStyle = `rgba(242,213,144,${m.flash * .5})`; c.beginPath(); c.arc(m.x, m.y, 13, 0, 7); c.fill(); }
    atoms.forEach(([el, r], j) => { c.fillStyle = col[el]; c.beginPath(); c.arc(p[j][0], p[j][1], r, 0, 7); c.fill(); });
  }

  sims.push({ cv, frame(dt) {
    const { c, w, h } = setupCanvas(cv);
    const narrow = w < 640;
    const bx = 10, by = narrow ? 100 : 88, bw = narrow ? w - 20 : w * 0.5 - 20, bh = narrow ? h * 0.42 : h - by - 14;
    x += (xeq - x) * (1 - Math.exp(-dt / 0.9));
    reconcile(bw, bh);
    c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    // kasse med molekyler
    c.fillStyle = '#0b1018'; c.fillRect(bx, by, bw, bh); c.strokeStyle = '#33405e'; c.strokeRect(bx, by, bw, bh);
    c.save(); c.beginPath(); c.rect(bx, by, bw, bh); c.clip(); c.translate(bx, by);
    for (const m of mols) {
      m.x += m.vx * dt; m.y += m.vy * dt; m.a += m.va * dt; m.flash = Math.max(0, m.flash - dt * 1.2);
      if (m.x < 8 || m.x > bw - 8) m.vx = -m.vx; if (m.y < 8 || m.y > bh - 8) m.vy = -m.vy;
      m.x = clamp(m.x, 8, bw - 8); m.y = clamp(m.y, 8, bh - 8);
      drawMol(c, m);
    }
    c.restore();
    // søjler
    const cc = conc();
    const gx = narrow ? 50 : w * 0.5 + 40, gy = narrow ? by + bh + 24 : 80, gw = narrow ? w - 70 : w * 0.5 - 70, gh = narrow ? h - gy - 76 : h - 190;
    const vmax = Math.max(1, ...cc, ...ref) * 1.1;
    axes(c, gx, gy, gw, gh, { ylab: L.conc });
    const names = [L.h2, L.i2, L.hi], colors = ['#e7e9ef', '#b07cf0', '#d8b46a'];
    const slot = gw / 3;
    for (let k = 0; k < 3; k++) {
      const X = gx + slot * k + slot * 0.2, BW = slot * 0.6;
      const hh = cc[k] / vmax * gh, rh = ref[k] / vmax * gh;
      c.fillStyle = colors[k]; c.globalAlpha = .85; c.fillRect(X, gy + gh - hh, BW, hh); c.globalAlpha = 1;
      c.strokeStyle = '#f08a7a'; c.setLineDash([4, 3]); c.beginPath(); c.moveTo(X - 4, gy + gh - rh); c.lineTo(X + BW + 4, gy + gh - rh); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#e7e9ef'; c.font = '12px system-ui,sans-serif'; c.textAlign = 'center';
      c.fillText(names[k], X + BW / 2, gy + gh + 14);
      c.fillStyle = '#f2d590'; c.fillText(fmt(cc[k], 3), X + BW / 2, gy + gh - hh - 5);
      c.textAlign = 'left';
    }
    c.fillStyle = '#f08a7a'; c.font = '11px system-ui,sans-serif'; c.fillText('- - ' + L.before, gx + gw - 60, gy - 6);
    // Q/K-skala (log)
    const Q = cc[2] ** 2 / (cc[0] * cc[1]), r = Q / K;
    const sx = gx, sy = h - 30, sw = gw;
    c.strokeStyle = '#33405e'; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + sw, sy); c.stroke();
    [0.25, 0.5, 1, 2, 4].forEach(v => { const X = sx + sw * (Math.log(v) / Math.log(16) + .5); c.beginPath(); c.moveTo(X, sy - 4); c.lineTo(X, sy + 4); c.stroke();
      c.fillStyle = v === 1 ? '#7fd1b9' : '#9ba4b6'; c.textAlign = 'center'; c.fillText(String(v).replace('.', L.dec), X, sy + 16); });
    c.textAlign = 'left'; c.fillStyle = '#9ba4b6'; c.fillText(L.qk, sx - 34, sy + 4);
    const PX = sx + sw * clamp(Math.log(r) / Math.log(16) + .5, 0, 1);
    c.fillStyle = Math.abs(Math.log(r)) < 0.01 ? '#7fd1b9' : '#f2d590';
    c.beginPath(); c.moveTo(PX, sy - 3); c.lineTo(PX - 6, sy - 13); c.lineTo(PX + 6, sy - 13); c.fill();
    const msg = Math.abs(Math.log(r)) < 0.01 ? L.eq : r < 1 ? L.toRight : L.toLeft;
    let extra = '';
    if (lastMsg) {
      const k = lastMsg.findIndex(v => v !== 0), add = lastMsg[k];
      if (add > 0 && k < 2) extra = `<br>${L.added} ${fmt(add, 3)} M ${names[k]}, ${L.consumed} ${fmt(x, 3)} M (${fmt(100 * x / add, 0)} %)`;
    }
    hud.innerHTML = `Q = <b>${fmt(Q, 1)}</b> · K = 50<br><span style="color:${Math.abs(Math.log(r)) < 0.01 ? '#7fd1b9' : '#f2d590'}">${msg}</span>${extra}`;
  } });
})();

// ===================================================================
// 2. N2O4 <=> 2NO2 i en sprøjte
// ===================================================================
const Kp2 = T => 0.15 * Math.exp(-57200 / R * (1 / T - 1 / 298.15));
const aEq2 = (T, P) => { const k = Kp2(T); return Math.sqrt(k / (k + 4 * P)); };
(function () {
  const cv = document.getElementById('cv2'); if (!cv) return;
  const hud = document.getElementById('hud2');
  const sP = document.getElementById('s2P'), sT = document.getElementById('s2T');
  const Pmin = 0.25, Pmax = 8;
  const uToP = u => Pmin * (Pmax / Pmin) ** u, PtoU = P => Math.log(P / Pmin) / Math.log(Pmax / Pmin);
  let P = 1, T = 298.15, a = aEq2(T, P);
  sP.value = PtoU(1);
  function setP(p) { P = clamp(p, Pmin, Pmax); sP.value = PtoU(P); }
  function setT(t) { T = t; sT.value = Math.round(t); }
  sP.oninput = () => { P = uToP(+sP.value); };
  sT.oninput = () => { T = +sT.value; };
  document.getElementById('b2squeeze').onclick = () => setP(P * 4);
  document.getElementById('b2pull').onclick = () => setP(P / 4);
  document.getElementById('b2hot').onclick = () => setT(353.15);
  document.getElementById('b2cold').onclick = () => setT(273.15);
  let Tgas = T;
  const Vof = (al, t, p) => (1 + al) * t / p;
  const Vmin = Vof(0.02, 260, Pmax), Vmax = Vof(1, 380, Pmin);
  sims.push({ cv, frame(dt) {
    const { c, w, h } = setupCanvas(cv);
    document.getElementById('v2P').textContent = fmt(P, 2) + ' bar';
    document.getElementById('v2T').textContent = fmt(T - 273.15, 0) + ' °C';
    Tgas += (T - Tgas) * (1 - Math.exp(-dt / 0.6));
    const ae = aEq2(Tgas, P);
    a += (ae - a) * (1 - Math.exp(-dt / 1.6));
    const xN = 2 * a / (1 + a), cN = xN * P * 1e5 / (R * Tgas); // mol/m3 = mM
    const op = 1 - Math.exp(-cN / 18);
    c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    const narrow = w < 640;
    // sprøjte
    const sx = 20, sy = narrow ? 112 : h * 0.42, sw = narrow ? w - 40 : w * 0.52, sh = narrow ? 70 : 90;
    c.fillStyle = '#f3efe6'; c.fillRect(sx - 10, sy - 16, sw + 20, sh + 32); // hvidt papir bagved
    const V = Vof(a, Tgas, P);
    const frac = 0.12 + 0.82 * (Math.log(V) - Math.log(Vmin)) / (Math.log(Vmax) - Math.log(Vmin));
    const gl = sw * 0.86 * clamp(frac, 0.05, 1);
    const nozzle = 26;
    c.fillStyle = `rgba(150,62,20,${op})`; c.fillRect(sx + nozzle, sy, gl, sh);
    c.strokeStyle = '#555'; c.lineWidth = 2; c.strokeRect(sx + nozzle, sy, sw * 0.86 + 20, sh);
    c.fillStyle = '#777'; c.fillRect(sx, sy + sh / 2 - 5, nozzle, 10);
    c.fillStyle = '#666'; c.fillRect(sx + nozzle + gl, sy + 3, 10, sh - 6);
    c.fillRect(sx + nozzle + gl + 10, sy + sh / 2 - 4, sw - gl, 8);
    c.fillRect(sx + nozzle + sw * 0.86 + 20 + 6, sy + sh / 2 - 22, 8, 44);
    c.lineWidth = 1;
    // graf α(P)
    const gx = narrow ? 52 : w * 0.62 + 30, gy = narrow ? sy + sh + 46 : 60, gw = narrow ? w - 72 : w * 0.38 - 50, gh = narrow ? h - gy - 50 : h - 120;
    axes(c, gx, gy, gw, gh, { xlab: L.pAx + ' (log)', ylab: L.alphaAx });
    const X = p => gx + gw * PtoU(p), Y = al => gy + gh * (1 - al);
    c.strokeStyle = '#d8b46a'; c.lineWidth = 2; c.beginPath();
    for (let k = 0; k <= 80; k++) { const p = uToP(k / 80); const yy = Y(aEq2(T, p)); k ? c.lineTo(X(p), yy) : c.moveTo(X(p), yy); }
    c.stroke(); c.lineWidth = 1;
    c.fillStyle = '#9ba4b6'; c.font = '11px system-ui,sans-serif'; c.textAlign = 'center';
    [0.25, 1, 4, 8].forEach(p => c.fillText(String(p).replace('.', L.dec), X(p), gy + gh + 13));
    c.textAlign = 'right'; [0, 0.5, 1].forEach(v => c.fillText(String(v).replace('.', L.dec), gx - 4, Y(v) + 4)); c.textAlign = 'left';
    c.fillStyle = '#f08a7a'; c.beginPath(); c.arc(X(P), Y(a), 5, 0, 7); c.fill();
    const settled = Math.abs(a - ae) < 0.002 && Math.abs(Tgas - T) < 0.5;
    hud.innerHTML = L.p2(fmt(P, 2), fmt(Tgas - 273.15, 0), fmt(a, 3), fmt(xN, 3), fmt(Kp2(Tgas), 3), fmt(cN, 1)) +
      `<div class="${settled ? 'msg' : 'warn'}">${settled ? L.settled : L.relax}</div>`;
  } });
})();

// ===================================================================
// 3. Haber-Bosch: x(NH3) ved ligevægt, fødegas N2:H2 = 1:3
// ===================================================================
const Kh = T => 1.45e-5 * Math.exp(92000 / R * (1 / T - 1 / 723.15)); // bar^-2
function habEq(n1, n2, n3, P, T) {
  const lnKP2 = Math.log(Kh(T) * P * P), n = n1 + n2 + n3;
  const g = xi => 2 * Math.log(n3 + 2 * xi) + 2 * Math.log(n - 2 * xi) - Math.log(n1 - xi) - 3 * Math.log(n2 - 3 * xi) - lnKP2;
  const lo = -n3 / 2 + 1e-12, hi = Math.min(n1, n2 / 3) - 1e-12;
  const xi = bisect(g, lo, hi);
  return [n1 - xi, n2 - 3 * xi, n3 + 2 * xi];
}
(function () {
  const cv = document.getElementById('cv3'); if (!cv) return;
  const hud = document.getElementById('hud3');
  const sT = document.getElementById('s3T'), sP = document.getElementById('s3P');
  const uToP = u => 10 ** (3 * u);
  let dirty = true; sT.oninput = sP.oninput = () => dirty = true;
  addEventListener('resize', () => dirty = true);
  const xNH3 = (P, T) => { const s = habEq(1, 3, 0, P, T); return s[2] / (s[0] + s[1] + s[2]); };
  const curves = [300, 400, 500, 600];
  sims.push({ cv, frame() {
    if (!dirty) return; dirty = false;
    const { c, w, h } = setupCanvas(cv);
    const Tc = +sT.value, T = Tc + 273.15, P = uToP(+sP.value);
    document.getElementById('v3T').textContent = Tc + ' °C';
    document.getElementById('v3P').textContent = fmt(P, 0) + ' bar';
    c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    const gx = 56, gy = w < 640 ? 96 : 30, gw = w - 80, gh = h - gy - 50;
    axes(c, gx, gy, gw, gh, { xlab: L.pAx + ' (log)', ylab: L.yAx });
    const X = p => gx + gw * Math.log10(p) / 3, Y = v => gy + gh * (1 - v / 0.8);
    // industrielt vindue
    c.fillStyle = 'rgba(127,209,185,.10)'; c.fillRect(X(150), gy, X(300) - X(150), gh);
    c.fillStyle = '#9ba4b6'; c.font = '11px system-ui,sans-serif'; c.textAlign = 'center';
    [1, 10, 100, 1000].forEach(p => c.fillText(p, X(p), gy + gh + 13));
    c.textAlign = 'right'; [0, 20, 40, 60, 80].forEach(v => c.fillText(v, gx - 4, Y(v / 100) + 4)); c.textAlign = 'left';
    const draw = (Tcel, color, lw) => {
      c.strokeStyle = color; c.lineWidth = lw; c.beginPath();
      for (let k = 0; k <= 90; k++) { const p = 10 ** (3 * k / 90); const yy = Y(xNH3(p, Tcel + 273.15)); k ? c.lineTo(X(p), yy) : c.moveTo(X(p), yy); }
      c.stroke(); c.lineWidth = 1;
      const p = 1000; c.fillStyle = color; c.fillText(L.tLbl(Tcel), X(p) - 50, Y(xNH3(p, Tcel + 273.15)) - 6);
    };
    curves.forEach(t => draw(t, '#4a5878', 1.2));
    draw(Tc, '#d8b46a', 2.4);
    const xv = xNH3(P, T);
    c.fillStyle = '#f08a7a'; c.beginPath(); c.arc(X(P), Y(xv), 6, 0, 7); c.fill();
    hud.innerHTML = L.p3(Tc, fmt(P, 0), fmt(100 * xv, 1));
  } });
})();

// ===================================================================
// 4. Undtagelsen: tilsæt N2 ved konstant P og T
// ===================================================================
(function () {
  const cv = document.getElementById('cv4'); if (!cv) return;
  const hud = document.getElementById('hud4');
  const sr = document.getElementById('s4r');
  const P = 300, T = 723.15;
  const uToR = u => 9 ** (2 * u - 1);
  sr.value = 0.25;
  const ratioTxt = r => r >= 1 ? `${fmt(r, r < 10 ? 1 : 0)} : 1` : `1 : ${fmt(1 / r, 1 / r < 10 ? 1 : 0)}`;
  function eqFromFeed(r) { return habEq(4 * r / (1 + r), 4 / (1 + r), 0, P, T); }
  // kurve: dn(NH3)/dn(N2) mod x(N2)
  const curve = [];
  for (let k = 0; k <= 120; k++) {
    const s = eqFromFeed(uToR(k / 120)), n = s[0] + s[1] + s[2], d = 0.002 * n;
    const s2 = habEq(s[0] + d, s[1], s[2], P, T);
    curve.push([s[0] / n, (s2[2] - s[2]) / d]);
  }
  let before, after, shown, t = 0, dirty = true;
  function fresh() { before = eqFromFeed(uToR(+sr.value)); after = null; shown = before.slice(); t = 0; dirty = true; }
  sr.oninput = fresh;
  document.getElementById('b4reset').onclick = fresh;
  document.getElementById('b4add').onclick = () => {
    const base = after || before; before = base;
    const n = base[0] + base[1] + base[2];
    after = habEq(base[0] + 0.1 * n, base[1], base[2], P, T); t = 0;
  };
  addEventListener('resize', () => dirty = true);
  fresh();
  sims.push({ cv, frame(dt) {
    if (after && t < 1) { t = Math.min(1, t + dt / 1.4); dirty = true; }
    if (!dirty) return; dirty = t < 1 && !!after;
    const { c, w, h } = setupCanvas(cv);
    const r = uToR(+sr.value);
    document.getElementById('v4r').textContent = ratioTxt(r);
    if (after) shown = before.map((v, k) => v + (after[k] - v) * (1 - (1 - t) ** 3));
    c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    const narrow = w < 640;
    // søjler
    const gx = 50, gy = narrow ? 140 : 150, gw = narrow ? w - 70 : w * 0.45 - 60, gh = narrow ? h * 0.30 : h - gy - 40;
    axes(c, gx, gy, gw, gh, { ylab: L.mol });
    const vmax = Math.max(4.4, ...(after || before)) * 1.05;
    const names = ['N₂', 'H₂', 'NH₃'], colors = ['#9fd0ff', '#e7e9ef', '#7fd1b9'];
    const slot = gw / 3;
    for (let k = 0; k < 3; k++) {
      const X = gx + slot * k + slot * .2, BW = slot * .6, hh = shown[k] / vmax * gh, rh = before[k] / vmax * gh;
      c.fillStyle = colors[k]; c.globalAlpha = .85; c.fillRect(X, gy + gh - hh, BW, hh); c.globalAlpha = 1;
      if (after) { c.strokeStyle = '#f08a7a'; c.setLineDash([4, 3]); c.beginPath(); c.moveTo(X - 4, gy + gh - rh); c.lineTo(X + BW + 4, gy + gh - rh); c.stroke(); c.setLineDash([]); }
      c.fillStyle = '#e7e9ef'; c.font = '12px system-ui,sans-serif'; c.textAlign = 'center';
      c.fillText(names[k], X + BW / 2, gy + gh + 14);
      c.fillStyle = '#f2d590'; c.fillText(fmt(shown[k], 3), X + BW / 2, gy + gh - hh - 5); c.textAlign = 'left';
    }
    // diagram dn(NH3)/dn(N2) mod x(N2)
    const px = narrow ? 56 : w * 0.5 + 40, py = narrow ? gy + gh + 40 : 96, pw = narrow ? w - 76 : w * 0.5 - 60, ph = narrow ? h - py - 40 : h - py - 40;
    axes(c, px, py, pw, ph, { xlab: 'x(N₂)', ylab: 'Δn(NH₃)/Δn(N₂)' });
    const ys = curve.map(p => p[1]), y0 = Math.min(...ys), ymin = 1.8 * y0, ymax = -5 * y0;
    const Xp = v => px + pw * v, Yp = v => py + ph * (1 - (v - ymin) / (ymax - ymin));
    c.strokeStyle = '#33405e'; c.beginPath(); c.moveTo(px, Yp(0)); c.lineTo(px + pw, Yp(0)); c.stroke();
    c.strokeStyle = '#f08a7a'; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(Xp(0.5), py); c.lineTo(Xp(0.5), py + ph); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#f08a7a'; c.font = '11px system-ui,sans-serif'; c.fillText(L.boundary, Xp(0.5) + 4, py + 12);
    c.fillStyle = '#9ba4b6'; c.textAlign = 'center'; [0, 0.25, 0.5, 0.75, 1].forEach(v => c.fillText(String(v).replace('.', L.dec), Xp(v), py + ph + 13)); c.textAlign = 'left';
    c.fillText('0', px - 12, Yp(0) + 4);
    c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
    c.fillStyle = 'rgba(240,138,122,.10)'; c.fillRect(px, Yp(0), pw, py + ph - Yp(0));
    c.strokeStyle = '#d8b46a'; c.lineWidth = 2; c.beginPath();
    curve.forEach(([xx, yy], k) => k ? c.lineTo(Xp(xx), Yp(yy)) : c.moveTo(Xp(xx), Yp(yy))); c.stroke(); c.lineWidth = 1;
    c.restore();
    const cur = after ? before : shown, n = cur[0] + cur[1] + cur[2], xn = cur[0] / n;
    const d = 0.002 * n, s2 = habEq(cur[0] + d, cur[1], cur[2], P, T), slope = (s2[2] - cur[2]) / d;
    c.fillStyle = '#f2d590'; c.beginPath(); c.arc(Xp(xn), clamp(Yp(slope), py, py + ph), 5, 0, 7); c.fill();
    c.fillStyle = '#7fd1b9'; c.fillText(L.more, px + 6, py + 14); c.fillStyle = '#f08a7a'; c.fillText(L.less, px + pw - 6 - c.measureText(L.less).width, py + ph - 8);
    const dn = after ? after[2] - before[2] : null;
    hud.innerHTML = L.p4(ratioTxt(r), fmt(xn, 3), dn === null ? null : (dn >= 0 ? '+' : '') + fmt(dn, 4), dn !== null && dn >= 0) +
      `<br><span style="color:#9ba4b6">P = 300 bar · T = 450 °C</span>`;
  } });
})();

requestAnimationFrame(loop);
