// bayes.js – interaktive figurer til siden om Bayes' sætning (da/en). Kræver fysikfag.js og mathelp.js.
'use strict';
(function () { const s = document.createElement('style'); s.textContent =
  '.mh{display:flex;gap:22px;justify-content:center;flex-wrap:wrap;padding:58px 10px 8px}.door{width:130px;height:200px;border-radius:10px 10px 4px 4px;border:3px solid #8a6a3a;background:linear-gradient(#5a3d1e,#3d2914);color:#f2d590;font-size:1.5rem;cursor:pointer;position:relative}' +
  '.door.sel{box-shadow:0 0 0 4px #9fd0ff}.door.open{background:#0e1628;cursor:default}.door .c{font-size:3.4rem;display:block;margin-top:8px}' +
  '@media print{.door{background:#f4efe2;color:#111}.door.open{background:#fff}}';
  document.head.appendChild(s); })();
const lbeta = (a, b) => lgam(a) + lgam(b) - lgam(a + b);
const betapdf = (x, a, b) => (x <= 0 || x >= 1 ? 0 : Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - lbeta(a, b)));

// ===== 1. Den medicinske test – 1000 personer =====
(function () {
  if (!document.getElementById('medcv')) return;
  const x = mkcv('medcv', 900, 440), info = document.getElementById('medinfo');
  const pS = document.getElementById('medp'), sS = document.getElementById('meds'), fS = document.getElementById('medf');
  const prev = () => Math.pow(10, +pS.value);
  function draw() {
    const th = TH(), p = prev(), se = +sS.value, sp = +fS.value; setv('medpv', pct(p, p < 0.01 ? 2 : 1)); setv('medsv', pct(se, 1)); setv('medfv', pct(sp, 1)); clr(x);
    const N = 1000, ill = Math.round(N * p), tp = Math.round(ill * se), fn = ill - tp, h = N - ill, fp = Math.round(h * (1 - sp)), tn = h - fp;
    const cols = 40, cw = 14, X0 = 30, Y0 = 50;
    const kinds = []; for (let i = 0; i < tp; i++) kinds.push(0); for (let i = 0; i < fn; i++) kinds.push(1); for (let i = 0; i < fp; i++) kinds.push(2); for (let i = 0; i < tn; i++) kinds.push(3);
    const C = [th.red, th.vio, th.gold, PR ? '#d9dee8' : '#26314a'];
    kinds.forEach((k, i) => { const r = Math.floor(i / cols), c = i % cols, px = X0 + c * cw + cw / 2, py = Y0 + r * cw + cw / 2; x.fillStyle = C[k];
      x.beginPath(); x.arc(px, py - 3, 2.6, 0, 7); x.fill(); x.fillRect(px - 2.8, py, 5.6, 4.5); });
    ctext(x, L('1000 personer, der bliver testet', '1000 people being tested'), X0, 34, th.tm, 'left', '12px system-ui');
    const lx = 610; const rows = [[C[0], L('syg, positiv test', 'ill, positive test'), tp], [C[1], L('syg, negativ test (overset)', 'ill, negative test (missed)'), fn], [C[2], L('rask, positiv test (falsk alarm)', 'healthy, positive test (false alarm)'), fp], [C[3], L('rask, negativ test', 'healthy, negative test'), tn]];
    rows.forEach(([c, s, n], k) => { x.fillStyle = c; x.fillRect(lx, 60 + k * 30, 16, 16); ctext(x, `${n}  ${s}`, lx + 26, 73 + k * 30, th.t, 'left', '13px system-ui'); });
    const pos = tp + fp, ppv = p * se / (p * se + (1 - p) * (1 - sp)), npv = (1 - p) * sp / ((1 - p) * sp + p * (1 - se));
    // stolpe: af de positive
    const by = 220, bw = 260; ctext(x, L(`Af de ${pos} med positiv test er ${tp} syge:`, `Of the ${pos} with a positive test, ${tp} are ill:`), lx, by, th.t, 'left', '13px system-ui');
    x.fillStyle = C[2]; x.fillRect(lx, by + 10, bw, 26); x.fillStyle = C[0]; x.fillRect(lx, by + 10, pos ? bw * tp / pos : 0, 26);
    ctext(x, 'P(' + L('syg', 'ill') + ' | +) = ' + pct(ppv, 1), lx, by + 64, th.gold, 'left', 'bold 16px system-ui');
    ctext(x, 'P(' + L('rask', 'healthy') + ' | −) = ' + pct(npv, 2), lx, by + 92, th.ice, 'left', '13.5px system-ui');
    const LR = se / (1 - sp); ctext(x, L(`Likelihood-ratio LR+ = ${fmt(LR, 1)}`, `Likelihood ratio LR+ = ${fmt(LR, 1)}`), lx, by + 120, th.tm, 'left', '13px system-ui');
    info.innerHTML = L(`Forekomst ${pct(p, 2)} · sensitivitet ${pct(se, 1)} · specificitet ${pct(sp, 1)}<br>Odds før: 1 : ${fmt((1 - p) / p, 0)} → odds efter: 1 : ${fmt((1 - ppv) / ppv, 1)}`,
      `Prevalence ${pct(p, 2)} · sensitivity ${pct(se, 1)} · specificity ${pct(sp, 1)}<br>Prior odds: 1 : ${fmt((1 - p) / p, 0)} → posterior odds: 1 : ${fmt((1 - ppv) / ppv, 1)}`);
    x._ppv = ppv;
  }
  [pS, sS, fS].forEach(e => (e.oninput = draw));
  document.querySelectorAll('#medpre button').forEach(b => (b.onclick = () => {
    if (b.dataset.again) { pS.value = Math.log10(Math.max(1e-4, Math.min(0.99, x._ppv))); }
    else { pS.value = Math.log10(+b.dataset.p); sS.value = b.dataset.s; fS.value = b.dataset.f; }
    draw(); }));
  draw(); REDRAW.push(draw);
})();

