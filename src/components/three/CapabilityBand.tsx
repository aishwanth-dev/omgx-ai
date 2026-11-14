"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { damp, lerp, mulberry32 } from "@/lib/math";

/**
 * Original sculptural object for the four-capability selector: a rounded,
 * three-lobed loop made of parallel striped strands. All deformation happens
 * in the vertex shader so the four capability states can morph smoothly:
 *   0 AI          — rippling strands, travelling pulses and a neural node field
 *   1 Industrial  — the band splits into articulated, offset links
 *   2 Immersive   — strands open out in depth into a tunnel
 *   3 Hardware    — the loop flattens and circuit traces and sensor pads light up
 */

type StateVec = { spread: number; mech: number; tunnel: number; flat: number; wave: number; pulse: number; circuit: number; nodes: number };

const STATES: StateVec[] = [
  { spread: 0, mech: 0, tunnel: 0, flat: 0, wave: 1, pulse: 1, circuit: 0, nodes: 1 },
  { spread: 0.1, mech: 1, tunnel: 0, flat: 0.35, wave: 0.15, pulse: 0.25, circuit: 0, nodes: 0 },
  { spread: 0.35, mech: 0, tunnel: 1, flat: 0, wave: 0.5, pulse: 0.45, circuit: 0, nodes: 0 },
  { spread: -0.12, mech: 0, tunnel: 0, flat: 1, wave: 0, pulse: 0.2, circuit: 1, nodes: 0 },
];

const STRANDS = 11;
const SEGMENTS = 300;
const RADIAL = 8;

/** JS mirror of the shader's base curve (AI state) for placing nodes and connector anchors. */
const bandPoint = (t: number, s: number, flat = 0) => {
  const th = t * Math.PI * 2;
  const r = 1.55 * (1 + 0.16 * Math.cos(3 * th));
  const c = new THREE.Vector3(r * Math.cos(th), r * Math.sin(th), 0.42 * Math.sin(2 * th + 0.6) * (1 - flat));
  const radial = new THREE.Vector3(Math.cos(th), Math.sin(th), 0);
  const psi = th + 0.6;
  const across = radial.multiplyScalar(Math.cos(psi)).add(new THREE.Vector3(0, 0, Math.sin(psi) * (1 - flat * 0.85)));
  return c.addScaledVector(across, s * 0.31);
};

