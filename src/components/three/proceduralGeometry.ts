import * as THREE from "three";
import { mulberry32 } from "@/lib/math";

/**
 * Deterministic procedural builders still used by the capability scenes:
 * machine gears, tunnel frames and the ambient particle field.
 */

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