// ===== 2. Monty Hall =====
(function () {
  const box = document.getElementById('mhdoors'); if (!box) return;
  const info = document.getElementById('mhinfo'), stat = document.getElementById('mhstat');
  let car, pick, opened, phase, S = { stay: [0, 0], sw: [0, 0] };
  function reset() { car = Math.floor(3 * Math.random()); pick = -1; opened = -1; phase = 0; render(); info.innerHTML = L('Vælg en dør.', 'Choose a door.'); }
  function render() {
    box.innerHTML = [0, 1, 2].map(i => { const op = i === opened || phase === 2; const ct = op ? `<span class="c">${i === car ? '🚗' : '🐐'}</span>` : `<span class="c">${i + 1}</span>`;
      return `<button class="door${i === pick ? ' sel' : ''}${op ? ' open' : ''}" data-i="${i}">${ct}</button>`; }).join('');
    box.querySelectorAll('.door').forEach(b => (b.onclick = () => click(+b.dataset.i)));
    const r = k => (S[k][1] ? pct(S[k][0] / S[k][1], 1) : '–');
    stat.innerHTML = L(`Bliv: ${S.stay[0]} gevinster af ${S.stay[1]} (${r('stay')}) · Skift: ${S.sw[0]} af ${S.sw[1]} (${r('sw')})`, `Stay: ${S.stay[0]} wins of ${S.stay[1]} (${r('stay')}) · Switch: ${S.sw[0]} of ${S.sw[1]} (${r('sw')})`);
  }
  function click(i) {
    if (phase === 0) { pick = i; const goats = [0, 1, 2].filter(d => d !== pick && d !== car); opened = goats[Math.floor(Math.random() * goats.length)]; phase = 1; render();
      info.innerHTML = L(`Værten, der ved hvor bilen er, åbner dør ${opened + 1}: en ged. Vil du blive ved dør ${pick + 1} eller skifte? Klik på den dør, du vil have.`, `The host, who knows where the car is, opens door ${opened + 1}: a goat. Do you stay with door ${pick + 1} or switch? Click the door you want.`); }
    else if (phase === 1 && i !== opened) { const sw = i !== pick; pick = i; phase = 2; const win = pick === car; S[sw ? 'sw' : 'stay'][1]++; if (win) S[sw ? 'sw' : 'stay'][0]++; render();
      info.innerHTML = (win ? L('<span class="msg">Du vandt bilen!</span> ', '<span class="msg">You won the car!</span> ') : L('<span class="warn">En ged.</span> ', '<span class="warn">A goat.</span> ')) + L('Klik „Nyt spil“ for at spille igen.', 'Click “New game” to play again.'); }
  }
  document.getElementById('mhnew').onclick = reset;
  document.getElementById('mhsim').onclick = () => { for (let k = 0; k < 1000; k++) { const c = Math.floor(3 * Math.random()), p = Math.floor(3 * Math.random()); S.stay[1]++; if (p === c) S.stay[0]++; S.sw[1]++; if (p !== c) S.sw[0]++; } render(); };
  reset();
})();

