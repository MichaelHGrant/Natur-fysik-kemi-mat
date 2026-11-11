// dthfig.js – fælles tegnefunktioner til DTH-siderne: kredsløbsdiagrammer (IEC-symboler),
// logiske gates, strømprikker og animation. Kræver fysikfag.js (el, txt, LANG_EN).
'use strict';
const T = (da, en) => (LANG_EN ? en : da);

const SK = {
  // ----- grundlæggende -----
  wire(svg, pts, cls) { return el('polyline', { points: pts.map(p => p.join(',')).join(' '), class: cls || 'sk-w' }, svg); },
  dot(svg, x, y) { return el('circle', { cx: x, cy: y, r: 3.6, class: 'sk-node' }, svg); },
  _f(x1, y1, x2, y2) { const L = Math.hypot(x2 - x1, y2 - y1), a = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI; return { L, a, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2, vert: Math.abs(Math.abs(a) - 90) < 1 }; },
  _g(svg, f) { return el('g', { transform: `translate(${f.cx},${f.cy}) rotate(${f.a})` }, svg); },
  _leads(g, L, w) { el('line', { x1: -L / 2, y1: 0, x2: -w / 2, y2: 0, class: 'sk-w' }, g); el('line', { x1: w / 2, y1: 0, x2: L / 2, y2: 0, class: 'sk-w' }, g); },
  label(svg, f, main, val, side) {
    const s = side || 1;
    if (f.vert) {
      const t = SK.tx(svg, main, f.cx + 18 * s, f.cy - 2, 'sk-lab', s > 0 ? 'start' : 'end');
      let v = null; if (val !== undefined) v = txt(val, f.cx + 18 * s, f.cy + 15, 'sk-val', svg, s > 0 ? 'start' : 'end');
      return { t, v };
    }
    const t = SK.tx(svg, main, f.cx, f.cy - 18 * s - (s < 0 ? -10 : 0), 'sk-lab', 'middle');
    let v = null; if (val !== undefined) v = txt(val, f.cx, f.cy + (s > 0 ? 28 : -30), 'sk-val', svg, 'middle');
    return { t, v };
  },
  // tekst med sænkede indeks: "U_A", "u_{ind}"
  tx(svg, s, x, y, cls, anchor) {
    const t = el('text', { x, y, class: cls || 'sk-lab', 'text-anchor': anchor || 'start' }, svg);
    const re = /_\{([^}]*)\}|_([A-Za-z0-9æøåÆØÅ]+)/g; let last = 0, m, low = false;
    const add = (str, sub) => { const a = {}; if (sub && !low) a.dy = 4; if (!sub && low) a.dy = -4; low = sub; if (sub) a['font-size'] = '78%'; const sp = el('tspan', a, t); sp.textContent = str; };
    while ((m = re.exec(s))) { if (m.index > last) add(s.slice(last, m.index), false); add(m[1] || m[2], true); last = re.lastIndex; }
    if (last < s.length) add(s.slice(last), false);
    return t;
  },
  // ----- komponenter mellem to punkter -----
  resistor(svg, x1, y1, x2, y2, name, val, o = {}) {
    const f = this._f(x1, y1, x2, y2), g = this._g(svg, f), w = Math.min(54, f.L * 0.6);
    this._leads(g, f.L, w); el('rect', { x: -w / 2, y: -9, width: w, height: 18, rx: 2, class: o.cls || 'sk-c' }, g);
    return Object.assign({ g, f }, name ? this.label(svg, f, name, val, o.side) : {});
  },
  capacitor(svg, x1, y1, x2, y2, name, val, o = {}) {
    const f = this._f(x1, y1, x2, y2), g = this._g(svg, f), gap = 6;
    this._leads(g, f.L, 2 * gap);
    el('line', { x1: -gap, y1: -15, x2: -gap, y2: 15, class: 'sk-w sk-thick' }, g); el('line', { x1: gap, y1: -15, x2: gap, y2: 15, class: 'sk-w sk-thick' }, g);
    return Object.assign({ g, f }, name ? this.label(svg, f, name, val, o.side) : {});
  },
  inductor(svg, x1, y1, x2, y2, name, val, o = {}) {
    const f = this._f(x1, y1, x2, y2), g = this._g(svg, f), n = 4, w = Math.min(56, f.L * 0.6), r = w / (2 * n);
    this._leads(g, f.L, w);
    let d = `M${-w / 2},0`; for (let i = 0; i < n; i++) d += ` a${r},${r} 0 0 1 ${2 * r},0`;
    el('path', { d, class: 'sk-w' }, g);
    return Object.assign({ g, f }, name ? this.label(svg, f, name, val, o.side) : {});
  },
  // spændingskilde: plus ved (x1,y1)
  source(svg, x1, y1, x2, y2, name, val, o = {}) {
    const f = this._f(x1, y1, x2, y2), g = this._g(svg, f), R = 17;
    this._leads(g, f.L, 2 * R); el('circle', { cx: 0, cy: 0, r: R, class: 'sk-c' }, g);
    if (o.ac) el('path', { d: 'M-9,0 q4.5,-10 9,0 t9,0', class: 'sk-w', transform: `rotate(${-f.a})` }, g);
    else { const t1 = txt('+', -8, 5, 'sk-lab', g, 'middle'); t1.setAttribute('transform', `rotate(${-f.a} -8 0)`); const t2 = txt('−', 9, 5, 'sk-lab', g, 'middle'); t2.setAttribute('transform', `rotate(${-f.a} 9 0)`); }
    return Object.assign({ g, f }, name ? this.label(svg, f, name, val, o.side) : {});
  },
  // kontakt, der kan klikkes; state() returnerer true for sluttet
  switch(svg, x1, y1, x2, y2, name, closed, onToggle) {
    const f = this._f(x1, y1, x2, y2), g = this._g(svg, f), w = 34;
    this._leads(g, f.L, w);
    el('circle', { cx: -w / 2, cy: 0, r: 3.5, class: 'sk-node' }, g); el('circle', { cx: w / 2, cy: 0, r: 3.5, class: 'sk-node' }, g);
    const lever = el('line', { x1: -w / 2, y1: 0, x2: w / 2, y2: closed ? 0 : -16, class: 'sk-w sk-thick' }, g);
    const hit = el('rect', { x: -w / 2 - 8, y: -26, width: w + 16, height: 38, fill: 'transparent', style: 'cursor:pointer' }, g);
    let st = closed;
    hit.onclick = () => { st = !st; lever.setAttribute('y2', st ? 0 : -16); if (onToggle) onToggle(st); };
    if (name) this.label(svg, f, name);
    return { g, f, state: () => st, set: v => { st = v; lever.setAttribute('y2', st ? 0 : -16); } };
  },
  meter(svg, x, y, letter, cls) {
    el('circle', { cx: x, cy: y, r: 15, class: cls || 'sk-c' }, svg);
    txt(letter, x, y + 5, 'sk-lab', svg, 'middle').setAttribute('style', 'font-weight:700');
  },
  ground(svg, x, y) {
    el('line', { x1: x, y1: y, x2: x, y2: y + 8, class: 'sk-w' }, svg);
    [[14, 8], [9, 13], [4, 18]].forEach(([w, yy]) => el('line', { x1: x - w, y1: y + yy, x2: x + w, y2: y + yy, class: 'sk-w' }, svg));
  },
  // pil for strøm ved midten af et ledningsstykke
  arrow(svg, x1, y1, x2, y2, label, cls) {
    const a = Math.atan2(y2 - y1, x2 - x1), cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    const g = el('g', { transform: `translate(${cx},${cy}) rotate(${a * 180 / Math.PI})` }, svg);
    el('path', { d: 'M-6,-5 L6,0 L-6,5 z', class: cls || 'sg-ice' }, g);
    if (label) { const t = txt(label, 0, -10, 'sk-val', g, 'middle'); t.setAttribute('transform', `rotate(${-a * 180 / Math.PI} 0 -10)`); }
    return g;
  },
  // ----- strømprikker langs en polylinje -----
  flow(svg, pts, spacing = 22) {
    const seg = []; let tot = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push([pts[i - 1], pts[i], tot, l]); tot += l; }
    const g = el('g', {}, svg), n = Math.max(1, Math.floor(tot / spacing)), dots = [];
    for (let k = 0; k < n; k++) dots.push(el('circle', { r: 3.2, class: 'sk-dot' }, g));
    let ph = 0;
    const at = s => { s = ((s % tot) + tot) % tot; for (const [p, q, s0, l] of seg) if (s <= s0 + l) { const t = (s - s0) / l; return [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]; } return pts[pts.length - 1]; };
    const place = () => dots.forEach((d, k) => { const [x, y] = at(ph + k * tot / n); d.setAttribute('cx', x.toFixed(1)); d.setAttribute('cy', y.toFixed(1)); });
    place();
    return { step(v) { ph += v; place(); }, show(b) { g.style.display = b ? '' : 'none'; } };
  },
  // animation, der kun kører, når figuren er synlig
  animate(node, frame) {
    let raf = null, last = 0, run = true;
    const loop = t => { const dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t; frame(dt); raf = run ? requestAnimationFrame(loop) : null; };
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && run && !raf) { last = 0; raf = requestAnimationFrame(loop); } else if (!e.isIntersecting && raf) { cancelAnimationFrame(raf); raf = null; } }));
    io.observe(node);
    return { stop() { run = false; if (raf) { cancelAnimationFrame(raf); raf = null; } }, start() { run = true; if (!raf) { last = 0; raf = requestAnimationFrame(loop); } }, get running() { return run; } };
  },
  // ----- logiske gates (amerikanske symboler) -----
  // tegnes med venstre kant ved x og midten ved y; returnerer pinpositioner
  gate(svg, type, x, y, out) {
    const g = el('g', {}, svg), w = 56, h = 40, cls = out ? 'sk-gate sk-gate-on' : 'sk-gate';
    let d, ox = x + w;
    if (type === 'AND' || type === 'NAND') d = `M${x},${y - h / 2} h${w / 2} a${h / 2},${h / 2} 0 0 1 0,${h} h${-w / 2} z`;
    else if (type === 'OR' || type === 'NOR' || type === 'XOR') d = `M${x},${y - h / 2} q${w * 0.6},0 ${w},${h / 2} q${-w * 0.4},${h / 2} ${-w},${h / 2} q${w * 0.3},${-h / 2} 0,${-h} z`;
    else if (type === 'NOT') { d = `M${x},${y - h / 2.6} L${x + w * 0.7},${y} L${x},${y + h / 2.6} z`; ox = x + w * 0.7; }
    el('path', { d, class: cls }, g);
    if (type === 'XOR') el('path', { d: `M${x - 7},${y - h / 2} q${w * 0.3},${h / 2} 0,${h}`, class: 'sk-w' }, g);
    if (type === 'NAND' || type === 'NOR' || type === 'NOT') { el('circle', { cx: ox + 5, cy: y, r: 5, class: cls }, g); ox += 10; }
    const name = txt(type, x + w * 0.42, y + 4, 'sk-glab', g, 'middle');
    if (type === 'NOT') name.textContent = '';
    const ins = type === 'NOT' ? [[x, y]] : [[x + (type.includes('OR') ? 6 : 0), y - 10], [x + (type.includes('OR') ? 6 : 0), y + 10]];
    return { g, out: [ox, y], in: ins };
  },
  level(svg, pts, v) { return el('polyline', { points: pts.map(p => p.join(',')).join(' '), class: v ? 'sk-hi' : 'sk-lo' }, svg); },
  bit(svg, x, y, v, label, onclick) {
    const g = el('g', { style: onclick ? 'cursor:pointer' : '' }, svg);
    el('rect', { x: x - 16, y: y - 16, width: 32, height: 32, rx: 6, class: v ? 'sg-gold' : 'sg-dimf' }, g);
    const t = txt(String(v), x, y + 7, 'sk-lab', g, 'middle'); t.setAttribute('style', 'font-size:19px;font-weight:700;fill:' + (v ? '#05070b' : '#cfd4df'));
    if (label) txt(label, x, y - 23, 'sk-lab', g, 'middle');
    if (onclick) g.onclick = onclick;
    return g;
  }
};
