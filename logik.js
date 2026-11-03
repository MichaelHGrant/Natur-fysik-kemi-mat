// logik.js – interaktive figurer til siden om logik og sandhedstabeller (da/en). Kræver fysikfag.js og mathelp.js.
'use strict';
(function () { const s = document.createElement('style'); s.textContent =
  'table.tt{border-collapse:collapse;margin:10px 0;font-size:.92rem;width:auto!important}table.tt th,table.tt td{border:1px solid var(--line,#252f47);padding:3px 10px;text-align:center}' +
  'table.tt th{color:var(--gold,#d8b46a);font-weight:normal;white-space:nowrap}table.tt td.var{background:var(--panel,#0e1424)}table.tt .res{background:#3a2f17}' +
  '.tv1{color:#7fd1b9}.tv0{color:#f08a7a}.ttwrap{overflow-x:auto;max-width:100%}' +
  '#ttin{width:100%;max-width:560px;font-size:1.1rem;padding:6px 10px;background:var(--panel2,#141c30);color:var(--ink,#e7e9ef);border:1px solid #33405e;border-radius:8px}' +
  '#vennin{width:260px;font-size:1rem;padding:4px 8px;background:var(--panel2,#141c30);color:var(--ink,#e7e9ef);border:1px solid #33405e;border-radius:8px}' +
  '.wrow{display:flex;gap:16px;flex-wrap:wrap;margin:12px 0}.wcard{width:96px;height:132px;font-size:1.7rem;border-radius:10px;border:2px solid #33405e;background:#f4efe2;color:#111}' +
  '.wcard.on{border-color:#d8b46a;box-shadow:0 0 0 3px #d8b46a}.wcard.ok{background:#cfeee2}.wcard.no{opacity:.55}.wrule{font-size:1.02rem;color:var(--gold2,#f2d590);margin:6px 0}' +
  '@media print{table.tt .res{background:#f3e7c9}table.tt td.var{background:#fff}.tv1{color:#2e8b57}.tv0{color:#c0392b}}';
  document.head.appendChild(s); })();

