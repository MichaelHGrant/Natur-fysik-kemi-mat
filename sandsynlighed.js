// sandsynlighed.js – interaktive figurer til siden om sandsynlighedsregning (da/en). Kræver fysikfag.js og mathelp.js.
'use strict';
const lC = (n, k) => (k < 0 || k > n ? -Infinity : lgam(n + 1) - lgam(k + 1) - lgam(n - k + 1));
const C = (n, k) => Math.round(Math.exp(lC(n, k)));
const big = n => Math.round(n).toLocaleString(LANG_EN ? 'en-GB' : 'da-DK');

// ===== 1. Sandsynlighed som areal: A, B, A∩B =====
(function () {
  if (!document.getElementById('vpcv')) return;
  const x = mkcv('vpcv', 900, 420), info = document.getElementById('vpinfo');
  const aS = document.getElementById('vpa'), bS = document.getElementById('vpb'), cS = document.getElementById('vpc');
  function draw(fromSlider) {
    const th = TH(); let a = +aS.value, b = +bS.value; const lo = Math.max(0, a + b - 1), hi = Math.min(a, b);
    let c = +cS.value; c = Math.max(lo, Math.min(hi, c)); cS.value = c;
    setv('vpav', fmt(a, 2)); setv('vpbv', fmt(b, 2)); setv('vpcv2', fmt(c, 2)); clr(x);
    // arealdiagram: enhedskvadrat
    const S = 330, X0 = 50, Y0 = 50;
    const h1 = a > 0 ? c / a : 0, h2 = a < 1 ? (b - c) / (1 - a) : 0;
    x.fillStyle = PR ? '#f4f4f4' : '#0c1222'; x.fillRect(X0, Y0, S, S);
    x.fillStyle = th.fi; x.fillRect(X0, Y0, a * S, S);
    x.fillStyle = th.fr; x.fillRect(X0, Y0, a * S, h1 * S); x.fillRect(X0 + a * S, Y0, (1 - a) * S, h2 * S);
    x.fillStyle = th.fg; x.fillRect(X0, Y0, a * S, h1 * S);
    x.strokeStyle = th.ice; x.lineWidth = 2; x.strokeRect(X0, Y0, a * S, S);
    x.strokeStyle = th.red; x.beginPath(); x.moveTo(X0, Y0 + h1 * S); x.lineTo(X0 + a * S, Y0 + h1 * S); x.lineTo(X0 + a * S, Y0 + h2 * S); x.lineTo(X0 + S, Y0 + h2 * S); x.stroke();
    x.strokeStyle = th.tm; x.lineWidth = 1.5; x.strokeRect(X0, Y0, S, S); x.lineWidth = 1;
    ctext(x, L('Sandsynlighed som areal (hele kvadratet = 1)', 'Probability as area (whole square = 1)'), X0, Y0 - 14, th.tm, 'left', '12px system-ui');
    if (a > 0.06) ctext(x, 'A', X0 + a * S / 2, Y0 + S - 10, th.ice, 'center', 'bold 16px system-ui');
    if (c > 0.02) ctext(x, 'A∩B', X0 + a * S / 2, Y0 + h1 * S / 2 + 5, th.gold, 'center', 'bold 13px system-ui');
    if (b - c > 0.03 && a < 0.94) ctext(x, 'B', X0 + a * S + (1 - a) * S / 2, Y0 + h2 * S / 2 + 5, th.red, 'center', 'bold 16px system-ui');
    // Venn med tal
    const cx = 640, cy = 215, r = 110, d = 70;
    x.strokeStyle = th.tm; x.strokeRect(470, 70, 380, 300);
    x.lineWidth = 2.5; x.strokeStyle = th.ice; x.beginPath(); x.arc(cx - d, cy, r, 0, 7); x.stroke(); x.strokeStyle = th.red; x.beginPath(); x.arc(cx + d, cy, r, 0, 7); x.stroke(); x.lineWidth = 1;
    ctext(x, 'A', cx - d - 80, cy - 90, th.ice, 'left', 'bold 18px system-ui'); ctext(x, 'B', cx + d + 70, cy - 90, th.red, 'left', 'bold 18px system-ui');
    const f2 = v => fmt(v, 2);
    ctext(x, f2(a - c), cx - d - 45, cy + 6, th.t, 'center', '16px system-ui'); ctext(x, f2(c), cx, cy + 6, th.gold, 'center', 'bold 16px system-ui');
    ctext(x, f2(b - c), cx + d + 45, cy + 6, th.t, 'center', '16px system-ui'); ctext(x, f2(1 - a - b + c), 490, 355, th.t, 'left', '16px system-ui');
    const un = a + b - c, ind = Math.abs(c - a * b) < 0.005;
    info.innerHTML = L(`P(A ∪ B) = P(A) + P(B) − P(A ∩ B) = <b>${f2(un)}</b><br>P(A | B) = P(A ∩ B)/P(B) = <b>${b > 0 ? f2(c / b) : '–'}</b> · P(B | A) = <b>${a > 0 ? f2(c / a) : '–'}</b><br>P(A)·P(B) = ${f2(a * b)} → ${ind ? '<span class="msg">A og B er uafhængige</span>' : c === 0 ? '<span class="warn">disjunkte (udelukker hinanden)</span>' : 'A og B er afhængige'}`,
      `P(A ∪ B) = P(A) + P(B) − P(A ∩ B) = <b>${f2(un)}</b><br>P(A | B) = P(A ∩ B)/P(B) = <b>${b > 0 ? f2(c / b) : '–'}</b> · P(B | A) = <b>${a > 0 ? f2(c / a) : '–'}</b><br>P(A)·P(B) = ${f2(a * b)} → ${ind ? '<span class="msg">A and B are independent</span>' : c === 0 ? '<span class="warn">disjoint (mutually exclusive)</span>' : 'A and B are dependent'}`);
  }
  [aS, bS, cS].forEach(e => (e.oninput = () => draw(true)));
  document.querySelectorAll('#vppre button').forEach(bt => (bt.onclick = () => { const a = +aS.value, b = +bS.value; const m = bt.dataset.m;
    if (m === 'ind') cS.value = a * b; else if (m === 'dis') { if (a + b > 1) bS.value = 1 - a; cS.value = 0; } else if (m === 'sub') { if (b > a) bS.value = a * 0.6; cS.value = +bS.value; } draw(); }));
  draw(); REDRAW.push(draw);
})();

