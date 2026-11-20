/* lorentz-roer-sim.js — mhgfysik.dk
   Lyd i rør med strømning: tre interaktive 3D-simuleringer (Three.js r128).
   Sproget vælges med window.LR_LANG = 'da' | 'en'.  CC BY 4.0, Michael H. Grant */
(function () {
'use strict';
const LANG = window.LR_LANG === 'en' ? 'en' : 'da';
const TX = {
  da: {
    lab: 'Laboratoriet', gal: 'Gassens system (Galilei)', lor: 'Lorentz-systemet',
    play: '⏸ Pause', pause: '▶ Afspil', mode0: 'Plan bølge (0)', mode1: 'Mode (1,0)',
    down: 'medstrøms', up: 'modstrøms', lam: 'bølgelængde', cut: 'grænsefrekvens for (1,0)',
    cutoff: 'under grænsefrekvensen – moden dør ud', flowgone: 'Ingen strømning i ligningen – mønsteret er symmetrisk',
    wallsmove: 'Gassen står stille – men røret og højttaleren glider baglæns',
    wallsstill: 'Væggene står stille, gassen strømmer', stretched: 'Røret er strakt med γ',
    freq: 'frekvens', TL: 'Transmissionstab', chamberM: 'Mach i kammeret',
    att: 'Dæmpning', per1m: 'TL for 1 m foret rør', solving: 'regner …',
    noflow: 'uden strømning', ax_f: 'f [Hz]', ax_TL: 'TL [dB]', ax_att: 'dB/m',
    peak: 'toppunkt'
  },
  en: {
    lab: 'Laboratory', gal: 'Gas frame (Galilei)', lor: 'Lorentz frame',
    play: '⏸ Pause', pause: '▶ Play', mode0: 'Plane wave (0)', mode1: 'Mode (1,0)',
    down: 'downstream', up: 'upstream', lam: 'wavelength', cut: 'cut-on frequency of (1,0)',
    cutoff: 'below cut-on – the mode is evanescent', flowgone: 'No flow in the equation – the pattern is symmetric',
    wallsmove: 'The gas is at rest – but the duct and the loudspeaker slide backwards',
    wallsstill: 'The walls are at rest, the gas flows', stretched: 'The duct is stretched by γ',
    freq: 'frequency', TL: 'Transmission loss', chamberM: 'Mach in chamber',
    att: 'Attenuation', per1m: 'TL for 1 m of lined duct', solving: 'computing …',
    noflow: 'no flow', ax_f: 'f [Hz]', ax_TL: 'TL [dB]', ax_att: 'dB/m',
    peak: 'peak'
  }
}[LANG];
const fmt = (v, n = 2) => (LANG === 'da' ? v.toFixed(n).replace('.', ',') : v.toFixed(n));

/* ---------------- komplekse tal ---------------- */
const cx = (re, im = 0) => ({ re, im });
const add = (a, b) => cx(a.re + b.re, a.im + b.im);
const sub = (a, b) => cx(a.re - b.re, a.im - b.im);
const mul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const scl = (a, s) => cx(a.re * s, a.im * s);
const div = (a, b) => { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
const abs = a => Math.hypot(a.re, a.im);
const csqrt = a => { const r = abs(a); let re = Math.sqrt((r + a.re) / 2), im = Math.sqrt(Math.max(0, (r - a.re) / 2)); if (a.im < 0) im = -im; return cx(re, im); };
const cexp = a => { const e = Math.exp(a.re); return cx(e * Math.cos(a.im), e * Math.sin(a.im)); };
const csin = a => cx(Math.sin(a.re) * Math.cosh(a.im), Math.cos(a.re) * Math.sinh(a.im));
const ccos = a => cx(Math.cos(a.re) * Math.cosh(a.im), -Math.sin(a.re) * Math.sinh(a.im));
const I = cx(0, 1);
const brDecay = z => { const s = csqrt(z); return s.im > 0 ? scl(s, -1) : s; }; // Im <= 0

const c0 = 343, rho = 1.21;

/* ---------------- farver og fælles 3D ---------------- */
function colorFor(v, out) { // v i [-1,1]
  v = Math.max(-1, Math.min(1, v));
  if (v >= 0) { out[0] = 0.25 + 0.75 * v; out[1] = 0.27 + 0.45 * v; out[2] = 0.32 - 0.12 * v; }
  else { const w = -v; out[0] = 0.25 - 0.15 * w; out[1] = 0.27 + 0.35 * w; out[2] = 0.32 + 0.68 * w; }
}

function makeScene(box, camPos) {
  const W = box.clientWidth, H = box.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(W, H);
  box.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06080d);
  const camera = new THREE.PerspectiveCamera(42, W / H, 0.05, 100);
  camera.position.set(...camPos);
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.enableZoom = true; controls.zoomSpeed = 0.6;
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const dl = new THREE.DirectionalLight(0xffffff, 0.75); dl.position.set(2, 5, 3); scene.add(dl);
  const obj = { renderer, scene, camera, controls, visible: true };
  new ResizeObserver(() => {
    const w = box.clientWidth, h = box.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
  }).observe(box);
  new IntersectionObserver(es => { obj.visible = es[0].isIntersecting; }).observe(box);
  return obj;
}

function makeSurface(nx, ny) {
  const geo = new THREE.PlaneGeometry(1, 1, nx - 1, ny - 1);
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(nx * ny * 3), 3));
  const mat = new THREE.MeshPhongMaterial({ vertexColors: true, side: THREE.DoubleSide, shininess: 40 });
  const mesh = new THREE.Mesh(geo, mat);
  return { mesh, geo, nx, ny };
}
// sæt punkt (i,j): x langs røret, z på tværs, y = højde
function setPt(s, i, j, x, z, h, v, col) {
  const k = j * s.nx + i, p = s.geo.attributes.position.array, c = s.geo.attributes.color.array;
  p[3 * k] = x; p[3 * k + 1] = h; p[3 * k + 2] = z;
  colorFor(v, col); c[3 * k] = col[0]; c[3 * k + 1] = col[1]; c[3 * k + 2] = col[2];
}
function finishSurface(s) {
  s.geo.attributes.position.needsUpdate = true; s.geo.attributes.color.needsUpdate = true;
  s.geo.computeVertexNormals();
}
function lineBox(x0, x1, z0, z1, y0, y1, color, opacity = 1) {
  const g = new THREE.BufferGeometry();
  const P = [];
  const add4 = (a, b) => P.push(...a, ...b);
  for (const y of [y0, y1]) {
    add4([x0, y, z0], [x1, y, z0]); add4([x0, y, z1], [x1, y, z1]);
    add4([x0, y, z0], [x0, y, z1]); add4([x1, y, z0], [x1, y, z1]);
  }
  for (const x of [x0, x1]) for (const z of [z0, z1]) add4([x, y0, z], [x, y1, z]);
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
}
function wallPlane(x0, x1, z, y0, y1, color, opacity) {
  const g = new THREE.PlaneGeometry(x1 - x0, y1 - y0);
  const m = new THREE.Mesh(g, new THREE.MeshPhongMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }));
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, z); return m;
}
function makeParticles(n, color, size = 0.025) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * n), 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.85 }));
  return { pts, g, n };
}

