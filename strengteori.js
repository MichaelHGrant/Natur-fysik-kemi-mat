// strengteori.js – simulationer til strengteori.html og strengteori-en.html
// Tekster kommer fra objektet L, som defineres på siden.
'use strict';
const fmt = (v, d = 2) => (isFinite(v) ? v.toFixed(d) : '–').replace('.', L.dec);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

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
const visible = el => { const r = el.getBoundingClientRect(); return r.bottom > -50 && r.top < innerHeight + 50; };
let last = performance.now();
function loop(t) {
  const dt = Math.min(0.05, (t - last) / 1000); last = t;
  for (const s of sims) if (visible(s.cv)) s.frame(dt);
  requestAnimationFrame(loop);
}
function axes(c, x0, y0, w, h, xlab, ylab) {
  c.strokeStyle = '#33405e'; c.lineWidth = 1; c.strokeRect(x0, y0, w, h);
  c.fillStyle = '#9ba4b6'; c.font = '11px system-ui,sans-serif'; c.textAlign = 'center';
  if (xlab) c.fillText(xlab, x0 + w / 2, y0 + h + 28);
  if (ylab) { c.save(); c.translate(x0 - 32, y0 + h / 2); c.rotate(-Math.PI / 2); c.fillText(ylab, 0, 0); c.restore(); }
  c.textAlign = 'left';
}

// ===================================================================
// 1. Svingende streng i 3D (åben mellem D-braner / lukket løkke)
// ===================================================================
(function () {
  const cv = document.getElementById('cv1'); if (!cv) return;
  const hud = document.getElementById('hud1');
  const sn = document.getElementById('s1n'), snt = document.getElementById('s1nt');
  const bO = document.getElementById('b1open'), bC = document.getElementById('b1closed');
  const rowNt = document.getElementById('rowNt');
  let closed = false, t = 0, yaw = 0.6, pitch = 0.95, drag = null;
  function setMode(c) { closed = c; bO.classList.toggle('on', !c); bC.classList.toggle('on', c); rowNt.style.display = c ? '' : 'none'; }
  bO.onclick = () => setMode(false); bC.onclick = () => setMode(true); setMode(false);
  cv.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY, yaw, pitch]; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (!drag) return; yaw = drag[2] + (e.clientX - drag[0]) * 0.01; pitch = clamp(drag[3] + (e.clientY - drag[1]) * 0.01, -1.3, 1.3); });
  cv.addEventListener('pointerup', () => drag = null);
  function proj(p, w, h) {
    let [x, y, z] = p;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    [x, z] = [cy * x + sy * z, -sy * x + cy * z];
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    [y, z] = [cp * y - sp * z, sp * y + cp * z];
    const f = 3.2 / (3.2 + z), s = Math.min(w, h) * 0.33;
    return [w / 2 + x * s * f, h / 2 + 20 - y * s * f, z];
  }
  sims.push({ cv, frame(dt) {
    const { c, w, h } = setupCanvas(cv);
    t += dt * 1.2;
    if (!drag) yaw += dt * 0.15;
    const n = +sn.value, nt = +snt.value;
    document.getElementById('v1n').textContent = n;
    document.getElementById('v1nt').textContent = nt;
    c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    const pts = [];
    if (!closed) {
      // D-braner ved x = ±1.2
      for (const X of [-1.2, 1.2]) {
        const q = [[X, -0.8, -0.8], [X, -0.8, 0.8], [X, 0.8, 0.8], [X, 0.8, -0.8]].map(p => proj(p, w, h));
        c.fillStyle = 'rgba(159,208,255,.10)'; c.strokeStyle = 'rgba(159,208,255,.45)';
        c.beginPath(); q.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill(); c.stroke();
        const lp = proj([X, 0.95, 0], w, h); c.fillStyle = '#9fd0ff'; c.font = '12px system-ui,sans-serif'; c.textAlign = 'center'; c.fillText(L.brane, lp[0], lp[1]); c.textAlign = 'left';
      }
      const A = 0.5 / Math.sqrt(n);
      for (let k = 0; k <= 200; k++) {
        const s = Math.PI * k / 200;
        // åben streng med Neumann-ender langs x, fastholdt i y,z (Dirichlet på branerne)
        pts.push([-1.2 + 2.4 * k / 200, A * Math.sin(n * s) * Math.cos(n * t), 0.6 * A * Math.sin(n * s) * Math.sin(n * t)]);
      }
    } else {
      const a = 0.42 / Math.sqrt(n), b = 0.42 / Math.sqrt(nt);
      for (let k = 0; k <= 240; k++) {
        const s = 2 * Math.PI * k / 240;
        const dy = a * Math.cos(n * (s - t)) + b * Math.cos(nt * (s + t));
        const dr = 0.12 * (a * Math.sin(n * (s - t)) - b * Math.sin(nt * (s + t)));
        const r = 1 + dr;
        pts.push([r * Math.cos(s), dy, r * Math.sin(s)]);
      }
    }
    const P = pts.map(p => proj(p, w, h));
    for (let k = 1; k < P.length; k++) {
      const z = (P[k][2] + P[k - 1][2]) / 2, lum = clamp(0.55 - z * 0.25, 0.25, 0.85);
      c.strokeStyle = `hsl(42,70%,${lum * 80}%)`; c.lineWidth = 3.2 * (1 - z * 0.15);
      c.beginPath(); c.moveTo(P[k - 1][0], P[k - 1][1]); c.lineTo(P[k][0], P[k][1]); c.stroke();
    }
    if (!closed) { c.fillStyle = '#f2d590'; [P[0], P[P.length - 1]].forEach(p => { c.beginPath(); c.arc(p[0], p[1], 5, 0, 7); c.fill(); }); }
    c.fillStyle = '#7d879b'; c.font = '11px system-ui,sans-serif'; c.fillText(L.drag, w - 120, h - 8);
    if (!closed) {
      const m2 = n - 1;
      hud.innerHTML = L.open(n, m2, n === 1 ? L.photon : L.massive);
    } else {
      const ok = n === nt, m2 = 2 * (n + nt - 2);
      hud.innerHTML = L.closed(n, nt, m2, n === 1 && nt === 1 ? L.graviton : L.massive, ok);
    }
    c.lineWidth = 1;
  } });
})();

