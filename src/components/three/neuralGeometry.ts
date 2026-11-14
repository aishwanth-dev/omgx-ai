import * as THREE from "three";
import { mulberry32 } from "@/lib/math";

/**
 * Procedural geometry for the original OMGX "Neural Engine Core": a set of
 * interwoven closed loops (some rendered as flat twisted ribbons, others as
 * fine tubes), neural nodes sampled along them and connection paths between
 * nodes. Deterministic so the sculpture is identical on every load.
 */

export type CoreLoop = {
  curve: THREE.CatmullRomCurve3;
  kind: "ribbon" | "tube";
  width: number;
  /** Unit direction this loop drifts along when the core "unfolds". */
  unfoldDir: THREE.Vector3;
  unfoldAxis: THREE.Vector3;
  seed: number;
};

export type CoreData = {
  loops: CoreLoop[];
  nodePositions: Float32Array;
  nodePhase: Float32Array;
  nodeSize: Float32Array;
  connPositions: Float32Array;
  connT: Float32Array;
  connSel: Float32Array;
  connSeed: Float32Array;
};

const makeLoop = (rand: () => number, radius: number) => {
  const euler = new THREE.Euler(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
  const p1 = rand() * Math.PI * 2;
  const p2 = rand() * Math.PI * 2;
  const p3 = rand() * Math.PI * 2;
  const pts: THREE.Vector3[] = [];
  const count = 72;
  for (let k = 0; k < count; k++) {
    const th = (k / count) * Math.PI * 2;
    const r = radius * (1 + 0.15 * Math.sin(3 * th + p1) + 0.06 * Math.cos(5 * th + p2));
    const v = new THREE.Vector3(r * Math.cos(th), r * Math.sin(th), 0.38 * radius * Math.sin(2 * th + p3));
    v.applyEuler(euler);
    pts.push(v);
  }
  return new THREE.CatmullRomCurve3(pts, true, "centripetal");
};

export const buildCoreData = (opts: { loops: number; ribbons: number; nodesPerLoop: number; seed?: number }): CoreData => {
  const rand = mulberry32(opts.seed ?? 20260514);
  const loops: CoreLoop[] = [];
  for (let i = 0; i < opts.loops; i++) {
    const isRibbon = i < opts.ribbons;
    const radius = isRibbon ? 1.18 + rand() * 0.28 : 1.0 + rand() * 0.55;
    const curve = makeLoop(rand, radius);
    const dir = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
    const axis = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
    loops.push({
      curve,
      kind: isRibbon ? "ribbon" : "tube",
      width: isRibbon ? 0.16 + rand() * 0.26 : 0.008 + rand() * 0.018,
      unfoldDir: dir,
      unfoldAxis: axis,
      seed: rand(),
    });
  }

  // Nodes sampled along loops plus a few interior nodes.
  const nodes: THREE.Vector3[] = [];
  loops.forEach((loop) => {
    for (let j = 0; j < opts.nodesPerLoop; j++) {
      const t = (j + rand() * 0.6) / opts.nodesPerLoop;
      nodes.push(loop.curve.getPointAt(t % 1));
    }
  });
  for (let j = 0; j < 10; j++) {
    nodes.push(
      new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize().multiplyScalar(0.25 + rand() * 0.55),
    );
  }

  const nodePositions = new Float32Array(nodes.length * 3);
  const nodePhase = new Float32Array(nodes.length);
  const nodeSize = new Float32Array(nodes.length);
  nodes.forEach((n, i) => {
    nodePositions.set([n.x, n.y, n.z], i * 3);
    nodePhase[i] = rand();
    nodeSize[i] = 1.6 + rand() * 2.4;
  });

  // Connect each node to its two nearest neighbours, plus occasional long paths through the core.
  const pairs = new Set<string>();
  const segs: [THREE.Vector3, THREE.Vector3, number, number][] = [];
  nodes.forEach((a, i) => {
    const dists = nodes
      .map((b, j) => ({ j, d: a.distanceTo(b) }))
      .filter((x) => x.j !== i)
      .sort((x, y) => x.d - y.d)
      .slice(0, 2);
    if (rand() < 0.18) dists.push({ j: Math.floor(rand() * nodes.length), d: 0 });
    dists.forEach(({ j }) => {
      if (j === i) return;
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (pairs.has(key)) return;
      pairs.add(key);
      segs.push([a, nodes[j], rand() < 0.32 ? 1 : 0, rand()]);
    });
  });

  const connPositions = new Float32Array(segs.length * 6);
  const connT = new Float32Array(segs.length * 2);
  const connSel = new Float32Array(segs.length * 2);
  const connSeed = new Float32Array(segs.length * 2);
  segs.forEach(([a, b, sel, seed], i) => {
    connPositions.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
    connT.set([0, 1], i * 2);
    connSel.set([sel, sel], i * 2);
    connSeed.set([seed, seed], i * 2);
  });

  return { loops, nodePositions, nodePhase, nodeSize, connPositions, connT, connSel, connSeed };
};

/** Flat, twisted ribbon along a closed curve. uv.x runs along the curve, uv.y across it. */
export const buildRibbonGeometry = (curve: THREE.CatmullRomCurve3, width: number, segments = 320, twists = 1) => {
  const frames = curve.computeFrenetFrames(segments, true);
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const p = new THREE.Vector3();
  const d = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    curve.getPointAt(t % 1, p);
    const fi = i % segments;
    const a = t * Math.PI * 2 * twists;
    d.copy(frames.normals[fi]).multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[fi], Math.sin(a));
    n.crossVectors(frames.tangents[fi], d).normalize();
    // Taper: ribbons swell and thin along their length.
    const w = width * (0.35 + 0.65 * Math.pow(Math.sin(t * Math.PI * 2 + 0.6) * 0.5 + 0.5, 1.4));
    positions.push(p.x - d.x * w * 0.5, p.y - d.y * w * 0.5, p.z - d.z * w * 0.5);
    positions.push(p.x + d.x * w * 0.5, p.y + d.y * w * 0.5, p.z + d.z * w * 0.5);
    normals.push(n.x, n.y, n.z, n.x, n.y, n.z);
    uvs.push(t, 0, t, 1);
    if (i < segments) {
      const k = i * 2;
      indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
};

/** Gear outline for the abstract machine assembly. */
export const buildGearGeometry = (teeth: number, outer: number, inner: number, hole: number, depth: number) => {
  const shape = new THREE.Shape();
  const steps = teeth * 4;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const phase = i % 4;
    const r = phase === 0 || phase === 3 ? inner : outer;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  const holePath = new THREE.Path();
  holePath.absarc(0, 0, hole, 0, Math.PI * 2, true);
  shape.holes.push(holePath);
  // Lightening cut-outs give the gear a machined look.
  const cutR = (inner + hole) / 2;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const c = new THREE.Path();
    c.absarc(Math.cos(a) * cutR, Math.sin(a) * cutR, (inner - hole) * 0.22, 0, Math.PI * 2, true);
    shape.holes.push(c);
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.18,
    bevelSize: depth * 0.12,
    bevelSegments: 2,
    curveSegments: 8,
  });
  geo.center();
  return geo;
};

/** Rounded-square ring outline used for the immersive tunnel frames. */
export const buildFramePoints = (radius: number, segments = 96, power = 4) => {
  const pts: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const x = Math.sign(c) * Math.pow(Math.abs(c), 2 / power) * radius;
    const y = Math.sign(s) * Math.pow(Math.abs(s), 2 / power) * radius * 0.78;
    pts.push(x, y, 0);
  }
  return new Float32Array(pts);
};

export const buildParticles = (count: number, seed = 7) => {
  const rand = mulberry32(seed);
  const shell = new Float32Array(count * 3);
  const tunnel = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const v = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
    const r = 2.2 + Math.pow(rand(), 0.7) * 5.5;
    shell.set([v.x * r, v.y * r * 0.75, v.z * r], i * 3);
    const a = rand() * Math.PI * 2;
    const tr = 1.6 + rand() * 2.8;
    tunnel.set([Math.cos(a) * tr, Math.sin(a) * tr * 0.8, -32 + rand() * 36], i * 3);
    seeds[i] = rand();
  }
  return { shell, tunnel, seeds };
};
