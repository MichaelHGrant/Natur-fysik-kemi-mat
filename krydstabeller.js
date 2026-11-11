// krydstabeller.js – interaktive figurer til siden om krydstabeller og trædiagrammer (da/en). Kræver fysikfag.js og mathelp.js.
'use strict';
(function () { const s = document.createElement('style'); s.textContent =
  'table.ct{border-collapse:collapse;margin:8px 0;font-size:.95rem;width:auto!important}table.ct th,table.ct td{border:1px solid var(--line,#252f47);padding:4px 10px;text-align:center}' +
  'table.ct th{color:var(--gold,#d8b46a);font-weight:normal}table.ct td.tot{color:#9ba4b6}table.ct input{width:78px;font-size:.95rem;text-align:center;background:var(--panel2,#141c30);color:var(--ink,#e7e9ef);border:1px solid #33405e;border-radius:6px;padding:2px}' +
  'table.ct input.lab{width:120px;color:var(--gold2,#f2d590)}table.ct .pc{display:block;font-size:.78rem;color:#9fd0ff}' +
  '.ctwrap{display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start;padding:64px 14px 10px}.ctwrap canvas{flex:1 1 360px;max-width:440px}' +
  '@media print{table.ct input{border:none;background:#fff;color:#111}table.ct .pc{color:#2b6cb0}}';
  document.head.appendChild(s); })();