// ===== 2. To terninger =====
(function () {
  if (!document.getElementById('dicecv')) return;
  const x = mkcv('dicecv', 900, 400), info = document.getElementById('diceinfo');
  let fn = 'sum', hl = 7, sims = [], cnt = {};
  const FN = { sum: (a, b) => a + b, max: (a, b) => Math.max(a, b), diff: (a, b) => Math.abs(a - b), prod: (a, b) => a * b };
  function vals() { const v = new Set(); for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) v.add(FN[fn](a, b)); return [...v].sort((p, q) => p - q); }
  function draw() {
    const th = TH(); clr(x); const V = vals(); if (!V.includes(hl)) hl = V[Math.floor(V.length / 2)];
    const G = 42, X0 = 40, Y0 = 60;
    ctext(x, L('Alle 36 lige sandsynlige udfald', 'All 36 equally likely outcomes'), X0, 34, th.tm, 'left', '12px system-ui');
    for (let a = 1; a <= 6; a++) { ctext(x, String(a), X0 + 20 + a * G, Y0 - 6, th.ice, 'center', '13px system-ui'); ctext(x, String(a), X0 + 8, Y0 + (a - 1) * G + G / 2 + 3, th.red, 'center', '13px system-ui'); }
    let n = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) { const v = FN[fn](a, b), on = v === hl; if (on) n++;
      const px = X0 + a * G, py = Y0 + (b - 1) * G; x.fillStyle = on ? th.fg : (PR ? '#f2f4f8' : '#0e1628'); x.strokeStyle = on ? th.gold : th.dim; x.fillRect(px, py, G - 4, G - 4); x.strokeRect(px, py, G - 4, G - 4);
      ctext(x, String(v), px + (G - 4) / 2, py + G / 2 + 3, on ? th.gold : th.tm, 'center', '13px system-ui'); }
    // fordeling
    const P = {}; V.forEach(v => (P[v] = 0)); for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) P[FN[fn](a, b)] += 1 / 36;
    const Ns = sims.length; const pm = Math.max(...V.map(v => Math.max(P[v], Ns ? (cnt[v] || 0) / Ns : 0)));
    const A = cax(x, 390, 40, 480, 300, { x0: -0.7, x1: V.length - 0.3, y0: 0, y1: pm * 1.15, yt: [], xt: [] });
    V.forEach((v, i) => { const w = Math.min(34, 400 / V.length * 0.4), on = v === hl;
      x.fillStyle = on ? th.fg : th.fi; x.strokeStyle = on ? th.gold : th.ice; x.fillRect(A.X(i) - w, A.Y(P[v]), w, A.Y(0) - A.Y(P[v])); x.strokeRect(A.X(i) - w, A.Y(P[v]), w, A.Y(0) - A.Y(P[v]));
      if (Ns) { const f = (cnt[v] || 0) / Ns; x.fillStyle = th.fr; x.strokeStyle = th.red; x.fillRect(A.X(i), A.Y(f), w, A.Y(0) - A.Y(f)); x.strokeRect(A.X(i), A.Y(f), w, A.Y(0) - A.Y(f)); }
      if (V.length <= 18 || i % 2 === 0) ctext(x, String(v), A.X(i), A.Y(0) + 16, th.tm, 'center', '11.5px system-ui'); });
    ctext(x, L('blå: teori', 'blue: theory') + (Ns ? L(` · rød: ${big(Ns)} simulerede kast`, ` · red: ${big(Ns)} simulated throws`) : ''), 400, 30, th.tm, 'left', '12px system-ui');
    const nm = { sum: L('summen', 'the sum'), max: L('den største', 'the larger'), diff: L('forskellen', 'the difference'), prod: L('produktet', 'the product') }[fn];
    info.innerHTML = L(`P(${nm} = ${hl}) = ${n}/36 = <b>${fmt(n / 36, 4)}</b>`, `P(${nm} = ${hl}) = ${n}/36 = <b>${fmt(n / 36, 4)}</b>`);
    x._V = V; x._A = A;
  }
  const cv = document.getElementById('dicecv');
  cv.addEventListener('click', ev => { const r = cv.getBoundingClientRect(), px = (ev.clientX - r.left) / r.width * 900, py = (ev.clientY - r.top) / r.height * 400;
    if (px < 360) { const a = Math.floor((px - 40) / 42), b = Math.floor((py - 60) / 42) + 1; if (a >= 1 && a <= 6 && b >= 1 && b <= 6) hl = FN[fn](a, b); }
    else if (x._V) { let best = 0, bd = 1e9; x._V.forEach((v, i) => { const d = Math.abs(x._A.X(i) - px); if (d < bd) { bd = d; best = v; } }); hl = best; }
    draw(); });
  document.getElementById('dicesim').onclick = () => { for (let i = 0; i < 1000; i++) { const v = FN[fn](1 + Math.floor(6 * Math.random()), 1 + Math.floor(6 * Math.random())); cnt[v] = (cnt[v] || 0) + 1; sims.push(v); } draw(); };
  chips('#dicesel button.chip', b => { fn = b.dataset.f; sims = []; cnt = {}; hl = fn === 'sum' ? 7 : fn === 'max' ? 6 : fn === 'diff' ? 1 : 12; draw(); });
  draw(); REDRAW.push(draw);
})();

