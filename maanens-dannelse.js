/*
 * maanens-dannelse.js – fælles 3D-motor for maanens-dannelse.html (da) og maanens-dannelse-en.html (en)
 * Michael H. Grant · mhgfysik.dk · CC BY 4.0
 *
 * Fem 3D-scener i samme lærred:
 *   dannelse – Theia-nedslaget, den glødende skive, Roche-grænsen, Månen samles og trækker sig tilbage
 *   ring     – laboratorium: hvornår bliver en måne til en ring? (Roche-grænse og synkronbane)
 *   krater   – kraterdannelse i 3D, med tværsnit, slowmotion og baglæns
 *   aksen    – Jordens hældning med og uden Månen
 *   tidevand – tidevandsbuler, spring- og nipflod, og tidevandet i Jordens fortid
 * plus to 2D-lærreder: tidevandsbassiner (fisk på land) og måneskin (lux, koralgydning).
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const EN = document.documentElement.lang === 'en';
const S = (da, en) => (EN ? en : da);
const fmt = (x, d = 1) => Number(x).toLocaleString(EN ? 'en-GB' : 'da-DK', { maximumFractionDigits: d, minimumFractionDigits: d });
const fmt0 = x => fmt(x, 0);
const $ = id => document.getElementById(id);

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2;
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
let seed = 12345;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
const isMobile = matchMedia('(max-width: 700px)').matches || /Mobi|Android/i.test(navigator.userAgent);

/* ======================================================================
   Procedurelle teksturer (bruges også som reserve, hvis billeder ikke hentes)
   ====================================================================== */
function hash3(x, y, z) { let h = x * 374761393 + y * 668265263 + z * 1274126177; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  let r = 0;
  for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) for (let dz = 0; dz < 2; dz++) {
    const wt = (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
    r += wt * hash3(xi + dx, yi + dy, zi + dz);
  }
  return r;
}
function fbm(x, y, z, oct = 5) { let a = 0.5, f = 1, s = 0; for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f, z * f); a *= 0.5; f *= 2.03; } return s; }
function sphereTexture(w, h, fn) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'); const img = ctx.createImageData(w, h);
  for (let j = 0; j < h; j++) {
    const lat = Math.PI * (0.5 - (j + 0.5) / h);
    for (let i = 0; i < w; i++) {
      const lon = TAU * (i + 0.5) / w;
      const x = Math.cos(lat) * Math.cos(lon), y = Math.sin(lat), z = Math.cos(lat) * Math.sin(lon);
      const [r, g, b] = fn(x, y, z, lat);
      const k = 4 * (j * w + i); img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = b; img.data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const TW = isMobile ? 256 : 512, TH = TW / 2;
const texLavaRock = sphereTexture(TW, TH, (x, y, z) => { const n = fbm(x * 3 + 7, y * 3, z * 3); const v = 40 + n * 70; return [v * 1.05, v * 0.9, v * 0.8]; });
const texLavaGlow = sphereTexture(TW, TH, (x, y, z) => { const n = fbm(x * 4, y * 4 + 3, z * 4); const c = clamp(1 - Math.abs(n - 0.5) * 16); return [255 * c, 110 * c * c + 20 * c, 20 * c * c]; });
const texTheia = sphereTexture(TW, TH, (x, y, z) => { const n = fbm(x * 3 + 2, y * 3 + 5, z * 3); return [110 + 80 * n, 70 + 50 * n, 50 + 30 * n]; });
const texMoonFallback = sphereTexture(TW, TH, (x, y, z) => {
  const n = fbm(x * 2.5, y * 2.5, z * 2.5, 6); const mare = smooth(0.55, 0.62, fbm(x * 1.3 + 4, y * 1.3, z * 1.3, 3));
  const v = 150 + 70 * n - 70 * mare; return [v, v, v * 0.97];
});
const texEarthFallback = sphereTexture(TW, TH, (x, y, z, lat) => {
  const n = fbm(x * 2 + 1, y * 2, z * 2, 6); const ice = Math.abs(lat) > 1.2;
  if (ice) return [235, 240, 245];
  return n > 0.53 ? [70 + 60 * n, 110 + 40 * n, 50] : [20, 50 + 40 * n, 120 + 60 * n];
});
const loader = new THREE.TextureLoader(); loader.setCrossOrigin('anonymous');
function loadTex(url, fallback) {
  const t = fallback.clone ? fallback : fallback; // placeholder; vi bytter image, når billedet er hentet
  loader.load(url, img => { img.colorSpace = THREE.SRGBColorSpace; t.image = img.image; t.needsUpdate = true; }, undefined, () => {});
  return t;
}
const texMoon = loadTex('https://threejs.org/examples/textures/planets/moon_1024.jpg', texMoonFallback);
const texEarth = loadTex('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg', texEarthFallback);

/* ======================================================================
   Renderer, scene, kamera
   ====================================================================== */
const box = $('simbox');
const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
renderer.localClippingEnabled = true;
box.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02030a);
const camera = new THREE.PerspectiveCamera(45, 1, 0.02, 4000);
camera.position.set(0, 7, 13);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.minDistance = 1.6; controls.maxDistance = 900;

const sunLight = new THREE.DirectionalLight(0xffffff, 2.6); sunLight.position.set(-12, 4, 6); scene.add(sunLight);
const amb = new THREE.AmbientLight(0x404a66, 0.35); scene.add(amb);

// stjerner
{
  const n = 2500, p = new Float32Array(n * 3), c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const v = new THREE.Vector3(gauss(), gauss(), gauss()).normalize().multiplyScalar(1500 + rnd() * 500);
    p.set([v.x, v.y, v.z], i * 3); const b = 0.4 + rnd() * 0.6; c.set([b, b, b * (0.9 + rnd() * 0.2)], i * 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true })));
}

const camFactor = () => Math.max(1, 1.2 / camera.aspect);
function resize() {
  const w = box.clientWidth, h = box.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

/* partikel-materiale med farve, størrelse og alfa pr. punkt */
function makePointsMaterial(baseSize) {
  return new THREE.ShaderMaterial({
    uniforms: { uSize: { value: baseSize * renderer.getPixelRatio() }, uScale: { value: 1200 } },
    vertexShader: `attribute float aAlpha; attribute float aSize; attribute vec3 color; varying vec3 vC; varying float vA;
      uniform float uSize; uniform float uScale;
      void main(){ vC=color; vA=aAlpha; vec4 mv=modelViewMatrix*vec4(position,1.0);
        gl_PointSize = uSize*aSize*uScale/max(-mv.z,0.1); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `varying vec3 vC; varying float vA;
      void main(){ vec2 d=gl_PointCoord-0.5; float r=length(d); if(r>0.5||vA<0.01) discard;
        gl_FragColor=vec4(vC, vA*smoothstep(0.5,0.15,r)); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
}
function makePoints(n, baseSize, blending) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(n), 1));
  g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(n).fill(1), 1));
  const m = makePointsMaterial(baseSize); if (blending !== undefined) m.blending = blending;
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; return pts;
}
function circleLine(r, color, dashed = true, seg = 256) {
  const pts = []; for (let i = 0; i <= seg; i++) { const a = TAU * i / seg; pts.push(new THREE.Vector3(r * Math.cos(a), 0, -r * Math.sin(a))); }
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  const m = dashed ? new THREE.LineDashedMaterial({ color, dashSize: 0.12, gapSize: 0.08, transparent: true, opacity: 0.85 }) : new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 });
  const l = new THREE.Line(g, m); if (dashed) l.computeLineDistances(); return l;
}
function glowSprite(color = 0xffcc88) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,220,160,0.8)'); gr.addColorStop(1, 'rgba(255,120,40,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  return s;
}

/* ======================================================================
   Etiketter (HTML over lærredet)
   ====================================================================== */
const labelBox = $('labels');
const labels = [];
function addLabel(text, cls, group) { const el = document.createElement('div'); el.className = 'lbl ' + (cls || ''); el.textContent = text; labelBox.appendChild(el); const L = { el, pos: new THREE.Vector3(), group, show: true }; labels.push(L); return L; }
const tmpV = new THREE.Vector3();
function updateLabels() {
  const w = box.clientWidth, h = box.clientHeight;
  for (const L of labels) {
    const vis = L.show && (!L.group || L.group.visible);
    if (!vis) { L.el.style.display = 'none'; continue; }
    tmpV.copy(L.pos).project(camera);
    if (tmpV.z > 1 || tmpV.z < -1) { L.el.style.display = 'none'; continue; }
    L.el.style.display = 'block';
    L.el.style.left = ((tmpV.x + 1) / 2 * w) + 'px'; L.el.style.top = ((1 - tmpV.y) / 2 * h) + 'px';
  }
}

/* ======================================================================
   Fælles objekter: Jorden (ung og nutidig) og Månen
   ====================================================================== */
function makeEarthModern(r = 1) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, 64, 48), new THREE.MeshStandardMaterial({ map: texEarth, roughness: 0.85, metalness: 0 }));
}
function makeMoon(r) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), new THREE.MeshStandardMaterial({ map: texMoon, roughness: 1, metalness: 0, emissive: 0xff5a10, emissiveIntensity: 0 }));
}

/* ======================================================================
   SCENE 1 · DANNELSE
   ====================================================================== */
