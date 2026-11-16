// map.js — two original maps, one collision model.
// "Sector Nine": a dusk industrial yard, three lanes (west to Site A, east
// to Site B, mid through a broken wall). "Foundry": the same yard at night —
// a furnace hall with silos, pipes and a mid connector, denser fog and
// furnace glow instead of the dusk sun. Both maps share the 44 x 36 yard,
// the same site/spawn/waypoint shape, and analytic AABB colliders, so bots
// and the player share one collision model and line of sight is one
// function call. Geometry is boxes and cylinders only, styled by palette.
import * as THREE from 'three';
import { PALETTE, FOUNDRY, SKY } from './palette.js';

const WALL_H = 3.4;

function box(scene, colliders, shootables, mat, x, y, z, w, h, d, collide = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  if (collide) {
    colliders.push({ x0: x - w / 2, x1: x + w / 2, y0: y, y1: y + h, z0: z - d / 2, z1: z + d / 2 });
    shootables.push(mesh);
  }
  return mesh;
}

// A cylinder mesh with a square AABB collider (half-size = radius): bots and
// raycasts treat silos and pipes as boxes, which is close enough at this scale.
function cylinder(scene, colliders, shootables, mat, x, y, z, r, h, segments = 14) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segments), mat);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  colliders.push({ x0: x - r, x1: x + r, y0: y, y1: y + h, z0: z - r, z1: z + r });
  shootables.push(mesh);
  return mesh;
}

function siteLetterTexture(letter, color) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 256, 256);
  g.strokeStyle = color;
  g.lineWidth = 10;
  g.strokeRect(14, 14, 228, 228);
  g.fillStyle = color;
  g.font = 'bold 150px system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(letter, 128, 136);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

// Vertical-gradient sky dome: a big inverted sphere with a canvas gradient.
// Cheap, no shader, and it reads as dusk on Sector Nine, as night on Foundry.
function skyDome(scene, top, horizon) {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#' + top.toString(16).padStart(6, '0'));
  grad.addColorStop(0.62, '#' + horizon.toString(16).padStart(6, '0'));
  grad.addColorStop(1, '#0a0c10');
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(120, 16, 12),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false }),
  );
  dome.position.y = -4;
  scene.add(dome);
}

function stars(scene, count, seed) {
  // Deterministic star field: a seeded LCG so the night sky is identical
  // every run, and the screenshot captures match the game.
  let a = seed | 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const ang = next() * Math.PI * 2;
    const el = 0.15 + next() * 1.2;
    const r = 110;
    pos[i * 3] = Math.cos(ang) * Math.cos(el) * r;
    pos[i * 3 + 1] = Math.sin(el) * r;
    pos[i * 3 + 2] = Math.sin(ang) * Math.cos(el) * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xdfe8ff, size: 0.7, sizeAttenuation: false, fog: false }));
  scene.add(points);
}

function groundSlab(scene, shootables, mat, seamMat) {
  const ground = new THREE.Mesh(new THREE.BoxGeometry(46, 0.2, 38), mat);
  ground.position.set(0, -0.1, 0);
  ground.receiveShadow = true;
  scene.add(ground);
  shootables.push(ground);
  for (let x = -20; x <= 20; x += 10) {
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 38), seamMat);
    seam.position.set(x, 0.01, 0);
    scene.add(seam);
  }
  for (let z = -15; z <= 15; z += 10) {
    const seam = new THREE.Mesh(new THREE.BoxGeometry(46, 0.02, 0.08), seamMat);
    seam.position.set(0, 0.01, z);
    scene.add(seam);
  }
}

function sitePlate(scene, letter, color, x, z) {
  const tex = siteLetterTexture(letter, color);
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 5),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.85, depthWrite: false }),
  );
  plate.rotation.x = -Math.PI / 2;
  plate.position.set(x, 0.02, z);
  scene.add(plate);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.4, 2.6, 40),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.03, z);
  scene.add(ring);
}

function perimeter(scene, colliders, shootables, mat) {
  box(scene, colliders, shootables, mat, 0, 0, -18, 46, WALL_H, 1);
  box(scene, colliders, shootables, mat, 0, 0, 18, 46, WALL_H, 1);
  box(scene, colliders, shootables, mat, -22.5, 0, 0, 1, WALL_H, 38);
  box(scene, colliders, shootables, mat, 22.5, 0, 0, 1, WALL_H, 38);
}

function skyline(scene, mat) {
  const skyline = [[-30, -28, 8, 14], [-12, -30, 10, 18], [8, -30, 7, 12], [26, -28, 9, 16], [-34, 0, 6, 20], [34, 4, 6, 18]];
  for (const [x, z, w, h] of skyline) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2), mat);
    b.position.set(x, h / 2, z);
    scene.add(b);
  }
}

