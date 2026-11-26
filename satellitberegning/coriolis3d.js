/* Satellitberegning – 3D: stenen der falder rundt om Jorden, og Jorden der drejer under den.
   Fysik: Newtons tyngdelov med GM = gR², integreret i et inertialsystem (RK4).
   Jorden kan rotere; i "medroterende" visning står Jorden stille og banen afbøjes (Coriolis).
   Michael H. Grant · mhgfysik.dk · CC BY 4.0 */
(function () {
  'use strict';
  const LANG = (document.documentElement.lang || 'da').slice(0, 2);
  const T = {
    da: {
      play: '▶ Afspil', pause: '❚❚ Pause', reset: '↺ Affyr igen',
      inertial: 'Set fra rummet', rotating: 'Set fra Jorden (medroterende)',
      t: 'Tid', min: 'min', orbits: 'Omløb', turned: 'Jorden har drejet', alt: 'Højde',
      vrel: 'Fart i forhold til jorden', km: 'km', kms: 'km/s', hit: 'Stenen ramte jorden efter',
      cor: 'Coriolis-kraft', vel: 'fart i forhold til jorden',
      presets: ['Nordpå fra Djursland', 'Østpå fra Djursland', 'Vestpå fra Djursland', 'Newtons kanon (6,5 km/s fra 300 km)', 'Fra ækvator, nordpå'],
      deg: '°'
    },
    en: {
      play: '▶ Play', pause: '❚❚ Pause', reset: '↺ Fire again',
      inertial: 'Seen from space', rotating: 'Seen from the Earth (co-rotating)',
      t: 'Time', min: 'min', orbits: 'Orbits', turned: 'The Earth has turned', alt: 'Altitude',
      vrel: 'Speed relative to the ground', km: 'km', kms: 'km/s', hit: 'The stone hit the ground after',
      cor: 'Coriolis force', vel: 'velocity relative to the ground',
      presets: ['Northwards from Djursland', 'Eastwards from Djursland', 'Westwards from Djursland', "Newton's cannon (6.5 km/s from 300 km)", 'From the equator, northwards'],
      deg: '°'
    }
  }[LANG === 'en' ? 'en' : 'da'];

  const R_M = 6371000, G_ACC = 9.82, OMEGA = 7.2921e-5;
  const GM = G_ACC;            // in units of R: GM = g R² / R³ per s² -> g/R ... handled below
  const MU = G_ACC / R_M;      // GM / R³  [1/s²]  (positions in units of R)

  const host = document.getElementById('c3d');
  if (!host || !window.THREE) return;
  const $ = id => document.getElementById(id);

  // ---------- scene ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05050c);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 200);
  camera.position.set(2.27, 1.73, -3.36);   // looking at Djursland and the polar orbit
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.minDistance = 1.4; controls.maxDistance = 12;

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const sun = new THREE.DirectionalLight(0xffffff, 0.85); sun.position.set(2, 2, 1); camera.add(sun); scene.add(camera);   // lyset følger kameraet

  const earthGroup = new THREE.Group(); scene.add(earthGroup);   // Earth-fixed things
  const spaceGroup = new THREE.Group(); scene.add(spaceGroup);   // inertial things

  // Earth with texture (fallback: plain blue)
  const earthMat = new THREE.MeshPhongMaterial({ color: 0x2a5b8c, shininess: 12 });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), earthMat);
  earthGroup.add(earth);
  new THREE.TextureLoader().load(
    'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_atmos_2048.jpg',
    tex => { earthMat.map = tex; earthMat.color.set(0xffffff); earthMat.needsUpdate = true; });

  // lat/long grid
  const gridMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 });
  const eqMat = new THREE.LineBasicMaterial({ color: 0xc9a961, transparent: true, opacity: 0.6 });
  function circle(pts, mat) { earthGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat)); }
  for (let lat = -75; lat <= 75; lat += 15) {
    const pts = []; for (let i = 0; i <= 128; i++) pts.push(fixedPoint(lat, i / 128 * 360, 1.002));
    circle(pts, lat === 0 ? eqMat : gridMat);
  }
  for (let lon = 0; lon < 360; lon += 15) {
    const pts = []; for (let i = 0; i <= 64; i++) pts.push(fixedPoint(-90 + i / 64 * 180, lon, 1.002));
    circle(pts, lon === 0 ? eqMat : gridMat);
  }
  // spin axis
  const axis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -1.5, 0), new THREE.Vector3(0, 1.5, 0)]),
    new THREE.LineBasicMaterial({ color: 0x8a7ab8 }));
  scene.add(axis);

  // stars (inertial)
  {
    const g = new THREE.BufferGeometry(), n = 1500, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3().randomDirection ? new THREE.Vector3().randomDirection() :
        new THREE.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5).normalize();
      v.multiplyScalar(60 + Math.random() * 30); a.set([v.x, v.y, v.z], i * 3);
    }
    g.setAttribute('position', new THREE.BufferAttribute(a, 3));
    spaceGroup.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.18 })));
  }

  // launch-site marker (Earth-fixed)
  const site = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 12), new THREE.MeshBasicMaterial({ color: 0xc9a961 }));
  earthGroup.add(site);

  // stone (inertial)
  const stone = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 14), new THREE.MeshBasicMaterial({ color: 0xe0503c }));
  scene.add(stone);

  // trails
  const MAXP = 6000;
  function makeTrail(color, parent, opacity) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAXP * 3), 3));
    g.setDrawRange(0, 0);
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
    l.frustumCulled = false; parent.add(l); return l;
  }
  const trailInertial = makeTrail(0xe0503c, spaceGroup, 1);   // orbit in space
  const trailRel = makeTrail(0xff9a5c, earthGroup, 1);        // path relative to the rotating Earth
  const trailGround = makeTrail(0xffe08a, earthGroup, 0.9);   // ground track on the surface
  const impact = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  impact.visible = false; earthGroup.add(impact);

  // arrows (shown in co-rotating view): velocity rel. ground and Coriolis
  const arrVel = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 0.3, 0x6b8acf, 0.06, 0.04);
  const arrCor = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 0.3, 0x7cd67c, 0.06, 0.04);
  scene.add(arrVel); scene.add(arrCor);

  // ---------- helpers ----------
  function fixedPoint(latDeg, lonDeg, r) {
    const f = latDeg * Math.PI / 180, l = lonDeg * Math.PI / 180;
    return new THREE.Vector3(r * Math.cos(f) * Math.cos(l), r * Math.sin(f), -r * Math.cos(f) * Math.sin(l));
  }
  function rotY(v, a) { // rotate vector about +y by angle a (same convention as Object3D.rotation.y)
    const c = Math.cos(a), s = Math.sin(a);
    return new THREE.Vector3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c);
  }
  const VIS = 0.012; // lift trails a little so they are visible at h = 0
  function visR(p) { const r = p.length(); return p.clone().multiplyScalar((r + VIS) / r); }

  // ---------- state ----------
  const S = {
    lat: 56.4, lon: 10.8, az: 0, v: 7.91, h: 0, spin: 1, speed: 600, rotating: false, playing: true,
    r: new THREE.Vector3(), u: new THREE.Vector3(), t: 0, theta: 0, n: [0, 0, 0], hit: false, maxT: 0
  };
  function omega() { return OMEGA * S.spin; }

  function launch() {
    S.t = 0; S.theta = 0; S.hit = false; S.n = [0, 0, 0]; impact.visible = false;
    [trailInertial, trailRel, trailGround].forEach(l => l.geometry.setDrawRange(0, 0));
    const f = S.lat * Math.PI / 180, l = S.lon * Math.PI / 180, a = S.az * Math.PI / 180;
    const up = fixedPoint(S.lat, S.lon, 1);
    const east = new THREE.Vector3(-Math.sin(l), 0, -Math.cos(l));
    const north = new THREE.Vector3(-Math.sin(f) * Math.cos(l), Math.cos(f), Math.sin(f) * Math.sin(l));
    const rad = 1 + (S.h * 1000 + 1.7) / R_M;   // 1,7 m over havet, som ved strandkanten
    S.r = up.clone().multiplyScalar(rad);
    const dir = north.multiplyScalar(Math.cos(a)).add(east.multiplyScalar(Math.sin(a)));
    const vRel = dir.multiplyScalar(S.v * 1000 / R_M);                // units R/s
    const w = omega();
    S.u = vRel.add(new THREE.Vector3(w * S.r.z, 0, -w * S.r.x));       // + ω × r
    site.position.copy(fixedPoint(S.lat, S.lon, 1.004));
    // stop after a few orbits (or 3 hours)
    const E = S.u.lengthSq() / 2 - MU / S.r.length();
    const aAx = E < 0 ? -MU / (2 * E) : 0;
    const P = E < 0 ? 2 * Math.PI * Math.sqrt(aAx ** 3 / MU) : 3 * 3600;
    S.maxT = Math.min(Math.max(P * 4, 1800), 6 * 3600);
    push();
  }

  function acc(r) { const d = r.length(); return r.clone().multiplyScalar(-MU / (d * d * d)); }
  function step(dt) {
    const r = S.r, u = S.u;
    const k1v = acc(r), k1r = u.clone();
    const r2 = r.clone().addScaledVector(k1r, dt / 2), u2 = u.clone().addScaledVector(k1v, dt / 2);
    const k2v = acc(r2), k2r = u2.clone();
    const r3 = r.clone().addScaledVector(k2r, dt / 2), u3 = u.clone().addScaledVector(k2v, dt / 2);
    const k3v = acc(r3), k3r = u3.clone();
    const r4 = r.clone().addScaledVector(k3r, dt), u4 = u.clone().addScaledVector(k3v, dt);
    const k4v = acc(r4), k4r = u4.clone();
    S.r.addScaledVector(k1r, dt / 6).addScaledVector(k2r, dt / 3).addScaledVector(k3r, dt / 3).addScaledVector(k4r, dt / 6);
    S.u.addScaledVector(k1v, dt / 6).addScaledVector(k2v, dt / 3).addScaledVector(k3v, dt / 3).addScaledVector(k4v, dt / 6);
    S.t += dt; S.theta = omega() * S.t;
  }
  function addPoint(line, idx, p) {
    if (S.n[idx] >= MAXP) return;
    const a = line.geometry.attributes.position;
    a.setXYZ(S.n[idx], p.x, p.y, p.z); S.n[idx]++;
    a.needsUpdate = true; line.geometry.setDrawRange(0, S.n[idx]);
  }
  function push() {
    const fixed = rotY(S.r, -S.theta);
    addPoint(trailInertial, 0, visR(S.r));
    addPoint(trailRel, 1, visR(fixed));
    addPoint(trailGround, 2, fixed.clone().normalize().multiplyScalar(1.003));
  }

  // ---------- UI ----------
  function bind(id, key, fmt) {
    const el = $(id), out = $(id + 'Val');
    const upd = () => { S[key] = parseFloat(el.value); if (out) out.textContent = fmt(S[key]); };
    el.addEventListener('input', () => { upd(); if (key !== 'speed') launch(); });
    upd();
  }
  const dec = (x, n) => LANG === 'en' ? x.toFixed(n) : x.toFixed(n).replace('.', ',');
  bind('cLat', 'lat', x => dec(x, 1) + '°');
  bind('cAz', 'az', x => dec(x, 0) + '°');
  bind('cV', 'v', x => dec(x, 2) + ' km/s');
  bind('cH', 'h', x => dec(x, 0) + ' km');
  bind('cSpin', 'spin', x => x === 0 ? (LANG === 'en' ? 'not rotating' : 'står stille') : dec(x, 0) + '×');
  bind('cSpeed', 'speed', x => dec(x, 0) + '×');
  const bPlay = $('cPlay');
  bPlay.textContent = T.pause;
  bPlay.onclick = () => { S.playing = !S.playing; bPlay.textContent = S.playing ? T.pause : T.play; };
  $('cReset').textContent = T.reset;
  $('cReset').onclick = () => { launch(); S.playing = true; bPlay.textContent = T.pause; };
  const vIn = $('cViewIn'), vRo = $('cViewRot');
  vIn.textContent = T.inertial; vRo.textContent = T.rotating;
  function setView(rot) { S.rotating = rot; vIn.classList.toggle('on', !rot); vRo.classList.toggle('on', rot); }
  vIn.onclick = () => setView(false); vRo.onclick = () => setView(true); setView(false);

  const presets = [
    { lat: 56.4, az: 0, v: 7.91, h: 0 }, { lat: 56.4, az: 90, v: 7.91, h: 0 }, { lat: 56.4, az: 270, v: 7.91, h: 0 },
    { lat: 56.4, az: 0, v: 6.5, h: 300 }, { lat: 0, az: 0, v: 7.91, h: 0 }];
  const pBox = $('cPresets');
  presets.forEach((p, i) => {
    const b = document.createElement('button'); b.textContent = T.presets[i];
    b.onclick = () => {
      Object.entries({ cLat: p.lat, cAz: p.az, cV: p.v, cH: p.h }).forEach(([id, v]) => { $(id).value = v; $(id).dispatchEvent(new Event('input')); });
    };
    pBox.appendChild(b);
  });

  // ---------- loop ----------
  function resize() {
    const w = host.clientWidth, h = Math.max(360, Math.min(640, w * 0.62));
    renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize); resize();

  let last = performance.now(), acc_ = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dtReal = Math.min(0.05, (now - last) / 1000); last = now;
    if (S.playing && !S.hit && S.t < S.maxT) {
      let simDt = dtReal * S.speed, h = 4;               // 4 s steps
      const nSteps = Math.ceil(simDt / h); h = simDt / nSteps;
      for (let i = 0; i < nSteps; i++) {
        step(h); acc_ += h;
        if (S.r.length() < 1) {                           // hit the ground
          S.hit = true; const f = rotY(S.r, -S.theta).normalize();
          impact.position.copy(f.multiplyScalar(1.004)); impact.visible = true; push(); break;
        }
        if (acc_ > 20) { acc_ = 0; push(); }
      }
    }
    // frames: inertial view -> Earth turns; co-rotating view -> sky turns
    earthGroup.rotation.y = S.rotating ? 0 : S.theta;
    spaceGroup.rotation.y = S.rotating ? -S.theta : 0;
    trailInertial.visible = !S.rotating;
    trailRel.visible = S.rotating;
    const shown = S.rotating ? rotY(S.r, -S.theta) : S.r.clone();
    stone.position.copy(visR(shown));

    // arrows in co-rotating view
    const w = omega();
    const vRelIn = S.u.clone().sub(new THREE.Vector3(w * S.r.z, 0, -w * S.r.x)); // v - ω×r (inertial comps)
    const vRelF = rotY(vRelIn, -S.theta);
    const wv = new THREE.Vector3(0, w, 0);
    const aCor = wv.clone().cross(vRelF).multiplyScalar(-2);
    const showArr = S.rotating && !S.hit && w > 0;
    arrVel.visible = arrCor.visible = showArr;
    if (showArr) {
      arrVel.position.copy(stone.position); arrVel.setDirection(vRelF.clone().normalize());
      arrCor.position.copy(stone.position);
      if (aCor.length() > 0) arrCor.setDirection(aCor.clone().normalize());
    }

    // readouts
    const alt = (S.r.length() - 1) * R_M / 1000;
    const vr = vRelIn.length() * R_M / 1000;
    const E = S.u.lengthSq() / 2 - MU / S.r.length(); const aAx = -MU / (2 * E);
    const P = E < 0 ? 2 * Math.PI * Math.sqrt(aAx ** 3 / MU) : Infinity;
    $('cRead').innerHTML = S.hit
      ? `<b>${T.hit}</b> ${dec(S.t / 60, 1)} ${T.min}`
      : `<span><b>${T.t}</b> ${dec(S.t / 60, 1)} ${T.min}</span>` +
        `<span><b>${T.orbits}</b> ${isFinite(P) ? dec(S.t / P, 2) : '–'}</span>` +
        `<span><b>${T.turned}</b> ${dec(S.theta * 180 / Math.PI, 1)}°</span>` +
        `<span><b>${T.alt}</b> ${dec(Math.max(0, alt), 0)} ${T.km}</span>` +
        `<span><b>${T.vrel}</b> ${dec(vr, 2)} ${T.kms}</span>`;
    controls.update();
    renderer.render(scene, camera);
  }
  launch();
  requestAnimationFrame(frame);
})();