function textSprite(txt, color) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 96;
  const g = cv.getContext('2d'); g.font = 'bold 44px system-ui,sans-serif'; g.fillStyle = color; g.textBaseline = 'middle';
  g.fillText(txt, 8, 48);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false }));
  sp.scale.set(0.9, 0.17, 1); return sp;
}
/* ---------------- små 2D-grafer ---------------- */
function plot(canvas, opt) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = canvas.clientWidth, H = canvas.clientHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  const g = canvas.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  const L = 44, R = 10, T = 10, B = 28, pw = W - L - R, ph = H - T - B;
  const X = x => L + (x - opt.x0) / (opt.x1 - opt.x0) * pw;
  const Y = y => T + ph - (y - opt.y0) / (opt.y1 - opt.y0) * ph;
  g.strokeStyle = '#252f47'; g.fillStyle = '#9ba4b6'; g.font = '11px system-ui,sans-serif'; g.lineWidth = 1;
  for (const xt of opt.xt) { g.beginPath(); g.moveTo(X(xt), T); g.lineTo(X(xt), T + ph); g.stroke(); g.fillText(xt, X(xt) - 10, H - 12); }
  for (const yt of opt.yt) { g.beginPath(); g.moveTo(L, Y(yt)); g.lineTo(L + pw, Y(yt)); g.stroke(); g.fillText(yt, 4, Y(yt) + 4); }
  g.fillText(opt.xl, L + pw - 40, H - 1); g.fillStyle = '#d8b46a'; g.fillText(opt.yl, L + 6, T + 12); g.fillStyle = '#9ba4b6';
  g.save(); g.beginPath(); g.rect(L, T, pw, ph); g.clip();
  for (const s of opt.series) {
    g.strokeStyle = s.color; g.lineWidth = s.w || 1.8; g.setLineDash(s.dash || []); g.beginPath();
    s.x.forEach((x, i) => { const y = Math.min(opt.y1 * 1.5, s.y[i]); i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); });
    g.stroke();
  }
  g.setLineDash([]);
  if (opt.marker != null) { g.strokeStyle = '#f2d590'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(X(opt.marker), T); g.lineTo(X(opt.marker), T + ph); g.stroke(); }
  g.restore();
  let ly = T + 14;
  for (const s of opt.series) if (s.label) {
    g.fillStyle = s.color; g.fillRect(L + pw - 150, ly - 8, 14, 3); g.fillStyle = '#cfd4df'; g.fillText(s.label, L + pw - 132, ly - 3); ly += 15;
  }
}