const W = 2.2;                       // visuel Kepler-skala: omega = W r^-1.5 (rad pr. animationssekund)
const omega = r => W / (r * Math.sqrt(r));
const ROCHE_ROCK = 2.9, SYNC_5H = 2.3;
const formation = (() => {
  const G = new THREE.Group(); scene.add(G);
  const T = 80;                    // varighed ved 1×
  const sImp = 0.14;
  // ung jord
  const protoMat = new THREE.MeshStandardMaterial({ map: texLavaRock, emissiveMap: texLavaGlow, emissive: 0xffffff, emissiveIntensity: 0.3, roughness: 1 });
  const proto = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), protoMat); G.add(proto);
  const modern = makeEarthModern(1.002); modern.material.transparent = true; modern.material.opacity = 0; G.add(modern);
  // Theia
  const theia = new THREE.Mesh(new THREE.SphereGeometry(0.53, 48, 32), new THREE.MeshStandardMaterial({ map: texTheia, emissive: 0xff6020, emissiveIntensity: 0, roughness: 1 }));
  G.add(theia);
  const flash = glowSprite(); flash.scale.setScalar(0.01); G.add(flash);
  const flashLight = new THREE.PointLight(0xffaa55, 0, 30, 1.5); G.add(flashLight);
  // linjer
  const roche = circleLine(ROCHE_ROCK, 0xf2d590); G.add(roche);
  const sync = circleLine(SYNC_5H, 0x7fd1b9); G.add(sync);
  const lRoche = addLabel(S('Roche-grænsen (2,9 R⊕)', 'Roche limit (2.9 R⊕)'), 'g', G);
  const lSync = addLabel(S('Synkronbane (døgn 5 t)', 'Synchronous orbit (5 h day)'), 'gr', G);
  const lEarth = addLabel(S('Proto-Jorden', 'Proto-Earth'), '', G);
  const lTheia = addLabel('Theia', 'b', G);
  const lMoon = addLabel(S('Månen', 'The Moon'), 'g', G);
  // partikler
  const N = isMobile ? 2600 : 6500;
  const pts = makePoints(N, isMobile ? 0.05 : 0.035); G.add(pts);
  const P = { rt: new Float32Array(N), phi0: new Float32Array(N), z0: new Float32Array(N), td: new Float32Array(N), fate: new Uint8Array(N), tJ: new Float32Array(N), rOut: new Float32Array(N), k: new Uint8Array(N), heat: new Float32Array(N) };
  const K = 5, RK = [3.1, 3.45, 3.95, 4.55, 5.3], phiK0 = [], phiM0 = 0.6;
  for (let k = 0; k < K; k++) phiK0.push(phiM0 + (k - 2) * 0.7);
  for (let i = 0; i < N; i++) {
    let rt = 1.2 + Math.abs(gauss()) * 1.5 + rnd() * 0.9; if (rt > 6.4) rt = 1.3 + rnd() * 5;
    P.rt[i] = rt; P.phi0[i] = gauss() * 0.18; P.z0[i] = gauss() * 0.32 * Math.min(1.5, rt / 2.5); P.td[i] = 5 + rnd() * 7; P.heat[i] = rnd();
    if (rt < ROCHE_ROCK) { P.fate[i] = rnd() < 0.45 ? 0 : 1; } else P.fate[i] = 2;
    if (P.fate[i] === 0) P.tJ[i] = 0.34 + rnd() * 0.22;
    else if (P.fate[i] === 1) { P.tJ[i] = 0.47 + rnd() * 0.12; P.rOut[i] = 3.0 + rnd() * 0.6; }
    else P.tJ[i] = 0.38 + rnd() * 0.2;
    const rr = P.fate[i] === 1 ? P.rOut[i] : rt; let best = 0, bd = 1e9;
    for (let k = 0; k < K; k++) { const d = Math.abs(RK[k] - rr); if (d < bd) { bd = d; best = k; } }
    P.k[i] = best;
  }
  const clumps = [];
  for (let k = 0; k < K; k++) { const m = makeMoon(0.27); m.material.emissiveIntensity = 1.2; G.add(m); clumps.push(m); }
  const total = [0, 0, 0, 0, 0]; for (let i = 0; i < N; i++) if (P.fate[i] > 0) total[P.k[i]]++;
  const totalAll = total.reduce((a, b) => a + b, 0);
  const moon = makeMoon(0.273); G.add(moon);
  const orbitLine = circleLine(1, 0xd8b46a, false, 256); orbitLine.material.opacity = 0.35; G.add(orbitLine);

  // historisk tabel: [alder (mia. år), afstand (R⊕), døgn (timer)] – tilnærmet
  const HIST = [[4.51, 3.8, 5], [4.45, 10, 7], [4.3, 22, 9.5], [3.2, 42.2, 13], [2.45, 54.6, 17], [0.62, 58.2, 21.9], [0.38, 59.0, 22], [0, 60.3, 24]];
  const sRec0 = 0.78, sRec1 = 0.985;
  function hist(u) { const x = u * (HIST.length - 1); const i = Math.min(HIST.length - 2, Math.floor(x)), f = x - i; return [lerp(HIST[i][0], HIST[i + 1][0], f), lerp(HIST[i][1], HIST[i + 1][1], f), lerp(HIST[i][2], HIST[i + 1][2], f)]; }
  // forud-integreret månevinkel i tilbagetrækningsfasen
  const NA = 600, cumA = new Float32Array(NA + 1);
  for (let j = 1; j <= NA; j++) { const s = sRec0 + (sRec1 - sRec0) * j / NA; const u = smooth(sRec0, sRec1, s); const a = hist(u)[1]; cumA[j] = cumA[j - 1] + omega(a) * (sRec1 - sRec0) / NA * T * 0.6; }
  const tauOf = s => Math.max(0, s - sImp) * T;
  function moonAngle(s) {
    if (s <= sRec0) return phiM0 + omega(3.8) * tauOf(s);
    const base = phiM0 + omega(3.8) * tauOf(sRec0);
    const j = clamp((s - sRec0) / (sRec1 - sRec0)) * NA; const j0 = Math.floor(j);
    return base + (j0 >= NA ? cumA[NA] : lerp(cumA[j0], cumA[j0 + 1], j - j0)) + (s > sRec1 ? omega(60.3) * (s - sRec1) * T * 0.6 : 0);
  }
  function clumpPos(k, s, out) {
    const tau = tauOf(s);
    let r = RK[k], a = phiK0[k] + omega(RK[k]) * tau;
    const mm = smooth(0.58 + 0.02 * k, 0.72, s);
    if (mm > 0) { const am = moonAngle(s); r = lerp(r, 3.8, mm); a = a + angDiff(a, am) * mm; }
    return out.set(r * Math.cos(a), 0, -r * Math.sin(a));
  }
  const cp = [0, 1, 2, 3, 4].map(() => new THREE.Vector3());
  const STAGES = [
    { s: 0, title: S('1 · Theia nærmer sig', '1 · Theia approaches'), time: S('For ca. 4,5 mia. år siden – ~100 mio. år efter Solsystemets fødsel', 'About 4.5 billion years ago – ~100 million years after the Solar System formed'),
      text: S('Den unge Jord er en næsten færdig, glødende klippeplanet. En anden protoplanet, Theia, på størrelse med Mars, kommer ind på skrå. Målinger af jernisotoper i måneprøver tyder på, at Theia blev dannet i det indre Solsystem – måske endnu tættere på Solen end Jorden (Hopp m.fl., Science 2025).',
        'The young Earth is an almost finished, glowing rocky planet. Another protoplanet, Theia, about the size of Mars, comes in at an oblique angle. Iron isotopes in lunar samples suggest that Theia formed in the inner Solar System – perhaps even closer to the Sun than Earth (Hopp et al., Science 2025).') },
    { s: 0.135, title: S('2 · Kæmpenedslaget', '2 · The giant impact'), time: S('Minutter til timer', 'Minutes to hours'),
      text: S('Theia rammer med ca. 10 km/s i en vinkel på omkring 45°. Theias jernkerne synker ned og smelter sammen med Jordens kerne. Kappemateriale fra begge kloder fordamper og smelter og kastes ud. Fordi stødet er skråt, får det udkastede materiale fart på tværs og går i kredsløb i stedet for at falde tilbage.',
        'Theia strikes at about 10 km/s at roughly 45°. Its iron core sinks and merges with Earth’s core. Mantle rock from both bodies is vaporised and melted and thrown out. Because the blow is oblique, the ejected material gets sideways speed and goes into orbit instead of falling straight back.') },
    { s: 0.2, title: S('3 · En glødende skive', '3 · A glowing disk'), time: S('Timer til dage', 'Hours to days'),
      text: S('Materialet – omkring 1,5–2 månemasser – fordeler sig i en skive af smeltet sten og stendamp på flere tusind grader. Inderste dele kredser hurtigst (Keplers 3. lov), så skyen vikles op. Stød mellem dråberne fjerner bevægelsen på tværs, mens impulsmomentet bevares: skyen bliver flad. Den grønne cirkel er synkronbanen, hvor et omløb varer lige så længe som Jordens døgn på ca. 5 timer.',
        'The material – about 1.5–2 lunar masses – spreads into a disk of molten rock and rock vapour at thousands of degrees. The inner parts orbit fastest (Kepler’s third law), so the cloud winds up. Collisions between droplets remove the up-and-down motion while angular momentum is conserved: the cloud flattens. The green circle is the synchronous orbit, where one orbit takes as long as Earth’s day of about 5 hours.') },
    { s: 0.36, title: S('4 · Roche-grænsen sorterer', '4 · The Roche limit sorts'), time: S('Måneder til år', 'Months to years'),
      text: S('Inden for Roche-grænsen (gul) river Jordens tidevandskraft enhver klump i stykker – her kan stoffet kun være en ring. Uden for grænsen vinder klumpernes egen tyngde, og småmåner vokser hurtigt. Den indre ring breder sig ud: noget regner ned på Jorden, resten skubbes ud over Roche-grænsen og fodrer småmånerne.',
        'Inside the Roche limit (yellow) Earth’s tidal force tears any clump apart – here the material can only be a ring. Outside the limit the clumps’ own gravity wins, and moonlets grow quickly. The inner ring spreads: some rains down on Earth, the rest is pushed out across the Roche limit and feeds the moonlets.') },
    { s: 0.58, title: S('5 · Månen samles – ingen ring bliver tilbage', '5 · The Moon assembles – no ring is left'), time: S('Fra få måneder op til ~100 år', 'From a few months up to ~100 years'),
      text: S('Småmånerne støder sammen og bliver til én måne lige uden for Roche-grænsen, med et hav af magma på overfladen. Ringen forsvinder, fordi det meste af massen lå uden for Roche-grænsen, fordi den indre rest enten faldt ned eller blev skubbet ud, og fordi Månen dannedes uden for synkronbanen: tidevandet skubber den udad, væk fra Roche-grænsen.',
        'The moonlets collide and become a single moon just outside the Roche limit, with an ocean of magma on its surface. The ring disappears because most of the mass lay outside the Roche limit, because the inner remnant either fell down or was pushed out, and because the Moon formed outside the synchronous orbit: tides push it outwards, away from the Roche limit.') },
    { s: 0.78, title: S('6 · Månen trækker sig tilbage', '6 · The Moon recedes'), time: S('4,5 mia. år – og stadig 3,8 cm om året', '4.5 billion years – and still 3.8 cm a year'),
      text: S('Tidevandsbulen på Jorden ligger lidt foran Månen og trækker den fremad i banen: Månen får impulsmoment og løftes udad, mens Jordens rotation bremses. Døgnet går fra ca. 5 til 24 timer. Afstand og døgn i fortiden er tilnærmede: de bygger på tidevandsaflejringer (3,2 mia. år: 70 % af nutidens afstand, døgn 13 t) og koralvækstlinjer (Devon: ca. 400 døgn om året). Kameraet zoomer ud – kun Jord og Måne er i rigtigt størrelsesforhold.',
        'Earth’s tidal bulge lies slightly ahead of the Moon and pulls it forward in its orbit: the Moon gains angular momentum and rises outwards, while Earth’s spin slows. The day goes from about 5 to 24 hours. Past distances and day lengths are approximate: they rest on tidal deposits (3.2 billion years ago: 70 % of today’s distance, a 13-hour day) and coral growth lines (Devonian: about 400 days a year). The camera zooms out – only Earth and Moon are drawn to scale.') }
  ];
  const tmp = new THREE.Vector3();
  function update(s, dtEff) {
    const tau = tauOf(s);
    // Theia
    const C = new THREE.Vector3(1.53, 0, 0), vh = new THREE.Vector3(-0.707, 0, -0.707);
    if (s < sImp) {
      const f = s / sImp; const d = (1 - f) * 12; theia.position.copy(C).addScaledVector(vh, -d); theia.position.y = 0.3 * (1 - f) * (1 - f);
      theia.scale.setScalar(1); theia.visible = true; theia.material.emissiveIntensity = 0.1 + 0.8 * smooth(0.85, 1, f);
      theia.rotation.y += dtEff * 0.4;
    } else {
      const f = smooth(sImp, sImp + 0.05, s); theia.position.copy(C).addScaledVector(vh, 0.7 * f);
      theia.scale.setScalar(Math.max(0.001, 1 - f)); theia.material.emissiveIntensity = 1.5; theia.visible = f < 0.999;
    }
    const fl = s < sImp ? 0 : Math.exp(-(s - sImp) / 0.012) * smooth(sImp, sImp + 0.003, s);
    flash.position.set(1.05, 0, -0.1); flash.scale.setScalar(0.2 + 6 * fl); flash.material.opacity = fl; flashLight.position.copy(flash.position); flashLight.intensity = 40 * fl;
    // jorden
    const heat = s < sImp ? 0.35 : lerp(1.6, 0.15, smooth(sImp, 0.8, s));
    protoMat.emissiveIntensity = heat;
    modern.material.opacity = smooth(0.84, 0.98, s); modern.visible = modern.material.opacity > 0.001;
    // dagslængde → rotationshastighed
    const u = smooth(sRec0, sRec1, s); const [age, aM, dayH] = hist(u);
    const spin = 2.4 * (5 / dayH);
    proto.rotation.y += dtEff * spin; modern.rotation.y = proto.rotation.y;
    // partikler
    const pos = pts.geometry.attributes.position.array, col = pts.geometry.attributes.color.array, al = pts.geometry.attributes.aAlpha.array;
    for (let k = 0; k < K; k++) clumpPos(k, s, cp[k]);
    const joined = [0, 0, 0, 0, 0];
    const cool = smooth(sImp, 0.7, s);
    for (let i = 0; i < N; i++) {
      if (s < sImp) { al[i] = 0; continue; }
      const rt = P.rt[i]; const kap = omega(rt) * 1.1;
      let r = rt + (1 - rt) * Math.exp(-tau / P.td[i]) * Math.cos(kap * tau);
      let z = P.z0[i] * Math.sin(Math.min(tau * 1.2, Math.PI / 2)) * Math.exp(-tau / 9);
      const phi = P.phi0[i] + omega(rt) * tau;
      let a = smooth(sImp, sImp + 0.01, s);
      const f = P.fate[i];
      if (f === 0) { const ff = smooth(P.tJ[i], P.tJ[i] + 0.06, s); r = lerp(r, 0.98, ff); z *= 1 - ff; a *= 1 - smooth(P.tJ[i] + 0.04, P.tJ[i] + 0.06, s); }
      else if (f === 1) { r = lerp(r, P.rOut[i], smooth(P.tJ[i] - 0.09, P.tJ[i] - 0.01, s)); }
      r = Math.max(r, 1.02);
      let x = r * Math.cos(phi), y = z, zz = -r * Math.sin(phi);
      if (f > 0) {
        const j = smooth(P.tJ[i], P.tJ[i] + 0.05, s);
        if (j > 0) { const c = cp[P.k[i]]; x = lerp(x, c.x, j); y = lerp(y, c.y, j); zz = lerp(zz, c.z, j); }
        a *= 1 - smooth(P.tJ[i] + 0.035, P.tJ[i] + 0.05, s);
        if (s > P.tJ[i] + 0.04) joined[P.k[i]]++;
      }
      pos[3 * i] = x; pos[3 * i + 1] = y; pos[3 * i + 2] = zz;
      const hh = clamp(1 - cool * (0.6 + 0.6 * P.heat[i]) + (r < ROCHE_ROCK ? 0.25 : 0));
      col[3 * i] = lerp(0.55, 1.0, hh); col[3 * i + 1] = lerp(0.45, 0.62, hh) * (0.8 + 0.3 * hh); col[3 * i + 2] = lerp(0.42, 0.25, hh);
      al[i] = a * 0.85;
    }
    pts.geometry.attributes.position.needsUpdate = true; pts.geometry.attributes.color.needsUpdate = true; pts.geometry.attributes.aAlpha.needsUpdate = true;
    // klumper og måne
    const merged = s >= 0.72;
    let mass = 0;
    for (let k = 0; k < K; k++) {
      const frac = joined[k] / Math.max(1, totalAll); mass += frac;
      const c = clumps[k]; c.visible = !merged && frac > 0.002; c.position.copy(cp[k]);
      c.scale.setScalar(Math.max(0.05, Math.cbrt(frac))); c.material.emissiveIntensity = 1.4 * (1 - smooth(0.4, 0.95, s)); c.rotation.y += dtEff * 0.2;
    }
    moon.visible = merged;
    const am = moonAngle(s); const aR = s < sRec0 ? 3.8 : aM;
    moon.position.set(aR * Math.cos(am), 0, -aR * Math.sin(am));
    moon.rotation.y = am + Math.PI;                     // bundet rotation: samme side mod Jorden
    moon.material.emissiveIntensity = 1.4 * (1 - smooth(0.4, 0.95, s));
    orbitLine.visible = merged; orbitLine.scale.setScalar(aR);
    roche.material.opacity = 0.85 * (1 - smooth(0.85, 0.95, s)); sync.material.opacity = 0.85 * (1 - smooth(0.85, 0.95, s));
    roche.visible = roche.material.opacity > 0.01; sync.visible = roche.visible;
    // etiketter
    lRoche.pos.set(ROCHE_ROCK * 0.71, 0.05, ROCHE_ROCK * 0.71); lRoche.show = roche.visible && s > 0.18;
    lSync.pos.set(-SYNC_5H * 0.71, 0.05, SYNC_5H * 0.71); lSync.show = roche.visible && s > 0.18;
    lEarth.pos.set(0, 1.15, 0); lEarth.el.textContent = s > 0.8 ? S('Jorden', 'Earth') : S('Proto-Jorden', 'Proto-Earth');
    lTheia.pos.copy(theia.position).y += 0.7; lTheia.show = s < sImp + 0.01;
    lMoon.pos.copy(moon.position).y += 0.45; lMoon.show = merged;
    // HUD
    let tm;
    if (s < sImp) tm = S('Før nedslaget · døgnet på proto-Jorden: få timer', 'Before the impact · the proto-Earth’s day: a few hours');
    else if (s < sRec0) {
      const yrs = s < 0.2 ? S('timer', 'hours') : s < 0.36 ? S('dage', 'days') : s < 0.58 ? S('måneder–år', 'months–years') : S('op til ~100 år', 'up to ~100 years');
      tm = S('Efter nedslaget: ', 'After the impact: ') + yrs + S(' · skivemasse samlet i måner: ', ' · disk mass gathered into moons: ') + fmt0(100 * mass) + ' %';
    } else {
      const km = aR * 6371;
      tm = S('For ', '') + fmt(age, 2) + S(' mia. år siden', ' billion years ago') + ' · ' + S('afstand ', 'distance ') + fmt0(km / 1000) + S(' 000 km', ',000 km') + ' (' + fmt(aR, 1) + ' R⊕) · ' + S('døgn ', 'day ') + fmt(dayH, 1) + S(' t', ' h');
    }
    $('hudTm').textContent = tm;
    // automatisk zoom i tilbagetrækningen
    if ($('autoZoom') && $('autoZoom').checked) {
      const want = (s < sRec0 ? 12.5 : Math.max(12.5, aR * 2.9)) * camFactor();
      const v = camera.position.clone().sub(controls.target); const L = v.length();
      v.setLength(lerp(L, want, 0.06)); camera.position.copy(controls.target).add(v);
    }
  }
  return { group: G, T, STAGES, update, cam: [0, 7, 13], story: true };
})();