// ===== 3. Bayesiansk opdatering: hvor skæv er mønten? =====
(function () {
  if (!document.getElementById('coincv')) return;
  const x = mkcv('coincv', 900, 380), info = document.getElementById('coininfo'), tS = document.getElementById('coint');
  const PRI = { flat: [1, 1], fair: [20, 20], skep: [0.5, 0.5] };
  let pri = 'flat', h = 0, t = 0, seq = '';
  function q(a, b, P) { let lo = 0, hi = 1; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; let s = 0; const n = 400; for (let i = 0; i < n; i++) s += betapdf(m * (i + 0.5) / n, a, b) * m / n; s < P ? (lo = m) : (hi = m); } return (lo + hi) / 2; }
  function draw() {
    const th = TH(); setv('cointv', fmt(+tS.value, 2)); clr(x);
    const [a0, b0] = PRI[pri], a = a0 + h, b = b0 + t;
    const ys = []; for (let i = 1; i < 400; i++) ys.push(betapdf(i / 400, a, b)); const ym = Math.max(3, ...ys.filter(isFinite)) * 1.1;
    const { X, Y } = cax(x, 60, 20, 810, 300, { x0: 0, x1: 1, y0: 0, y1: ym, yt: [], xt: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1], xf: v => DEC(String(v)), xl: L('p = sandsynligheden for plat', 'p = probability of tails') });
    const lo = q(a, b, 0.025), hi = q(a, b, 0.975);
    x.fillStyle = th.fg; x.beginPath(); x.moveTo(X(lo), Y(0)); for (let i = 0; i <= 200; i++) { const v = lo + (hi - lo) * i / 200; x.lineTo(X(v), Y(Math.min(ym, betapdf(v, a, b)))); } x.lineTo(X(hi), Y(0)); x.fill();
    ccurve(x, v => Math.min(ym * 1.2, betapdf(v, a0, b0)), 0.002, 0.998, X, Y, th.dim, 1.8, 300, [5, 4]);
    ccurve(x, v => betapdf(v, a, b), 0.001, 0.999, X, Y, th.gold, 2.6, 500);
    const tp = +tS.value; x.strokeStyle = th.red; x.setLineDash([3, 3]); x.beginPath(); x.moveTo(X(tp), Y(0)); x.lineTo(X(tp), Y(ym * 0.95)); x.stroke(); x.setLineDash([]);
    ctext(x, L('sand værdi', 'true value'), X(tp) + 4, Y(ym * 0.92), th.red, 'left', '12px system-ui');
    ctext(x, seq.slice(-70), 70, 352 + 18, th.tm, 'left', '12px monospace');
    const mean = a / (a + b);
    info.innerHTML = L(`${h + t} kast: ${h} plat, ${t} krone · <span style="color:#9ba4b6">- - forhåndsviden</span> · <b>efter data</b><br>Bedste bud ${fmt(mean, 3)} · 95 %-troværdighedsinterval [${fmt(lo, 3)} ; ${fmt(hi, 3)}]`,
      `${h + t} tosses: ${h} tails, ${t} heads · <span style="color:#9ba4b6">- - prior</span> · <b>posterior</b><br>Best estimate ${fmt(mean, 3)} · 95 % credible interval [${fmt(lo, 3)}, ${fmt(hi, 3)}]`);
  }
  function toss(n) { for (let i = 0; i < n; i++) { if (Math.random() < +tS.value) { h++; seq += L('P', 'T'); } else { t++; seq += L('K', 'H'); } } draw(); }
  document.getElementById('coin1').onclick = () => toss(1); document.getElementById('coin10').onclick = () => toss(10); document.getElementById('coin100').onclick = () => toss(100);
  document.getElementById('coin0').onclick = () => { h = t = 0; seq = ''; draw(); };
  tS.oninput = () => { h = t = 0; seq = ''; draw(); };
  chips('#coinpri button.chip', b => { pri = b.dataset.p; draw(); });
  toss(20); REDRAW.push(draw);
})();
