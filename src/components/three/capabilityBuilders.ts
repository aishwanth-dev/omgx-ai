import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mulberry32 } from "@/lib/math";

/**
 * The four discipline models, built once from three.js primitives: graphite and
 * enamel bodies with restrained emissive accents, matching the hero object.
 * Each builder returns a rig that owns its geometry and materials. Repeated
 * parts are instanced, materials are standard (a clearcoat only on the main
 * body), and the rig is re-centred so its bounding sphere sits at the origin.
 */
export type ModelRig = {
  /** Outer group; its origin is the centre of the model's bounding sphere. */
  root: THREE.Group;
  /** Radius of the bounding sphere around the origin, in model units. */
  radius: number;
  update: (t: number) => void;
  /** Writes the idle Euler rotation (x, y, z) at time t into `out`. */
  idle: (t: number, out: number[]) => void;
  /** Sets the whole model's opacity (0–1). A no-op when unchanged. */
  setOpacity: (o: number) => void;
  dispose: () => void;
};

const Y = new THREE.Vector3(0, 1, 0);
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const SPECS = {
  graphite: () => new THREE.MeshStandardMaterial({ color: "#1a2033", roughness: 0.4, metalness: 0.55 }),
  board: () => new THREE.MeshStandardMaterial({ color: "#0f1424", roughness: 0.55, metalness: 0.35 }),
  enamel: () => new THREE.MeshStandardMaterial({ color: "#eceff7", roughness: 0.3, metalness: 0.08 }),
  // The only clearcoat materials: the main body shells.
  shell: () => new THREE.MeshPhysicalMaterial({ color: "#eceff7", roughness: 0.3, metalness: 0.08, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
  shellDark: () => new THREE.MeshPhysicalMaterial({ color: "#1a2033", roughness: 0.4, metalness: 0.55, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
  glass: () => new THREE.MeshStandardMaterial({ color: "#05070f", roughness: 0.12, metalness: 0.7 }),
  metal: () => new THREE.MeshStandardMaterial({ color: "#b9c0d4", roughness: 0.28, metalness: 1 }),
  chip: () => new THREE.MeshStandardMaterial({ color: "#0b0e1a", roughness: 0.45, metalness: 0.3 }),
  matcha: () => new THREE.MeshStandardMaterial({ color: "#0b1a4a", emissive: "#4f7cff", emissiveIntensity: 1.7, roughness: 0.4 }),
} satisfies Record<string, () => THREE.MeshStandardMaterial>;
type Kit = { [K in keyof typeof SPECS]: THREE.MeshStandardMaterial };

class Builder {
  geos: THREE.BufferGeometry[] = [];
  mats: THREE.Material[] = [];
  private lastOpacity = -1;
  g<T extends THREE.BufferGeometry>(geo: T): T {
    this.geos.push(geo);
    return geo;
  }
  /** Registers a material. All are transparent from the start so fading never recompiles a shader. */
  m<T extends THREE.Material>(mat: T, base = 1): T {
    mat.userData.base = base;
    mat.transparent = true;
    this.mats.push(mat);
    return mat;
  }
  box(w: number, h: number, d: number, r = 0.05, seg = 2) {
    return this.g(new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3)));
  }
  mesh(parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, p: [number, number, number] = [0, 0, 0], r: [number, number, number] = [0, 0, 0]) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...p);
    m.rotation.set(...r);
    parent.add(m);
    return m;
  }
  /** One material per colour; each is created the first time a builder asks for it. */
  kit(): Kit {
    const cache: Partial<Kit> = {};
    const out = {} as Kit;
    for (const key of Object.keys(SPECS) as (keyof Kit)[]) {
      Object.defineProperty(out, key, { enumerable: true, get: () => (cache[key] ??= this.m(SPECS[key]())) });
    }
    return out;
  }
  finish(root: THREE.Group, rest: Pick<ModelRig, "update" | "idle">): ModelRig {
    // Centre the bounding sphere on the origin so idle turns never swing the model off-centre.
    const box = new THREE.Box3().setFromObject(root);
    const centre = box.getCenter(new THREE.Vector3());
    const radius = box.getSize(new THREE.Vector3()).length() / 2;
    root.position.sub(centre);
    const outer = new THREE.Group();
    outer.add(root);
    return {
      root: outer,
      radius,
      ...rest,
      setOpacity: (o) => {
        if (o === this.lastOpacity) return;
        this.lastOpacity = o;
        for (let i = 0; i < this.mats.length; i++) {
          const mat = this.mats[i];
          mat.opacity = (mat.userData.base as number) * o;
        }
      },
      dispose: () => {
        this.geos.forEach((g) => g.dispose());
        this.mats.forEach((m) => m.dispose());
      },
    };
  }
}