// ---------- parser for udsagnslogik / mængdealgebra ----------
// Variable: enkeltbogstaver. Operatorer: ¬ ~ ! (ikke), ∧ & ∩ (og), ∨ | ∪ + (eller), ⊕ ^ △ (xor), → -> ⇒ (hvis-så), ↔ <-> ⇔ (biimplikation), \ (mængdedifferens), ' og ᶜ som efterstillet komplement
function lexLog(s) {
  const t = []; s = s.replace(/<->|<=>|⇔/g, '↔').replace(/->|=>|⇒/g, '→').replace(/[~!]/g, '¬').replace(/[&∩]/g, '∧').replace(/[|∪+]/g, '∨').replace(/[\^△]/g, '⊕').replace(/ᶜ/g, "'");
  for (const ch of s) { if (/\s/.test(ch)) continue; if (/[A-Za-zÆØÅæøå]/.test(ch)) t.push({ v: ch }); else if ('¬∧∨⊕→↔\\()\'01'.includes(ch)) t.push({ o: ch }); else throw new Error(L('Ukendt tegn: ', 'Unknown character: ') + ch); }
  return t;
}
function parseLog(src) {
  const t = lexLog(src); let i = 0;
  const peek = () => t[i], eat = o => { if (t[i] && t[i].o === o) { i++; return true; } return false; };
  function prim() {
    let n; const k = t[i];
    if (!k) throw new Error(L('Udtrykket slutter for tidligt', 'The expression ends too early'));
    if (eat('¬')) n = { op: '¬', a: prim() };
    else if (eat('(')) { n = bic(); if (!eat(')')) throw new Error(L('Mangler )', 'Missing )')); n.par = true; }
    else if (k.v) { i++; n = { v: k.v }; }
    else if (k.o === '0' || k.o === '1') { i++; n = { c: k.o === '1' }; }
    else throw new Error(L('Uventet ', 'Unexpected ') + k.o);
    while (eat("'")) n = { op: '¬', a: n, post: true };
    return n;
  }
  function and() { let n = prim(); while (peek() && (peek().o === '∧' || peek().o === '\\')) { const o = t[i++].o; n = { op: o, a: n, b: prim() }; } return n; }
  function or() { let n = and(); while (peek() && (peek().o === '∨' || peek().o === '⊕')) { const o = t[i++].o; n = { op: o, a: n, b: and() }; } return n; }
  function imp() { const n = or(); if (eat('→')) return { op: '→', a: n, b: imp() }; return n; }
  function bic() { let n = imp(); while (eat('↔')) n = { op: '↔', a: n, b: imp() }; return n; }
  const r = bic(); if (i < t.length) throw new Error(L('Uventet ', 'Unexpected ') + (t[i].o || t[i].v)); return r;
}
function evalLog(n, e) {
  if (n.v) return !!e[n.v]; if ('c' in n) return n.c;
  const a = evalLog(n.a, e);
  switch (n.op) { case '¬': return !a; case '∧': return a && evalLog(n.b, e); case '∨': return a || evalLog(n.b, e); case '⊕': return a !== evalLog(n.b, e);
    case '→': return !a || evalLog(n.b, e); case '↔': return a === evalLog(n.b, e); case '\\': return a && !evalLog(n.b, e); }
}
function showLog(n, top) {
  if (n.v) return n.v; if ('c' in n) return n.c ? '1' : '0';
  let s = n.op === '¬' ? (n.post ? showLog(n.a) + "'" : '¬' + showLog(n.a)) : showLog(n.a) + ' ' + n.op + ' ' + showLog(n.b);
  return n.par && !top ? '(' + s + ')' : s;
}
function varsLog(n, s = new Set()) { if (n.v) s.add(n.v); if (n.a) varsLog(n.a, s); if (n.b) varsLog(n.b, s); return s; }
function subsLog(n, out = []) { if (n.a) subsLog(n.a, out); if (n.b) subsLog(n.b, out); if (n.op) out.push(n); return out; }

// ===== 1. Sandhedstabel =====
(function () {
  const inp = document.getElementById('ttin'); if (!inp) return;
  const out = document.getElementById('ttout'), info = document.getElementById('ttinfo');
  const TV = b => (b ? '<span class="tv1">S</span>' : '<span class="tv0">F</span>');
  const TVe = b => (b ? '<span class="tv1">T</span>' : '<span class="tv0">F</span>');
  function run() {
    let tree; try { tree = parseLog(inp.value); } catch (e) { out.innerHTML = ''; info.innerHTML = '<span class="warn">' + e.message + '</span>'; return; }
    const vs = [...varsLog(tree)].sort(); if (vs.length > 5) { info.innerHTML = L('Højst 5 variable, tak.', 'At most 5 variables, please.'); return; }
    const subs = subsLog(tree), cols = subs.map(s => showLog(s, true)); const uniq = []; subs.forEach((s, k) => { if (!uniq.some(u => u[1] === cols[k])) uniq.push([s, cols[k]]); });
    let h = '<table class="tt"><tr>' + vs.map(v => `<th>${v}</th>`).join('') + uniq.map(([s, c], k) => `<th class="${k === uniq.length - 1 ? 'res' : ''}">${c}</th>`).join('') + '</tr>';
    let nT = 0; const N = 1 << vs.length;
    for (let r = 0; r < N; r++) { const e = {}; vs.forEach((v, k) => (e[v] = !((r >> (vs.length - 1 - k)) & 1)));
      const res = evalLog(tree, e); if (res) nT++;
      h += '<tr>' + vs.map(v => `<td class="var">${(LANG_EN ? TVe : TV)(e[v])}</td>`).join('') + uniq.map(([s], k) => `<td class="${k === uniq.length - 1 ? 'res' : ''}">${(LANG_EN ? TVe : TV)(evalLog(s, e))}</td>`).join('') + '</tr>'; }
    out.innerHTML = h + '</table>';
    const kind = nT === N ? L('<b>Tautologi</b> – sand i alle rækker (logisk sandhed)', '<b>Tautology</b> – true in every row (a logical truth)') : nT === 0 ? L('<b>Modstrid</b> – falsk i alle rækker', '<b>Contradiction</b> – false in every row') : L(`<b>Kontingent</b> – sand i ${nT} af ${N} rækker; sandheden afhænger af omstændighederne`, `<b>Contingent</b> – true in ${nT} of ${N} rows; its truth depends on the circumstances`);
    info.innerHTML = kind;
  }
  inp.addEventListener('input', run);
  document.querySelectorAll('#ttsym button').forEach(b => (b.onclick = () => { const p = inp.selectionStart ?? inp.value.length; inp.value = inp.value.slice(0, p) + b.dataset.s + inp.value.slice(inp.selectionEnd ?? p); inp.focus(); inp.selectionStart = inp.selectionEnd = p + b.dataset.s.length; run(); }));
  document.querySelectorAll('#ttpre button').forEach(b => (b.onclick = () => { inp.value = b.dataset.e; run(); }));
  run();
})();

