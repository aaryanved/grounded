// Three.js forest scene — extracted from assets/scenes/forest-day.html

let renderer, scene, camera;
let tPool = [], nZ = {};
let trees = [], nTZ = 3;
let dapples = [], shafts = [], bfs = [];
let pMesh, eL, eR, pGeo;
let amb, walkGlow;
let camZ = 5, spd = 3.0, tSpd = 3.0, paused = false;
let sP, sL, clk;
let _last = performance.now();
let _animFrameId = null;

const TW = 38, TD = 28, SX = 14, SZ = 12, COLS = 9, ROWS = 14;
const TNCT = 360;
const RESET_DIST = TD * ROWS * 2;
const PL = TD * ROWS;

const hash = n => Math.abs((Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1);

function n2(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hash(ix + iz * 57), b = hash(ix + 1 + iz * 57),
        c = hash(ix + (iz + 1) * 57), d = hash(ix + 1 + (iz + 1) * 57);
  return a + (b - a) * ux + (c - a) * uz + (b - a + a - b + d - c) * ux * uz;
}

function fbm(x, z, o) {
  let v = 0, a = 0.5, f = 1, m = 0;
  for (let i = 0; i < o; i++) { v += n2(x * f, z * f) * a; m += a; a *= 0.5; f *= 2.1; }
  return v / m;
}

function th(x, z) {
  const raw = fbm(x * 0.038, z * 0.038, 5) * 9 + fbm(x * 0.016 + 3, z * 0.016, 3) * 5 - 3.5;
  const d = Math.abs(x);
  const b = Math.min(1, Math.max(0, (d - 2.0) / 6.5));
  return raw * b * b;
}

function buildGeo(col, rz) {
  const geo = new THREE.PlaneGeometry(TW, TD, SX, SZ);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const wx = col * TW;
  for (let i = 0; i < pos.count; i++)
    pos.setY(i, th(wx + pos.getX(i), rz + pos.getZ(i)));
  pos.needsUpdate = true; geo.computeVertexNormals(); return geo;
}

function tCol(col) {
  const d = Math.abs(col);
  return new THREE.Color().setHSL(0.290 + d * 0.008, 0.20 + d * 0.025, Math.max(0.14, 0.32 - d * 0.032));
}

function mkTile(col) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshPhongMaterial({
      color: tCol(col),
      emissive: new THREE.Color().setHSL(0.30, 0.20, 0.018),
      specular: new THREE.Color(0x1c2a0e), shininess: 3, flatShading: true
    }));
  m.userData = { col, rz: 0 }; scene.add(m); return m;
}

function placeTile(m, col, rz) {
  m.userData = { col, rz }; m.geometry.dispose();
  m.geometry = buildGeo(col, rz); m.position.set(col * TW, 0, rz);
}

function reclaimTerrain(cz) {
  tPool.forEach(m => {
    if (m.userData.rz + TD < cz - TD * 2) {
      placeTile(m, m.userData.col, nZ[m.userData.col]);
      nZ[m.userData.col] += TD;
    }
  });
}

function conformPath(cz) {
  const pos = pGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, th(pos.getX(i) * 0.35, cz + pos.getZ(i)) + 0.05);
  pos.needsUpdate = true; pGeo.computeVertexNormals();
}

function mkEdge(x) {
  const g = new THREE.PlaneGeometry(0.6, PL, 1, 80); g.rotateX(-Math.PI / 2);
  const e = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x7a9e58, transparent: true, opacity: 0.38 }));
  scene.add(e); return e;
}

function updatePath(cz) {
  pMesh.position.set(0, 0, cz);
  eL.position.set(-2.5, 0.11, cz); eR.position.set(2.5, 0.11, cz);
  conformPath(cz);
}