// ===== 3. Fødselsdagsproblemet =====
(function () {
  if (!document.getElementById('bdcv')) return;
  const x = mkcv('bdcv', 900, 380), info = document.getElementById('bdinfo'), nS = document.getElementById('bdn');
  const p = n => { let q = 1; for (let i = 0; i < n; i++) q *= (365 - i) / 365; return 1 - q; };
  const pme = n => 1 - Math.pow(364 / 365, n - 1);
  let cls = null, trials = 0, hits = 0;
  function draw() {
    const th = TH(), n = +nS.value; setv('bdnv', n); clr(x);
    const { X, Y } = cax(x, 60, 20, 520, 300, { x0: 0, x1: 80, y0: 0, y1: 1, yt: [0, 0.25, 0.5, 0.75, 1], xt: [0, 10, 20, 23, 30, 40, 50, 60, 70, 80], yf: v => fmt(100 * v, 0) + ' %', xl: L('antal personer n', 'number of people n') });
    ccurve(x, t => p(Math.round(t)), 1, 80, X, Y, th.gold, 2.4, 79);
    ccurve(x, t => pme(Math.round(t)), 1, 80, X, Y, th.ice, 1.8, 79, [5, 4]);
    x.strokeStyle = th.red; x.setLineDash([3, 3]); x.beginPath(); x.moveTo(X(n), Y(0)); x.lineTo(X(n), Y(p(n))); x.lineTo(X(0), Y(p(n))); x.stroke(); x.setLineDash([]);
    x.fillStyle = th.red; x.beginPath(); x.arc(X(n), Y(p(n)), 5, 0, 7); x.fill();
    ctext(x, L('mindst to har samme fødselsdag', 'at least two share a birthday'), X(26), Y(0.42), th.gold, 'left', '12px system-ui');
    ctext(x, L('nogen har samme fødselsdag som dig', 'someone shares your birthday'), X(40), Y(0.05) + 2, th.ice, 'left', '12px system-ui');
    // en tilfældig klasse: kalender 12×31
    const gx = 610, gy = 40, cw = 9, ch = 22;
    ctext(x, L(`En tilfældig gruppe på ${n}`, `A random group of ${n}`), gx, 28, th.tm, 'left', '12px system-ui');
    const md = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; const ML = LANG_EN ? 'JFMAMJJASOND' : 'JFMAMJJASOND';
    const cnt = new Array(365).fill(0); if (cls) cls.forEach(d => cnt[d]++);
    let doy = 0; for (let m = 0; m < 12; m++) { ctext(x, ML[m], gx - 6, gy + m * ch + 15, th.tm, 'right', '11px system-ui');
      for (let d = 0; d < md[m]; d++, doy++) { const c = cnt[doy]; x.fillStyle = c >= 2 ? th.red : c === 1 ? th.ice : (PR ? '#eef0f4' : '#141c30'); x.fillRect(gx + d * cw, gy + m * ch, cw - 2, ch - 4); } }
    const dup = cnt.filter(c => c >= 2).length;
    info.innerHTML = L(`n = ${n}: P(mindst to ens) = <b>${pct(p(n), 1)}</b><br>Gruppen: ${dup ? `<span class="warn">${dup} dag(e) med to eller flere</span>` : 'ingen fælles fødselsdage'} · simuleret ${hits} af ${trials}`,
      `n = ${n}: P(at least two the same) = <b>${pct(p(n), 1)}</b><br>The group: ${dup ? `<span class="warn">${dup} day(s) with two or more</span>` : 'no shared birthdays'} · simulated ${hits} of ${trials}`);
  }
  function newClass() { const n = +nS.value; cls = Array.from({ length: n }, () => Math.floor(365 * Math.random())); trials++; if (new Set(cls).size < n) hits++; draw(); }
  nS.oninput = () => { trials = hits = 0; newClass(); };
  document.getElementById('bdnew').onclick = newClass;
  document.getElementById('bdmany').onclick = () => { for (let i = 0; i < 999; i++) { const n = +nS.value, s = new Set(); let dup = false; for (let j = 0; j < n; j++) { const d = Math.floor(365 * Math.random()); if (s.has(d)) dup = true; s.add(d); } trials++; if (dup) hits++; } newClass(); };
  newClass(); REDRAW.push(draw);
})();