// ===== 1. Krydstabel (2×2) =====
(function () {
  const tb = document.getElementById('cttab'); if (!tb) return;
  const info = document.getElementById('ctinfo'); const x = mkcv('ctcv', 440, 340);
  const PRE = {
    titanic: { r: [L('Mand', 'Male'), L('Kvinde', 'Female')], c: [L('Omkom', 'Died'), L('Overlevede', 'Survived')], n: [[1364, 367], [126, 344]] },
    vaccine: { r: [L('Placebo', 'Placebo'), L('Vaccine', 'Vaccine')], c: [L('Covid-19', 'Covid-19'), L('Ikke syg', 'Not ill')], n: [[162, 18163], [8, 18190]] },
    screen: { r: [L('Kræft', 'Cancer'), L('Ikke kræft', 'No cancer')], c: [L('Positiv', 'Positive'), L('Negativ', 'Negative')], n: [[9, 1], [89, 901]] },
    indep: { r: [L('Rygere', 'Smokers'), L('Ikke-rygere', 'Non-smokers')], c: [L('Venstrehåndet', 'Left-handed'), L('Højrehåndet', 'Right-handed')], n: [[20, 180], [80, 720]] }
  };
  let mode = 'n', cur = JSON.parse(JSON.stringify(PRE.titanic));
  function build() {
    const n = cur.n, R = [n[0][0] + n[0][1], n[1][0] + n[1][1]], Cc = [n[0][0] + n[1][0], n[0][1] + n[1][1]], T = R[0] + R[1];
    const pc = (v, i, j) => mode === 'row' ? pct(v / R[i], 1) : mode === 'col' ? pct(v / Cc[j], 1) : mode === 'tot' ? pct(v / T, 1) : '';
    let h = `<tr><th></th><th><input class="lab" data-c="0" value="${cur.c[0]}"></th><th><input class="lab" data-c="1" value="${cur.c[1]}"></th><th>${L('I alt', 'Total')}</th></tr>`;
    for (let i = 0; i < 2; i++) h += `<tr><th><input class="lab" data-r="${i}" value="${cur.r[i]}"></th>` + [0, 1].map(j => `<td><input type="number" min="0" data-i="${i}" data-j="${j}" value="${n[i][j]}"><span class="pc">${pc(n[i][j], i, j)}</span></td>`).join('') + `<td class="tot">${big0(R[i])}<span class="pc">${mode === 'col' ? pct(R[i] / T, 1) : mode === 'tot' ? pct(R[i] / T, 1) : mode === 'row' ? '100 %' : ''}</span></td></tr>`;
    h += `<tr><th>${L('I alt', 'Total')}</th>` + [0, 1].map(j => `<td class="tot">${big0(Cc[j])}<span class="pc">${mode === 'row' ? pct(Cc[j] / T, 1) : mode === 'tot' ? pct(Cc[j] / T, 1) : mode === 'col' ? '100 %' : ''}</span></td>`).join('') + `<td class="tot">${big0(T)}</td></tr>`;
    tb.innerHTML = h;
    tb.querySelectorAll('input[type=number]').forEach(e => e.addEventListener('change', () => { cur.n[+e.dataset.i][+e.dataset.j] = Math.max(0, Math.round(+e.value || 0)); build(); }));
    tb.querySelectorAll('input.lab').forEach(e => e.addEventListener('change', () => { if (e.dataset.r) cur.r[+e.dataset.r] = e.value; else cur.c[+e.dataset.c] = e.value; build(); }));
    draw(); stats();
  }
  const big0 = v => v.toLocaleString(LANG_EN ? 'en-GB' : 'da-DK');
  function draw() {
    const th = TH(), n = cur.n; clr(x); const R = [n[0][0] + n[0][1], n[1][0] + n[1][1]], T = R[0] + R[1]; if (!T) return;
    const X0 = 50, Y0 = 30, W = 360, H = 270; let y = Y0;
    ctext(x, L('Mosaikplot: højde ∝ rækketotal, bredde ∝ rækkeprocent', 'Mosaic plot: height ∝ row total, width ∝ row percentage'), X0 - 40, 16, th.tm, 'left', '11.5px system-ui');
    for (let i = 0; i < 2; i++) { const hh = Math.max(2, R[i] / T * H - 4), w0 = R[i] ? n[i][0] / R[i] * W : 0;
      x.fillStyle = th.fr; x.fillRect(X0, y, w0, hh); x.strokeStyle = th.red; x.strokeRect(X0, y, w0, hh);
      x.fillStyle = th.fi; x.fillRect(X0 + w0 + 3, y, W - w0 - 3, hh); x.strokeStyle = th.ice; x.strokeRect(X0 + w0 + 3, y, W - w0 - 3, hh);
      ctext(x, String(cur.r[i]).slice(0, 6), X0 - 6, y + hh / 2 + 4, th.t, 'right', '12px system-ui'); y += hh + 4; }
    ctext(x, cur.c[0], X0 + 4, Y0 + H + 18, th.red, 'left', '12px system-ui'); ctext(x, cur.c[1], X0 + W, Y0 + H + 18, th.ice, 'right', '12px system-ui');
  }
  function stats() {
    const n = cur.n, R = [n[0][0] + n[0][1], n[1][0] + n[1][1]], Cc = [n[0][0] + n[1][0], n[0][1] + n[1][1]], T = R[0] + R[1];
    if (!R[0] || !R[1] || !Cc[0] || !Cc[1]) { info.innerHTML = ''; return; }
    const p1 = n[0][0] / R[0], p2 = n[1][0] / R[1], rr = p1 / p2, or = (n[0][0] * n[1][1]) / (n[0][1] * n[1][0] || NaN);
    let chi = 0; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const e = R[i] * Cc[j] / T; chi += (n[i][j] - e) ** 2 / e; }
    const p = 1 - gammaP(0.5, chi / 2);
    info.innerHTML = L(`P(${cur.c[0]} | ${cur.r[0]}) = <b>${pct(p1, 1)}</b> · P(${cur.c[0]} | ${cur.r[1]}) = <b>${pct(p2, 1)}</b><br>Relativ risiko ${fmt(rr, 2)} · odds-ratio ${isFinite(or) ? fmt(or, 2) : '–'} · χ² = ${fmt(chi, 1)}, p = ${pfmt(p)} ${p < 0.05 ? '<span class="warn">(afhængige)</span>' : '<span class="msg">(forenelig med uafhængighed)</span>'}`,
      `P(${cur.c[0]} | ${cur.r[0]}) = <b>${pct(p1, 1)}</b> · P(${cur.c[0]} | ${cur.r[1]}) = <b>${pct(p2, 1)}</b><br>Relative risk ${fmt(rr, 2)} · odds ratio ${isFinite(or) ? fmt(or, 2) : '–'} · χ² = ${fmt(chi, 1)}, p = ${pfmt(p)} ${p < 0.05 ? '<span class="warn">(dependent)</span>' : '<span class="msg">(consistent with independence)</span>'}`);
  }
  chips('#ctmode button.chip', b => { mode = b.dataset.m; build(); });
  chips('#ctpre button.chip', b => { cur = JSON.parse(JSON.stringify(PRE[b.dataset.p])); build(); });
  build(); REDRAW.push(draw);
})();