/* ======================================================================
   SCENE 2 · RING ELLER MÅNE? (laboratorium)
   ====================================================================== */
const ringlab = (() => {
  const G = new THREE.Group(); scene.add(G); G.visible = false;
  const earth = makeEarthModern(1); G.add(earth);
  const M = isMobile ? 900 : 1800;
  const pts = makePoints(M, isMobile ? 0.06 : 0.045, THREE.NormalBlending); G.add(pts);
  const off = new Float32Array(M * 3);
  for (let i = 0; i < M; i++) { let x, y, z; do { x = rnd() * 2 - 1; y = rnd() * 2 - 1; z = rnd() * 2 - 1; } while (x * x + y * y + z * z > 1); off.set([x * 0.27, y * 0.27, z * 0.27], 3 * i); }
  { const col = pts.geometry.attributes.color.array; for (let i = 0; i < M; i++) { const b = 0.65 + 0.3 * rnd(); col.set([b, b * 0.97, b * 0.92], 3 * i); } pts.geometry.attributes.color.needsUpdate = true; }
  const rocheL = circleLine(2.9, 0xf2d590); G.add(rocheL);
  const syncL = circleLine(2.3, 0x7fd1b9); G.add(syncL);
  const lR = addLabel('', 'g', G), lS = addLabel('', 'gr', G), lM = addLabel('', '', G);
  const st = { d: 3.8, day: 5, rho: 3.34, drift: true, t: 0, dis: false, tDis: 0, dDis: 0, phiDis: 0, phi: 0, crash: false };
  const rocheOf = rho => 2.44 * Math.cbrt(5.51 / rho);
  const syncOf = day => 6.61 * Math.pow(day / 23.93, 2 / 3);
  function reset() { st.d = +$('rlD').value; st.day = +$('rlDay').value; st.rho = +$('rlRho').value; st.drift = $('rlDrift').checked; st.t = 0; st.dis = false; st.phi = 0; st.crash = false; st.d0 = st.d; }
  function syncUI() { $('rlDv').textContent = fmt(+$('rlD').value, 1) + ' R⊕'; $('rlDayv').textContent = fmt(+$('rlDay').value, 1) + S(' t', ' h'); }
  ['rlD', 'rlDay', 'rlRho', 'rlDrift'].forEach(id => $(id).addEventListener('input', () => { syncUI(); reset(); }));
  document.querySelectorAll('[data-rl]').forEach(b => b.addEventListener('click', () => {
    const p = { young: [3.8, 5, 3.34], inside: [3.4, 11, 3.34], roche: [2.3, 5, 3.34], ice: [3.6, 5, 0.93] }[b.dataset.rl];
    $('rlD').value = p[0]; $('rlDay').value = p[1]; $('rlRho').value = p[2]; syncUI(); reset();
  }));
  $('rlGo').addEventListener('click', reset);
  syncUI(); reset();
  const STAGES = [{ s: 0, title: S('Ring eller måne? – et laboratorium', 'Ring or moon? – a laboratory'), time: S('Vælg afstand, døgnlængde og materiale', 'Choose distance, day length and material'),
    text: S('Anbring en „bunke grus“ med Månens størrelse i kredsløb om Jorden. To afstande afgør dens skæbne: Roche-grænsen (gul), inden for hvilken tidevandskraften er stærkere end bunkens egen tyngde, og synkronbanen (grøn), hvor et omløb varer lige så længe som et døgn. Uden for synkronbanen skubber tidevandet månen udad; inden for trækker det den indad – og så ender den før eller siden inden for Roche-grænsen som en ring.',
      'Place a Moon-sized “rubble pile” in orbit around Earth. Two distances decide its fate: the Roche limit (yellow), inside which the tidal force beats the pile’s own gravity, and the synchronous orbit (green), where one orbit lasts exactly one day. Outside the synchronous orbit tides push the moon outwards; inside, they pull it inwards – and then sooner or later it ends up inside the Roche limit as a ring.') }];
  function update(s, dtEff) {
    const roche = rocheOf(st.rho), sync = syncOf(st.day);
    rocheL.scale.setScalar(roche / 2.9); syncL.scale.setScalar(sync / 2.3);
    st.t += dtEff;
    if (st.t < 0) { st.t = 0; }
    if (st.dis && st.t < st.tDis) { st.dis = false; st.d = st.dDis; st.phi = st.phiDis; }
    if (!st.dis && !st.crash) {
      if (st.drift) { const sg = Math.sign(st.d - sync); st.d += sg * 18 * Math.pow(st.d, -5.5) * dtEff; st.d = Math.max(1.05, Math.min(9, st.d)); }
      st.phi += omega(st.d) * dtEff;
      if (st.d < roche) { st.dis = true; st.tDis = st.t; st.dDis = st.d; st.phiDis = st.phi; }
      if (st.d < 1.3) st.crash = true;
    }
    earth.rotation.y += dtEff * TAU / (st.day / 2.5);
    const pos = pts.geometry.attributes.position.array, al = pts.geometry.attributes.aAlpha.array;
    const stretch = 1 + 0.7 * smooth(roche * 1.35, roche, st.d);
    for (let i = 0; i < M; i++) {
      const dx = off[3 * i], dy = off[3 * i + 1], dz = off[3 * i + 2];
      let r, phi, y;
      if (!st.dis) { r = st.d + dx * stretch; phi = st.phi + dz / st.d; y = dy / Math.sqrt(stretch); }
      else {
        const tau = st.t - st.tDis; const spread = 1 + 9 * smooth(0, 30, tau);
        r = st.dDis + dx * 1.6 * spread + dx * 0.2 * Math.sin(tau);
        phi = st.phiDis + dz / st.dDis + omega(Math.max(1.02, r)) * tau;
        y = dy * Math.exp(-tau / 4) * 0.8;
      }
      al[i] = r < 1.04 ? 0 : 1;
      pos[3 * i] = r * Math.cos(phi); pos[3 * i + 1] = y; pos[3 * i + 2] = -r * Math.sin(phi);
    }
    pts.geometry.attributes.position.needsUpdate = true; pts.geometry.attributes.aAlpha.needsUpdate = true;
    lR.el.textContent = S('Roche-grænse ', 'Roche limit ') + fmt(roche, 1) + ' R⊕'; lR.pos.set(roche * 0.71, 0.05, roche * 0.71);
    lS.el.textContent = S('Synkronbane ', 'Synchronous orbit ') + fmt(sync, 1) + ' R⊕'; lS.pos.set(-sync * 0.71, 0.05, sync * 0.71);
    lM.el.textContent = st.dis ? S('Ring', 'Ring') : S('Måne', 'Moon'); lM.pos.set(st.d * Math.cos(st.phi), 0.4, -st.d * Math.sin(st.phi)); lM.show = !st.dis;
    let msg;
    if (st.dis) msg = S('Inden for Roche-grænsen: tidevandskraften river bunken over. Indre stumper kredser hurtigere end ydre, så den trækkes ud til en ring.', 'Inside the Roche limit: the tidal force tears the pile apart. Inner fragments orbit faster than outer ones, so it is drawn out into a ring.');
    else if (st.d >= sync) msg = S('Uden for synkronbanen: Jorden roterer hurtigere end månen kredser, tidevandsbulen ligger foran månen og trækker den udad. Den forbliver en måne – som vores.', 'Outside the synchronous orbit: Earth spins faster than the moon orbits, the tidal bulge runs ahead of the moon and pulls it outwards. It stays a moon – like ours.');
    else msg = S('Mellem Roche-grænsen og synkronbanen: månen kredser hurtigere end Jorden roterer, bulen halter bagefter og bremser den. Den spiraler indad mod Roche-grænsen – præcis som Mars-månen Phobos, der om 30–50 mio. år forventes at blive revet over til en ring.', 'Between the Roche limit and the synchronous orbit: the moon orbits faster than Earth spins, the bulge lags behind and brakes it. It spirals inwards towards the Roche limit – exactly like Mars’ moon Phobos, which is expected to be torn into a ring in 30–50 million years.');
    $('rlMsg').textContent = msg;
    $('hudTm').textContent = S('Afstand nu: ', 'Distance now: ') + fmt(st.dis ? st.dDis : st.d, 2) + ' R⊕ · ' + S('omløbstid ', 'orbital period ') + fmt(1.408 * Math.pow(st.dis ? st.dDis : st.d, 1.5), 1) + S(' t', ' h');
  }
  return { group: G, T: 0, STAGES, update, cam: [0, 9, 11], story: false, reset };
})();