// ===== 2. Logiske porte og halvadderen =====
(function () {
  if (!document.getElementById('gatecv')) return;
  const x = mkcv('gatecv', 900, 360), info = document.getElementById('gateinfo');
  let g = 'AND', A = 1, B = 0;
  const F = { AND: (a, b) => a & b, OR: (a, b) => a | b, NOT: a => 1 - a, NAND: (a, b) => 1 - (a & b), NOR: (a, b) => 1 - (a | b), XOR: (a, b) => a ^ b };
  const SYM = { AND: 'A ∧ B', OR: 'A ∨ B', NOT: '¬A', NAND: '¬(A ∧ B)', NOR: '¬(A ∨ B)', XOR: 'A ⊕ B' };
  function wire(pts, on) { const th = TH(); x.strokeStyle = on ? th.gold : th.dim; x.lineWidth = on ? 3 : 2; x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(...p) : x.moveTo(...p))); x.stroke(); x.lineWidth = 1; }
  function gate(type, cx, cy, s = 1) { // tegner porten med midte (cx,cy); returnerer [indgang1, indgang2, udgang]
    const th = TH(); x.strokeStyle = th.ice; x.fillStyle = PR ? '#eef4fb' : '#0e1830'; x.lineWidth = 2.2;
    const w = 90 * s, h = 70 * s, l = cx - w / 2, r = cx + w / 2, t = cy - h / 2, b = cy + h / 2; let out = r;
    const base = type.replace('N', '').replace('XO', 'XO');
    const bt = type === 'NAND' ? 'AND' : type === 'NOR' ? 'OR' : type;
    x.beginPath();
    if (bt === 'AND') { x.moveTo(l, t); x.lineTo(cx, t); x.arc(cx, cy, h / 2, -Math.PI / 2, Math.PI / 2); x.lineTo(l, b); x.closePath(); out = cx + h / 2; }
    else if (bt === 'OR' || bt === 'XOR') { x.moveTo(l, t); x.quadraticCurveTo(cx + 10 * s, t, r, cy); x.quadraticCurveTo(cx + 10 * s, b, l, b); x.quadraticCurveTo(l + 22 * s, cy, l, t); out = r; }
    else if (bt === 'NOT') { x.moveTo(l, t); x.lineTo(r - 10 * s, cy); x.lineTo(l, b); x.closePath(); out = r - 10 * s; }
    x.fill(); x.stroke();
    if (bt === 'XOR') { x.beginPath(); x.moveTo(l - 12 * s, t); x.quadraticCurveTo(l + 10 * s, cy, l - 12 * s, b); x.stroke(); }
    if (type === 'NAND' || type === 'NOR' || type === 'NOT') { x.beginPath(); x.arc(out + 7 * s, cy, 7 * s, 0, 7); x.fill(); x.stroke(); out += 14 * s; }
    x.lineWidth = 1; const inX = bt === 'OR' || bt === 'XOR' ? l + 10 * s : l;
    return bt === 'NOT' ? [[inX, cy], null, [out, cy]] : [[inX, cy - h / 4], [inX, cy + h / 4], [out, cy]];
  }
  function sw(px, py, v, lab) { const th = TH(); x.fillStyle = v ? th.gold : th.dim; x.beginPath(); x.arc(px, py, 16, 0, 7); x.fill(); ctext(x, String(v), px, py + 5, PR ? '#fff' : '#05070b', 'center', 'bold 15px system-ui'); ctext(x, lab, px - 28, py + 5, th.t, 'right', '15px system-ui'); }
  function lamp(px, py, v, lab) { const th = TH(); if (v && !PR) { const gr = x.createRadialGradient(px, py, 4, px, py, 46); gr.addColorStop(0, 'rgba(242,213,144,.65)'); gr.addColorStop(1, 'rgba(242,213,144,0)'); x.fillStyle = gr; x.beginPath(); x.arc(px, py, 46, 0, 7); x.fill(); }
    x.fillStyle = v ? th.gold : (PR ? '#ddd' : '#1a2235'); x.strokeStyle = th.gold; x.lineWidth = 2; x.beginPath(); x.arc(px, py, 18, 0, 7); x.fill(); x.stroke(); x.lineWidth = 1; ctext(x, lab + ' = ' + v, px + 30, py + 5, th.t, 'left', '15px system-ui'); }
  function draw() {
    const th = TH(); clr(x);
    if (g === 'HALF') {
      const s1 = [120, 110], s2 = [120, 250]; const S = A ^ B, C = A & B;
      const p1 = gate('XOR', 470, 110, 1), p2 = gate('AND', 470, 250, 1);
      wire([s1, [300, s1[1]], [300, p1[0][1]], p1[0]], A); wire([[300, s1[1]], [300, p2[0][1]], p2[0]], A);
      wire([s2, [340, s2[1]], [340, p1[1][1]], p1[1]], B); wire([[340, s2[1]], [340, p2[1][1]], p2[1]], B);
      x.fillStyle = A ? th.gold : th.dim; x.beginPath(); x.arc(300, s1[1], 4, 0, 7); x.fill(); x.fillStyle = B ? th.gold : th.dim; x.beginPath(); x.arc(340, s2[1], 4, 0, 7); x.fill();
      wire([p1[2], [690, 110]], S); wire([p2[2], [690, 250]], C);
      sw(...s1, A, 'A'); sw(...s2, B, 'B'); lamp(700, 110, S, L('Sum S', 'Sum S')); lamp(700, 250, C, L('Mente C', 'Carry C'));
      ctext(x, 'XOR', 470, 160, th.tm, 'center', '12px system-ui'); ctext(x, 'AND', 470, 300, th.tm, 'center', '12px system-ui');
      info.innerHTML = L(`<b>Halvadder</b>: ${A} + ${B} = ${C}${S} (binært) = ${A + B}<br>S = A ⊕ B, C = A ∧ B`, `<b>Half adder</b>: ${A} + ${B} = ${C}${S} (binary) = ${A + B}<br>S = A ⊕ B, C = A ∧ B`);
      return;
    }
    const v = g === 'NOT' ? F.NOT(A) : F[g](A, B);
    const p = gate(g, 450, 170, 1.5);
    wire([[180, g === 'NOT' ? 170 : 120], [300, g === 'NOT' ? 170 : 120], [300, p[0][1]], p[0]], A);
    if (g !== 'NOT') wire([[180, 220], [300, 220], [300, p[1][1]], p[1]], B);
    wire([p[2], [690, 170]], v);
    sw(160, g === 'NOT' ? 170 : 120, A, 'A'); if (g !== 'NOT') sw(160, 220, B, 'B'); lamp(705, 170, v, 'Y');
    ctext(x, g + '   Y = ' + SYM[g], 450, 300, th.t, 'center', '15px system-ui');
    // lille sandhedstabel
    const rows = g === 'NOT' ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]]; const tx = 770, ty = 40;
    ctext(x, g === 'NOT' ? 'A  Y' : 'A B  Y', tx, ty, th.tm, 'left', '13px monospace');
    rows.forEach((rw, k) => { const y = g === 'NOT' ? F.NOT(rw[0]) : F[g](rw[0], rw[1]); const cur = rw[0] === A && (g === 'NOT' || rw[1] === B);
      ctext(x, (g === 'NOT' ? rw[0] + '  ' : rw[0] + ' ' + rw[1] + '  ') + y, tx, ty + 22 * (k + 1), cur ? th.gold : th.t, 'left', (cur ? 'bold ' : '') + '13px monospace'); });
    info.innerHTML = L(`Klik på A og B for at skifte mellem 0 og 1 · Y = ${v}`, `Click A and B to switch between 0 and 1 · Y = ${v}`);
  }
  const cv = document.getElementById('gatecv');
  cv.addEventListener('click', ev => { const r = cv.getBoundingClientRect(), px = (ev.clientX - r.left) / r.width * 900, py = (ev.clientY - r.top) / r.height * 360;
    const pa = g === 'HALF' ? [120, 110] : [160, g === 'NOT' ? 170 : 120], pb = g === 'HALF' ? [120, 250] : [160, 220];
    if (Math.hypot(px - pa[0], py - pa[1]) < 30) A = 1 - A; else if (g !== 'NOT' && Math.hypot(px - pb[0], py - pb[1]) < 30) B = 1 - B; draw(); });
  document.getElementById('gateA').onclick = () => { A = 1 - A; draw(); }; document.getElementById('gateB').onclick = () => { B = 1 - B; draw(); };
  chips('#gatesel button.chip', b => { g = b.dataset.g; draw(); });
  draw(); REDRAW.push(draw);
})();