// ===================================================================
// 2. T-dualitet: lukket streng på en cirkel, α' = 1
// ===================================================================
(function () {
  const cv = document.getElementById('cv2'); if (!cv) return;
  const hud = document.getElementById('hud2');
  const sR = document.getElementById('s2R');
  // (n, w, N, Ñ) med N − Ñ = n·w
  const states = [
    [0, 0, 1, 1], [1, 0, 1, 1], [0, 1, 1, 1], [1, 1, 1, 0], [2, 0, 1, 1], [0, 2, 1, 1],
    [1, 0, 2, 2], [0, 1, 2, 2], [2, 1, 2, 0], [1, 2, 2, 0], [0, 0, 2, 2], [3, 0, 1, 1], [0, 3, 1, 1]
  ];
  const m2 = ([n, w, N, Nt], R) => n * n / (R * R) + w * w * R * R + 2 * (N + Nt - 2);
  const colOf = ([n, w]) => n && !w ? '#9fd0ff' : w && !n ? '#f08a7a' : n && w ? '#d8b46a' : '#7d879b';
  let dirty = true; sR.oninput = () => dirty = true; addEventListener('resize', () => dirty = true);
  document.getElementById('b2dual').onclick = () => { sR.value = -sR.value; dirty = true; };
  sims.push({ cv, frame() {
    if (!dirty) return; dirty = false;
    const { c, w, h } = setupCanvas(cv);
    const lg = +sR.value, R = 10 ** lg;
    document.getElementById('v2R').textContent = fmt(R, 2);
    c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    const narrow = w < 640;
    const gx = 50, gy = narrow ? 80 : 60, gw = narrow ? w - 66 : w * 0.62 - 60, gh = narrow ? h * 0.48 : h - gy - 46;
    axes(c, gx, gy, gw, gh, L.tdAx, L.m2Ax);
    const ymax = 10;
    const X = l => gx + gw * (l + 1.2) / 2.4, Y = v => gy + gh * (1 - (v + 0.5) / (ymax + 0.5));
    c.fillStyle = '#9ba4b6'; c.font = '11px system-ui,sans-serif'; c.textAlign = 'center';
    [0.1, 0.3, 1, 3, 10].forEach(v => c.fillText(String(v).replace('.', L.dec), X(Math.log10(v)), gy + gh + 13));
    c.textAlign = 'right'; [0, 2, 4, 6, 8, 10].forEach(v => c.fillText(v, gx - 4, Y(v) + 4)); c.textAlign = 'left';
    c.strokeStyle = '#33405e'; c.beginPath(); c.moveTo(gx, Y(0)); c.lineTo(gx + gw, Y(0)); c.stroke();
    c.setLineDash([3, 4]); c.strokeStyle = '#7fd1b9'; c.beginPath(); c.moveTo(X(0), gy); c.lineTo(X(0), gy + gh); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#7fd1b9'; c.fillText(L.selfdual, X(0) + 4, gy + 12);
    c.save(); c.beginPath(); c.rect(gx, gy, gw, gh); c.clip();
    for (const s of states) {
      c.strokeStyle = colOf(s); c.lineWidth = 1.8; c.beginPath();
      for (let k = 0; k <= 200; k++) { const l = -1.2 + 2.4 * k / 200; const y = Y(m2(s, 10 ** l)); k ? c.lineTo(X(l), y) : c.moveTo(X(l), y); }
      c.stroke();
    }
    c.restore(); c.lineWidth = 1;
    c.strokeStyle = '#f2d590'; c.beginPath(); c.moveTo(X(lg), gy); c.lineTo(X(lg), gy + gh); c.stroke();
    c.setLineDash([5, 4]); c.strokeStyle = 'rgba(242,213,144,.5)'; c.beginPath(); c.moveTo(X(-lg), gy); c.lineTo(X(-lg), gy + gh); c.stroke(); c.setLineDash([]);
    for (const s of states) { const v = m2(s, R); if (v <= ymax) { c.fillStyle = colOf(s); c.beginPath(); c.arc(X(lg), Y(v), 4, 0, 7); c.fill(); } }
    // tabel
    const tx = narrow ? 20 : w * 0.62 + 30, ty = narrow ? gy + gh + 48 : 60;
    const rows = states.map(s => [s, m2(s, R)]).sort((a, b) => a[1] - b[1]).slice(0, narrow ? 6 : 10);
    c.fillStyle = '#d8b46a'; c.font = '12px system-ui,sans-serif'; c.fillText(L.lowest, tx, ty);
    c.fillStyle = '#9ba4b6'; c.font = '12px ui-monospace,Menlo,monospace'; c.fillText('(n, w, N, Ñ)', tx, ty + 18);
    c.font = '12px ui-monospace,Menlo,monospace';
    rows.forEach(([s, v], i) => {
      const yy = ty + 38 + i * (narrow ? 17 : 21);
      c.fillStyle = colOf(s); c.fillText(`(${s.join(', ')})`, tx, yy);
      c.fillStyle = '#e7e9ef'; c.fillText(fmt(v, 3), tx + 130, yy);
    });
    hud.innerHTML = L.tdHud(fmt(R, 2), fmt(1 / R, 2));
  } });
})();