/* ======================================================================
   SCENE 3 · KRATERDANNELSE
   ====================================================================== */
const crater = (() => {
  const G = new THREE.Group(); scene.add(G); G.visible = false;
  const R = 4;                                // det færdige kraters radius i scene-enheder
  const SIZE = 40, SEG = isMobile ? 150 : 230;
  const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);  // viser z ≤ 0, når tværsnit er slået til
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG); geo.rotateX(-Math.PI / 2);
  const nV = geo.attributes.position.count;
  const baseCol = new Float32Array(nV * 3), rr = new Float32Array(nV);
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(nV * 3), 3));
  for (let i = 0; i < nV; i++) {
    const x = geo.attributes.position.getX(i), z = geo.attributes.position.getZ(i);
    rr[i] = Math.hypot(x, z) / R;
    const n = fbm(x * 0.6 + 50, 0, z * 0.6, 4), b = 0.36 + 0.22 * n;
    baseCol.set([b, b * 0.98, b * 0.95], 3 * i);
  }
  const groundMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, side: THREE.DoubleSide });
  const ground = new THREE.Mesh(geo, groundMat); G.add(ground);
  // tværsnitsvæg
  const NX = isMobile ? 220 : 340, NY = 40, DEEP = 7;
  const wallGeo = new THREE.BufferGeometry();
  const wPos = new Float32Array(NX * NY * 3), wCol = new Float32Array(NX * NY * 3); const idx = [];
  for (let i = 0; i < NX - 1; i++) for (let j = 0; j < NY - 1; j++) { const a = i * NY + j, b = (i + 1) * NY + j; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  wallGeo.setIndex(idx); wallGeo.setAttribute('position', new THREE.BufferAttribute(wPos, 3)); wallGeo.setAttribute('color', new THREE.BufferAttribute(wCol, 3));
  const wall = new THREE.Mesh(wallGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })); G.add(wall);
  // nedslagslegeme, glimt, chokbølge, damp
  const imp = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), new THREE.MeshStandardMaterial({ color: 0x8a7a6a, roughness: 0.9, emissive: 0xff7020, emissiveIntensity: 0 })); G.add(imp);
  const trail = glowSprite(0xffaa66); G.add(trail);
  const flash = glowSprite(); G.add(flash);
  const flashLight = new THREE.PointLight(0xffbb77, 0, 60, 1.2); G.add(flashLight);
  const shock = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32, 0, TAU, Math.PI / 2, Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false, wireframe: true, clippingPlanes: [clipPlane] }));
  G.add(shock);
  const NE = isMobile ? 1600 : 3600;
  const ej = makePoints(NE, isMobile ? 0.11 : 0.08, THREE.NormalBlending); G.add(ej);
  const E = { r0: new Float32Array(NE), th: new Float32Array(NE), rng: new Float32Array(NE), sl: new Float32Array(NE), melt: new Float32Array(NE) };
  for (let i = 0; i < NE; i++) {
    const q = Math.sqrt(rnd()); E.r0[i] = 0.06 + 0.9 * q; E.th[i] = rnd() * TAU; E.melt[i] = q < 0.25 ? 1 : 0;
    E.rng[i] = Math.min(5, 0.28 * Math.pow(E.r0[i], -1.7)) * (0.8 + 0.4 * rnd());
    E.sl[i] = Math.pow(E.r0[i], 1.5);         // udkastningstid (brøkdel af udgravningen): indre først
  }
  const NV2 = isMobile ? 300 : 700;
  const vap = makePoints(NV2, 0.22); G.add(vap);
  const V = { d: [] }; for (let i = 0; i < NV2; i++) { const v = new THREE.Vector3(gauss(), Math.abs(gauss()) + 0.3, gauss()).normalize(); V.d.push(v, 0.5 + rnd()); }
  const lab = { imp: addLabel(S('Nedslagslegeme', 'Impactor'), 'b', G), rim: addLabel(S('Kratervold', 'Rim'), 'g', G), peak: addLabel(S('Centraltop', 'Central peak'), 'g', G), curtain: addLabel(S('Udkastningsgardin', 'Ejecta curtain'), '', G), shock: addLabel(S('Chokbølge', 'Shock wave'), 'b', G), lens: addLabel(S('Breccie-linse', 'Breccia lens'), 'gr', G) };

  // fysik
  const P = { L: 1, v: 17, ang: 45, body: 'moon' };
  const out = {};
  function physics() {
    const g = P.body === 'moon' ? 1.62 : 9.81, Dc = P.body === 'moon' ? 15 : 3.2;
    const rhoI = 3000, rhoT = P.body === 'moon' ? 2800 : 2700;
    const Lm = P.L * 1000, vm = P.v * 1000;
    const Dtc = 1.161 * Math.cbrt(rhoI / rhoT) * Math.pow(Lm, 0.78) * Math.pow(vm, 0.44) * Math.pow(g, -0.22) * Math.cbrt(Math.sin(P.ang * Math.PI / 180)); // m
    const Dtk = Dtc / 1000;
    const simple = 1.25 * Dtk < Dc;
    const Df = simple ? 1.25 * Dtk : 1.17 * Math.pow(Dtk, 1.13) / Math.pow(Dc, 0.13);
    const depth = simple ? 0.2 * Df : (P.body === 'moon' ? 1.044 * Math.pow(Df, 0.301) : 0.4 * Math.pow(Df, 0.3));
    const m = rhoI * Math.PI / 6 * Lm ** 3, Ej = 0.5 * m * vm * vm;
    Object.assign(out, { g, Dc, Dtk, simple, Df, depth, Ej, Mt: Ej / 4.184e15, tc: P.L / P.v, Te: 0.8 * Math.sqrt(Dtc / g), m });
    out.Tm = out.Te * (simple ? 1 : 1.6);
    // profiler i krater-enheder (R = det færdige kraters radius)
    out.Rt = clamp(Dtk / Df, 0.35, 0.85);
    out.dT = (Dtk / 2.8) / (Df / 2) * 1.0;          // transient dybde (≈ D_tc/2,8) i R-enheder
    out.dF = depth / (Df / 2);
    out.rim = simple ? 0.08 : Math.max(0.03, 0.08 * Math.pow(Df / 20, -0.2));
    out.ri = (P.L / Df);                              // nedslagslegemets radius i R-enheder (= L/2 / (D/2))
    out.pk = simple ? 0 : out.dF * 0.75;
    const tb = $('crOut'); if (tb) tb.innerHTML = [
      [S('Energi', 'Energy'), sci(Ej) + ' J ≈ ' + bigMt(out.Mt)],
      [S('Transient krater', 'Transient crater'), fmt(Dtk, Dtk < 10 ? 2 : 1) + ' km'],
      [S('Færdigt krater, diameter D', 'Final crater, diameter D'), fmt(Df, Df < 10 ? 2 : 1) + ' km = ' + fmt0(Df / P.L) + ' × ' + S('legemet', 'the impactor')],
      [S('Dybde (rand til bund)', 'Depth (rim to floor)'), fmt(depth, depth < 1 ? 2 : 1) + ' km'],
      [S('Type', 'Type'), simple ? S('simpelt skålkrater', 'simple bowl crater') : S('komplekst krater (centraltop, terrasser)', 'complex crater (central peak, terraces)')],
      [S('Kontakt og kompression', 'Contact and compression'), fmt(out.tc, out.tc < 0.1 ? 3 : 2) + ' s'],
      [S('Udgravning', 'Excavation'), fmt0(out.Te) + ' s'],
      [S('Kollaps (modifikation)', 'Collapse (modification)'), fmt0(out.Tm) + ' s']
    ].map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('');
  }
  function sci(x) { const e = Math.floor(Math.log10(x)); const m = x / 10 ** e; return fmt(m, 1) + '·10' + String(e).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)] || '⁻').join(''); }
  function bigMt(mt) { if (mt < 1) return fmt(mt * 1000, 0) + S(' kt TNT', ' kt of TNT'); if (mt < 1e6) return fmt0(mt) + S(' Mt TNT', ' Mt of TNT'); return sci(mt) + S(' Mt TNT', ' Mt of TNT'); }
  function bindUI() {
    const upd = () => {
      P.L = Math.pow(10, +$('crL').value); P.v = +$('crV').value; P.ang = +$('crA').value; P.body = $('crBody').value;
      $('crLv').textContent = P.L < 1 ? fmt0(P.L * 1000) + ' m' : fmt(P.L, P.L < 10 ? 1 : 0) + ' km';
      $('crVv').textContent = fmt0(P.v) + ' km/s'; $('crAv').textContent = fmt0(P.ang) + '°';
      physics();
    };
    ['crL', 'crV', 'crA', 'crBody'].forEach(id => $(id).addEventListener('input', upd)); upd();
    $('crCut').addEventListener('change', () => applyCut());
    document.querySelectorAll('[data-crp]').forEach(b => b.addEventListener('click', () => {
      const p = { small: [-0.7, 17, 45, 'moon'], copernicus: [0.48, 17, 45, 'moon'], meteor: [-1.3, 12.8, 45, 'earth'], chicxulub: [1.08, 20, 60, 'earth'] }[b.dataset.crp];
      $('crL').value = p[0]; $('crV').value = p[1]; $('crA').value = p[2]; $('crBody').value = p[3]; upd(); go(0);
    }));
  }
  function applyCut() { const on = $('crCut').checked; groundMat.clippingPlanes = on ? [clipPlane] : []; groundMat.needsUpdate = true; wall.visible = on; }

  // profiler
  function transient(r, e) {             // udgravning, e = 0..1
    const Rt = out.Rt * Math.pow(Math.max(e, 1e-4), 0.42);
    const dt = out.dT * smooth(0, 0.55, e) * (0.35 + 0.65 * Math.pow(e, 0.25));
    const rimH = out.rim * 1.3 * Math.min(1, e * 1.4) * out.Rt;
    if (r < Rt) return -dt * (1 - (r / Rt) ** 2) + rimH * (r / Rt) ** 6;
    return rimH * Math.pow(Rt / r, 3);
  }
  function finalProfile(r) {
    if (out.simple) {
      if (r < 1) return -out.dF * (1 - Math.pow(r, 2.2)) + out.rim * Math.pow(r, 8);
      return out.rim * Math.pow(1 / r, 3);
    }
    if (r >= 1) return out.rim * Math.pow(1 / r, 3);
    const fl = 0.5;
    if (r < fl) return -out.dF;
    const t = (r - fl) / (1 - fl), n = 4, k = Math.min(n - 1, Math.floor(t * n)), fr = t * n - k;
    const f = (k + smooth(0.45, 1, fr)) / n;
    return -out.dF + (out.dF + out.rim) * f;
  }
  function profile(r, s) {
    const sC = 0.15, sE = 0.2, sM = 0.55, sF = 0.86;
    if (s <= sC) return 0;
    if (s < sM) { const e = smooth(sC, sM, s) ** 0.75; return transient(r, Math.max(0.0001, e)) * (s < sE ? smooth(sC, sE, s) : 1); }
    const m = smooth(sM, sF, s);
    const hT = transient(r, 1), hF = finalProfile(r);
    let h;
    if (out.simple) { const w = smooth(0, 1, m); h = lerp(hT, hF, w); }
    else {
      const w = smooth(0, 0.85, m); h = lerp(hT, hF, w);
      const pk = out.pk * (1 - Math.exp(-5 * m) * Math.cos(7 * m)) * smooth(0, 0.15, m);
      h += pk * Math.exp(-((r / 0.14) ** 2));
    }
    return h;
  }
  function wallColor(x, y0, s, hNow, rN) {
    // strata efter oprindelig dybde
    const band = Math.floor(-y0 / 0.55);
    const pal = [[0.58, 0.55, 0.5], [0.42, 0.4, 0.38], [0.66, 0.6, 0.48], [0.38, 0.36, 0.34], [0.52, 0.47, 0.4], [0.32, 0.31, 0.32]];
    let c = pal[((band % pal.length) + pal.length) % pal.length];
    return c;
  }
  // forudberegnet transient (dybeste udgravning) til breccie-farvning
  const tmpC = new THREE.Color();
  const STAGES = [
    { s: 0, title: S('1 · Nedslagslegemet nærmer sig', '1 · The impactor approaches'), time: '',
      text: S('En sten- eller jernklump suser ind med typisk 15–20 km/s på Månen (op til ca. 70 km/s). Den bærer en enorm kinetisk energi, ½mv² – ved 17 km/s er det ca. 35 gange så meget som den samme masse TNT. Kraterets størrelse afhænger af energien, men også af tyngden og vinklen.',
        'A lump of rock or iron streaks in at typically 15–20 km/s on the Moon (up to about 70 km/s). It carries an enormous kinetic energy, ½mv² – at 17 km/s that is about 35 times as much as the same mass of TNT. The size of the crater depends on the energy, but also on gravity and the angle.') },
    { s: 0.15, title: S('2 · Kontakt og kompression', '2 · Contact and compression'), time: '',
      text: S('Det hele varer ikke længere, end det tager legemet at bevæge sig sin egen diameter. Trykket når millioner af atmosfærer. En chokbølge farer ned i undergrunden og op i legemet, som fordamper og smelter helt. Nedslaget er i virkeligheden en eksplosion – derfor er kratere næsten altid runde, også ved skrå nedslag.',
        'All this lasts no longer than it takes the impactor to travel its own diameter. Pressures reach millions of atmospheres. A shock wave races down into the ground and up into the impactor, which is completely vaporised and melted. The impact is really an explosion – which is why craters are nearly always round, even for oblique impacts.') },
    { s: 0.2, title: S('3 · Udgravning', '3 · Excavation'), time: '',
      text: S('Bag chokbølgen sætter klippen sig i bevægelse udad og opad og strømmer ud af et skålformet hul – det transiente krater, ca. 1/3 så dybt som det er bredt. Materialet slynges op i et kegleformet udkastningsgardin: stof fra nær midten kastes tidligst, hurtigst og længst. Kanten løftes og foldes tilbage til en vold.',
        'Behind the shock wave the rock starts moving outwards and upwards and flows out of a bowl-shaped hole – the transient crater, about 1/3 as deep as it is wide. Material is thrown up in a cone-shaped ejecta curtain: rock from near the centre is ejected earliest, fastest and furthest. The edge is lifted and folded back into a rim.') },
    { s: 0.55, title: S('4 · Modifikation – kollaps', '4 · Modification – collapse'), time: '',
      text: S('Det transiente krater er ikke stabilt. I små kratere skrider væggene ned og fylder bunden med en linse af knust sten (breccie). I store kratere giver bunden efter: den rejser sig som en væske, der rebounder, og danner en centraltop, mens væggene skrider ned i terrasser. Overgangen ligger ved ca. 15–20 km på Månen og kun ca. 3 km på Jorden, fordi tyngden er større.',
        'The transient crater is not stable. In small craters the walls slump and fill the floor with a lens of crushed rock (breccia). In large craters the floor gives way: it rebounds like a liquid and forms a central peak, while the walls slide down in terraces. The transition is at about 15–20 km on the Moon but only about 3 km on Earth, because gravity is stronger.') },
    { s: 0.86, title: S('5 · Det færdige krater', '5 · The final crater'), time: '',
      text: S('Tilbage står et krater 10–20 gange bredere end legemet, omgivet af et udkastningstæppe, der tynder ud med afstanden (tykkelse ~ r⁻³). Uden vejr og vand kan et månekrater ligge urørt i milliarder af år – derfor er Månen Solsystemets bedste arkiv over nedslag, også dem, Jorden har glemt.',
        'What remains is a crater 10–20 times wider than the impactor, surrounded by an ejecta blanket that thins with distance (thickness ~ r⁻³). With no weather or water, a lunar crater can lie untouched for billions of years – which is why the Moon is the Solar System’s best archive of impacts, including those Earth has forgotten.') }
  ];
  function realTime(s) {
    const sC = 0.15, sE = 0.2, sM = 0.55, sF = 0.86;
    if (s < sC) return -(sC - s) / sC * 1.0;
    if (s < sE) return (s - sC) / (sE - sC) * 2 * out.tc;
    if (s < sM) return 2 * out.tc + (s - sE) / (sM - sE) * (out.Te - 2 * out.tc);
    if (s < sF) return out.Te + (s - sM) / (sF - sM) * out.Tm;
    return out.Te + out.Tm + (s - sF) / (1 - sF) * out.Te * 2;
  }
  let lastS = -1;
  function update(s) {
    const pos = geo.attributes.position.array, col = geo.attributes.color.array;
    const sC = 0.15, sE = 0.2, sM = 0.55;
    // landede udkast giver lysere stråler/tæppe
    const blanket = smooth(0.3, 0.9, s);
    for (let i = 0; i < nV; i++) {
      const r = rr[i]; const h = profile(r, s) * R; pos[3 * i + 1] = h;
      let b0 = baseCol[3 * i], b1 = baseCol[3 * i + 1], b2 = baseCol[3 * i + 2];
      if (r > 0.95 && r < 4) { const k = blanket * 0.22 * Math.pow(1 / r, 2) * (0.6 + 0.8 * hash3(Math.floor(Math.atan2(pos[3 * i + 2], pos[3 * i]) * 30), 1, 2)); b0 += k; b1 += k; b2 += k; }
      if (r < 1.0 && s > sM) { const melt = (1 - smooth(0.55, 1, s)) * 0.5 * (1 - r); b0 += melt; b1 += melt * 0.25; }
      col[3 * i] = b0 ** 2.2; col[3 * i + 1] = b1 ** 2.2; col[3 * i + 2] = b2 ** 2.2;
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; geo.computeVertexNormals();
    // tværsnit
    if (wall.visible) {
      for (let i = 0; i < NX; i++) {
        const x = -SIZE / 2 + SIZE * i / (NX - 1); const rN = Math.abs(x) / R;
        const h = profile(rN, s) * R; const hT = (s < sM ? profile(rN, s) : transient(rN, 1)) * R;
        for (let j = 0; j < NY; j++) {
          const y0 = -DEEP * j / (NY - 1);
          let y = y0 + h * (1 + y0 / DEEP);
          const k = 3 * (i * NY + j);
          wPos[k] = x; wPos[k + 1] = y; wPos[k + 2] = 0.002;
          let c = wallColor(x, y0, s, h, rN);
          // breccie: det, der ligger over det dybeste transiente krater, men under den nuværende overflade
          if (s > sM && rN < out.Rt * 1.05 && y > hT + 0.02 && out.simple) { const q = hash3(i, j, 7); c = [0.66 + 0.2 * q, 0.44 + 0.12 * q, 0.30]; }
          // smeltelag langs bunden
          if (s > sE && rN < out.Rt && y > h - 0.12 * R * 0.08 * 4 && y <= h + 0.001) { const t = 1 - smooth(0.6, 1, s); c = [lerp(0.45, 1.0, t), lerp(0.2, 0.45, t), 0.12]; }
          // chokbølgens front
          const rs = shockR(s); const dd = Math.hypot(x, y + out.ri * R * 0.5);
          if (rs > 0 && Math.abs(dd - rs) < 0.12) { const a = shockA(s); c = [lerp(c[0], 0.6, a), lerp(c[1], 0.85, a), lerp(c[2], 1, a)]; }
          wCol[k] = c[0] ** 2.2; wCol[k + 1] = c[1] ** 2.2; wCol[k + 2] = c[2] ** 2.2;
        }
      }
      wallGeo.attributes.position.needsUpdate = true; wallGeo.attributes.color.needsUpdate = true; wallGeo.computeBoundingSphere();
    }
    // nedslagslegeme
    const ri = Math.max(0.04, out.ri * R); imp.scale.setScalar(ri);
    const a = P.ang * Math.PI / 180; const dir = new THREE.Vector3(Math.cos(a), -Math.sin(a), 0);  // fra venstre
    if (s < sC) {
      const d = (sC - s) / sC * 30; imp.position.set(-dir.x * d, ri - dir.y * d, 0); imp.visible = true; imp.material.emissiveIntensity = 0.3 + 1.2 * smooth(0.6, 1, s / sC);
      trail.visible = true; trail.position.copy(imp.position).addScaledVector(dir, -ri * 1.2); trail.scale.setScalar(ri * 3); trail.material.opacity = 0.7;
    } else {
      const f = smooth(sC, sE, s); imp.position.set(dir.x * ri * f, ri - (ri * 1.6) * f, 0); imp.scale.setScalar(ri * (1 - f) + 0.001); imp.material.emissiveIntensity = 2; imp.visible = f < 0.99; trail.visible = false;
    }
    const fl = s < sC ? 0 : Math.exp(-(s - sC) / 0.025);
    flash.position.set(0, 0.3, 0); flash.scale.setScalar(R * 2.5 * fl + 0.01); flash.material.opacity = fl; flashLight.position.set(0, 2, 0); flashLight.intensity = 400 * fl;
    // chokbølge
    const rs = shockR(s); shock.visible = rs > 0 && shockA(s) > 0.02; shock.scale.setScalar(Math.max(0.01, rs)); shock.position.y = -out.ri * R * 0.5; shock.material.opacity = 0.45 * shockA(s);
    // udkast
    const ep = ej.geometry.attributes.position.array, ec = ej.geometry.attributes.color.array, ea = ej.geometry.attributes.aAlpha.array;
    for (let i = 0; i < NE; i++) {
      const sl = sE + E.sl[i] * (sM - sE) * 0.85; const r0 = E.r0[i] * out.Rt;
      const flight = 0.06 + 0.12 * Math.sqrt(E.rng[i]);
      let x, y, al = 1;
      if (s < sl) { al = 0; x = r0; y = 0; }
      else {
        const f = (s - sl) / flight;
        if (f < 1) { x = r0 + E.rng[i] * f; y = E.rng[i] * f * (1 - f) * 1.0; }
        else { x = r0 + E.rng[i]; y = profile(x, s) + 0.01; al = 1 - smooth(0.9, 1, s) * 0.6; }
      }
      const X = x * R * Math.cos(E.th[i]), Z = x * R * Math.sin(E.th[i]);
      const cut = $('crCut').checked && Z > 0;
      ep[3 * i] = X; ep[3 * i + 1] = y * R; ep[3 * i + 2] = Z; ea[i] = cut ? 0 : al;
      const hot = E.melt[i] * (1 - smooth(sl, sl + 0.25, s));
      ec[3 * i] = lerp(0.62, 1, hot); ec[3 * i + 1] = lerp(0.6, 0.55, hot); ec[3 * i + 2] = lerp(0.56, 0.2, hot);
    }
    ej.geometry.attributes.position.needsUpdate = true; ej.geometry.attributes.color.needsUpdate = true; ej.geometry.attributes.aAlpha.needsUpdate = true;
    // damp-sky
    const vp = vap.geometry.attributes.position.array, vc = vap.geometry.attributes.color.array, va = vap.geometry.attributes.aAlpha.array;
    const vt = s < sC ? 0 : (s - sC);
    for (let i = 0; i < NV2; i++) {
      const d = V.d[2 * i], sp = V.d[2 * i + 1]; const rad = Math.pow(vt, 0.6) * 22 * sp;
      vp[3 * i] = d.x * rad; vp[3 * i + 1] = d.y * rad; vp[3 * i + 2] = d.z * rad;
      va[i] = s < sC ? 0 : 0.5 * Math.exp(-vt / 0.08) * ($('crCut').checked && d.z * rad > 0 ? 0 : 1);
      vc[3 * i] = 1; vc[3 * i + 1] = 0.75; vc[3 * i + 2] = 0.45;
    }
    vap.geometry.attributes.position.needsUpdate = true; vap.geometry.attributes.color.needsUpdate = true; vap.geometry.attributes.aAlpha.needsUpdate = true;
    // etiketter
    lab.imp.pos.copy(imp.position).y += ri + 0.5; lab.imp.show = s < sC + 0.01;
    lab.shock.pos.set(-rs * 0.7, -rs * 0.7, 0); lab.shock.show = $('crCut').checked && shock.visible && rs > 1;
    lab.curtain.pos.set(-out.Rt * R * 1.6, R * 0.55, 0); lab.curtain.show = s > 0.27 && s < 0.6;
    lab.rim.pos.set(R * 1.02 * (s < sM ? out.Rt : 1), profile(s < sM ? out.Rt : 1, s) * R + 0.5, -1.5); lab.rim.show = s > 0.4;
    lab.peak.pos.set(0, profile(0, s) * R + 0.6, 0); lab.peak.show = !out.simple && s > 0.66;
    lab.lens.pos.set(0, profile(0, s) * R - 0.4, 0.05); lab.lens.show = out.simple && $('crCut').checked && s > 0.7;
    const t = realTime(s);
    $('hudTm').textContent = 't = ' + (Math.abs(t) < 1 ? fmt(t, 2) : fmt0(t)) + ' s ' + S('efter kontakt', 'after contact') + ' · D = ' + fmt(out.Df, out.Df < 10 ? 2 : 1) + ' km';
  }
  function shockR(s) { const sC = 0.15; if (s < sC) return 0; return 12 * Math.pow((s - sC) / 0.2, 0.7); }
  function shockA(s) { const sC = 0.15; if (s < sC) return 0; return Math.exp(-(s - sC) / 0.09); }
  bindUI(); applyCut();
  return { group: G, T: 50, STAGES, update, cam: [0, 9, 17], story: true };
})();