const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpP = new THREE.Vector3();
const tmpS = new THREE.Vector3();

/** 1. AI / ML: a layered neural network (instanced nodes and links) with pulses travelling along its links. */
export function buildNeural(): ModelRig {
  const b = new Builder();
  const k = b.kit();
  const root = new THREE.Group();
  const rand = mulberry32(5);
  const layers = [3, 5, 5, 3];
  const xs = [-1.9, -0.64, 0.64, 1.9];
  const pts = layers.map((n, l) => Array.from({ length: n }, (_, i) => V(xs[l], (i - (n - 1) / 2) * 0.58, Math.sin(i * 2.3 + l * 1.7) * 0.5)));

  const sphere = b.g(new THREE.SphereGeometry(1, 16, 10));
  const classes = [
    { layers: [0], mat: k.enamel, r: 0.14 },
    { layers: [1, 2], mat: k.graphite, r: 0.115 },
    { layers: [3], mat: k.matcha, r: 0.14 },
  ];
  for (const c of classes) {
    const list = c.layers.flatMap((l) => pts[l]);
    const im = new THREE.InstancedMesh(sphere, c.mat, list.length);
    list.forEach((p, i) => im.setMatrixAt(i, tmpM.compose(p, tmpQ.identity(), tmpS.setScalar(c.r))));
    root.add(im);
  }

  // Links: every node to every node of the next layer, as one instanced draw of thin prisms.
  const links: [THREE.Vector3, THREE.Vector3][] = [];
  for (let l = 0; l < layers.length - 1; l++) for (const a of pts[l]) for (const c of pts[l + 1]) links.push([a, c]);
  const linkMat = b.m(new THREE.MeshBasicMaterial({ color: "#3a62ea", opacity: 0.38, depthWrite: false }), 0.38);
  const cyl = b.g(new THREE.CylinderGeometry(1, 1, 1, 4, 1));
  const lm = new THREE.InstancedMesh(cyl, linkMat, links.length);
  links.forEach(([a, c], i) => {
    const dir = tmpP.copy(c).sub(a);
    const len = dir.length();
    tmpQ.setFromUnitVectors(Y, dir.normalize());
    lm.setMatrixAt(i, tmpM.compose(a.clone().add(c).multiplyScalar(0.5), tmpQ, tmpS.set(0.014, len, 0.014)));
  });
  root.add(lm);

  // Pulses: bright beads that run along random links (one instanced draw).
  const pulseMat = b.m(new THREE.MeshBasicMaterial({ color: "#c9d8ff" }));
  const pulses = Array.from({ length: 28 }, () => ({ link: Math.floor(rand() * links.length), speed: 0.22 + rand() * 0.35, phase: rand() }));
  const pm = new THREE.InstancedMesh(b.g(new THREE.SphereGeometry(1, 8, 6)), pulseMat, pulses.length);
  root.add(pm);
  const update = (t: number) => {
    for (let i = 0; i < pulses.length; i++) {
      const p = pulses[i];
      const f = (p.phase + t * p.speed) % 1;
      const l = links[p.link];
      tmpP.lerpVectors(l[0], l[1], f);
      pm.setMatrixAt(i, tmpM.compose(tmpP, tmpQ.identity(), tmpS.setScalar(0.05 * (0.35 + 0.65 * Math.sin(Math.PI * f)))));
    }
    pm.instanceMatrix.needsUpdate = true;
  };
  update(0);
  lm.frustumCulled = false;
  pm.frustumCulled = false;

  return b.finish(root, {
    update,
    idle: (t, o) => {
      o[0] = 0.14 * Math.sin(t * 0.3);
      o[1] = t * 0.22;
      o[2] = 0;
    },
  });
}