// ===================================================================
// 3. Landskabet: K^N vakua
// ===================================================================
(function () {
  const cv = document.getElementById('cv3'); if (!cv) return;
  const hud = document.getElementById('hud3');
  const sK = document.getElementById('s3K'), sN = document.getElementById('s3N');
  let dirty = true; sK.oninput = sN.oninput = () => dirty = true; addEventListener('resize', () => dirty = true);
  sims.push({ cv, frame() {
    if (!dirty) return; dirty = false;
    const { c, w, h } = setupCanvas(cv);
    const K = +sK.value, N = +sN.value, lg = N * Math.log10(K);
    document.getElementById('v3K').textContent = K;
    document.getElementById('v3N').textContent = N;
    c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    const narrow = w < 640;
    const gx = narrow ? 16 : 30, gy = narrow ? 112 : 110, gw = w - gx - 20, gh = h - gy - 40;
    const xmax = Math.max(600, Math.ceil(lg / 100) * 100 + 50);
    const X = v => gx + gw * v / xmax;
    const items = L.refs.map(([name, v]) => [`${name}: 10^${fmt(v, 0)}`, v, '#4a5878']).concat([[`${L.you}: ${K}^${N} ≈ 10^${fmt(lg, 0)}`, lg, '#d8b46a']]);
    const bh = Math.min(40, gh / items.length - 10);
    c.font = '12px system-ui,sans-serif';
    items.forEach(([name, v, col], i) => {
      const y = gy + i * (bh + 10);
      c.fillStyle = col; c.fillRect(gx, y, Math.max(2, X(v) - gx), bh);
      c.fillStyle = '#e7e9ef'; c.fillText(name, gx + 6, y + bh / 2 + 4);
    });
    c.strokeStyle = '#7fd1b9'; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(X(122), gy - 8); c.lineTo(X(122), gy + items.length * (bh + 10)); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#9ba4b6'; c.textAlign = 'center';
    for (let v = 0; v <= xmax; v += xmax > 1000 ? 250 : 100) c.fillText(v, X(v), h - 22);
    c.fillText(L.lgAx, gx + gw / 2, h - 6); c.textAlign = 'left';
    const good = lg > 122 ? fmt(lg - 122, 0) : null;
    hud.innerHTML = L.ldHud(K, N, fmt(lg, 0), good);
  } });
})();

requestAnimationFrame(loop);