/* ======================================================================
   SCENE 4 · AKSEN – Jordens hældning med og uden Måne
   ====================================================================== */
const axis = (() => {
  const G = new THREE.Group(); scene.add(G); G.visible = false;
  const tilt = new THREE.Group(); G.add(tilt);
  const earth = makeEarthModern(1.3); tilt.add(earth);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 4.2, 12), new THREE.MeshBasicMaterial({ color: 0xf2d590 })); tilt.add(rod);
  const pc = []; [66.6, -66.6, 23.4, -23.4].forEach((lat, i) => { const l = circleLine(1.3 * Math.cos(lat * Math.PI / 180) * 1.01, i < 2 ? 0x9fd0ff : 0xffb070, false, 128); l.position.y = 1.3 * Math.sin(lat * Math.PI / 180); tilt.add(l); pc.push(l); });
  const eclip = circleLine(2.6, 0x666f88, true); G.add(eclip);
  const moon = makeMoon(0.35); G.add(moon);
  const lA = addLabel('', 'g', G), lM = addLabel(S('Månen (ikke i skala)', 'The Moon (not to scale)'), '', G), lSun = addLabel(S('← Lys fra Solen', '← Light from the Sun'), 'g', G);
  let which = 'moon';
  document.querySelectorAll('[data-ax]').forEach(b => b.addEventListener('click', () => { which = b.dataset.ax; document.querySelectorAll('[data-ax]').forEach(x => x.classList.toggle('on', x === b)); }));
  // kurver – illustrative, ikke beregnede
  function epsMoon(t) { return 23.3 + 1.2 * Math.sin(TAU * t * 1000 / 41) + 0.25 * Math.sin(TAU * t * 1000 / 1200); }
  function reflect(x) { while (x < 0 || x > 85) { if (x < 0) x = -x; if (x > 85) x = 170 - x; } return x; }
  function epsLaskar(t) { return reflect(23.3 + 22 * Math.sin(0.11 * t) + 15 * Math.sin(0.043 * t + 2) * Math.min(1, t / 8) + 8 * Math.sin(0.61 * t + 1) * Math.min(1, t / 3) + 3 * Math.sin(2.7 * t) + 1.2 * Math.sin(TAU * t * 1000 / 50)); }
  function epsLissauer(t) { return 23.3 + 6 * Math.sin(0.09 * t) * Math.min(1, t / 6) + 3.5 * Math.sin(0.53 * t + 1) * Math.min(1, t / 3) + 1.5 * Math.sin(2.1 * t) + 1.2 * Math.sin(TAU * t * 1000 / 50); }
  const F = { moon: epsMoon, laskar: epsLaskar, lissauer: epsLissauer };
  let tMy = 0; let yr = 0;
  const inset = $('inset'), ictx = inset.getContext('2d');
  function drawInset() {
    const w = inset.width = inset.clientWidth * devicePixelRatio, h = inset.height = inset.clientHeight * devicePixelRatio;
    const c = ictx; c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(8,12,22,0.85)'; c.fillRect(0, 0, w, h);
    const pad = 28 * devicePixelRatio, x0 = pad, x1 = w - 8 * devicePixelRatio, y0 = 8 * devicePixelRatio, y1 = h - 20 * devicePixelRatio;
    const span = 120, ta = Math.max(0, tMy - span * 0.8), tb = ta + span;
    const X = t => x0 + (t - ta) / span * (x1 - x0), Y = e => y1 - e / 90 * (y1 - y0);
    c.strokeStyle = '#252f47'; c.lineWidth = 1; c.font = (10 * devicePixelRatio) + 'px sans-serif'; c.fillStyle = '#9ba4b6';
    [0, 23.4, 45, 90].forEach(e => { c.beginPath(); c.moveTo(x0, Y(e)); c.lineTo(x1, Y(e)); c.stroke(); c.fillText(fmt0(e) + '°', 2, Y(e) + 3); });
    c.fillText(S('mio. år frem →', 'million years ahead →'), x1 - 110 * devicePixelRatio, h - 5 * devicePixelRatio);
    const cols = { moon: '#9fd0ff', laskar: '#ff8a6a', lissauer: '#f2d590' };
    for (const k of ['laskar', 'lissauer', 'moon']) {
      c.strokeStyle = cols[k]; c.globalAlpha = k === which ? 1 : 0.35; c.lineWidth = (k === which ? 1.8 : 1) * devicePixelRatio; c.beginPath();
      for (let i = 0; i <= 400; i++) { const t = ta + span * i / 400; if (t > tMy) break; const x = X(t), y = Y(k === 'moon' ? 23.3 + 1.2 * Math.sin(t * 9.1) : F[k](t)); i ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
    }
    c.globalAlpha = 1;
  }
  const STAGES = [{ s: 0, title: S('Månen holder Jordens akse rolig', 'The Moon keeps Earth’s axis steady'), time: '',
    text: S('Solen og Månen trækker i Jordens ækvatorbule og får aksen til at præcessere (som en snurretop) med en periode på ca. 26 000 år. Månen står for to tredjedele af det træk og gør præcessionen så hurtig, at den ikke falder i takt (resonans) med de langsomme forstyrrelser fra de andre planeter. Derfor svinger hældningen kun mellem ca. 22,1° og 24,5° – og årstiderne er stabile. Vælg „uden Måne“ for at se, hvad beregninger forudsiger.',
      'The Sun and the Moon pull on Earth’s equatorial bulge and make the axis precess (like a spinning top) with a period of about 26,000 years. The Moon provides two thirds of that pull and makes the precession so fast that it does not fall into step (resonance) with the slow perturbations from the other planets. So the tilt only varies between about 22.1° and 24.5° – and the seasons are stable. Choose “without the Moon” to see what calculations predict.') }];
  function update(s, dtEff) {
    tMy = Math.max(0, tMy + dtEff * 1.2); yr += dtEff * 0.6;
    const eps = which === 'moon' ? epsMoon(tMy) : F[which](tMy);
    const prec = which === 'moon' ? tMy * 0.35 : tMy * 0.08;
    tilt.rotation.set(0, 0, 0); tilt.rotateY(prec); tilt.rotateZ(-eps * Math.PI / 180);
    earth.rotation.y += dtEff * 1.5;
    moon.visible = which === 'moon'; const ma = yr * 4; moon.position.set(4.2 * Math.cos(ma), 0.3 * Math.sin(ma), -4.2 * Math.sin(ma)); moon.rotation.y = ma + Math.PI;
    // polar- og vendekredse flyttes med hældningen
    const pl = 90 - eps, tr = eps;
    [pl, -pl, tr, -tr].forEach((lat, i) => { const l = pc[i]; l.scale.setScalar(Math.cos(lat * Math.PI / 180) / Math.cos([66.6, -66.6, 23.4, -23.4][i] * Math.PI / 180)); l.position.y = 1.3 * Math.sin(lat * Math.PI / 180); });
    tilt.updateMatrixWorld(true); const top = new THREE.Vector3(0, 2.25, 0).applyMatrix4(tilt.matrixWorld); lA.pos.copy(top); lA.el.textContent = S('Hældning ', 'Tilt ') + fmt(eps, 1) + '°';
    lM.pos.copy(moon.position).y += 0.6; lM.show = moon.visible; lSun.pos.set(-3.4, 1.6, 0);
    $('hudTm').textContent = fmt0(tMy) + S(' mio. år frem · polarcirklen på ', ' million years ahead · Arctic Circle at ') + fmt(90 - eps, 1) + '° · ' + S('vendekredsen på ', 'tropic at ') + fmt(eps, 1) + '°';
    drawInset();
  }
  return { group: G, T: 0, STAGES, update, cam: [1, 3, 8.5], story: false, resetT: () => { tMy = 0; }, inset: true };
})();