function buildSectorNine(scene, colliders, shootables) {
  const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0.06, ...opts });
  const groundMat = mat(PALETTE.ground);
  const wallMat = mat(PALETTE.wall);
  const wallDarkMat = mat(PALETTE.wallDark);
  const crateMat = mat(PALETTE.crate);
  const crateAltMat = mat(PALETTE.crateAlt);
  const contAMat = mat(PALETTE.containerA);
  const contBMat = mat(PALETTE.containerB);

  // Lights: low dusk sun + cool hemisphere, warm site lamps.
  scene.add(new THREE.HemisphereLight(0x8fa3b8, 0x1a1611, 1.05));
  const sun = new THREE.DirectionalLight(0xffb36b, 1.9);
  sun.position.set(-18, 26, 14);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -30;
  sun.shadow.camera.right = 30;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -30;
  sun.shadow.camera.far = 80;
  scene.add(sun);
  const lampA = new THREE.PointLight(PALETTE.siteA, 24, 18, 1.8);
  lampA.position.set(-15, 4.4, -13);
  scene.add(lampA);
  const lampB = new THREE.PointLight(PALETTE.siteB, 24, 18, 1.8);
  lampB.position.set(15, 4.4, -13);
  scene.add(lampB);

  groundSlab(scene, shootables, groundMat, new THREE.MeshBasicMaterial({ color: PALETTE.groundLine }));
  perimeter(scene, colliders, shootables, wallMat);

  // Mid wall with a gap at x in [-2, 2] and a side gap at x in [12, 16].
  box(scene, colliders, shootables, wallDarkMat, -12, 0, -2, 20, WALL_H, 1);
  box(scene, colliders, shootables, wallDarkMat, 9, 0, -2, 6, WALL_H, 1);
  box(scene, colliders, shootables, wallDarkMat, 19, 0, -2, 6, WALL_H, 1);

  // West lane cover (to Site A) and east lane cover (to Site B).
  box(scene, colliders, shootables, crateMat, -14, 0, 6, 3, 1.2, 3);
  box(scene, colliders, shootables, crateAltMat, -14, 1.2, 6, 2, 1.1, 2);
  box(scene, colliders, shootables, crateMat, -8, 0, 12, 4, 1.2, 2);
  box(scene, colliders, shootables, crateAltMat, 14, 0, 6, 3, 1.2, 3);
  box(scene, colliders, shootables, crateMat, 8, 0, 12, 4, 1.2, 2);
  box(scene, colliders, shootables, crateAltMat, 0, 0, 8, 2, 1.2, 2);

  // Containers: long sightline blockers near mid.
  box(scene, colliders, shootables, contAMat, -6, 0, -8, 6, 2.6, 2.4);
  box(scene, colliders, shootables, contBMat, 7, 0, -8, 6, 2.6, 2.4);
  box(scene, colliders, shootables, contAMat, -18, 0, -8, 2.4, 2.6, 6);
  box(scene, colliders, shootables, contBMat, 18, 0, -8, 2.4, 2.6, 6);

  // Site A crates (west) and Site B crates (east).
  box(scene, colliders, shootables, crateAltMat, -17, 0, -14, 3, 1.2, 3);
  box(scene, colliders, shootables, crateMat, -12, 0, -15, 2, 1.2, 2);
  box(scene, colliders, shootables, crateAltMat, 17, 0, -14, 3, 1.2, 3);
  box(scene, colliders, shootables, crateMat, 12, 0, -15, 2, 1.2, 2);
  box(scene, colliders, shootables, crateAltMat, -19, 0, 2, 2, 2.2, 2);
  box(scene, colliders, shootables, crateAltMat, 19, 0, 2, 2, 2.2, 2);

  sitePlate(scene, 'A', '#f0a830', -15, -13);
  sitePlate(scene, 'B', '#35c4d8', 15, -13);
  skyline(scene, new THREE.MeshBasicMaterial({ color: PALETTE.sky }));
  skyDome(scene, SKY.sectorNine.top, SKY.sectorNine.horizon);

  return {
    name: 'sector-nine',
    displayName: 'Sector Nine',
    fog: { near: 22, far: 60 },
    background: PALETTE.canvas,
    sites: {
      A: { letter: 'A', x: -15, z: -13, r: 3.4, color: PALETTE.siteA },
      B: { letter: 'B', x: 15, z: -13, r: 3.4, color: PALETTE.siteB },
    },
    spawns: {
      player: { x: 0, z: 15 },
      friendlies: [{ x: -4, z: 15 }, { x: 4, z: 15 }],
      // Spawn points sit clear of the site containers: (-17,-10) and (17,-10)
      // used to be inside them, so defenders spawned embedded in a box.
      defendersA: [{ x: -19, z: -13 }, { x: -12, z: -15 }],
      defendersB: [{ x: 19, z: -13 }, { x: 12, z: -15 }],
    },
    // Patrol waypoints: defenders hold near their site, friendlies push a lane.
    // Every waypoint is clear of solid boxes: (-17,-10) / (17,-10) used to sit
    // inside the site containers and trapped patrolling bots against them.
    waypoints: {
      A: [
        { x: -19, z: -13 }, { x: -13, z: -8 }, { x: -18, z: -14 }, { x: -11, z: -13 },
        { x: -16, z: -6 }, { x: -14, z: -11 },
      ],
      B: [
        { x: 19, z: -13 }, { x: 13, z: -8 }, { x: 18, z: -14 }, { x: 11, z: -13 },
        { x: 16, z: -6 }, { x: 14, z: -11 },
      ],
      midA: [{ x: -4, z: 12 }, { x: -8, z: 4 }, { x: -12, z: -4 }, { x: -14, z: -9 }],
      midB: [{ x: 4, z: 12 }, { x: 8, z: 4 }, { x: 12, z: -4 }, { x: 14, z: -9 }],
      mid: [{ x: 0, z: 10 }, { x: 0, z: 2 }, { x: 0, z: -6 }, { x: -4, z: 2 }],
    },
  };
}