// ===== 3. Venn-diagram: logik = mængdelære =====
(function () {
  if (!document.getElementById('venncv')) return;
  const W = 900, H = 420, x = mkcv('venncv', W, H), inp = document.getElementById('vennin'), info = document.getElementById('venninfo');
  const C = [[470, 175, 120, 'A'], [630, 175, 120, 'B'], [550, 290, 120, 'C']];
  const U = [250, 30, 600, 370];
  function draw() {
    const th = TH(); clr(x); let tree;
    try { tree = parseLog(inp.value.replace(/[a-c]/g, m => m.toUpperCase())); } catch (e) { info.innerHTML = '<span class="warn">' + e.message + '</span>'; tree = null; }
    const vs = tree ? [...varsLog(tree)] : []; const bad = vs.filter(v => !'ABCU'.includes(v));
    if (bad.length) { info.innerHTML = L('Brug kun mængderne A, B og C (og U for universet).', 'Use only the sets A, B and C (and U for the universe).'); tree = null; }
    const cvs = x.canvas, d = cvs.width / W;
    if (tree) { const img = x.getImageData(0, 0, cvs.width, cvs.height), D = img.data, col = PR ? [226, 200, 140] : [96, 74, 34];
      const X0 = Math.floor(U[0] * d), X1 = Math.ceil((U[0] + U[2]) * d), Y0 = Math.floor(U[1] * d), Y1 = Math.ceil((U[1] + U[3]) * d);
      for (let Y = Y0; Y < Y1; Y++) for (let X = X0; X < X1; X++) { const px = X / d, py = Y / d, e = { U: true }; C.forEach(([cx, cy, r, n]) => (e[n] = (px - cx) ** 2 + (py - cy) ** 2 < r * r));
        if (evalLog(tree, e)) { const k = 4 * (Y * cvs.width + X); D[k] = col[0]; D[k + 1] = col[1]; D[k + 2] = col[2]; } }
      x.putImageData(img, 0, 0);
      info.innerHTML = L(`Skraveret: <b>${showLog(tree, true).replace(/∧/g, '∩').replace(/∨/g, '∪')}</b><br>I logik: ∩ = og (∧), ∪ = eller (∨), komplement = ikke (¬)`, `Shaded: <b>${showLog(tree, true).replace(/∧/g, '∩').replace(/∨/g, '∪')}</b><br>In logic: ∩ = and (∧), ∪ = or (∨), complement = not (¬)`); }
    x.strokeStyle = th.tm; x.lineWidth = 1.5; x.strokeRect(...U); ctext(x, 'U', U[0] + 10, U[1] + 22, th.tm, 'left', '16px system-ui');
    const cc = [th.ice, th.red, th.grn];
    C.forEach(([cx, cy, r, n], k) => { x.strokeStyle = cc[k]; x.lineWidth = 2.5; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.stroke(); });
    ctext(x, 'A', 350, 90, cc[0], 'left', 'bold 20px system-ui'); ctext(x, 'B', 740, 90, cc[1], 'left', 'bold 20px system-ui'); ctext(x, 'C', 675, 385, cc[2], 'left', 'bold 20px system-ui');
    x.lineWidth = 1;
  }
  inp.addEventListener('input', draw);
  document.querySelectorAll('#vennpre button').forEach(b => (b.onclick = () => { inp.value = b.dataset.e; draw(); }));
  draw(); REDRAW.push(draw);
})();