function bindSlider(id, cb) {
  const el = document.getElementById(id); if (!el) return null;
  el.addEventListener('input', cb); return el;
}

/* =====================================================================
   SIM 1: Røret i tre systemer
   ===================================================================== */
function sim1() {
  const box = document.getElementById('sim1'); if (!box) return;
  const S = makeScene(box, [0, 2.6, 3.4]);
  const NX = 220, NY = 26, XD = 2.6, ZD = 0.55;   // visning: x i [-XD,XD], z i [-ZD/2, ZD/2]
  const bReal = 0.30, half = 1.5;                  // rørets bredde [m], halv længde vist [m]
  const surf = makeSurface(NX, NY); S.scene.add(surf.mesh);
  const outline = new THREE.Group(); S.scene.add(outline);
  const spk = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, ZD), new THREE.MeshPhongMaterial({ color: 0xd8b46a }));
  S.scene.add(spk);
  const rings = new THREE.Group(); S.scene.add(rings); // markører på væggen hver 0,25 m
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x7fd1b9 });
  for (let i = 0; i < 40; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, ZD + 0.04), ringMat); r.position.y = -0.27; rings.add(r); }
  const part = makeParticles(260, 0xc3a6ff); S.scene.add(part.pts);
  const pbase = []; for (let i = 0; i < part.n; i++) pbase.push([Math.random(), Math.random(), Math.random()]);
  const hud = document.getElementById('sim1hud');
  const st = { frame: 'lab', mode: 0, play: true, t: 0 };
  const sM = bindSlider('s1M', upd), sF = bindSlider('s1f', upd);
  document.querySelectorAll('[data-s1frame]').forEach(b => b.onclick = () => { st.frame = b.dataset.s1frame; st.t = 0; upd(); });
  document.querySelectorAll('[data-s1mode]').forEach(b => b.onclick = () => { st.mode = +b.dataset.s1mode; upd(); });
  const pb = document.getElementById('s1play'); pb.onclick = () => { st.play = !st.play; pb.textContent = st.play ? TX.play : TX.pause; };
  let P = {};
  function upd() {
    const M = +sM.value, f = +sF.value;
    document.getElementById('s1Mv').textContent = fmt(M, 2);
    document.getElementById('s1fv').textContent = f + ' Hz';
    document.querySelectorAll('[data-s1frame]').forEach(b => b.classList.toggle('on', b.dataset.s1frame === st.frame));
    document.querySelectorAll('[data-s1mode]').forEach(b => b.classList.toggle('on', +b.dataset.s1mode === st.mode));
    const k = 2 * Math.PI * f / c0, g = 1 / Math.sqrt(1 - M * M), b2 = 1 - M * M, q = st.mode * Math.PI / bReal;
    const root = brDecay(cx(k * k - b2 * q * q));
    const kp = scl(add(cx(-k * M), root), 1 / b2);          // medstrøms (Im<=0)
    const km = scl(sub(cx(-k * M), root), 1 / b2);          // modstrøms (Im>=0)
    const fc = c0 / (2 * bReal) * Math.sqrt(1 - M * M);
    P = { M, f, k, g, q, kp, km, fc, w: 2 * Math.PI * f };
    let txt = '';
    if (Math.abs(root.im) > 1e-9 && st.mode === 1) txt += `<div class="warn">${TX.cutoff}</div>`;
    else txt += `<b>λ₊</b> (${TX.down}) = ${fmt(2 * Math.PI / kp.re, 3)} m &nbsp; <b>λ₋</b> (${TX.up}) = ${fmt(2 * Math.PI / -km.re, 3)} m<br>`;
    txt += `γ = ${fmt(g, 3)} &nbsp; ${TX.cut}: ${Math.round(fc)} Hz` + (st.mode ? '' : '');
    const msg = st.frame === 'lab' ? TX.wallsstill : st.frame === 'gal' ? TX.wallsmove : TX.flowgone + '. ' + TX.stretched + ` (${fmt(g, 3)}).`;
    txt += `<div class="msg">${msg}</div>`;
    hud.innerHTML = txt;
    // omrids
    outline.clear();
    const xs = st.frame === 'lor' ? g : 1;
    const xr = Math.min(XD * 1.25, XD * xs);
    outline.add(lineBox(-xr, xr, -ZD / 2, ZD / 2, -0.27, 0.27, 0x3a4a6e));
    outline.add(wallPlane(-xr, xr, -ZD / 2 - 0.001, -0.27, 0.27, 0x9fd0ff, 0.06));
  }
  const col = [0, 0, 0];
  const sc = XD / half; // visningsenheder pr. meter
  function step(dt) {
    if (st.play) st.t += dt;
    const { M, k, g, q, kp, km, w } = P;
    const Tper = 1.6; // ét periode-forløb vises på 1,6 s
    const phase = 2 * Math.PI * st.t / Tper;          // = ω t (slowmotion)
    const tReal = st.t / Tper / P.f;                  // fysisk tid
    const V = M * c0;
    // vinduet: x_disp -> fysisk x
    const xs = st.frame === 'lor' ? g : 1;
    let shift = 0;                                    // Galilei: x = x'' + V t
    if (st.frame === 'gal') {
      const Treset = 0.9 * half / Math.max(V, 1e-6) ;  // nulstil, før højttaleren forsvinder
      const tr = tReal % Treset; shift = V * tr;
    }
    const xr = Math.min(XD * 1.25, XD * xs);
    for (let i = 0; i < NX; i++) {
      const xd = -xr + 2 * xr * i / (NX - 1);
      let xPhys, extraPh = 0;
      if (st.frame === 'lor') xPhys = (xd / sc) / g;               // x = x'/γ
      else if (st.frame === 'gal') xPhys = xd / sc + shift;       // x = x'' + Vt
      else xPhys = xd / sc;
      const kk = xPhys >= 0 ? kp : km;
      let A = cexp(mul(cx(0, -1), scl(kk, xPhys)));               // e^{-i k_x x}
      let ph = phase;
      if (st.frame === 'lor') {                                    // Φ = P e^{-iKMx'} = P e^{-iγ²kMx}; tid t' med ω' = γω
        A = mul(A, cexp(cx(0, -g * g * k * M * xPhys)));
        ph = phase * g;
      }
      if (st.frame === 'gal') ph = 2 * Math.PI * ((tReal % (0.9 * half / Math.max(V, 1e-6))) * P.f);
      const e = mul(A, cexp(cx(0, ph)));
      for (let j = 0; j < NY; j++) {
        const zz = -ZD / 2 + ZD * j / (NY - 1);
        const yPhys = (zz / ZD + 0.5) * bReal;
        const tr = st.mode ? Math.cos(q * yPhys) : 1;
        const v = e.re * tr;
        setPt(surf, i, j, xd, zz, 0.18 * v, v, col);
      }
    }
    finishSurface(surf);
    // højttaler og vægmarkører
    const srcX = st.frame === 'gal' ? -shift * sc : 0;
    spk.position.set(srcX, 0, 0);
    const markStep = 0.25 * sc * xs;
    rings.children.forEach((r, n) => {
      const x0 = (n - 20) * markStep + (st.frame === 'gal' ? -shift * sc : 0);
      r.position.x = x0; r.visible = Math.abs(x0) <= xr;
    });
    // partikler: gassen
    const pos = part.g.attributes.position.array;
    const cDisp = 2 * Math.PI / k * sc / Tper;         // lydens fart i visningen (λ pr. periode)
    const vDisp = st.frame === 'lab' ? M * cDisp : 0;
    part.pts.visible = st.frame !== 'lor';
    for (let n = 0; n < part.n; n++) {
      const b = pbase[n];
      let x = ((b[0] * 2 * xr + vDisp * st.t) % (2 * xr) + 2 * xr) % (2 * xr) - xr;
      pos[3 * n] = x; pos[3 * n + 1] = -0.25 + 0.5 * b[1]; pos[3 * n + 2] = -ZD / 2 + ZD * b[2];
    }
    part.g.attributes.position.needsUpdate = true;
  }
  upd();
  return { S, step };
}