/** 2. Automation & Robotics: a robot head with a visor, glowing eyes, ear modules, neck and antenna. */
export function buildRobot(): ModelRig {
  const b = new Builder();
  const k = b.kit();
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = -0.25;
  root.add(body);

  b.mesh(body, b.box(2.0, 1.55, 1.6, 0.4, 4), k.shell, [0, 0.35, 0]);
  b.mesh(body, b.box(1.62, 0.74, 0.2, 0.22), k.glass, [0, 0.38, 0.76]);
  const eyes = [-1, 1].map((s) => b.mesh(body, b.box(0.32, 0.17, 0.06, 0.07, 1), k.matcha, [s * 0.38, 0.4, 0.875]));
  b.mesh(body, b.box(0.62, 0.07, 0.05, 0.03, 1), k.graphite, [0, -0.18, 0.81]);

  // Ear modules.
  const earGeo = b.g(new THREE.CylinderGeometry(0.34, 0.34, 0.28, 24));
  const capGeo = b.g(new THREE.CylinderGeometry(0.14, 0.14, 0.05, 20));
  const ringGeo = b.g(new THREE.TorusGeometry(0.23, 0.024, 8, 32));
  for (const s of [-1, 1]) {
    b.mesh(body, earGeo, k.graphite, [s * 1.12, 0.35, 0], [0, 0, Math.PI / 2]);
    b.mesh(body, capGeo, k.enamel, [s * 1.27, 0.35, 0], [0, 0, Math.PI / 2]);
    b.mesh(body, ringGeo, k.matcha, [s * 1.255, 0.35, 0], [0, Math.PI / 2, 0]);
  }

  // Neck and shoulders.
  b.mesh(body, b.g(new THREE.CylinderGeometry(0.34, 0.42, 0.5, 24)), k.graphite, [0, -0.72, 0]);
  const rib = b.g(new THREE.TorusGeometry(0.4, 0.045, 8, 28));
  b.mesh(body, rib, k.enamel, [0, -0.6, 0], [Math.PI / 2, 0, 0]);
  b.mesh(body, rib, k.metal, [0, -0.84, 0], [Math.PI / 2, 0, 0]);
  b.mesh(body, b.box(2.3, 0.36, 1.3, 0.16), k.graphite, [0, -1.12, 0]);
  b.mesh(body, b.box(1.5, 0.12, 0.9, 0.05, 1), k.enamel, [0, -0.93, 0]);

  // Antenna.
  b.mesh(body, b.g(new THREE.CylinderGeometry(0.1, 0.13, 0.08, 16)), k.graphite, [0.45, 1.14, 0]);
  b.mesh(body, b.g(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8)), k.metal, [0.45, 1.4, 0]);
  const tip = b.mesh(body, b.g(new THREE.SphereGeometry(0.09, 14, 10)), k.matcha, [0.45, 1.68, 0]);

  const update = (t: number) => {
    // A quick blink every ~4 s, and a slow antenna pulse.
    const ph = t % 4.2;
    const blink = ph > 4.0 ? 1 - Math.sin(((ph - 4.0) / 0.2) * Math.PI) * 0.92 : 1;
    eyes[0].scale.y = blink;
    eyes[1].scale.y = blink;
    k.matcha.emissiveIntensity = 1.5 + 0.35 * Math.sin(t * 1.8);
    tip.scale.setScalar(1 + 0.12 * Math.sin(t * 3));
  };
  update(0);

  return b.finish(root, {
    update,
    idle: (t, o) => {
      o[0] = 0.05 * Math.sin(t * 0.5);
      o[1] = 0.62 * Math.sin(t * 0.34);
      o[2] = 0;
    },
  });
}