// ===== 2. Trædiagram og det omvendte træ =====
(function () {
  if (!document.getElementById('treecv')) return;
  const x = mkcv('treecv', 900, 480), info = document.getElementById('treeinfo');
  const aS = document.getElementById('tra'), bS = document.getElementById('trb'), cS = document.getElementById('trc');
  let names = { A: 'A', B: 'B' };
  const NM = {
    gen: { A: 'A', B: 'B' },
    med: { A: L('syg', 'ill'), B: L('positiv', 'positive') },
    urn: { A: L('1. rød', '1st red'), B: L('2. rød', '2nd red') },
    fab: { A: L('maskine 1', 'machine 1'), B: L('defekt', 'defective') }
  };
  function node(px, py, s, col) { const th = TH(); x.fillStyle = PR ? '#fff' : '#0e1628'; x.strokeStyle = col; x.lineWidth = 1.5; x.beginPath(); x.roundRect ? x.roundRect(px - 50, py - 14, 100, 28, 8) : x.rect(px - 50, py - 14, 100, 28); x.fill(); x.stroke(); x.lineWidth = 1; ctext(x, s, px, py + 5, th.t, 'center', '13px system-ui'); }
  function edge(x1, y1, x2, y2, p, lab) { const th = TH(); x.strokeStyle = th.ice; x.lineWidth = 1 + 5 * p; x.globalAlpha = 0.85; x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke(); x.globalAlpha = 1; x.lineWidth = 1;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; x.fillStyle = PR ? '#fff' : '#05070b'; x.fillRect(mx - 26, my - 10, 52, 18); ctext(x, fmt(p, 3), mx, my + 4, th.gold, 'center', '12px system-ui'); }
  function tree(ox, title, A, nA, nB, pA, pBA, pBnA) {
    const th = TH(); ctext(x, title, ox + 175, 22, th.tm, 'center', '12.5px system-ui');
    const r = [ox + 20, 220], l1 = [[ox + 150, 110], [ox + 150, 330]], l2 = [[ox + 300, 60], [ox + 300, 160], [ox + 300, 280], [ox + 300, 380]];
    const P = [pA, 1 - pA], Q = [[pBA, 1 - pBA], [pBnA, 1 - pBnA]];
    x.fillStyle = th.gold; x.beginPath(); x.arc(...r, 5, 0, 7); x.fill();
    for (let i = 0; i < 2; i++) { edge(...r, l1[i][0] - 50, l1[i][1], P[i]); for (let j = 0; j < 2; j++) edge(l1[i][0] + 50, l1[i][1], l2[2 * i + j][0] - 50, l2[2 * i + j][1], Q[i][j]); }
    node(...l1[0], nA, th.ice); node(...l1[1], '¬' + nA, th.ice);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const k = 2 * i + j; node(...l2[k], (j ? '¬' : '') + nB, th.red);
      ctext(x, '= ' + fmt(P[i] * Q[i][j], 4), l2[k][0] + 56, l2[k][1] + 5, (i === 0 && j === 0) ? th.gold : th.tm, 'left', (i === 0 && j === 0 ? 'bold ' : '') + '12.5px system-ui'); }
  }
  function draw() {
    const th = TH(), a = +aS.value, b = +bS.value, c = +cS.value; setv('trav', fmt(a, 3)); setv('trbv', fmt(b, 3)); setv('trcv', fmt(c, 3)); clr(x);
    const pB = a * b + (1 - a) * c, pAB = pB > 0 ? a * b / pB : 0, pAnB = pB < 1 ? a * (1 - b) / (1 - pB) : 0;
    tree(0, L('Træet som data kommer: først ', 'The tree as data arrive: first ') + names.A, 'A', names.A, names.B, a, b, c);
    x.strokeStyle = th.dim; x.setLineDash([4, 4]); x.beginPath(); x.moveTo(450, 40); x.lineTo(450, 420); x.stroke(); x.setLineDash([]);
    tree(460, L('Det omvendte træ: først ', 'The reversed tree: first ') + names.B, 'B', names.B, names.A, pB, pAB, pAnB);
    info.innerHTML = L(`P(${names.B}) = ${fmt(a, 3)}·${fmt(b, 3)} + ${fmt(1 - a, 3)}·${fmt(c, 3)} = <b>${fmt(pB, 4)}</b> (loven om total sandsynlighed)<br>P(${names.A} | ${names.B}) = ${fmt(a * b, 4)} / ${fmt(pB, 4)} = <b>${fmt(pAB, 4)}</b> (Bayes)`,
      `P(${names.B}) = ${fmt(a, 3)}·${fmt(b, 3)} + ${fmt(1 - a, 3)}·${fmt(c, 3)} = <b>${fmt(pB, 4)}</b> (law of total probability)<br>P(${names.A} | ${names.B}) = ${fmt(a * b, 4)} / ${fmt(pB, 4)} = <b>${fmt(pAB, 4)}</b> (Bayes)`);
  }
  [aS, bS, cS].forEach(e => (e.oninput = draw));
  chips('#trpre button.chip', bt => { names = NM[bt.dataset.n]; aS.value = bt.dataset.a; bS.value = bt.dataset.b; cS.value = bt.dataset.c; draw(); });
  draw(); REDRAW.push(draw);
})();