/* ======================================================================
   SCENE 5 · TIDEVAND
   ====================================================================== */
const ERAS = {
  today: { a: 384400, day: 24, name: S('I dag', 'Today') },
  devon: { a: 375000, day: 22, name: S('Devon, ca. 380 mio. år siden', 'Devonian, about 380 million years ago') },
  arch: { a: 269000, day: 13, name: S('Arkæikum, 3,2 mia. år siden', 'Archean, 3.2 billion years ago') },
  hade: { a: 140000, day: 8, name: S('Hadæikum, ca. 4,4 mia. år siden (meget usikkert)', 'Hadean, about 4.4 billion years ago (very uncertain)') }
};
function eraInfo(e) {
  const E = ERAS[e]; const amp = Math.pow(384400 / E.a, 3);
  const Psid = 27.32 * Math.pow(E.a / 384400, 1.5) * 24 / E.day; // sideriske måneder i datidens døgn
  const Psyn = 1 / (1 / Psid - E.day / 24 / 365.25 * 1);         // tilnærmet
  return { ...E, amp, Psid, Psyn };
}
const tides = (() => {
  const G = new THREE.Group(); scene.add(G); G.visible = false;
  const earth = makeEarthModern(1); G.add(earth);
  const oceanGeo = new THREE.SphereGeometry(1.02, 96, 64); const base = oceanGeo.attributes.position.array.slice();
  const ocean = new THREE.Mesh(oceanGeo, new THREE.MeshStandardMaterial({ color: 0x3a7bd5, transparent: true, opacity: 0.55, roughness: 0.3, metalness: 0.1, depthWrite: false }));
  G.add(ocean);
  const moon = makeMoon(0.273); G.add(moon);
  const orbit = circleLine(6, 0xd8b46a, false); orbit.material.opacity = 0.3; G.add(orbit);
  const marker = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffd060 })); earth.add(marker);
  const lat = 56.4 * Math.PI / 180, lon = 10.9 * Math.PI / 180;
  // Three.js-kuglens tekstur: lon 0 ved +x? SphereGeometry: u=0 ved -x … vi placerer markøren via u-v-koordinat
  const phiU = (lon + Math.PI) ;                         // u = (lon+180)/360
  marker.position.set(-Math.cos(phiU) * Math.cos(lat) * 1.01, Math.sin(lat) * 1.01, Math.sin(phiU) * Math.cos(lat) * 1.01);
  const lMark = addLabel('Grenaa', 'g', G), lMoon = addLabel(S('Månen (afstand ikke i skala)', 'The Moon (distance not to scale)'), '', G), lSun = addLabel(S('← Lys og tidevandskraft fra Solen', '← Light and tidal force from the Sun'), 'g', G);
  let era = 'today'; let t = 0; const hist = [];
  document.querySelectorAll('[data-era]').forEach(b => b.addEventListener('click', () => { era = b.dataset.era; document.querySelectorAll('[data-era]').forEach(x => x.classList.toggle('on', x.dataset.era === era)); hist.length = 0; poolEra(era); }));
  const SUN = new THREE.Vector3(-1, 0, 0);
  const inset = $('inset'), ictx = inset.getContext('2d');
  const mV = new THREE.Vector3(), nV = new THREE.Vector3(), wp = new THREE.Vector3();
  function tideAt(n, mdir, A) { const cm = n.dot(mdir), cs = n.dot(SUN); return A * ((3 * cm * cm - 1) / 2 + 0.46 * (3 * cs * cs - 1) / 2 * Math.pow(ERAS[era].a / 384400, 3)); }
  const STAGES = [{ s: 0, title: S('Tidevand – to buler og en svævning', 'Tides – two bulges and a beat'), time: '',
    text: S('Månen trækker stærkere i den nære side af Jorden end i centrum og svagere i den fjerne side. Forskellen strækker havet ud i to buler – én mod Månen og én væk fra den. Jorden drejer under bulerne, så de fleste kyster får to højvande i døgnet. Solens tidevand er knap halvt så stort. Ved nymåne og fuldmåne lægges de sammen (springflod), ved halvmåne modarbejder de hinanden (nipflod). Bulerne er stærkt overdrevet.',
      'The Moon pulls harder on the near side of Earth than on its centre, and less on the far side. The difference stretches the ocean into two bulges – one towards the Moon and one away from it. Earth turns beneath the bulges, so most coasts get two high tides a day. The Sun’s tide is a little under half as large. At new and full moon they add up (spring tides); at half moon they work against each other (neap tides). The bulges are greatly exaggerated.') }];
  function update(s, dtEff) {
    const E = eraInfo(era);
    t += dtEff * 5;                              // 1 animationssekund = 5 timer ved 1×
    const tDays = t / E.day;                     // i datidens døgn
    const ma = TAU * t / (E.Psid * E.day);       // Månens banevinkel
    const spin = TAU * t / E.day * (1 + E.day / 24 / 365.25 * 0) ; // sidereal ~ solar her
    earth.rotation.y = spin;
    const aVis = 6 * Math.pow(E.a / 384400, 1);
    moon.position.set(aVis * Math.cos(ma), 0, -aVis * Math.sin(ma)); moon.rotation.y = ma + Math.PI; orbit.scale.setScalar(aVis / 6);
    mV.copy(moon.position).normalize();
    const A = 0.11 * Math.min(E.amp, 5);
    const p = oceanGeo.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) {
      nV.set(base[i], base[i + 1], base[i + 2]).normalize();
      const h = 1.02 + tideAt(nV, mV, A);
      p[i] = nV.x * h; p[i + 1] = nV.y * h; p[i + 2] = nV.z * h;
    }
    oceanGeo.attributes.position.needsUpdate = true; oceanGeo.computeVertexNormals();
    marker.getWorldPosition(wp); nV.copy(wp).normalize();
    const hLoc = tideAt(nV, mV, 1) * E.amp / Math.max(1e-6, E.amp) ; // relativt
    hist.push([t, tideAt(nV, mV, E.amp)]); while (hist.length && t - hist[0][0] > 30 * 24) hist.shift();
    lMark.pos.copy(wp).multiplyScalar(1.12); lMoon.pos.copy(moon.position).y += 0.45; lSun.pos.set(-3.2, 1.4, 0);
    const phase = ((ma / TAU) % 1 + 1) % 1;
    const fase = phase < 0.06 || phase > 0.94 ? S('fuldmåne', 'full moon') : Math.abs(phase - 0.5) < 0.06 ? S('nymåne', 'new moon') : Math.abs(phase - 0.25) < 0.06 || Math.abs(phase - 0.75) < 0.06 ? S('halvmåne', 'half moon') : '';
    $('hudTm').textContent = E.name + ' · ' + S('døgn ', 'day ') + fmt(E.day, 0) + S(' t · måned ', ' h · month ') + fmt(E.Psid, 1) + S(' døgn · tidevandskraft ', ' days · tidal force ') + fmt(E.amp, 1) + '× ' + S('nutidens', 'today’s') + (fase ? ' · ' + fase : '');
    drawGauge(E);
  }
  function drawGauge(E) {
    const w = inset.width = inset.clientWidth * devicePixelRatio, h = inset.height = inset.clientHeight * devicePixelRatio;
    const c = ictx; c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(8,12,22,0.85)'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#9ba4b6'; c.font = (10 * devicePixelRatio) + 'px sans-serif';
    c.fillText(S('Tidevand ved Grenaa (ligevægtstidevand), sidste 30 døgn', 'Tide at Grenaa (equilibrium tide), last 30 days'), 6 * devicePixelRatio, 13 * devicePixelRatio);
    if (hist.length < 2) return;
    const t1 = hist[hist.length - 1][0], t0 = t1 - 30 * 24; const sc = 1 / Math.max(1.6, 1.6 * E.amp);
    const X = tt => 6 * devicePixelRatio + (tt - t0) / (30 * 24) * (w - 12 * devicePixelRatio), Y = v => h * 0.58 - v * sc * h * 0.5;
    c.strokeStyle = '#252f47'; c.beginPath(); c.moveTo(0, Y(0)); c.lineTo(w, Y(0)); c.stroke();
    c.strokeStyle = '#9fd0ff'; c.lineWidth = 1.3 * devicePixelRatio; c.beginPath();
    hist.forEach((q, i) => { const x = X(q[0]), y = Y(q[1]); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
  }
  return { group: G, T: 0, STAGES, update, cam: [0, 4.5, 9.5], story: false, inset: true };
})();