/** 3. Immersive AR/VR/XR: a headset with a visor body, strap, lenses and a faint glow. */
export function buildHeadset(): ModelRig {
  const b = new Builder();
  const k = b.kit();
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  b.mesh(body, b.box(2.5, 1.25, 1.0, 0.45, 4), k.shellDark);
  b.mesh(body, b.box(2.3, 1.05, 0.14, 0.4), k.glass, [0, 0, 0.52]);
  b.mesh(body, b.box(2.2, 0.2, 0.94, 0.09, 1), k.enamel, [0, 0.62, -0.01]);
  const glow = b.m(new THREE.MeshBasicMaterial({ color: "#ff4a5e", opacity: 0.5, depthWrite: false }), 0.5);
  b.mesh(body, b.box(1.5, 0.03, 0.02, 0.01, 1), glow, [0, -0.36, 0.6]);

  // Front tracking cameras.
  const cam = b.g(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16));
  const camRing = b.g(new THREE.TorusGeometry(0.115, 0.014, 6, 20));
  for (const s of [-1, 1]) {
    b.mesh(body, cam, k.chip, [s * 0.9, 0.2, 0.6], [Math.PI / 2, 0, 0]);
    b.mesh(body, camRing, k.matcha, [s * 0.9, 0.2, 0.6]);
  }

  // Strap: an elliptical band around the back plus an over-the-head arc.
  const band = b.g(new THREE.CylinderGeometry(1, 1, 0.42, 40, 1, true));
  const bandMat = b.m(new THREE.MeshStandardMaterial({ color: "#222839", roughness: 0.6, metalness: 0.3, side: THREE.DoubleSide }));
  const bandMesh = b.mesh(body, band, bandMat, [0, 0, -1.0]);
  bandMesh.scale.set(1.28, 1, 1.1);
  const arc = b.g(new THREE.TorusGeometry(1.1, 0.06, 8, 36, Math.PI));
  const arcMesh = b.mesh(body, arc, k.enamel, [0, 0.0, -1.0], [0, Math.PI / 2, 0]);
  arcMesh.scale.set(1, 0.8, 1.15);
  b.mesh(body, b.box(1.0, 0.7, 0.3, 0.14), k.enamel, [0, 0, -2.12]);
  const sideBox = b.box(0.16, 0.5, 0.9, 0.06, 1);
  for (const s of [-1, 1]) b.mesh(body, sideBox, k.enamel, [s * 1.3, 0, -0.45]);

  // Eyepieces on the rear face, each with a faintly lit lens.
  const cup = b.g(new THREE.CylinderGeometry(0.44, 0.5, 0.22, 24));
  const lens = b.g(new THREE.CylinderGeometry(0.31, 0.31, 0.04, 24));
  const lensRing = b.g(new THREE.TorusGeometry(0.33, 0.02, 6, 28));
  const lensDisc = b.g(new THREE.CircleGeometry(0.24, 20));
  const lensGlow = b.m(new THREE.MeshBasicMaterial({ color: "#4f7cff", opacity: 0.3, depthWrite: false }), 0.3);
  for (const s of [-1, 1]) {
    b.mesh(body, cup, k.graphite, [s * 0.58, 0, -0.6], [Math.PI / 2, 0, 0]);
    b.mesh(body, lens, k.glass, [s * 0.58, 0, -0.72], [Math.PI / 2, 0, 0]);
    b.mesh(body, lensRing, k.matcha, [s * 0.58, 0, -0.73]);
    b.mesh(body, lensDisc, lensGlow, [s * 0.58, 0, -0.745], [0, Math.PI, 0]);
  }

  const update = (t: number) => {
    k.matcha.emissiveIntensity = 1.4 + 0.3 * Math.sin(t * 1.5);
    glow.color.set("#ff4a5e").multiplyScalar(0.8 + 0.2 * Math.sin(t * 1.5));
  };
  update(0);

  return b.finish(root, {
    update,
    idle: (t, o) => {
      o[0] = 0.14 + 0.04 * Math.sin(t * 0.4);
      o[1] = 0.45 + 0.6 * Math.sin(t * 0.3);
      o[2] = 0;
    },
  });
}

type Item = { p: [number, number, number]; s: [number, number, number]; ry?: number };