// ===== 3. Simpsons paradoks =====
(function () {
  if (!document.getElementById('simcv')) return;
  const x = mkcv('simcv', 900, 380), info = document.getElementById('siminfo');
  // Charig m.fl. 1986: nyresten, åben operation (A) og perkutan nefrolitotomi (B)
  const D = { small: { A: [81, 87], B: [234, 270] }, large: { A: [192, 263], B: [55, 80] } };
  let show = 'all';
  function draw() {
    const th = TH(); clr(x);
    const tot = { A: [D.small.A[0] + D.large.A[0], D.small.A[1] + D.large.A[1]], B: [D.small.B[0] + D.large.B[0], D.small.B[1] + D.large.B[1]] };
    const groups = [[L('Små sten', 'Small stones'), D.small], [L('Store sten', 'Large stones'), D.large], [L('Samlet', 'Combined'), tot]];
    const { X, Y } = cax(x, 70, 30, 500, 300, { x0: 0, x1: 3, y0: 0.5, y1: 1, yt: [0.5, 0.6, 0.7, 0.8, 0.9, 1], xt: [], yf: v => fmt(100 * v, 0) + ' %', yl: L('andel vellykkede', 'success rate') });
    groups.forEach(([nm, g], k) => { const cx = X(k + 0.5);
      [['A', -1, th.gold, th.fg], ['B', 1, th.ice, th.fi]].forEach(([t, s, c, f]) => { const r = g[t][0] / g[t][1], w = 56, px = cx + (s < 0 ? -w - 4 : 4);
        const dim = show !== 'all' && ((show === 'grp' && k === 2) || (show === 'tot' && k < 2));
        x.globalAlpha = dim ? 0.25 : 1; x.fillStyle = f; x.strokeStyle = c; x.fillRect(px, Y(r), w, Y(0.5) - Y(r)); x.strokeRect(px, Y(r), w, Y(0.5) - Y(r));
        ctext(x, pct(r, 0), px + w / 2, Y(r) - 6, c, 'center', 'bold 13px system-ui'); ctext(x, `${g[t][0]}/${g[t][1]}`, px + w / 2, Y(0.5) - 8, th.t, 'center', '11px system-ui'); x.globalAlpha = 1; });
      ctext(x, nm, cx, Y(0.5) + 18, th.t, 'center', '13px system-ui'); });
    ctext(x, L('■ A: åben operation', '■ A: open surgery'), 600, 60, th.gold, 'left', '13px system-ui'); ctext(x, L('■ B: kikkertoperation (PCNL)', '■ B: keyhole surgery (PCNL)'), 600, 82, th.ice, 'left', '13px system-ui');
    // fordeling af patienter
    ctext(x, L('Hvem fik hvilken behandling?', 'Who received which treatment?'), 600, 130, th.tm, 'left', '12px system-ui');
    [['A', D.small.A[1], D.large.A[1], th.gold], ['B', D.small.B[1], D.large.B[1], th.ice]].forEach(([t, s, l, c], k) => { const y = 150 + k * 70, W = 260, ws = s / (s + l) * W;
      x.fillStyle = c; x.globalAlpha = 0.35; x.fillRect(600, y, ws, 40); x.globalAlpha = 0.75; x.fillRect(600 + ws + 2, y, W - ws - 2, 40); x.globalAlpha = 1;
      ctext(x, `${t}: ${s} ${L('små', 'small')}`, 606, y + 25, th.t, 'left', '12px system-ui'); ctext(x, `${l} ${L('store', 'large')}`, 600 + W - 6, y + 25, PR ? '#fff' : '#05070b', 'right', '12px system-ui'); });
    ctext(x, L('B fik flest af de lette tilfælde', 'B got most of the easy cases'), 600, 310, th.red, 'left', '12.5px system-ui');
    info.innerHTML = L('A er bedst for <b>både</b> små og store sten – men B ser bedst ud samlet (83 % mod 78 %).', 'A is better for <b>both</b> small and large stones – yet B looks better overall (83 % against 78 %).');
  }
  chips('#simsel button.chip', b => { show = b.dataset.s; draw(); });
  draw(); REDRAW.push(draw);
})();