/* =====================================================================
   SIM 2: Ekspansionskammeret
   ===================================================================== */
function chamberField(f, M1, m, L) {
  const k = 2 * Math.PI * f / c0, Mc = M1 / m;
  const seg = Mm => { const g2 = 1 / (1 - Mm * Mm); return { al: k * Mm * g2, kp: k * g2 }; };
  const s1 = seg(M1), s2 = seg(Mc);
  // udløb: a3 = 1 ved x = L, b3 = 0. Tilstand ved x = L: p, Y1 q = ρc u1
  const pL = cx(1), rcu1L = cx(1);            // ρc u i udløbsrør
  const rcu2L = scl(rcu1L, 1 / m);            // volumenkontinuitet: S1 u1 = S2 u2
  // kammer: p = e^{iαx}(a e^{-ik'x} + b e^{ik'x}), ρcu = e^{iαx}(a e^{-ik'x} - b e^{ik'x})
  const eL = cexp(cx(0, s2.al * L));
  const sp = div(pL, eL), su = div(rcu2L, eL);
  const a2 = mul(scl(add(sp, su), 0.5), cexp(cx(0, s2.kp * L)));
  const b2 = mul(scl(sub(sp, su), 0.5), cexp(cx(0, -s2.kp * L)));
  // x = 0
  const p0 = add(a2, b2), rcu20 = sub(a2, b2), rcu10 = scl(rcu20, m);
  const a1 = scl(add(p0, rcu10), 0.5), b1 = scl(sub(p0, rcu10), 0.5);
  const TL = 20 * Math.log10(abs(a1));
  // feltet, normeret til indfaldende amplitude 1
  const n = div(cx(1), a1);
  function P(x) {
    let s, a, b, x0 = 0;
    if (x < 0) { s = s1; a = a1; b = b1; }
    else if (x <= L) { s = s2; a = a2; b = b2; }
    else { s = s1; a = cx(1); b = cx(0); x0 = L; }
    let xx = x - x0, ph = cexp(cx(0, s.al * xx));
    if (x > L) ph = mul(ph, cexp(cx(0, s2.al * 0))); // udløb refereret til x = L
    const v = add(mul(a, cexp(cx(0, -s.kp * xx))), mul(b, cexp(cx(0, s.kp * xx))));
    let r = mul(mul(ph, v), n);
    if (x > L) r = mul(r, cexp(cx(0, 0)));
    return r;
  }
  return { TL, P };
}
function TLformula(f, M1, m, L) {
  const k = 2 * Math.PI * f / c0, Mc = M1 / m;
  return 10 * Math.log10(1 + 0.25 * (m - 1 / m) ** 2 * Math.sin(k * L / (1 - Mc * Mc)) ** 2);
}
function sim2() {
  const box = document.getElementById('sim2'); if (!box) return;
  const S = makeScene(box, [0.2, 2.2, 3.0]);
  const NX = 260, NY = 20, Lin = 0.6;
  const surf = makeSurface(NX, NY); S.scene.add(surf.mesh);
  const outline = new THREE.Group(); S.scene.add(outline);
  const part = makeParticles(300, 0xc3a6ff, 0.022); S.scene.add(part.pts);
  const pb = []; for (let i = 0; i < part.n; i++) pb.push([Math.random(), Math.random(), Math.random()]);
  const sF = bindSlider('s2f', upd), sM = bindSlider('s2M', upd), sm = bindSlider('s2m', upd), sL = bindSlider('s2L', upd);
  const hud = document.getElementById('sim2hud'), cv = document.getElementById('s2plot');
  let st = { t: 0, play: true };
  const pbtn = document.getElementById('s2play'); pbtn.onclick = () => { st.play = !st.play; pbtn.textContent = st.play ? TX.play : TX.pause; };
  let P = {};
  const disp = { sc: 1, w1: 0.16 };
  function width(x) { return (x >= 0 && x <= P.L) ? disp.w1 * Math.sqrt(P.m) : disp.w1; }
  function upd() {
    const f = +sF.value, M1 = +sM.value, m = +sm.value, L = +sL.value;
    document.getElementById('s2fv').textContent = f + ' Hz';
    document.getElementById('s2Mv').textContent = fmt(M1, 2);
    document.getElementById('s2mv').textContent = fmt(m, 1);
    document.getElementById('s2Lv').textContent = fmt(L, 2) + ' m';
    const F = chamberField(f, M1, m, L);
    P = { f, M1, m, L, F };
    disp.sc = 4.2 / (L + 2 * Lin);
    hud.innerHTML = `<b>${TX.TL}</b> = ${fmt(F.TL, 1)} dB &nbsp; (${TX.noflow}: ${fmt(TLformula(f, 0, m, L), 1)} dB)<br>` +
      `${TX.chamberM} M<sub>k</sub> = ${fmt(M1 / m, 3)} &nbsp; kL/(1−M<sub>k</sub>²) = ${fmt(2 * Math.PI * f / c0 * L / (1 - (M1 / m) ** 2), 2)}`;
    outline.clear();
    const sc = disp.sc, x0 = -(L / 2 + Lin) * sc, w1 = disp.w1, w2 = w1 * Math.sqrt(m), H = 0.22;
    const X = x => x0 + (x + Lin) * sc;
    outline.add(lineBox(X(-Lin), X(0), -w1 / 2, w1 / 2, -H, H, 0x3a4a6e));
    outline.add(lineBox(X(0), X(L), -w2 / 2, w2 / 2, -H, H, 0x5a6a8e));
    outline.add(lineBox(X(L), X(L + Lin), -w1 / 2, w1 / 2, -H, H, 0x3a4a6e));
    // TL-graf
    const xs = [], y0 = [], y1 = [];
    for (let ff = 10; ff <= 1000; ff += 4) { xs.push(ff); y0.push(TLformula(ff, 0, m, L)); y1.push(TLformula(ff, M1, m, L)); }
    const ymax = Math.max(5, Math.ceil(Math.max(...y0) / 5) * 5);
    plot(cv, { x0: 0, x1: 1000, y0: 0, y1: ymax, xt: [0, 200, 400, 600, 800, 1000], yt: [0, ymax / 2, ymax].map(v => Math.round(v)), xl: TX.ax_f, yl: TX.ax_TL,
      series: [{ x: xs, y: y0, color: '#9ba4b6', dash: [4, 3], label: 'M = 0' }, { x: xs, y: y1, color: '#f2d590', label: 'M₁ = ' + fmt(M1, 2) }], marker: f });
  }
  const col = [0, 0, 0];
  function step(dt) {
    if (st.play) st.t += dt;
    const { L, M1, m, F } = P, sc = disp.sc, Lt = L + 2 * Lin;
    const ph = cexp(cx(0, 2 * Math.PI * st.t / 1.6));
    for (let i = 0; i < NX; i++) {
      const x = -Lin + Lt * i / (NX - 1), xd = (x - L / 2) * sc;
      const v = mul(F.P(x), ph).re;
      const w = width(x);
      for (let j = 0; j < NY; j++) {
        const z = (-0.5 + j / (NY - 1)) * w;
        setPt(surf, i, j, xd, z, 0.09 * v, v / 1.5, col);
      }
    }
    finishSurface(surf);
    const pos = part.g.attributes.position.array, k = 2 * Math.PI * P.f / c0;
    const cDisp = 2 * Math.PI / k * sc / 1.6;
    for (let n = 0; n < part.n; n++) {
      const b = pb[n];
      // partikler: hurtige i rørene, langsomme i kammeret (M1 og M1/m)
      let x = ((b[0] * Lt + 0) % Lt) - Lin;
      const vfac = (x >= 0 && x <= L) ? 1 / m : 1;
      b[0] = (b[0] + M1 * vfac * cDisp * dt * (st.play ? 1 : 0) / sc / Lt) % 1;
      x = b[0] * Lt - Lin;
      const w = width(x);
      pos[3 * n] = (x - L / 2) * sc; pos[3 * n + 1] = -0.2 + 0.4 * b[1]; pos[3 * n + 2] = (-0.5 + b[2]) * w;
    }
    part.g.attributes.position.needsUpdate = true;
    part.pts.visible = M1 > 0;
  }
  upd();
  return { S, step };
}