/* ======================================================================
   Afspilning, tidslinje, fart, baglæns
   ====================================================================== */
const MODES = { dannelse: formation, ring: ringlab, krater: crater, aksen: axis, tidevand: tides };
let mode = 'dannelse', playing = true, dir = 1, simT = 0;
const speed = () => Math.pow(2, +$('spd').value);
function setSpeedText() { const v = speed(); $('spdT').textContent = (v < 1 ? fmt(v, v < 0.2 ? 2 : 2) : fmt(v, v < 10 ? 1 : 0)) + '×'; }
$('spd').addEventListener('input', setSpeedText); setSpeedText();
$('bPlay').addEventListener('click', () => { playing = !playing; $('bPlay').textContent = playing ? S('❚❚ Pause', '❚❚ Pause') : S('▶ Afspil', '▶ Play'); });
$('bRev').addEventListener('click', () => { dir = -dir; $('bRev').classList.toggle('on', dir < 0); });
$('bStep') && $('bStep').addEventListener('click', () => { playing = false; $('bPlay').textContent = S('▶ Afspil', '▶ Play'); step(1 / 30 * speed() * dir); });
const tl = $('tl');
tl.addEventListener('input', () => { const M = MODES[mode]; if (M.story) simT = +tl.value * M.T; });
function go(s) { const M = MODES[mode]; simT = s * M.T; if (M.story) tl.value = s; }

function buildChips() {
  const M = MODES[mode]; const ch = $('chips'); ch.innerHTML = '';
  if (!M.story) return;
  M.STAGES.forEach(st => { const b = document.createElement('button'); b.className = 'chip'; b.textContent = st.title; b.addEventListener('click', () => go(st.s + 0.0005)); ch.appendChild(b); });
}
let lastStage = -1;
function setStage(s) {
  const M = MODES[mode]; let k = 0; M.STAGES.forEach((st, i) => { if (s >= st.s) k = i; });
  if (k === lastStage) return; lastStage = k;
  const st = M.STAGES[k]; $('hudSt').textContent = st.title;
  $('stageTitle').textContent = st.title; $('stageText').textContent = st.text;
  [...$('chips').children].forEach((b, i) => b.classList.toggle('on', i === k));
}
function setMode(m) {
  mode = m; lastStage = -1;
  for (const k in MODES) MODES[k].group.visible = (k === m);
  document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
  document.querySelectorAll('.mpanel').forEach(p => p.style.display = p.dataset.for === m ? '' : 'none');
  const M = MODES[m];
  tl.style.display = M.story ? '' : 'none';
  $('inset').style.display = M.inset ? '' : 'none';
  $('autoZoomL').style.display = m === 'dannelse' ? '' : 'none';
  simT = 0; tl.value = 0; dir = 1; $('bRev').classList.remove('on');
  camera.position.set(...M.cam).multiplyScalar(camFactor()); controls.target.set(0, 0, 0); controls.update();
  sunLight.position.set(-12, 4, m === 'krater' ? -4 : 6);
  if (m === 'krater') sunLight.position.set(-10, 6, -3);
  amb.intensity = m === 'krater' ? 0.5 : 0.35;
  if (M.reset) M.reset(); if (M.resetT) M.resetT();
  buildChips(); setStage(0);
  if (history.replaceState) history.replaceState(null, '', '#' + m);
}
document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { setMode(b.dataset.mode); box.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
document.querySelectorAll('[data-goto]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); setMode(a.dataset.goto); box.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));

function step(dtEff) {
  const M = MODES[mode];
  if (M.story) {
    simT += dtEff; if (simT > M.T) { simT = M.T; if (dir > 0) { playing = false; $('bPlay').textContent = S('▶ Afspil', '▶ Play'); } } if (simT < 0) { simT = 0; if (dir < 0) { playing = false; $('bPlay').textContent = S('▶ Afspil', '▶ Play'); } }
    tl.value = simT / M.T;
  }
  const s = M.story ? simT / M.T : 0;
  M.update(s, dtEff);
  setStage(s);
}
let last = performance.now();
let visible = true;
new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(box);
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!visible) return;
  if (playing) step(dt * speed() * dir); else { const M = MODES[mode], s = M.story ? simT / M.T : 0; M.update(s, 0); setStage(s); }
  controls.update(); updateLabels(); renderer.render(scene, camera);
}
resize();
const start = (location.hash || '').slice(1);
setMode(MODES[start] ? start : 'dannelse');
requestAnimationFrame(loop);
window.__moon = { setMode, go, step, MODES };   // til test

/* ======================================================================
   2D · TIDEVANDSBASSINER OG DE FØRSTE FIRBENEDE
   ====================================================================== */