// ===== 4. Lotto: den hypergeometriske fordeling =====
(function () {
  if (!document.getElementById('lotcv')) return;
  const x = mkcv('lotcv', 900, 380), info = document.getElementById('lotinfo');
  const G = { dk: [36, 7, L('Lotto (7 af 36)', 'Danish Lotto (7 of 36)')], ej: [50, 5, L('Eurojackpot, hovedtal (5 af 50)', 'Eurojackpot, main numbers (5 of 50)')], kn: [70, 10, L('Keno med 10 tal (20 trækkes af 70)', 'Keno with 10 numbers (20 drawn from 70)')], uk: [59, 6, L('Britisk Lotto (6 af 59)', 'UK Lotto (6 of 59)')] };
  let g = 'dk';
  function draw() {
    const th = TH(); clr(x); const [N, k, nm] = G[g];
    const drawn = g === 'kn' ? 20 : k; // antal trukne kugler; spilleren vælger k tal
    const P = []; for (let j = 0; j <= k; j++) P.push(Math.exp(lC(drawn, j) + lC(N - drawn, k - j) - lC(N, k)));
    const ym = Math.max(...P) * 1.15;
    const { X, Y } = cax(x, 70, 30, 800, 280, { x0: -0.7, x1: k + 0.7, y0: 0, y1: ym, yt: [], xt: Array.from({ length: k + 1 }, (_, i) => i), xl: L('antal rigtige', 'number correct') });
    P.forEach((v, j) => { const w = Math.min(60, 500 / (k + 1)); x.fillStyle = j === k ? th.fg : th.fi; x.strokeStyle = j === k ? th.gold : th.ice; const hh = Math.max(1.5, Y(0) - Y(v));
      x.fillRect(X(j) - w / 2, Y(0) - hh, w, hh); x.strokeRect(X(j) - w / 2, Y(0) - hh, w, hh);
      ctext(x, v > 0.001 ? pct(v, 1) : '1 : ' + big(1 / v), X(j), Y(0) - hh - 6, j === k ? th.gold : th.t, 'center', '11.5px system-ui'); });
    const tot = Math.exp(lC(N, k)) * (g === 'kn' ? 1 : 1), pk = P[k], yrs = 1 / pk / 52;
    info.innerHTML = L(`<b>${nm}</b>: ${g === 'kn' ? '' : `antal mulige rækker K(${N},${k}) = <b>${big(Math.exp(lC(N, k)))}</b><br>`}P(alle ${k} rigtige) = 1 : ${big(1 / pk)} – med én række om ugen i gennemsnit hvert ${big(yrs)}. år`,
      `<b>${nm}</b>: ${g === 'kn' ? '' : `number of possible rows C(${N},${k}) = <b>${big(Math.exp(lC(N, k)))}</b><br>`}P(all ${k} correct) = 1 in ${big(1 / pk)} – with one row a week, on average once every ${big(yrs)} years`);
  }
  chips('#lotsel button.chip', b => { g = b.dataset.g; draw(); });
  draw(); REDRAW.push(draw);
})();