/** 4. Hardware & integration: a PCB with a central chip, instanced traces and pins, and small components. */
export function buildBoard(): ModelRig {
  const b = new Builder();
  const k = b.kit();
  const root = new THREE.Group();
  const rand = mulberry32(21);
  const unit = b.g(new THREE.BoxGeometry(1, 1, 1));
  const cylG = b.g(new THREE.CylinderGeometry(1, 1, 1, 12));

  b.mesh(root, b.box(3.9, 0.1, 2.9, 0.06, 1), k.board);

  // Instanced helper: unit shapes with per-instance transforms.
  const place = (geo: THREE.BufferGeometry, mat: THREE.Material, items: Item[]) => {
    const im = new THREE.InstancedMesh(geo, mat, items.length);
    items.forEach((it, i) => im.setMatrixAt(i, tmpM.compose(tmpP.set(...it.p), tmpQ.setFromAxisAngle(Y, it.ry ?? 0), tmpS.set(...it.s))));
    root.add(im);
    return im;
  };

  // Silkscreen outline around the chip (one instanced draw).
  place(unit, k.enamel, [
    { p: [0, 0.052, -0.62], s: [1.3, 0.008, 0.012] },
    { p: [0, 0.052, 0.62], s: [1.3, 0.008, 0.012] },
    { p: [-0.65, 0.052, 0], s: [0.012, 0.008, 1.3] },
    { p: [0.65, 0.052, 0], s: [0.012, 0.008, 1.3] },
    { p: [0.1, 0.222, 0.18], s: [0.3, 0.012, 0.1] },
  ]);

  // Central chip, heat spreader and pin-1 marker.
  b.mesh(root, b.box(0.95, 0.14, 0.95, 0.03, 1), k.chip, [0, 0.12, 0]);
  b.mesh(root, b.box(0.7, 0.03, 0.7, 0.02, 1), k.metal, [0, 0.2, 0]);
  b.mesh(root, b.g(new THREE.SphereGeometry(0.035, 8, 6)), k.matcha, [-0.29, 0.216, -0.29]);

  // Pins on all four sides of the chip, fanning out into traces that end in pads.
  const pins: Item[] = [];
  const segs: Item[] = [];
  const pads: Item[] = [];
  const polys: THREE.Vector3[][] = [];
  const W = 0.028;
  const TY = 0.058;
  const seg = (x1: number, z1: number, x2: number, z2: number) => {
    const horizontal = Math.abs(z2 - z1) < 1e-9;
    const len = Math.abs(horizontal ? x2 - x1 : z2 - z1) + W;
    segs.push({ p: [(x1 + x2) / 2, TY, (z1 + z2) / 2], s: horizontal ? [len, 0.014, W] : [W, 0.014, len] });
  };
  for (let side = 0; side < 4; side++) {
    for (let i = 0; i < 9; i++) {
      const o = (i - 4) * 0.095;
      const mid = 4 - Math.abs(i - 4);
      const sgn = side % 2 === 0 ? 1 : -1;
      if (side < 2) {
        // East / west: out along x.
        const x0 = 0.55 * sgn;
        pins.push({ p: [x0, 0.09, o], s: [0.15, 0.02, 0.06] });
        const x1 = sgn * (0.82 + mid * 0.06);
        const z1 = Math.max(-0.95, Math.min(0.95, o * 2.3));
        const x2 = sgn * 1.45;
        seg(x0 + sgn * 0.07, o, x1, o);
        if (Math.abs(z1 - o) > 1e-6) seg(x1, o, x1, z1);
        seg(x1, z1, x2, z1);
        pads.push({ p: [x2, TY, z1], s: [0.055, 0.02, 0.055] });
        polys.push([V(x0, TY, o), V(x1, TY, o), V(x1, TY, z1), V(x2, TY, z1)]);
      } else {
        // North / south: out along z.
        const z0 = 0.55 * sgn;
        pins.push({ p: [o, 0.09, z0], s: [0.06, 0.02, 0.15] });
        const z1 = sgn * (0.82 + mid * 0.04);
        const x1 = Math.max(-0.6, Math.min(0.6, o * 1.6));
        const z2 = sgn * 1.05;
        seg(o, z0 + sgn * 0.07, o, z1);
        if (Math.abs(x1 - o) > 1e-6) seg(o, z1, x1, z1);
        seg(x1, z1, x1, z2);
        pads.push({ p: [x1, TY, z2], s: [0.055, 0.02, 0.055] });
        polys.push([V(o, TY, z0), V(o, TY, z1), V(x1, TY, z1), V(x1, TY, z2)]);
      }
    }
  }
  place(unit, k.metal, pins);
  place(unit, k.matcha, segs);
  place(cylG, k.metal, pads);

  // Small components along the outer bands: resistors north/south, capacitors east/west.
  const res: Item[] = [];
  for (let x = -1.6; x <= 1.61; x += 0.26) {
    for (const z of [-1.2, 1.2]) {
      if (z < 0 && x > 0.75) continue; // header sits here
      if (rand() < 0.2) continue;
      res.push({ p: [x, 0.08, z], s: [0.2, 0.06, 0.09], ry: rand() < 0.15 ? 0.2 : 0 });
    }
  }
  place(unit, k.enamel, res);
  const caps: Item[] = [];
  const capTops: Item[] = [];
  for (let z = -0.85; z <= 0.86; z += 0.34) {
    for (const x of [-1.72, 1.72]) {
      caps.push({ p: [x, 0.12, z], s: [0.075, 0.14, 0.075] });
      capTops.push({ p: [x, 0.194, z], s: [0.06, 0.012, 0.06] });
    }
  }
  place(cylG, k.graphite, caps);
  place(cylG, k.metal, capTops);

  // Header connector, its pins, mounting holes and status LEDs.
  b.mesh(root, b.box(0.78, 0.1, 0.16, 0.03, 1), k.graphite, [1.15, 0.1, -1.22]);
  place(unit, k.metal, Array.from({ length: 8 }, (_, i) => ({ p: [0.82 + i * 0.1, 0.2, -1.22], s: [0.035, 0.2, 0.035] })));
  const holes: Item[] = [];
  const rings: Item[] = [];
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      holes.push({ p: [sx * 1.8, 0, sz * 1.3], s: [0.075, 0.12, 0.075] });
      rings.push({ p: [sx * 1.8, 0.052, sz * 1.3], s: [0.11, 0.03, 0.11] });
    }
  place(cylG, k.glass, holes);
  place(cylG, k.metal, rings);
  place(
    b.g(new THREE.SphereGeometry(1, 8, 6)),
    k.matcha,
    Array.from({ length: 3 }, (_, i) => ({ p: [-1.3 + i * 0.14, 0.06, 1.0], s: [0.04, 0.04, 0.04] })),
  );

  // Data pulses running along the traces (one instanced draw, segment lengths precomputed).
  const pulseMat = b.m(new THREE.MeshBasicMaterial({ color: "#dbe5ff" }));
  const pulses = Array.from({ length: 18 }, () => ({ poly: Math.floor(rand() * polys.length), speed: 0.18 + rand() * 0.3, phase: rand() }));
  const pm = new THREE.InstancedMesh(b.g(new THREE.SphereGeometry(1, 8, 6)), pulseMat, pulses.length);
  pm.frustumCulled = false;
  root.add(pm);
  const segLens = polys.map((pl) => pl.slice(1).map((p, i) => p.distanceTo(pl[i])));
  const totals = segLens.map((l) => l.reduce((a, c) => a + c, 0));
  const update = (t: number) => {
    k.matcha.emissiveIntensity = 1.3 + 0.4 * Math.sin(t * 1.7);
    for (let i = 0; i < pulses.length; i++) {
      const p = pulses[i];
      const pl = polys[p.poly];
      const sl = segLens[p.poly];
      let d = ((p.phase + t * p.speed) % 1) * totals[p.poly];
      let j = 0;
      while (j < sl.length - 1 && d > sl[j]) {
        d -= sl[j];
        j++;
      }
      tmpP.lerpVectors(pl[j], pl[j + 1], Math.min(1, d / Math.max(1e-6, sl[j])));
      tmpP.y += 0.02;
      pm.setMatrixAt(i, tmpM.compose(tmpP, tmpQ.identity(), tmpS.setScalar(0.034)));
    }
    pm.instanceMatrix.needsUpdate = true;
  };
  update(0);

  return b.finish(root, {
    update,
    idle: (t, o) => {
      o[0] = 0.9 + 0.05 * Math.sin(t * 0.5);
      o[1] = 0.6 * Math.sin(t * 0.3);
      o[2] = 0;
    },
  });
}

export const MODEL_BUILDERS = [buildNeural, buildRobot, buildHeadset, buildBoard] as const;
/** Per-model fit: the model's bounding sphere is scaled to this radius (world units), so all four read at a similar size. */
export const MODEL_FIT = [1.14, 1.06, 1.1, 1.0] as const;