/* =====================================================================
   SIM 3: Den forede kanal (Myers + Delany–Bazley), løst i Lorentz-systemet
   ===================================================================== */
const LD = { h: 0.10 };
function zetaDB(f, sigma, d) {
  const X = rho * f / sigma, k = 2 * Math.PI * f / c0;
  const Zc = cx(1 + 0.0571 * X ** -0.754, -0.087 * X ** -0.732);
  const kc = cx(k * (1 + 0.0978 * X ** -0.700), -k * 0.189 * X ** -0.595);
  const kd = scl(kc, d);
  return mul(cx(0, -1), mul(Zc, div(ccos(kd), csin(kd))));   // -i Zc cot(kc d)
}
function solveLined(f, M, s, q0, z) {
  const g = 1 / Math.sqrt(1 - M * M), k = 2 * Math.PI * f / c0, K = g * k, h = LD.h;
  const F = q => {
    const kap = brDecay(sub(cx(K * K), mul(q, q)));
    const lhs = mul(q, div(csin(scl(q, h)), ccos(scl(q, h))));
    const t = sub(cx(K), scl(kap, s * M));
    const rhs = mul(cx(0, g * g * g / K), div(mul(t, t), z));
    return sub(lhs, rhs);
  };
  let q = q0;
  for (let it = 0; it < 60; it++) {
    const dq = 1e-7 * (1 + abs(q));
    const der = scl(sub(F(add(q, cx(dq))), F(sub(q, cx(dq)))), 1 / (2 * dq));
    const stp = div(F(q), der); q = sub(q, stp);
    if (abs(stp) < 1e-12 * (1 + abs(q))) break;
  }
  const kap = brDecay(sub(cx(K * K), mul(q, q)));
  const kx = scl(sub(scl(kap, s), cx(M * K)), g);      // k_x = γ(±κ − MK)
  return { q, kx, att: 8.686 * Math.abs(kx.im) };
}
function linedCurve(M, s, sigma, d, freqs) {
  let q = null; const out = [];
  for (const f of freqs) {
    const z = zetaDB(f, sigma, d);
    if (!q) {
      const k = 2 * Math.PI * f / c0;
      q = csqrt(div(cx(0, k), scl(z, LD.h)));
      q = solveLined(f, 0, s, q, z).q;
      for (let n = 1; n <= 24 && M > 0; n++) q = solveLined(f, M * n / 24, s, q, z).q;
    }
    const r = solveLined(f, M, s, q, z); q = r.q; out.push(r);
  }
  return out;
}
function sim3() {
  const box = document.getElementById('sim3'); if (!box) return;
  const S = makeScene(box, [0, 2.3, 3.2]);
  const NX = 200, NY = 22, XD = 2.4, ZD = 0.5, Lreal = 1.0;
  const ducts = [];
  for (const sgn of [1, -1]) {
    const surf = makeSurface(NX, NY); S.scene.add(surf.mesh);
    const zc = sgn > 0 ? -0.42 : 0.42;
    const grp = new THREE.Group(); S.scene.add(grp);
    grp.add(lineBox(-XD / 2, XD / 2, zc - ZD / 2, zc + ZD / 2, -0.2, 0.2, 0x3a4a6e));
    const lin = new THREE.MeshPhongMaterial({ color: 0xc8874a, transparent: true, opacity: 0.18, depthWrite: false });
    const lw = 0.06;
    for (const side of [-1, 1]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(XD, 0.12, lw), lin); b.position.y = -0.14;
      b.position.x = 0; b.position.z = zc + side * (ZD / 2 + lw / 2); grp.add(b);
    }
    const spk = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, ZD), new THREE.MeshPhongMaterial({ color: 0xd8b46a }));
    spk.position.set(-XD / 2 - 0.02, 0, zc); grp.add(spk);
    const lab = textSprite(sgn > 0 ? TX.down + '  (gas →)' : TX.up + '  (← gas)', sgn > 0 ? '#9fd0ff' : '#f08a7a');
    lab.position.set(XD / 2 + 0.55, 0.12, zc); grp.add(lab);
    const part = makeParticles(160, sgn > 0 ? 0x9fd0ff : 0xf08a7a, 0.022); S.scene.add(part.pts);
    const pb = []; for (let i = 0; i < part.n; i++) pb.push([Math.random(), Math.random(), Math.random()]);
    ducts.push({ sgn, surf, zc, part, pb, lw });
  }
  const sF = bindSlider('s3f', updF), sM = bindSlider('s3M', updAll), sS = bindSlider('s3s', updAll), sD = bindSlider('s3d', updAll);
  const hud = document.getElementById('sim3hud'), cv = document.getElementById('s3plot');
  const st = { t: 0, play: true };
  const pbtn = document.getElementById('s3play'); pbtn.onclick = () => { st.play = !st.play; pbtn.textContent = st.play ? TX.play : TX.pause; };
  const freqs = []; for (let f = 50; f <= 2000; f += 15) freqs.push(f);
  let C = {}, P = {};
  function updAll() {
    const M = +sM.value, sigma = +sS.value * 1000, d = +sD.value / 100;
    document.getElementById('s3Mv').textContent = fmt(M, 2);
    document.getElementById('s3sv').textContent = (+sS.value) + ' kPa·s/m²';
    document.getElementById('s3dv').textContent = (+sD.value) + ' cm';
    C = { M, sigma, d,
      c0: linedCurve(0, 1, sigma, d, freqs),
      cd: linedCurve(M, 1, sigma, d, freqs),
      cu: linedCurve(M, -1, sigma, d, freqs) };
    updF();
  }
  function nearestQ(arr, f) { let i = Math.round((f - 50) / 15); i = Math.max(0, Math.min(arr.length - 1, i)); return arr[i].q; }
  function updF() {
    const f = +sF.value; document.getElementById('s3fv').textContent = f + ' Hz';
    const z = zetaDB(f, C.sigma, C.d);
    const rd = solveLined(f, C.M, 1, nearestQ(C.cd, f), z), ru = solveLined(f, C.M, -1, nearestQ(C.cu, f), z), r0 = solveLined(f, 0, 1, nearestQ(C.c0, f), z);
    P = { f, rd, ru, r0 };
    hud.innerHTML = `<b>${TX.per1m}</b>: ${TX.down} ${fmt(rd.att, 1)} dB · ${TX.up} ${fmt(ru.att, 1)} dB · M = 0: ${fmt(r0.att, 1)} dB<br>` +
      `ζ = ${fmt(z.re, 2)} ${z.im < 0 ? '−' : '+'} ${fmt(Math.abs(z.im), 2)}i &nbsp; ${TX.up}/${TX.down} = ${fmt(ru.att / rd.att, 2)}`;
    const ymax = Math.max(10, Math.ceil(Math.max(...C.cu.map(r => r.att), ...C.c0.map(r => r.att)) / 20) * 20);
    plot(cv, { x0: 0, x1: 2000, y0: 0, y1: ymax, xt: [0, 500, 1000, 1500, 2000], yt: [0, ymax / 2, ymax], xl: TX.ax_f, yl: TX.ax_att,
      series: [{ x: freqs, y: C.c0.map(r => r.att), color: '#9ba4b6', dash: [4, 3], label: 'M = 0' },
               { x: freqs, y: C.cd.map(r => r.att), color: '#9fd0ff', label: TX.down },
               { x: freqs, y: C.cu.map(r => r.att), color: '#f08a7a', label: TX.up }], marker: f });
  }
  const col = [0, 0, 0];
  function step(dt) {
    if (st.play) st.t += dt;
    const ph = cexp(cx(0, 2 * Math.PI * st.t / 1.6));
    const sc = XD / Lreal, k = 2 * Math.PI * P.f / c0;
    for (const D of ducts) {
      const r = D.sgn > 0 ? P.rd : P.ru;
      // vis begge som bølger, der løber mod højre fra højttaleren; modstrøms: strømningen går mod venstre
      const kx = D.sgn > 0 ? r.kx : scl(r.kx, -1);
      const q = r.q;
      for (let i = 0; i < NX; i++) {
        const x = Lreal * i / (NX - 1), xd = -XD / 2 + x * sc;
        const ex = mul(cexp(mul(cx(0, -1), scl(kx, x))), ph);
        for (let j = 0; j < NY; j++) {
          const yy = (-0.5 + j / (NY - 1)) * 2 * LD.h;
          const cy = ccos(scl(q, yy)), c00 = cx(1);
          const v = mul(ex, div(cy, c00)).re;
          setPt(D.surf, i, j, xd, D.zc + (-0.5 + j / (NY - 1)) * ZD, 0.15 * v, v, col);
        }
      }
      finishSurface(D.surf);
      const pos = D.part.g.attributes.position.array;
      const vD = C.M * (2 * Math.PI / k) * sc / 1.6 * D.sgn;
      for (let n = 0; n < D.part.n; n++) {
        const b = D.pb[n];
        if (st.play) b[0] = ((b[0] + vD * dt / XD) % 1 + 1) % 1;
        pos[3 * n] = -XD / 2 + b[0] * XD; pos[3 * n + 1] = -0.18 + 0.36 * b[1]; pos[3 * n + 2] = D.zc + (-0.5 + b[2]) * ZD;
      }
      D.part.g.attributes.position.needsUpdate = true;
      D.part.pts.visible = C.M > 0;
    }
  }
  updAll();
  return { S, step };
}

/* ---------------- løkke ---------------- */
function start() {
  if (typeof THREE === 'undefined') return;
  const sims = [sim1(), sim2(), sim3()].filter(Boolean);
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    for (const s of sims) if (s.S.visible) { s.step(dt); s.S.controls.update(); s.S.renderer.render(s.S.scene, s.S.camera); }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
window.LR = { chamberField, TLformula, solveLined, linedCurve, zetaDB };
if (typeof document !== 'undefined' && document.readyState !== 'loading') start();
else if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', start);
})();