function mkTree() {
  const g = new THREE.Group();
  const trH = 0.9 + Math.random() * 1.5;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.16, trH, 5),
    new THREE.MeshPhongMaterial({ color: 0x5e4222, emissive: 0x120800, flatShading: true })
  );
  trunk.position.y = trH / 2;
  g.add(trunk);
  const layers = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < layers; i++) {
    const ti = i / Math.max(1, layers - 1);
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry((1.1 - ti * 0.55) * (0.82 + Math.random() * 0.52), 1.6 + Math.random() * 0.5, 6),
      new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(0.275 + Math.random() * 0.085, 0.18 + Math.random() * 0.14, 0.17 + Math.random() * 0.13 - ti * 0.025),
        emissive: new THREE.Color().setHSL(0.30, 0.22, 0.015),
        specular: new THREE.Color(0x182208), shininess: 4, flatShading: true
      })
    );
    cone.position.y = trH + i * (1.12 + Math.random() * 0.38); g.add(cone);
  }
  g.scale.setScalar(0.65 + Math.random() * 1.7);
  g.rotation.y = Math.random() * Math.PI * 2;
  g.userData = { wz: -9999 }; scene.add(g); trees.push(g);
}

function placeTree(t, wz) {
  const s = Math.random() < 0.5 ? 1 : -1, xd = 2.4 + Math.random() * 18;
  const x = s * xd; t.position.set(x, th(x, wz), wz); t.userData.wz = wz;
}

function reclaimTrees(cz) {
  trees.forEach(t => {
    if (t.userData.wz < cz - TD * 2.5) { placeTree(t, nTZ); nTZ += 0.9 + Math.random() * 1.8; }
  });
}

function shiftWorld(delta) {
  tPool.forEach(m => { m.position.z -= delta; m.userData.rz -= delta; });
  Object.keys(nZ).forEach(k => { nZ[k] -= delta; });
  trees.forEach(t => { t.position.z -= delta; t.userData.wz -= delta; });
  nTZ -= delta;
}

function _animate() {
  if (_animFrameId === null) return;
  _animFrameId = requestAnimationFrame(_animate);

  const now = performance.now(), dt = Math.min((now - _last) / 1000, 0.05); _last = now;
  const t = clk.getElapsedTime();

  if (!paused) {
    spd += (tSpd - spd) * 2.2 * dt;
    camZ += spd * dt;
  }

  if (camZ > RESET_DIST) {
    shiftWorld(RESET_DIST);
    camZ -= RESET_DIST;
    sP.z -= RESET_DIST;
    sL.z -= RESET_DIST;
  }

  const sx = Math.sin(t * 0.20) * 0.12 + Math.sin(t * 0.51) * 0.04;
  const gy = th(sx, camZ);
  const bob = Math.sin(t * spd * 0.52) * 0.016 + Math.sin(t * 0.38) * 0.007;

  sP.lerp(new THREE.Vector3(sx, gy + 1.72, camZ), 0.065);
  sL.lerp(new THREE.Vector3(sx * 0.12, gy + 1.54 + bob, camZ + 12), 0.050);
  camera.position.copy(sP); camera.lookAt(sL);

  walkGlow.position.set(sP.x, sP.y + 0.25, sP.z - 0.5);

  dapples.forEach(d => {
    d.position.set(sP.x + d.userData.ox + Math.sin(t * 0.16 + d.userData.ph) * 0.9,
      gy + 0.07, sP.z + d.userData.oz + Math.cos(t * 0.12 + d.userData.ph) * 1.1);
    d.material.opacity = d.userData.bOp * (0.55 + Math.sin(t * d.userData.sp + d.userData.ph) * 0.45);
  });

  shafts.forEach((s, i) => {
    s.position.set(sP.x + s.userData.ox + Math.sin(t * 0.09 + i) * 0.35, gy + 15, sP.z + s.userData.oz + 10);
    s.rotation.z = Math.sin(t * 0.07 + i) * 0.035;
  });

  bfs.forEach(b => {
    const d = b.userData;
    b.position.set(sP.x + d.ox + Math.sin(t * d.sp + d.ph) * 1.9, gy + d.oy + Math.sin(t * d.sp * 0.85 + d.ph) * 0.4, sP.z + d.oz + Math.cos(t * d.sp * 0.65) * 2.1);
    b.scale.set(0.4 + Math.abs(Math.sin(t * d.fl + d.ph)) * 0.85, 1, 1);
    b.rotation.y = Math.sin(t * d.sp * 0.28) * 0.35;
  });

  if (window._motes) {
    const p = window._motes.geometry.attributes.position, b = window._motes.userData.b;
    for (let i = 0; i < p.count; i++) {
      p.setX(i, b[i * 3] + sP.x + Math.sin(t * 0.18 + i * 0.65) * 0.65);
      p.setY(i, b[i * 3 + 1] + Math.sin(t * 0.13 + i * 0.48) * 0.30);
      p.setZ(i, ((b[i * 3 + 2] + sP.z + 29) % 58) + sP.z - 29);
    }
    p.needsUpdate = true;
  }

  reclaimTerrain(camZ); reclaimTrees(camZ); updatePath(camZ);

  amb.intensity = 0.90 + Math.sin(t * 0.17) * 0.055;

  renderer.render(scene, camera);
}