function buildFoundry(scene, colliders, shootables) {
  const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.12, ...opts });
  const groundMat = mat(FOUNDRY.ground);
  const wallMat = mat(FOUNDRY.wall);
  const wallDarkMat = mat(FOUNDRY.wallDark);
  const crateMat = mat(FOUNDRY.crate);
  const crateAltMat = mat(FOUNDRY.crateAlt);
  const contAMat = mat(FOUNDRY.containerA);
  const contBMat = mat(FOUNDRY.containerB);
  const furnaceMat = mat(FOUNDRY.furnace, { roughness: 0.7, metalness: 0.35 });
  const pipeMat = mat(FOUNDRY.pipe, { roughness: 0.45, metalness: 0.7 });

  // Night: dim cool hemisphere, no sun. Furnace glow does the work — two
  // orange point lights at the furnace mouth plus the site lamps.
  scene.add(new THREE.HemisphereLight(0x2a3340, 0x0f0c08, 0.55));
  const furnaceGlow = new THREE.PointLight(FOUNDRY.furnaceGlow, 60, 26, 1.6);
  furnaceGlow.position.set(0, 3.2, -9);
  scene.add(furnaceGlow);
  const furnaceGlow2 = new THREE.PointLight(0xff9a3c, 26, 18, 1.7);
  furnaceGlow2.position.set(0, 2.2, -4);
  scene.add(furnaceGlow2);
  const lampA = new THREE.PointLight(PALETTE.siteA, 24, 18, 1.8);
  lampA.position.set(-16, 4.4, -12);
  scene.add(lampA);
  const lampB = new THREE.PointLight(PALETTE.siteB, 24, 18, 1.8);
  lampB.position.set(16, 4.4, -12);
  scene.add(lampB);

  groundSlab(scene, shootables, groundMat, new THREE.MeshBasicMaterial({ color: FOUNDRY.groundLine }));
  perimeter(scene, colliders, shootables, wallMat);

  // Central furnace: a big hot block north of mid, with a glowing mouth
  // (emissive plane) facing the yard. It splits mid into two flanks.
  box(scene, colliders, shootables, furnaceMat, 0, 0, -9, 10, 4.5, 5);
  const mouth = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 2.2),
    new THREE.MeshBasicMaterial({ color: 0xff8a1e }),
  );
  mouth.position.set(0, 1.3, -6.48);
  scene.add(mouth);
  const mouthBar = new THREE.Mesh(
    new THREE.BoxGeometry(5, 0.3, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x14181c, roughness: 0.5, metalness: 0.6 }),
  );
  mouthBar.position.set(0, 2.6, -6.45);
  scene.add(mouthBar);

  // Mid connector: a wall across the yard at z = 2 with a centre gap
  // (x in [-5, 5]) and a west gap (x in [-15, -11]); the east side is solid.
  box(scene, colliders, shootables, wallDarkMat, -18.5, 0, 2, 7, WALL_H, 1);
  box(scene, colliders, shootables, wallDarkMat, -8, 0, 2, 6, WALL_H, 1);
  box(scene, colliders, shootables, wallDarkMat, 13.5, 0, 2, 17, WALL_H, 1);

  // Silos: tall cylinders guarding the lanes north of the connector.
  cylinder(scene, colliders, shootables, pipeMat, -10, 0, -10, 1.8, 5.5);
  cylinder(scene, colliders, shootables, pipeMat, 10, 0, -10, 1.8, 5.5);
  // Horizontal pipes overhead on the lanes (visual only, high up).
  const pipeH = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 12, 10), pipeMat);
  pipeH.rotation.z = Math.PI / 2;
  pipeH.position.set(-14, 3.6, -4);
  scene.add(pipeH);
  const pipeH2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 12, 10), pipeMat);
  pipeH2.rotation.z = Math.PI / 2;
  pipeH2.position.set(14, 3.6, -4);
  scene.add(pipeH2);

  // Lane cover: crates and a container on each side of mid.
  box(scene, colliders, shootables, crateMat, -14, 0, 6, 3, 1.2, 3);
  box(scene, colliders, shootables, crateAltMat, -14, 1.2, 6, 2, 1.1, 2);
  box(scene, colliders, shootables, crateMat, -8, 0, 12, 4, 1.2, 2);
  box(scene, colliders, shootables, crateAltMat, 14, 0, 6, 3, 1.2, 3);
  box(scene, colliders, shootables, crateMat, 8, 0, 12, 4, 1.2, 2);
  box(scene, colliders, shootables, contAMat, 0, 0, 8, 2.4, 2.6, 4);
  box(scene, colliders, shootables, contBMat, -6, 0, -4, 5, 2.6, 2.2);
  box(scene, colliders, shootables, contAMat, 7, 0, -4, 5, 2.6, 2.2);

  // Site cover: A gets an L of stacked crates, B a container + crate stack.
  box(scene, colliders, shootables, crateAltMat, -19, 0, -13, 2, 2.2, 4);
  box(scene, colliders, shootables, crateMat, -15, 0, -15, 4, 1.2, 2);
  box(scene, colliders, shootables, crateAltMat, -15, 1.2, -15, 2, 1.1, 2);
  box(scene, colliders, shootables, contBMat, 18, 0, -14, 2.4, 2.6, 5);
  box(scene, colliders, shootables, crateMat, 13, 0, -15, 3, 1.2, 2);
  box(scene, colliders, shootables, crateAltMat, 13, 1.2, -15, 2, 1.1, 2);

  sitePlate(scene, 'A', '#f0a830', -16, -12);
  sitePlate(scene, 'B', '#35c4d8', 16, -12);
  skyline(scene, new THREE.MeshBasicMaterial({ color: FOUNDRY.sky }));
  skyDome(scene, SKY.foundry.top, SKY.foundry.horizon);
  stars(scene, 260, 1337);

  return {
    name: 'foundry',
    displayName: 'Foundry',
    fog: { near: 12, far: 44 },
    background: FOUNDRY.canvas,
    sites: {
      A: { letter: 'A', x: -16, z: -12, r: 3.4, color: PALETTE.siteA },
      B: { letter: 'B', x: 16, z: -12, r: 3.4, color: PALETTE.siteB },
    },
    spawns: {
      player: { x: 0, z: 15 },
      friendlies: [{ x: -4, z: 15 }, { x: 4, z: 15 }],
      defendersA: [{ x: -19, z: -12 }, { x: -13, z: -14 }],
      defendersB: [{ x: 19, z: -12 }, { x: 13, z: -14 }],
    },
    waypoints: {
      A: [
        { x: -19, z: -12 }, { x: -13, z: -7 }, { x: -18, z: -14 }, { x: -11, z: -12 },
        { x: -16, z: -5 }, { x: -14, z: -10 },
      ],
      B: [
        { x: 19, z: -12 }, { x: 13, z: -7 }, { x: 18, z: -14 }, { x: 11, z: -12 },
        { x: 16, z: -5 }, { x: 14, z: -10 },
      ],
      midA: [{ x: -4, z: 12 }, { x: -8, z: 6 }, { x: -12, z: -2 }, { x: -14, z: -8 }],
      midB: [{ x: 4, z: 12 }, { x: 8, z: 6 }, { x: 12, z: -2 }, { x: 14, z: -8 }],
      mid: [{ x: 0, z: 10 }, { x: 0, z: 5 }, { x: -3, z: 0 }, { x: 3, z: 0 }],
    },
  };
}

export const MAPS = ['sector-nine', 'foundry'];

export function createMap(scene, name = 'sector-nine') {
  const colliders = [];
  const shootables = [];
  const built = name === 'foundry'
    ? buildFoundry(scene, colliders, shootables)
    : buildSectorNine(scene, colliders, shootables);
  return { colliders, shootables, ...built, bounds: { x: 21.5, z: 17.5 } };
}