const buildBandGeometry = () => {
  const count = STRANDS * (SEGMENTS + 1) * (RADIAL + 1);
  const aT = new Float32Array(count);
  const aAngle = new Float32Array(count);
  const aStrand = new Float32Array(count);
  const aIndex = new Float32Array(count);
  const indices: number[] = [];
  let v = 0;
  for (let k = 0; k < STRANDS; k++) {
    const s = (k / (STRANDS - 1)) * 2 - 1;
    const base = v;
    for (let i = 0; i <= SEGMENTS; i++) {
      for (let j = 0; j <= RADIAL; j++) {
        aT[v] = i / SEGMENTS;
        aAngle[v] = (j / RADIAL) * Math.PI * 2;
        aStrand[v] = s;
        aIndex[v] = k;
        v++;
      }
    }
    for (let i = 0; i < SEGMENTS; i++) {
      for (let j = 0; j < RADIAL; j++) {
        const a = base + i * (RADIAL + 1) + j;
        const b = a + RADIAL + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  // Positions are computed in the shader; a dummy attribute keeps three.js happy.
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute("aT", new THREE.BufferAttribute(aT, 1));
  g.setAttribute("aAngle", new THREE.BufferAttribute(aAngle, 1));
  g.setAttribute("aStrand", new THREE.BufferAttribute(aStrand, 1));
  g.setAttribute("aIndex", new THREE.BufferAttribute(aIndex, 1));
  g.setIndex(indices);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4);
  return g;
};

const bandMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSpread: { value: 0 },
      uMech: { value: 0 },
      uTunnel: { value: 0 },
      uFlat: { value: 0 },
      uWave: { value: 1 },
      uPulse: { value: 1 },
      uCircuit: { value: 0 },
      uInk: { value: new THREE.Color("#0e1416") },
      uPaper: { value: new THREE.Color("#f4f6f4") },
      uAccent: { value: new THREE.Color("#00c983") },
    },
    vertexShader: /* glsl */ `
      uniform float uTime, uSpread, uMech, uTunnel, uFlat, uWave;
      attribute float aT;
      attribute float aAngle;
      attribute float aStrand;
      attribute float aIndex;
      varying vec3 vNormal;
      varying vec3 vView;
      varying float vT;
      varying float vIndex;

      vec3 bandPos(float t, float s) {
        float th = t * 6.2831853;
        float r = 1.55 * (1.0 + 0.16 * cos(3.0 * th));
        vec3 c = vec3(r * cos(th), r * sin(th), 0.42 * sin(2.0 * th + 0.6) * (1.0 - uFlat));
        vec3 radial = vec3(cos(th), sin(th), 0.0);
        float psi = th + 0.6;
        vec3 across = cos(psi) * radial + vec3(0.0, 0.0, sin(psi) * (1.0 - uFlat * 0.85));
        vec3 p = c + across * s * 0.31 * (1.0 + uSpread);
        p += radial * 0.03 * sin(th * 12.0 + s * 2.5 + uTime * 0.9) * uWave;
        float seg = floor(t * 14.0);
        float odd = mod(seg, 2.0);
        p += radial * odd * 0.16 * uMech;
        p.z += (odd - 0.5) * 0.3 * uMech;
        p.xy *= 1.0 + s * 0.24 * uTunnel;
        p.z += s * 1.1 * uTunnel;
        return p;
      }

      void main() {
        vT = aT;
        vIndex = aIndex;
        vec3 p = bandPos(aT, aStrand);
        vec3 T = normalize(bandPos(aT + 0.0015, aStrand) - p);
        vec3 U = normalize(bandPos(aT, aStrand + 0.04) - p);
        vec3 B = normalize(cross(T, U));
        vec3 A = normalize(cross(B, T));
        vec3 n = cos(aAngle) * A + sin(aAngle) * B;
        vec3 pos = p + n * 0.024;
        vNormal = normalize(normalMatrix * n);
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        vView = mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime, uMech, uPulse, uCircuit;
      uniform vec3 uInk, uPaper, uAccent;
      varying vec3 vNormal;
      varying vec3 vView;
      varying float vT;
      varying float vIndex;
      void main() {
        float f = fract(vT * 14.0);
        float gap = 0.05 * uMech;
        if (uMech > 0.02 && (f < gap || f > 1.0 - gap)) discard;
        vec3 n = normalize(vNormal);
        vec3 v = normalize(-vView);
        vec3 l = normalize(vec3(-0.35, 0.7, 0.6));
        float diff = max(dot(n, l), 0.0);
        float spec = pow(max(dot(reflect(-l, n), v), 0.0), 28.0);
        float stripe = mod(vIndex, 2.0);
        vec3 base = mix(uInk, uPaper, stripe);
        vec3 col = base * (0.42 + 0.58 * diff) + spec * 0.45;
        // Travelling pulses along the strands.
        float pf = fract(vT * 4.0 - uTime * 0.18 + vIndex * 0.071);
        float pulse = smoothstep(0.0, 0.02, pf) * (1.0 - smoothstep(0.02, 0.14, pf));
        col = mix(col, uAccent, pulse * uPulse * (0.35 + 0.65 * (1.0 - stripe)));
        // Circuit-trace segments for the hardware state.
        float trace = step(0.62, fract(vT * 36.0 + vIndex * 0.37)) * step(0.5, fract(vIndex * 0.5 + 0.25));
        col = mix(col, uAccent, trace * uCircuit * 0.85);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

function Band({ active, anchors, reduced }: { active: number; anchors?: React.RefObject<(SVGLineElement | null)[]>; reduced: boolean }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const group = useRef<THREE.Group>(null);
  const geometry = useMemo(() => buildBandGeometry(), []);
  const material = useMemo(() => bandMaterial(), []);
  const current = useRef<StateVec>({ ...STATES[0] });
  const time = useRef(0);

  // Neural node field (AI state) and circuit board (hardware state).
  const extras = useMemo(() => {
    const rand = mulberry32(42);
    const nodePts: THREE.Vector3[] = [];
    for (let i = 0; i < 46; i++) nodePts.push(bandPoint(rand(), rand() * 2 - 1));
    for (let i = 0; i < 14; i++) nodePts.push(new THREE.Vector3((rand() - 0.5) * 1.6, (rand() - 0.5) * 1.6, (rand() - 0.5) * 0.6));
    const nodeGeo = new THREE.BufferGeometry().setFromPoints(nodePts);
    const linkPts: THREE.Vector3[] = [];
    nodePts.forEach((a, i) => {
      const near = nodePts
        .map((b, j) => ({ j, d: a.distanceTo(b) }))
        .filter((x) => x.j !== i)
        .sort((x, y) => x.d - y.d)
        .slice(0, 2);
      near.forEach(({ j }) => linkPts.push(a, nodePts[j]));
    });
    const linkGeo = new THREE.BufferGeometry().setFromPoints(linkPts);

    const tracePts: THREE.Vector3[] = [];
    const padPts: THREE.Vector3[] = [];
    for (let i = 0; i < 18; i++) {
      let x = (rand() - 0.5) * 1.8;
      let y = (rand() - 0.5) * 1.6;
      padPts.push(new THREE.Vector3(x, y, 0));
      for (let k = 0; k < 3; k++) {
        const horizontal = k % 2 === 0;
        const len = (rand() - 0.5) * 0.9;
        const nx = horizontal ? x + len : x;
        const ny = horizontal ? y : y + len;
        tracePts.push(new THREE.Vector3(x, y, 0), new THREE.Vector3(nx, ny, 0));
        x = nx;
        y = ny;
      }
      padPts.push(new THREE.Vector3(x, y, 0));
    }
    const traceGeo = new THREE.BufferGeometry().setFromPoints(tracePts);
    const padGeo = new THREE.BufferGeometry().setFromPoints(padPts);

    const nodeMat = new THREE.PointsMaterial({ color: "#00b877", size: 0.07, transparent: true, opacity: 0, depthWrite: false });
    const linkMat = new THREE.LineBasicMaterial({ color: "#0e1416", transparent: true, opacity: 0, depthWrite: false });
    const traceMat = new THREE.LineBasicMaterial({ color: "#00a86e", transparent: true, opacity: 0, depthWrite: false });
    const padMat = new THREE.PointsMaterial({ color: "#0e1416", size: 0.06, transparent: true, opacity: 0, depthWrite: false });
    return { nodeGeo, linkGeo, traceGeo, padGeo, nodeMat, linkMat, traceMat, padMat };
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
      Object.values(extras).forEach((o) => o.dispose());
    },
    [geometry, material, extras],
  );

  // With an on-demand frameloop (reduced motion), render once per state change.
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
  }, [active, invalidate]);

  const anchorT = useMemo(() => [0.08, 0.36, 0.58, 0.83], []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    if (!reduced) time.current += dt;
    const target = STATES[active];
    const c = current.current;
    const k = reduced ? 1 : damp(3.2, dt);
    (Object.keys(c) as (keyof StateVec)[]).forEach((key) => {
      c[key] = lerp(c[key], target[key], k);
    });
    const u = material.uniforms;
    u.uTime.value = time.current;
    u.uSpread.value = c.spread;
    u.uMech.value = c.mech;
    u.uTunnel.value = c.tunnel;
    u.uFlat.value = c.flat;
    u.uWave.value = c.wave;
    u.uPulse.value = c.pulse;
    u.uCircuit.value = c.circuit;
    extras.nodeMat.opacity = c.nodes;
    extras.linkMat.opacity = c.nodes * 0.35;
    extras.traceMat.opacity = c.circuit * 0.9;
    extras.padMat.opacity = c.circuit;

    const g = group.current;
    if (g) {
      const px = state.pointer.x;
      const py = state.pointer.y;
      g.rotation.x = lerp(g.rotation.x, -0.42 + c.tunnel * 0.25 - c.flat * 0.25 + (reduced ? 0 : py * 0.12), k);
      g.rotation.y = lerp(g.rotation.y, 0.32 + c.tunnel * 0.35 + (reduced ? 0 : px * 0.18), k);
      g.rotation.z = reduced ? 0.1 : 0.1 + time.current * 0.04;
    }

    // Project anchor points to screen space so the HTML connector lines meet the object.
    const lines = anchors?.current;
    if (lines && g) {
      g.updateMatrixWorld();
      anchorT.forEach((t, i) => {
        const line = lines[i];
        if (!line) return;
        tmp.copy(bandPoint(t, 0, c.flat)).applyMatrix4(g.matrixWorld).project(camera);
        line.setAttribute("x2", (((tmp.x + 1) / 2) * size.width).toFixed(1));
        line.setAttribute("y2", (((1 - tmp.y) / 2) * size.height).toFixed(1));
      });
    }
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry} material={material} frustumCulled={false} />
      <points geometry={extras.nodeGeo} material={extras.nodeMat} />
      <lineSegments geometry={extras.linkGeo} material={extras.linkMat} />
      <lineSegments geometry={extras.traceGeo} material={extras.traceMat} />
      <points geometry={extras.padGeo} material={extras.padMat} />
    </group>
  );
}

export default function CapabilityBandCanvas({
  active,
  running,
  anchors,
  reduced,
}: {
  active: number;
  running: boolean;
  anchors?: React.RefObject<(SVGLineElement | null)[]>;
  reduced: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 34, position: [0, 0, 7.2] }}
      frameloop={running ? (reduced ? "demand" : "always") : "never"}
      aria-hidden="true"
    >
      <Band active={active} anchors={anchors} reduced={reduced} />
    </Canvas>
  );
}
