// fysikfag.js – fælles hjælpefunktioner til SVG-figurerne på fagsiderne (plasma, faststof, termodynamik m.fl.)
'use strict';
const NS = 'http://www.w3.org/2000/svg';
function el(t, a, p) { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
function txt(s, x, y, cls, p, anchor) { const t = el('text', { x, y, class: cls, 'text-anchor': anchor || 'start' }, p); t.textContent = s; return t; }
const fmt = (v, d = 2) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(d).replace('.', ',');
const sup = n => String(n).replace('-', '⁻').replace(/\d/g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]);
function fmtSci(v, d = 2) {
  if (v === 0 || !isFinite(v)) return String(v);
  const e = Math.floor(Math.log10(Math.abs(v)));
  if (e >= -2 && e <= 4) return fmt(v, Math.max(0, d - e));
  return fmt(v / 10 ** e, d) + '·10' + sup(e);
}
// Akser: returnerer {X, Y} mapping-funktioner. opt: {x0,x1,y0,y1, logx, logy, xt:[ticks], yt:[ticks], xl, yl, xf, yf}
function axes(svg, gx, gy, gw, gh, o) {
  const lx = v => o.logx ? Math.log10(v) : v, ly = v => o.logy ? Math.log10(v) : v;
  const X = v => gx + (lx(v) - lx(o.x0)) / (lx(o.x1) - lx(o.x0)) * gw;
  const Y = v => gy + gh - (ly(v) - ly(o.y0)) / (ly(o.y1) - ly(o.y0)) * gh;
  (o.yt || []).forEach(v => { el('line', { x1: gx, y1: Y(v), x2: gx + gw, y2: Y(v), class: 'sg-grid' }, svg); txt(o.yf ? o.yf(v) : String(v).replace('.', ','), gx - 6, Y(v) + 4, 'sg-tm', svg, 'end'); });
  (o.xt || []).forEach(v => { el('line', { x1: X(v), y1: gy, x2: X(v), y2: gy + gh, class: 'sg-grid' }, svg); txt(o.xf ? o.xf(v) : String(v).replace('.', ','), X(v), gy + gh + 16, 'sg-tm', svg, 'middle'); });
  el('line', { x1: gx, y1: gy + gh, x2: gx + gw, y2: gy + gh, class: 'sg-ax' }, svg);
  el('line', { x1: gx, y1: gy, x2: gx, y2: gy + gh, class: 'sg-ax' }, svg);
  if (o.xl) txt(o.xl, gx + gw, gy + gh + 34, 'sg-tm', svg, 'end');
  if (o.yl) txt(o.yl, gx + 6, gy + 12, 'sg-tm', svg);
  return { X, Y };
}
function curve(svg, f, a, b, X, Y, cls, n = 300, clip) {
  let d = '', pen = false;
  for (let i = 0; i <= n; i++) {
    const x = a + (b - a) * i / n, y = f(x);
    if (!isFinite(y) || (clip && (y < clip[0] || y > clip[1]))) { pen = false; continue; }
    d += (pen ? ' L' : ' M') + X(x).toFixed(1) + ',' + Y(y).toFixed(1); pen = true;
  }
  return el('path', { d: d.trim(), class: cls }, svg);
}
function logspace(a, b, n) { const out = []; for (let i = 0; i <= n; i++) out.push(10 ** (Math.log10(a) + (Math.log10(b) - Math.log10(a)) * i / n)); return out; }
function onRange(id, f) { const e = document.getElementById(id); e.addEventListener('input', f); return e; }
function chips(sel, f) { const bs = document.querySelectorAll(sel); bs.forEach(b => b.addEventListener('click', () => { bs.forEach(x => x.classList.toggle('on', x === b)); f(b); })); }
const PHYS = { e: 1.602176634e-19, me: 9.1093837e-31, mp: 1.67262192e-27, kB: 1.380649e-23, eps0: 8.8541878128e-12, mu0: 1.25663706212e-6, c: 2.99792458e8, h: 6.62607015e-34, hbar: 1.054571817e-34, NA: 6.02214076e23, R: 8.314462618, sigma: 5.670374419e-8 };