let poolEra = () => {};
(() => {
  const cv = $('poolCanvas'); if (!cv) return; const c = cv.getContext('2d');
  let era = 'devon', t = 0, play = true, spd = 1;
  const POOLS = [{ x: 0.30, rim: 0.30, depth: 0.07 }, { x: 0.43, rim: 0.48, depth: 0.08 }, { x: 0.55, rim: 0.66, depth: 0.08 }, { x: 0.67, rim: 0.82, depth: 0.07 }, { x: 0.79, rim: 0.94, depth: 0.06 }];
  const st = POOLS.map(() => ({ w: 0.5, dry: 0 }));
  const fish = []; let saved = 0, lost = 0, seedF = 1;
  function reset() { st.forEach(s => { s.w = 0.5; s.dry = 0; }); fish.length = 0; saved = 0; lost = 0; for (let i = 0; i < 9; i++) fish.push({ pool: i % POOLS.length, x: 0, mv: 0, from: 0, to: 0, alive: true, k: i }); }
  reset();
  poolEra = e => { if (e === 'today' || e === 'devon' || e === 'arch') { era = e; const s = $('poolEra'); if (s) s.value = e; } };
  $('poolEra') && $('poolEra').addEventListener('input', e => { era = e.target.value; });
  $('poolPlay') && $('poolPlay').addEventListener('click', () => { play = !play; $('poolPlay').textContent = play ? '❚❚' : '▶'; });
  $('poolReset') && $('poolReset').addEventListener('click', reset);
  $('poolSpd') && $('poolSpd').addEventListener('input', e => { spd = Math.pow(2, +e.target.value); });
  const range = { today: 0.55, devon: 0.8, arch: 1.15 };
  function sea(tt) { // højde i strand-enheder (0..1), M2 + S2 svævning
    const R = range[era]; const m2 = Math.cos(TAU * tt / 12.42), s2 = 0.46 * Math.cos(TAU * tt / 12.0);
    return 0.38 + R * 0.5 * (m2 + s2) / 1.46;
  }
  const beach = x => 0.05 + x * 1.0;   // strandens højde stiger mod højre
  function draw() {
    const w = cv.width = cv.clientWidth * devicePixelRatio, h = cv.height = cv.clientHeight * devicePixelRatio;
    const Y = v => h * 0.92 - v * h * 0.75, X = x => x * w;
    c.fillStyle = '#0a1020'; c.fillRect(0, 0, w, h);
    const lvl = sea(t);
    // strand
    c.fillStyle = '#5d5040'; c.beginPath(); c.moveTo(0, h);
    for (let i = 0; i <= 200; i++) { const x = i / 200; let y = beach(x); POOLS.forEach(p => { const d = (x - p.x) / 0.04; if (Math.abs(d) < 1) y -= p.depth * (1 - d * d); }); c.lineTo(X(x), Y(y)); }
    c.lineTo(w, h); c.fill();
    // hav
    const xs = (lvl - 0.05) / 1.0; c.fillStyle = 'rgba(58,123,213,0.75)'; c.beginPath(); c.moveTo(0, Y(lvl)); c.lineTo(X(Math.max(0, xs)), Y(lvl)); c.lineTo(X(Math.max(0, xs)), h); c.lineTo(0, h); c.fill();
    // bassiner
    POOLS.forEach((p, i) => {
      const s = st[i]; const top = beach(p.x) - p.depth * (1 - s.w); const bot = beach(p.x) - p.depth;
      if (s.w > 0.02) { c.fillStyle = s.dry > 30 ? 'rgba(120,150,190,0.7)' : 'rgba(58,123,213,0.8)'; c.beginPath(); c.ellipse(X(p.x), Y((top + bot) / 2), X(0.035) * Math.sqrt(s.w), Math.max(1, (Y(bot) - Y(top)) / 2), 0, 0, TAU); c.fill(); }
      c.fillStyle = '#9ba4b6'; c.font = (10 * devicePixelRatio) + 'px sans-serif'; c.textAlign = 'center';
      c.fillText(s.dry > 0 ? fmt0(s.dry) + S(' t', ' h') : '', X(p.x), Y(beach(p.x) + 0.06));
    });
    // fisk
    fish.forEach(f => {
      if (!f.alive) return;
      let x = f.mv > 0 ? lerp(f.from, f.to, 1 - f.mv) : (f.pool < 0 ? f.x : POOLS[f.pool].x + 0.012 * Math.sin(t * 0.7 + f.k));
      let y = f.pool < 0 && f.mv <= 0 ? Math.min(lvl - 0.04, beach(x) - 0.01) : beach(x) - (f.mv > 0 ? -0.01 : 0.03);
      const sx = X(x), sy = Y(y) + (f.k % 3) * 3;
      c.save(); c.translate(sx, sy); c.scale(devicePixelRatio, devicePixelRatio); c.fillStyle = f.mv > 0 ? '#f2d590' : '#d8b46a';
      c.beginPath(); c.ellipse(0, 0, 9, 3.2, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(8, 0); c.lineTo(13, -3.5); c.lineTo(13, 3.5); c.fill();
      if (f.mv > 0) { c.strokeStyle = '#f2d590'; c.lineWidth = 1.4; const ph = Math.sin(t * 6) * 3; c.beginPath(); c.moveTo(-4, 2); c.lineTo(-6 + ph, 6); c.moveTo(2, 2); c.lineTo(0 - ph, 6); c.stroke(); }
      c.fillStyle = '#000'; c.beginPath(); c.arc(-6, -1, 1, 0, TAU); c.fill(); c.restore();
    });
    c.textAlign = 'left'; c.fillStyle = '#e7e9ef'; c.font = (12 * devicePixelRatio) + 'px sans-serif';
    c.fillText(S('Havniveau ', 'Sea level ') + (lvl > 0.38 ? '↑' : '↓') + ' · ' + S('kravlende fisk: ', 'fish crawling: ') + fish.filter(f => f.mv > 0).length + ' · ' + S('nået havet: ', 'reached the sea: ') + saved + ' · ' + S('strandet: ', 'stranded: ') + lost, 8 * devicePixelRatio, 18 * devicePixelRatio);
    c.fillStyle = '#9ba4b6'; c.font = (10 * devicePixelRatio) + 'px sans-serif';
    c.fillText(S('Dag ', 'Day ') + fmt(t / 24, 1) + S(' · tallene over bassinerne: timer uden forbindelse til havet', ' · numbers above pools: hours cut off from the sea'), 8 * devicePixelRatio, 34 * devicePixelRatio);
  }
  function tick(dt) {
    const h = dt * 6 * spd; // timer
    t += h; const lvl = sea(t);
    POOLS.forEach((p, i) => {
      const s = st[i];
      if (lvl > beach(p.x) - 0.005) { s.w = 1; s.dry = 0; }
      else { s.dry += h; s.w = Math.max(0, s.w - h * 0.006 * (1 + s.dry / 60)); }
    });
    fish.forEach(f => {
      if (!f.alive) return;
      if (f.mv > 0) { f.mv -= h * 0.12; if (f.mv <= 0) { f.mv = 0; if (f.toSea) { saved++; f.alive = false; } else { f.pool = f.toPool; } } return; }
      if (f.pool >= 0 && st[f.pool].w < 0.25) {
        // kravl ned til nærmeste vandfyldte bassin eller havet
        let target = -1; for (let j = f.pool - 1; j >= 0; j--) if (st[j].w > 0.4) { target = j; break; }
        const seaX = Math.max(0.02, lvl - 0.05); const px = POOLS[f.pool].x;
        const dSea = px - seaX, dPool = target >= 0 ? px - POOLS[target].x : 1e9;
        if (Math.min(dSea, dPool) > 0.3) { if (st[f.pool].w < 0.03) { f.alive = false; lost++; } return; }
        f.from = px; f.toSea = !(dPool < dSea); f.toPool = target; f.to = f.toSea ? seaX : POOLS[target].x; f.mv = 1;
      }
      if (f.pool >= 0 && st[f.pool].w >= 0.99 && lvl > beach(POOLS[f.pool].x) + 0.02 && Math.random() < 0.002) { /* bliver i bassinet */ }
    });
    if (fish.every(f => !f.alive)) reset();
  }
  let lt = performance.now(); let vis = true; new IntersectionObserver(e => { vis = e[0].isIntersecting; }).observe(cv);
  (function lp(n) { requestAnimationFrame(lp); const dt = Math.min(0.05, (n - lt) / 1000); lt = n; if (!vis) return; if (play) tick(dt); draw(); })(lt);
})();

/* ======================================================================
   2D · MÅNESKIN
   ====================================================================== */
(() => {
  const cv = $('lightCanvas'); if (!cv) return; const c = cv.getContext('2d');
  const sl = $('lightDay'); let auto = true;
  $('lightPlay') && $('lightPlay').addEventListener('click', () => { auto = !auto; $('lightPlay').textContent = auto ? '❚❚' : '▶'; });
  sl.addEventListener('input', () => { auto = false; $('lightPlay').textContent = '▶'; });
  const SYN = 29.53;
  function lux(age) { // alder i døgn efter nymåne
    const alpha = Math.abs(180 - (age / SYN) * 360);     // faseafstand: 0 ved fuldmåne
    const m = -12.73 + 0.026 * alpha + 4e-9 * alpha ** 4;
    return 0.27 * Math.pow(10, -0.4 * (m + 12.73));
  }
  function draw() {
    const age = +sl.value;
    const w = cv.width = cv.clientWidth * devicePixelRatio, h = cv.height = cv.clientHeight * devicePixelRatio, d = devicePixelRatio;
    const L = lux(age);
    const sky = Math.min(1, Math.log10(L * 1e4 + 1) / 4);
    c.fillStyle = `rgb(${Math.round(4 + 20 * sky)},${Math.round(6 + 26 * sky)},${Math.round(16 + 48 * sky)})`; c.fillRect(0, 0, w, h);
    // månefase
    const R = Math.min(h * 0.17, w * 0.11), cx = R * 1.4, cy = h * 0.3;
    c.fillStyle = '#1c2030'; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill();
    const ph = age / SYN; const k = Math.cos(ph * TAU);   // 1 ved nymåne, -1 ved fuldmåne
    const right = ph < 0.5;   // tiltagende: højre side lys (nordlig halvkugle)
    c.fillStyle = '#e8e4d8'; c.beginPath();
    if (right) c.arc(cx, cy, R, -Math.PI / 2, Math.PI / 2); else c.arc(cx, cy, R, Math.PI / 2, 3 * Math.PI / 2);
    c.closePath(); c.fill();
    c.fillStyle = k > 0 ? '#1c2030' : '#e8e4d8';
    c.beginPath(); c.ellipse(cx, cy, Math.max(0.5, Math.abs(k) * R), R, 0, 0, TAU); c.fill();
    // tal
    const x0 = cx + R * 1.5, fs = Math.max(10, Math.min(14, w / d / 38));
    let y = cy - R * 0.75;
    c.fillStyle = '#e7e9ef'; c.font = (fs + 2) * d + 'px Georgia, serif';
    const name = ph < 0.03 || ph > 0.97 ? S('Nymåne', 'New moon') : Math.abs(ph - 0.5) < 0.03 ? S('Fuldmåne', 'Full moon') : Math.abs(ph - 0.25) < 0.03 ? S('Første kvarter', 'First quarter') : Math.abs(ph - 0.75) < 0.03 ? S('Sidste kvarter', 'Last quarter') : ph < 0.5 ? S('Tiltagende', 'Waxing') : S('Aftagende', 'Waning');
    c.fillText(name + ' · ' + fmt(age, 1) + S(' døgn', ' days'), x0, y); y += (fs + 8) * d;
    c.font = fs * d + 'px sans-serif'; c.fillStyle = '#cfd4df';
    const lines = [
      S('Belysning: ', 'Illuminance: ') + (L < 0.01 ? fmt(L * 1000, 1) + ' mlx' : fmt(L, 3) + ' lx'),
      S('Fuld sol (100 000 lx) er ', 'Full sun (100,000 lx) is ') + fmt0(100000 / Math.max(L, 1e-6)) + S(' gange lysere', ' times brighter')
    ];
    const rise = (age - 14.77) * 50 / 60;
    if (age < 14.77) lines.push(S('Månen er oppe før solnedgang:', 'The Moon is up before sunset:'), S('ingen mørk aftenperiode', 'no dark evening period'));
    else lines.push(S('Mørkt fra solnedgang til', 'Dark from sunset to'), S('måneopgang: ca. ', 'moonrise: about ') + fmt(Math.min(12, rise), 1) + S(' timer', ' hours'));
    lines.forEach(t => { c.fillText(t, x0, y); y += (fs + 5) * d; });
    // kalender
    const cy2 = h * 0.70, xa = 12 * d, xb = w - 12 * d, X = a => xa + (a / SYN) * (xb - xa);
    c.strokeStyle = '#33405e'; c.lineWidth = 2 * d; c.beginPath(); c.moveTo(xa, cy2); c.lineTo(xb, cy2); c.stroke();
    c.font = (10 * d) + 'px sans-serif'; c.fillStyle = '#9ba4b6';
    [[0, S('ny', 'new')], [7.38, '1/4'], [14.77, S('fuld', 'full')], [22.15, '3/4'], [29.53, S('ny', 'new')]].forEach(q => { c.textAlign = 'center'; c.fillText(q[1], X(q[0]), cy2 - 10 * d); });
    c.textAlign = 'left';
    const rows = [
      ['#ff8a6a', S('Koraller gyder (2–8 nætter efter fuldmåne)', 'Corals spawn (2–8 nights after full moon)'), [[14.77 + 2, 14.77 + 8]]],
      ['#9fd0ff', S('Dolkhaler lægger æg ved springflod', 'Horseshoe crabs lay eggs at spring tide'), [[13.5, 17.5], [0, 2.5], [27.5, SYN]]],
      ['#7fd1b9', S('Grunion-fisk gyder på stranden', 'Grunion spawn on the beach'), [[15.5, 19.5], [0.8, 4.8]]]
    ];
    rows.forEach((r, k) => {
      const yy = cy2 + (8 + 7 * k) * d; c.strokeStyle = r[0]; c.lineWidth = 4 * d;
      r[2].forEach(q => { c.beginPath(); c.moveTo(X(q[0]), yy); c.lineTo(X(q[1]), yy); c.stroke(); });
      const ly = h - (8 + 13 * (2 - k)) * d; c.fillStyle = r[0]; c.fillRect(xa, ly - 7 * d, 10 * d, 6 * d); c.fillStyle = '#cfd4df'; c.fillText(r[1], xa + 15 * d, ly);
    });
    c.fillStyle = '#f2d590'; c.beginPath(); c.moveTo(X(age), cy2 - 2 * d); c.lineTo(X(age) - 5 * d, cy2 - 9 * d); c.lineTo(X(age) + 5 * d, cy2 - 9 * d); c.fill();
  }
  let lt = performance.now(), vis = true; new IntersectionObserver(e => { vis = e[0].isIntersecting; }).observe(cv);
  (function lp(n) { requestAnimationFrame(lp); const dt = Math.min(0.05, (n - lt) / 1000); lt = n; if (!vis) return; if (auto) { sl.value = ((+sl.value + dt * 1.2) % 29.53).toFixed(2); } draw(); })(lt);
})();
