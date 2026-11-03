// fag3d.js – fælles hjælpefunktioner til 3D-figurerne på fagsiderne (bruger three.js r128 + OrbitControls)
'use strict';
const T3 = (da, en) => (document.documentElement.lang === 'en' ? en : da);
const F3 = (v, d = 2) => { const s = Math.abs(v).toFixed(d); return (v < 0 ? '−' : '') + (document.documentElement.lang === 'en' ? s : s.replace('.', ',')); };

function scene3d(id, o = {}) {
  const box = document.getElementById(id);
  const W = () => Math.max(300, box.clientWidth), H = () => Math.round(W() * (o.aspect || 0.56));
  const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  r.setSize(W(), H());
  r.setClearColor(o.bg !== undefined ? o.bg : 0x05070b);
  r.domElement.style.display = 'block'; r.domElement.style.width = '100%'; r.domElement.style.height = 'auto';
  r.domElement.style.borderRadius = '12px 12px 0 0';
  box.appendChild(r.domElement);
  const hint = document.createElement('div'); hint.className = 'hint3d noprint';
  hint.textContent = T3('Træk for at dreje · rul for at zoome', 'Drag to rotate · scroll to zoom');
  box.appendChild(hint);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(o.fov || 45, W() / H(), 0.01, 2000);
  cam.position.set(...(o.cam || [4, 3, 5]));
  const ctl = new THREE.OrbitControls(cam, r.domElement);
  ctl.enableDamping = true; ctl.dampingFactor = 0.08;
  if (o.target) ctl.target.set(...o.target);
  if (o.autoRotate) { ctl.autoRotate = true; ctl.autoRotateSpeed = o.autoRotate; }
  ctl.update();
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const dl = new THREE.DirectionalLight(0xffffff, 0.75); dl.position.set(5, 8, 6); scene.add(dl);
  const dl2 = new THREE.DirectionalLight(0x9fd0ff, 0.25); dl2.position.set(-6, -3, -4); scene.add(dl2);
  const fns = []; let vis = true, last = performance.now(), t = 0, paused = false;
  new IntersectionObserver(es => es.forEach(e => (vis = e.isIntersecting))).observe(box);
  function loop(now) {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
    if (vis) { if (!paused) { t += dt; fns.forEach(f => f(t, dt)); } ctl.update(); r.render(scene, cam); }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.addEventListener('resize', () => { r.setSize(W(), H()); cam.aspect = W() / H(); cam.updateProjectionMatrix(); });
  const api = { scene, camera: cam, renderer: r, controls: ctl, box,
    onFrame: f => fns.push(f), render: () => r.render(scene, cam),
    get t() { return t; }, set t(v) { t = v; }, pause(v) { paused = v; } };
  (window.__printPrep = window.__printPrep || []).push(() => {
    ctl.autoRotate = false;
    if (o.print) o.print(api); else { if (o.printT !== undefined) t = o.printT; fns.forEach(f => f(t, 0)); }
    ctl.update(); r.render(scene, cam);
  });
  return api;
}
// små byggeklodser
const C3 = { gold: 0xd8b46a, gold2: 0xf2d590, ice: 0x9fd0ff, red: 0xf08a7a, grn: 0x7fd1b9, vio: 0xc3a6ff, dim: 0x4a5878, white: 0xe7e9ef };
function line3(pts, color, opacity = 1) {
  const g = new THREE.BufferGeometry().setFromPoints(pts.map(p => (p.isVector3 ? p : new THREE.Vector3(...p))));
  return new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
}
function tube3(pts, color, r = 0.02, seg) {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => (p.isVector3 ? p : new THREE.Vector3(...p))));
  return new THREE.Mesh(new THREE.TubeGeometry(curve, seg || Math.max(20, pts.length * 2), r, 8, false),
    new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1 }));
}
function ball3(r, color, opt = {}) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, opt.seg || 20, opt.seg ? opt.seg * 0.7 : 14),
    new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.1, transparent: !!opt.opacity, opacity: opt.opacity || 1, emissive: opt.emissive || 0x000000 }));
}
function label3(text, color = '#cfd4df', size = 0.3) {
  const c = document.createElement('canvas'), ctx = c.getContext('2d'); const fs = 48;
  ctx.font = `${fs}px system-ui,sans-serif`; const w = Math.ceil(ctx.measureText(text).width) + 8;
  c.width = w; c.height = fs + 12; ctx.font = `${fs}px system-ui,sans-serif`; ctx.fillStyle = color; ctx.textBaseline = 'top'; ctx.fillText(text, 4, 4);
  const tex = new THREE.CanvasTexture(c); tex.minFilter = THREE.LinearFilter;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  s.scale.set(size * w / (fs + 12), size, 1); return s;
}
function arrow3(from, dir, len, color, head = 0.15) {
  return new THREE.ArrowHelper(new THREE.Vector3(...dir).normalize(), new THREE.Vector3(...from), len, color, head, head * 0.6);
}
function axes3(len = 2, labels = ['x', 'y', 'z']) {
  const g = new THREE.Group();
  [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach((d, i) => { g.add(arrow3([0, 0, 0], d, len, C3.dim, 0.12)); const l = label3(labels[i], '#9ba4b6', 0.22); l.position.set(d[0] * (len + 0.2), d[1] * (len + 0.2), d[2] * (len + 0.2)); g.add(l); });
  return g;
}
function clear3(group) { while (group.children.length) { const c = group.children.pop(); if (c.geometry) c.geometry.dispose(); if (c.material) { if (c.material.map) c.material.map.dispose(); c.material.dispose(); } } }
(function () {
  const s = document.createElement('style');
  s.textContent = '.sim3d{position:relative;background:#05070b;border:1px solid var(--line,#252f47);border-radius:12px 12px 0 0;margin:14px 0 0;overflow:hidden}' +
    '.sim3d .info{position:absolute;left:10px;top:8px;font-size:.84rem;background:rgba(8,11,19,.8);border:1px solid var(--line,#252f47);border-radius:8px;padding:6px 10px;max-width:55%;pointer-events:none;line-height:1.45;z-index:2}' +
    '.sim3d .info b{color:var(--gold2,#f2d590);font-weight:normal}' +
    '.hint3d{position:absolute;right:10px;bottom:8px;font-size:.75rem;color:#9ba4b6;background:rgba(8,11,19,.6);padding:2px 8px;border-radius:6px;pointer-events:none}' +
    '.sim3d canvas.side{position:absolute;right:10px;top:8px;border:1px solid #252f47;border-radius:6px;background:rgba(8,11,19,.85)}' +
    '@media print{.sim3d{border-color:#ccc;break-inside:avoid}.sim3d .info{display:none}.hint3d{display:none}}';
  document.head.appendChild(s);
})();