// ===== 4. Wasons kortopgave =====
(function () {
  const box = document.getElementById('wason'); if (!box) return;
  const info = document.getElementById('wasoninfo');
  const SETS = {
    abs: { rule: L('Hvis et kort har en vokal på den ene side, så har det et lige tal på den anden side.', 'If a card has a vowel on one side, then it has an even number on the other side.'), cards: ['E', 'K', '4', '7'], right: [0, 3],
      why: L('Kun <b>E</b> og <b>7</b> kan afsløre et brud på reglen: E kunne have et ulige tal bag sig, og 7 kunne have en vokal. Kortet 4 er irrelevant – reglen siger intet om, hvad der står bag et lige tal (at vende det er at begå fejlslutningen „bekræftelse af efterleddet“).',
        'Only <b>E</b> and <b>7</b> can reveal a breach of the rule: E might have an odd number behind it, and 7 might have a vowel. The 4 card is irrelevant – the rule says nothing about what is behind an even number (turning it is the fallacy of “affirming the consequent”).') },
    soc: { rule: L('Hvis en person drikker øl, så skal personen være mindst 18 år.', 'If a person is drinking beer, then the person must be at least 18 years old.'), cards: [L('øl', 'beer'), L('cola', 'cola'), L('25 år', '25 years'), L('16 år', '16 years')], right: [0, 3],
      why: L('Man skal tjekke <b>øl</b>-drikkeren (er vedkommende gammel nok?) og den <b>16-årige</b> (drikker vedkommende øl?). Logisk er det præcis samme opgave som med bogstaver og tal – men her løser de fleste den.',
        'You must check the <b>beer</b> drinker (old enough?) and the <b>16-year-old</b> (drinking beer?). Logically it is exactly the same task as with letters and numbers – but here most people solve it.') }
  };
  let set = 'abs', sel = new Set();
  function render(reveal) {
    const S = SETS[set]; document.getElementById('wasonrule').innerHTML = S.rule;
    box.innerHTML = S.cards.map((c, k) => `<button class="wcard${sel.has(k) ? ' on' : ''}${reveal ? (S.right.includes(k) ? ' ok' : ' no') : ''}" data-k="${k}">${c}</button>`).join('');
    box.querySelectorAll('button').forEach(b => (b.onclick = () => { const k = +b.dataset.k; sel.has(k) ? sel.delete(k) : sel.add(k); render(false); info.innerHTML = ''; }));
  }
  document.getElementById('wasoncheck').onclick = () => { const S = SETS[set]; const ok = sel.size === 2 && S.right.every(k => sel.has(k)); render(true);
    info.innerHTML = (ok ? L('<span class="msg">Rigtigt!</span> ', '<span class="msg">Correct!</span> ') : L('<span class="warn">Ikke helt.</span> ', '<span class="warn">Not quite.</span> ')) + S.why; };
  chips('#wasonsel button.chip', b => { set = b.dataset.s; sel = new Set(); info.innerHTML = ''; render(false); });
  render(false);
})();