/* ---------- 2D: Coriolis-afbøjning af granater mod Paris ---------- */
(function () {
  'use strict';
  const cv = document.getElementById('parisCanvas');
  if (!cv) return;
  const EN = (document.documentElement.lang || 'da').startsWith('en');
  const OMEGA = 7.2921e-5, LAT = 48.85 * Math.PI / 180;
  const CASES = {
    1918: { range: 120000, tof: 182, az: 225, from: EN ? 'Paris Gun, Crépy-en-Laonnois' : 'Paris-kanonen, Crépy-en-Laonnois', label: '1918' },
    1870: { range: 6500, tof: 20, az: 0, from: EN ? 'Prussian battery, Châtillon' : 'Preussisk batteri, Châtillon', label: '1870' }
  };
  let which = 1918, exag = 10;
  const ctx = cv.getContext('2d');
  const dec = (x, n) => EN ? x.toFixed(n) : x.toFixed(n).replace('.', ',');
  function draw() {
    const W = cv.clientWidth, H = Math.round(W * 0.62), dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0f0f1c'; ctx.fillRect(0, 0, W, H);
    const c = CASES[which];
    const vh = c.range / c.tof;
    const yReal = OMEGA * Math.sin(LAT) * c.range * c.range / vh;   // lateral deflection, to the right
    const az = c.az * Math.PI / 180;
    // map: north up. gun at start, target at end
    const scale = (Math.min(W, H) * 0.7) / c.range;
    const dirE = Math.sin(az), dirN = Math.cos(az);
    const rightE = Math.cos(az), rightN = -Math.sin(az);         // 90° clockwise from firing direction
    const cx = W / 2 - dirE * c.range * scale / 2, cy = H / 2 + dirN * c.range * scale / 2;
    const P = (along, side) => [cx + (dirE * along + rightE * side) * scale, cy - (dirN * along + rightN * side) * scale];
    // Paris circle (≈ 12 km across in 1918; city wall ≈ 5 km radius in 1870)
    const tgt = P(c.range, 0);
    ctx.strokeStyle = '#2a2a40'; ctx.fillStyle = 'rgba(201,169,97,0.08)';
    ctx.beginPath(); ctx.arc(tgt[0], tgt[1], (which === 1918 ? 6000 : 4000) * scale, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8b8ba0'; ctx.font = '13px Manrope, sans-serif';
    ctx.fillText('Paris', tgt[0] + 8, tgt[1] - 8);
    // straight line (non-rotating Earth)
    ctx.setLineDash([6, 6]); ctx.strokeStyle = '#8b8ba0'; ctx.lineWidth = 1.5;
    ctx.beginPath(); let p = P(0, 0); ctx.moveTo(...p); p = P(c.range, 0); ctx.lineTo(...p); ctx.stroke(); ctx.setLineDash([]);
    // curved path, deflection grows with x²
    ctx.strokeStyle = '#e0503c'; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const x = c.range * i / 100, y = yReal * exag * (i / 100) ** 2;
      const q = P(x, y); i ? ctx.lineTo(...q) : ctx.moveTo(...q);
    }
    ctx.stroke();
    const land = P(c.range, yReal * exag);
    ctx.fillStyle = '#e0503c'; ctx.beginPath(); ctx.arc(land[0], land[1], 5, 0, 7); ctx.fill();
    ctx.fillStyle = '#8b8ba0'; ctx.beginPath(); ctx.arc(tgt[0], tgt[1], 4, 0, 7); ctx.fill();
    const g0 = P(0, 0); ctx.fillStyle = '#c9a961'; ctx.beginPath(); ctx.arc(g0[0], g0[1], 5, 0, 7); ctx.fill();
    ctx.fillStyle = '#e8e4d8'; ctx.fillText(c.from, g0[0] + 8, g0[1] + (which === 1870 ? 18 : -8));
    // north arrow
    ctx.strokeStyle = '#e8e4d8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(W - 30, 50); ctx.lineTo(W - 30, 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W - 36, 28); ctx.lineTo(W - 30, 18); ctx.lineTo(W - 24, 28); ctx.stroke();
    ctx.fillStyle = '#e8e4d8'; ctx.fillText(EN ? 'N' : 'N', W - 34, 66);
    // vertical-motion term (vacuum estimate): west by Ω cosφ g T³ / 6
    const west = OMEGA * Math.cos(LAT) * 9.82 * c.tof ** 3 / 6;
    const txt = EN
      ? `Range ${dec(c.range / 1000, 1)} km · flight time ${c.tof} s · deflection to the right ≈ ${dec(yReal, 0)} m (drawn ${exag}× larger)`
      : `Skudvidde ${dec(c.range / 1000, 1)} km · flyvetid ${c.tof} s · afbøjning til højre ≈ ${dec(yReal, 0)} m (tegnet ${exag} gange større)`;
    document.getElementById('parisRead').textContent = txt;
    document.getElementById('parisWest').textContent = EN
      ? `Rise and fall add a westward shift of roughly ${dec(west, 0)} m (estimate without air resistance).`
      : `Op- og nedturen giver desuden en forskydning mod vest på groft ${dec(west, 0)} m (overslag uden luftmodstand).`;
  }
  document.querySelectorAll('[data-case]').forEach(b => b.addEventListener('click', () => {
    which = +b.dataset.case;
    document.querySelectorAll('[data-case]').forEach(x => x.classList.toggle('on', x === b));
    const ex = document.getElementById('parisExag');
    ex.value = which === 1918 ? 10 : 200; ex.dispatchEvent(new Event('input'));
  }));
  const ex = document.getElementById('parisExag');
  ex.addEventListener('input', () => { exag = +ex.value; document.getElementById('parisExagVal').textContent = exag + '×'; draw(); });
  window.addEventListener('resize', draw);
  exag = +ex.value; document.getElementById('parisExagVal').textContent = exag + '×';
  draw();
})();
