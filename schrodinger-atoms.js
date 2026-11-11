// Numerical solution of the radial Schrödinger equation for one-electron atoms
// (hydrogen and the alkali metals) and Einstein A coefficients from the dipole matrix element.
// Atomic units throughout (hbar = m_e = e = 4*pi*eps0 = 1); energies in hartree, r in bohr.
//
// Method
//  * The valence electron moves in a central model potential
//        V_l(r) = -[1 + (Z-1) exp(-r/rho_l)] / r,
//    i.e. the full nuclear charge near the nucleus, screened to +1 far outside the core.
//    One screening length rho_l per orbital angular momentum l is fitted so that the lowest
//    level of that l has the measured energy. All other levels, all wavefunctions and all
//    transition rates then follow from the Schrödinger equation alone. Hydrogen: pure -1/r.
//  * Radial equation for u(r) = r R(r) on a logarithmic grid r = exp(x), u = r^(1/2) y:
//        y'' = [2 r^2 (V(r) - E) + (l + 1/2)^2] y,
//    integrated with Numerov's method. Eigenvalues by node counting and bisection;
//    wavefunctions by outward/inward integration matched at the outer turning point.
//  * Dipole radial integral  R = ∫ u_a(r) r u_b(r) dr,  line strength S = l_max R^2,
//        A = 2.0261e18 s^-1 * S / (g_orb * lambda[Å]^3),  g_orb = 2 l_upper + 1
//    (the spin-free multiplet rate; every fine-structure level of the upper term decays at it).
(function (root) {
  'use strict';
  const HARTREE_CM = 219474.6313705;           // 1 hartree in cm^-1
  // Measured data: ionisation energies (cm^-1, NIST) and level centroids (cm^-1 above the
  // ground state, J-weighted averages of the fine-structure levels, from the Kurucz/NIST levels).
  const ATOMS = {
    1:  { sym: 'H',  Z: 1,  IP: 109678.77, mu: 0.99945568, ground: [1, 0], levels: {} },
    3:  { sym: 'Li', Z: 3,  IP: 43487.11, ground: [2, 0], levels: {"2,0":0,"2,1":14903.88,"3,0":27206.1,"3,1":30925.63,"3,2":31283.08,"4,0":35012.04,"4,1":36469.79,"4,2":36623.36,"4,3":36628.33,"5,0":38299.47,"5,1":39015.71,"5,2":39094.9,"5,3":39097.53,"6,0":39987.61,"6,1":40391.31,"6,2":40437.28,"7,0":40967.99,"7,1":41217.58,"7,2":41246.59} },
    11: { sym: 'Na', Z: 11, IP: 41449.45, ground: [3, 0], levels: {"3,0":0,"3,1":16967.64,"3,2":29172.86,"4,0":25739.99,"4,1":30270.72,"4,2":34548.75,"4,3":34586.92,"5,0":33200.68,"5,1":35042.03,"5,2":37036.76,"5,3":37057.65,"6,0":36372.62,"6,1":37297.18,"6,2":38387.26,"6,3":38399.79,"7,0":38012.04,"7,1":38540.68,"7,2":39200.93,"7,3":39208.98,"8,0":38968.51,"8,1":39298.68,"8,2":39728.7} },
    19: { sym: 'K',  Z: 19, IP: 35009.81, ground: [4, 0], levels: {"3,2":21535.6,"4,0":0,"4,1":13023.64,"4,2":27397.5,"4,3":28127.85,"5,0":21026.55,"5,1":24713.89,"5,2":30185.44,"5,3":30606.73,"6,0":27450.69,"6,1":29004.9,"6,2":31695.99,"6,3":31953.17,"7,0":30274.28,"7,1":31072.9,"7,2":32598.35,"8,0":31765.37,"8,1":32229.22,"8,2":33178.16} },
    37: { sym: 'Rb', Z: 37, IP: 33690.81, ground: [5, 0], levels: {"4,2":19355.19,"5,0":0,"5,1":12737.36,"5,2":25702.34,"6,0":20133.6,"6,1":23766.86,"6,2":28688.51,"7,0":26311.46,"7,1":27858.44,"7,2":30281.09,"8,0":29046.84,"8,1":29847.53,"8,2":31222.08,"9,0":30499.06,"9,1":30966.46} },
    55: { sym: 'Cs', Z: 55, IP: 31406.47, ground: [6, 0], levels: {"4,3":24472.12,"5,2":14557.81,"5,3":26971.22,"6,0":0,"6,1":11547.63,"6,2":22614.65,"6,3":28329.45,"7,0":18535.52,"7,1":21886.32,"7,2":26060.44,"8,0":24317.15,"8,1":25764.23,"8,2":27818.26,"9,0":26910.66,"9,1":27667.07,"9,2":28833.2} }
  };
  // core dipole polarisabilities (a.u.)
  ATOMS[3].ac = 0.1923; ATOMS[11].ac = 0.9448; ATOMS[19].ac = 5.3310; ATOMS[37].ac = 9.0760; ATOMS[55].ac = 15.6440;
  // fitted model-potential parameters [rho_l, rc_l] per l: rho_l and rc_l chosen so that the two lowest
  // measured levels of each l are reproduced (fit done once, offline, with this same solver)
  const PARAMS = {"3":{"0":[0.0573609,0.3],"1":[0.34893,0.811679],"2":[0.001,1.31624],"3":[0.001,6]},"11":{"0":[0.410896,2.10277],"1":[0.303034,0.546169],"2":[0.426105,2.44254],"3":[0.552984,6]},"19":{"0":[0.334968,0.856016],"1":[0.363016,0.994336],"2":[0.469068,1.55843],"3":[0.587781,3.82822]},"37":{"0":[0.303275,0.994336],"1":[0.318298,1.15501],"2":[0.36359,1.34164]},"55":{"0":[0.315703,1.15501],"1":[0.324475,1.34164],"2":[0.358355,1.55843],"3":[0.299353,0.994336]}};
  const L_LETTER = 'spdfg';

  function makeGrid(Z, rmax) {
    const xmin = Math.log(1e-5 / Z), xmax = Math.log(rmax), N = 4000;
    const h = (xmax - xmin) / (N - 1);
    const r = new Float64Array(N);
    for (let i = 0; i < N; i++) r[i] = Math.exp(xmin + i * h);
    return { r: r, h: h, N: N };
  }
  // p = { rho, ac, rc }: screening length, core dipole polarisability, polarisation cut-off
  function potential(Z, p) {
    if (Z === 1 || !p) return function (r) { return -1 / r; };
    const rho = p.rho, ac = p.ac || 0, rc = p.rc || 1;
    return function (r) {
      const pol = ac > 0 ? -ac / (2 * r * r * r * r) * (1 - Math.exp(-Math.pow(r / rc, 6))) : 0;
      return -(1 + (Z - 1) * Math.exp(-r / rho)) / r + pol;
    };
  }
  // outward Numerov integration; returns number of sign changes (nodes)
  function countNodes(grid, V, l, E) {
    const r = grid.r, h2 = grid.h * grid.h / 12, N = grid.N, c = (l + 0.5) * (l + 0.5);
    let y0 = Math.pow(r[0], l + 0.5), y1 = Math.pow(r[1], l + 0.5);
    let g0 = 2 * r[0] * r[0] * (V(r[0]) - E) + c, g1 = 2 * r[1] * r[1] * (V(r[1]) - E) + c;
    let nodes = 0;
    for (let i = 2; i < N; i++) {
      const g2 = 2 * r[i] * r[i] * (V(r[i]) - E) + c;
      if (h2 * g2 > 0.3) break;                        // deep in the forbidden region: stop
      const y2 = (2 * y1 * (1 + 5 * h2 * g1) - y0 * (1 - h2 * g0)) / (1 - h2 * g2);
      if ((y2 < 0) !== (y1 < 0) && y2 !== 0) nodes++;
      y0 = y1; y1 = y2; g0 = g1; g1 = g2;
      const m = Math.abs(y1);
      if (m > 1e150) { y0 /= m; y1 /= m; }
    }
    return nodes;
  }
  function eigenvalue(grid, V, n, l, Z) {
    const k = n - l - 1;
    let lo = -0.6 * Z * Z - 5, hi = -1e-7;
    for (let it = 0; it < 80; it++) {
      const mid = 0.5 * (lo + hi);
      if (countNodes(grid, V, l, mid) > k) hi = mid; else lo = mid;
    }
    return 0.5 * (lo + hi);
  }
  function wavefunction(grid, V, l, E) {
    const r = grid.r, h2 = grid.h * grid.h / 12, N = grid.N, c = (l + 0.5) * (l + 0.5);
    const g = new Float64Array(N);
    for (let i = 0; i < N; i++) g[i] = 2 * r[i] * r[i] * (V(r[i]) - E) + c;
    let Ne = N;                                        // last point where Numerov is stable
    for (let i = 10; i < N; i++) { if (h2 * g[i] > 0.3 && r[i] > 1) { Ne = i; break; } }
    let m = Ne - 10;                                   // outer classical turning point
    for (let i = Ne - 10; i > 10; i--) { if (g[i] < 0) { m = i; break; } }
    m = Math.min(m + 5, Ne - 10);
    const y = new Float64Array(N);
    y[0] = Math.pow(r[0], l + 0.5); y[1] = Math.pow(r[1], l + 0.5);
    for (let i = 1; i < m; i++) {
      y[i + 1] = (2 * y[i] * (1 + 5 * h2 * g[i]) - y[i - 1] * (1 - h2 * g[i - 1])) / (1 - h2 * g[i + 1]);
      const a = Math.abs(y[i + 1]);
      if (a > 1e150) { for (let j = 0; j <= i + 1; j++) y[j] /= a; }
    }
    const ym = y[m];
    const z = new Float64Array(N);
    z[Ne - 1] = 0; z[Ne - 2] = 1e-30;
    for (let i = Ne - 2; i > m; i--) {
      z[i - 1] = (2 * z[i] * (1 + 5 * h2 * g[i]) - z[i + 1] * (1 - h2 * g[i + 1])) / (1 - h2 * g[i - 1]);
      const a = Math.abs(z[i - 1]);
      if (a > 1e150) { for (let j = i - 1; j < Ne; j++) z[j] /= a; }
    }
    const s = ym / z[m];
    for (let i = m + 1; i < N; i++) y[i] = (i < Ne) ? z[i] * s : 0;
    // normalise: ∫u^2 dr = ∫ y^2 r^2 dx = 1, and fix sign so that u > 0 at large r
    let norm = 0;
    for (let i = 0; i < N; i++) norm += y[i] * y[i] * r[i] * r[i];
    norm = Math.sqrt(norm * grid.h);
    let sign = 1;
    for (let i = N - 1; i >= 0; i--) { if (Math.abs(y[i]) > 1e-8 * norm) { sign = y[i] > 0 ? 1 : -1; break; } }
    const u = new Float64Array(N);
    for (let i = 0; i < N; i++) { y[i] *= sign / norm; u[i] = y[i] * Math.sqrt(r[i]); }
    return { y: y, u: u };
  }
  // ∫ u_a d(r) u_b dr = ∫ y_a y_b r^2 d(r) dx, with the core-polarisation-corrected dipole
  // operator d(r) = r [1 - (ac/r^3)(1 - exp(-(r/rc)^3))]  (ac = 0: plain r)
  function radialIntegral(grid, a, b, ac, rc) {
    const r = grid.r; let s = 0;
    for (let i = 0; i < grid.N; i++) {
      let d = r[i];
      if (ac > 0) d *= 1 - ac / (r[i] * r[i] * r[i]) * (1 - Math.exp(-Math.pow(r[i] / rc, 3)));
      s += a.y[i] * b.y[i] * r[i] * r[i] * d;
    }
    return s * grid.h;
  }

  // Solve one atom: fit rho_l, compute levels, wavefunctions and E1 transitions.
  function solveAtom(Zkey, opts) {
    const at = ATOMS[Zkey]; if (!at) return null;
    opts = opts || {};
    const Z = at.Z, nmaxExtra = opts.nmaxExtra || 5;
    const grid = makeGrid(Z, opts.rmax || 600);
    const Eion = -at.IP / HARTREE_CM;                  // ground-state binding energy (hartree)
    const meas = {};                                   // measured term energies (hartree, < 0)
    for (const key in at.levels) meas[key] = Eion + at.levels[key] / HARTREE_CM;
    const ng = at.ground[0];
    const lmax = Z === 1 ? 2 : 3;
    const ac = at.ac || 0;
    const rho = {}, V = {}, P = {};
    for (let l = 0; l <= lmax; l++) {
      if (Z === 1) { V[l] = potential(1); continue; }
      const stored = PARAMS[Zkey] && PARAMS[Zkey][l];
      if (stored) { P[l] = { rho: stored[0], ac: ac, rc: stored[1] }; }
      else {                                           // fallback: fit rho only (no polarisation)
        let n0 = null;
        for (let n = 2; n <= 9; n++) { if (meas[n + ',' + l] !== undefined && n > l) { n0 = n; break; } }
        if (n0 === null) { V[l] = potential(1); continue; }
        let lo = 1e-4, hi = 10;
        for (let it = 0; it < 45; it++) {
          const mid = Math.sqrt(lo * hi);
          if (eigenvalue(grid, potential(Z, { rho: mid }), n0, l, Z) > meas[n0 + ',' + l]) lo = mid; else hi = mid;
        }
        P[l] = { rho: Math.sqrt(lo * hi), ac: 0, rc: 1 };
      }
      rho[l] = P[l].rho; V[l] = potential(Z, P[l]);
    }
    const levels = [];
    for (let l = 0; l <= lmax; l++) {
      let nstart = (Z === 1) ? l + 1 : null;
      if (nstart === null) { for (let n = 2; n <= 9; n++) { if (meas[n + ',' + l] !== undefined && n > l) { nstart = n; break; } } }
      if (nstart === null) continue;
      for (let n = nstart; n <= Math.max(nstart, ng) + nmaxExtra; n++) {
        let E = eigenvalue(grid, V[l], n, l, Z);
        const wf = wavefunction(grid, V[l], l, E);
        const key = n + ',' + l;
        let Em = (Z === 1) ? -0.5 / (n * n) : meas[key];
        levels.push({ n: n, l: l, name: n + L_LETTER[l], E: E, Emeas: Em, wf: wf });
      }
    }
    const mu = at.mu || 1;                             // reduced-mass correction (hydrogen)
    const trans = [];
    for (const up of levels) for (const lo of levels) {
      if (Math.abs(up.l - lo.l) !== 1 || up.E <= lo.E) continue;
      const dE = (up.E - lo.E) * mu;                   // hartree
      const sigma = dE * HARTREE_CM;                   // cm^-1
      const lamVacA = 1e8 / sigma;
      const rcAvg = (P[up.l] && P[lo.l]) ? 0.5 * (P[up.l].rc + P[lo.l].rc) : 1;
      const R = radialIntegral(grid, up.wf, lo.wf, ac, rcAvg);
      const S = Math.max(up.l, lo.l) * R * R;
      const gorb = 2 * up.l + 1;
      const A = 2.0261e18 * S / (gorb * Math.pow(lamVacA, 3));
      let lamMeasAir = null;
      if (up.Emeas !== undefined && lo.Emeas !== undefined) {
        const s2 = (up.Emeas - lo.Emeas) * mu * HARTREE_CM;
        lamMeasAir = vacToAir(1e7 / s2);
      }
      trans.push({ up: up, lo: lo, R: R, A: A, gA: 2 * gorb * A, lambda: vacToAir(lamVacA / 10), lambdaMeas: lamMeasAir });
    }
    return { atom: at, grid: grid, rho: rho, params: P, levels: levels, transitions: trans };
  }
  function vacToAir(lnm) {                             // Edlén-type refractive index of air
    const s2 = Math.pow(1e3 / lnm, 2);
    const n = 1 + 8.34254e-5 + 2.406147e-2 / (130 - s2) + 1.5998e-4 / (38.9 - s2);
    return lnm / n;
  }
  root.SchrodingerAtoms = { ATOMS: ATOMS, PARAMS: PARAMS, _int: { makeGrid: makeGrid, potential: potential, eigenvalue: eigenvalue }, solveAtom: solveAtom, supported: function (Z) { return !!ATOMS[Z]; } };
})(typeof window !== 'undefined' ? window : globalThis);