export function initScene() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.88;

  const canvas = renderer.domElement;
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '0';
  document.body.appendChild(canvas);

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xb8d4a0, 0.024);

  camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 260);

  // Sky dome
  (function () {
    const geo = new THREE.SphereGeometry(240, 28, 14);
    const pa = geo.attributes.position;
    const col = new Float32Array(pa.count * 3);
    for (let i = 0; i < pa.count; i++) {
      const t = Math.max(0, Math.min(1, (pa.getY(i) + 8) / 248));
      const t2 = t * t;
      col[i * 3]     = THREE.MathUtils.lerp(0.831, 0.549, t2);
      col[i * 3 + 1] = THREE.MathUtils.lerp(0.910, 0.722, t2);
      col[i * 3 + 2] = THREE.MathUtils.lerp(0.753, 0.800, t2);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    scene.add(new THREE.Mesh(geo,
      new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false })));
  })();

  // Sun
  (function () {
    const g = new THREE.Group();
    g.position.set(50, 80, -210);
    for (const [r, op] of [[6, 0.40], [11, 0.22], [20, 0.10], [34, 0.055], [55, 0.025], [85, 0.012]]) {
      const m = new THREE.Mesh(
        new THREE.CircleGeometry(r, 24),
        new THREE.MeshBasicMaterial({ color: 0xfff5dc, transparent: true, opacity: op, fog: false, depthWrite: false })
      );
      g.add(m);
    }
    scene.add(g);
  })();

  // Clouds
  (function () {
    for (let i = 0; i < 12; i++) {
      const g = new THREE.Group();
      for (let p = 0; p < 3 + Math.floor(Math.random() * 4); p++) {
        const r = 6 + Math.random() * 10;
        const m = new THREE.Mesh(
          new THREE.CircleGeometry(r, 9),
          new THREE.MeshBasicMaterial({ color: 0xeaf2e5, transparent: true,
            opacity: 0.22 + Math.random() * 0.20, fog: false, depthWrite: false })
        );
        m.position.set((Math.random() - 0.5) * r * 2.4, (Math.random() - 0.5) * r * 0.3, (Math.random() - 0.5) * 3);
        g.add(m);
      }
      g.position.set((Math.random() - 0.5) * 360, 48 + Math.random() * 52, -85 - Math.random() * 155);
      g.lookAt(0, g.position.y, 0);
      scene.add(g);
    }
  })();

  // Terrain
  const HALF = Math.floor(COLS / 2);
  for (let c = -HALF; c <= HALF; c++) {
    nZ[c] = 0;
    for (let r = 0; r < ROWS; r++) { const m = mkTile(c); placeTile(m, c, nZ[c]); nZ[c] += TD; tPool.push(m); }
  }

  // Path
  pGeo = new THREE.PlaneGeometry(4.8, PL, 5, 80);
  pGeo.rotateX(-Math.PI / 2);
  pMesh = new THREE.Mesh(pGeo, new THREE.MeshPhongMaterial({
    color: 0xc4b48c, emissive: 0x251c08, specular: 0x8a7040, shininess: 3, flatShading: true
  }));
  pMesh.position.y = 0.04; scene.add(pMesh);
  eL = mkEdge(-2.5); eR = mkEdge(2.5);

  // Trees
  for (let i = 0; i < TNCT; i++) mkTree();
  trees.forEach(t => { placeTree(t, nTZ); nTZ += (TD * ROWS) / TNCT; });

  // Dapples
  for (let i = 0; i < 22; i++) {
    const dp = new THREE.Mesh(
      new THREE.CircleGeometry(0.5 + Math.random() * 1.2, 7),
      new THREE.MeshBasicMaterial({ color: 0xdff0c8, transparent: true, opacity: 0, depthWrite: false })
    );
    dp.rotation.x = -Math.PI / 2;
    dp.userData = { ox: (Math.random() - 0.5) * 7, oz: (Math.random() - 0.5) * 20,
      ph: Math.random() * Math.PI * 2, sp: 0.08 + Math.random() * 0.14, bOp: 0.06 + Math.random() * 0.10 };
    scene.add(dp); dapples.push(dp);
  }

  // Shafts
  for (let i = 0; i < 10; i++) {
    const s = new THREE.Mesh(
      new THREE.ConeGeometry(0.7 + Math.random() * 0.8, 24, 5, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xeaf8d0, transparent: true,
        opacity: 0.018 + Math.random() * 0.016, depthWrite: false, side: THREE.DoubleSide })
    );
    s.userData = { ox: (Math.random() - 0.5) * 11, oz: (Math.random() - 0.5) * 7 };
    scene.add(s); shafts.push(s);
  }

  // Motes
  (function () {
    const N = 260, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 52; pos[i * 3 + 1] = 0.3 + Math.random() * 5; pos[i * 3 + 2] = (Math.random() - 0.5) * 58;
      col[i * 3] = 0.86 + Math.random() * 0.12; col[i * 3 + 1] = 0.90 + Math.random() * 0.08; col[i * 3 + 2] = 0.66 + Math.random() * 0.22;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(geo,
      new THREE.PointsMaterial({ size: 0.048, vertexColors: true, transparent: true, opacity: 0.45, fog: true }));
    pts.userData.b = pos.slice(); scene.add(pts); window._motes = pts;
  })();

  // Butterflies
  for (let i = 0; i < 16; i++) {
    const g = new THREE.Group();
    const c = [0xc8d4a8, 0xd4c8a0, 0xb0c8b0, 0xdcd4b4, 0xb4c4a8][Math.floor(Math.random() * 5)];
    const mat = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    for (const sx of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.CircleGeometry(0.10 + Math.random() * 0.06, 5), mat);
      w.position.x = sx * 0.09; w.rotation.z = sx * 0.22; g.add(w);
    }
    g.userData = { ox: (Math.random() - 0.5) * 22, oy: 0.5 + Math.random() * 2.8, oz: (Math.random() - 0.5) * 40,
      ph: Math.random() * Math.PI * 2, sp: 0.15 + Math.random() * 0.22, fl: 1.4 + Math.random() * 2.0 };
    scene.add(g); bfs.push(g);
  }

  // Lights
  amb = new THREE.AmbientLight(0xc8e0b8, 0.90); scene.add(amb);
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.45); sun.position.set(50, 80, -210); scene.add(sun);
  scene.add(new THREE.HemisphereLight(0x9cc8a0, 0x7a9060, 0.62));
  walkGlow = new THREE.PointLight(0xf4eddc, 0.50, 16); scene.add(walkGlow);

  // Camera start vectors
  sP = new THREE.Vector3(0, 1.72, 5);
  sL = new THREE.Vector3(0, 1.56, 14);

  // Clock
  clk = new THREE.Clock();

  // Event listeners
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp'   || e.key === 'w') tSpd = 7;
    if (e.key === 'ArrowDown' || e.key === 's') tSpd = 0.7;
  });
  window.addEventListener('keyup', e => {
    if (['ArrowUp', 'w', 'ArrowDown', 's'].includes(e.key)) tSpd = 3.0;
  });
  canvas.addEventListener('click', () => paused = !paused);
  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  // Start loop
  _animFrameId = requestAnimationFrame(_animate);
}
