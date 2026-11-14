"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { band, damp, lerp, range, smoothstep } from "@/lib/math";
import { markReady } from "@/lib/readiness";
import { FlowingSplines, type SplineState } from "./FlowingSplines";
import { MachineAssembly, type MachineState } from "./MachineAssembly";
import { createCoreState, NeuralCore, ParticleField, type CoreQuality } from "./NeuralCore";
import { TunnelFrames, type TunnelState } from "./TunnelFrames";

type V3 = [number, number, number];
type Key = { p: number; cam: V3; tgt: V3; pos: V3; rot: V3; s: number };

/**
 * Camera / object keyframes for the homepage scroll story. Progress 0–1 is the
 * single shared value driven by the GSAP ScrollTrigger timeline in HomeStory.
 * Chapter windows here must match the DOM chapter timings in HomeStory.
 */
const KEYS: Key[] = [
  { p: 0.0, cam: [0, 0, 7.6], tgt: [0, 0, 0], pos: [2.35, 0.62, 0], rot: [0.25, 0, -0.2], s: 0.8 },
  { p: 0.1, cam: [0, 0.2, 7.0], tgt: [0, 0, 0], pos: [0, 0, 0], rot: [0.2, 0.7, -0.1], s: 1 },
  { p: 0.22, cam: [0.9, 0.35, 4.7], tgt: [0.2, 0, 0], pos: [0, 0, 0], rot: [0.45, 1.3, 0], s: 1 },
  { p: 0.32, cam: [0.4, 0.15, 4.3], tgt: [0, 0, 0], pos: [0, 0, 0], rot: [0.55, 1.7, 0.1], s: 1 },
  { p: 0.44, cam: [-1.8, 0.9, 6.4], tgt: [0, 0, 0], pos: [0, 0, 0], rot: [0.7, 2.3, 0.3], s: 1 },
  { p: 0.52, cam: [-0.6, 0.3, 5.2], tgt: [0, 0, 0], pos: [0, 0, 0], rot: [0.7, 2.6, 0.3], s: 1 },
  { p: 0.62, cam: [0, 0, 0.4], tgt: [0, 0, -10], pos: [0, 0, 0], rot: [0.6, 2.9, 0.2], s: 1 },
  { p: 0.66, cam: [0, 0, 0.3], tgt: [0, 0, -10], pos: [0, 0, 0], rot: [0.6, 3.0, 0.2], s: 1 },
  { p: 0.76, cam: [0, 0, 8.2], tgt: [0, 0, 0], pos: [1.0, -0.4, 0], rot: [0.9, 3.6, -0.7], s: 1 },
  { p: 0.88, cam: [0, 0, 8.2], tgt: [0, 0, 0], pos: [2.5, -1.7, -1], rot: [1.1, 4.1, -0.85], s: 0.85 },
  { p: 1.0, cam: [0, 0, 8.4], tgt: [0, 0, 0], pos: [2.8, -2.6, -4], rot: [1.25, 4.6, -0.9], s: 0.6 },
];

const MOBILE_HERO: Partial<Key> = { pos: [0, 1.05, 0], s: 0.74 };

const sampleKeys = (keys: Key[], p: number) => {
  let i = 0;
  while (i < keys.length - 2 && p > keys[i + 1].p) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const t = smoothstep((p - a.p) / (b.p - a.p));
  const mix = (x: V3, y: V3): V3 => [lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2], y[2], t)];
  return { cam: mix(a.cam, b.cam), tgt: mix(a.tgt, b.tgt), pos: mix(a.pos, b.pos), rot: mix(a.rot, b.rot), s: lerp(a.s, b.s, t) };
};

export function StoryScene({
  progress,
  pointer,
  quality,
  mobile,
  reduced,
}: {
  progress: React.RefObject<number>;
  pointer: React.RefObject<{ x: number; y: number }>;
  quality: CoreQuality;
  mobile: boolean;
  reduced: boolean;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const core = useRef(createCoreState());
  const machine = useRef<MachineState>({ visibility: 0, drive: 0, scale: 1 });
  const tunnel = useRef<TunnelState>({ visibility: 0, travel: 0, cameraZ: 0 });
  const splines = useRef<SplineState>({ draw: 0, opacity: 0, sweep: 0 });
  const coreGroup = useRef<THREE.Group>(null);
  const machineGroup = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Vector3(), []);
  const camGoal = useMemo(() => new THREE.Vector3(), []);
  const tgtGoal = useMemo(() => new THREE.Vector3(), []);
  const pointerSmooth = useRef({ x: 0, y: 0 });
  const elapsed = useRef(0);
  const first = useRef(true);

  const keys = useMemo(() => {
    if (!mobile) return KEYS;
    // Mobile: object above the headline in the hero, slightly wider camera throughout.
    return KEYS.map((k, i) => ({
      ...k,
      ...(i === 0 ? MOBILE_HERO : {}),
      cam: [k.cam[0] * 0.6, k.cam[1], k.cam[2] > 2 ? k.cam[2] * 1.28 : k.cam[2]] as V3,
      pos: (i === 0 ? MOBILE_HERO.pos! : [k.pos[0] * 0.35, k.pos[1] * 0.8, k.pos[2]]) as V3,
    }));
  }, [mobile]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    if (!reduced) elapsed.current += dt;
    const t = elapsed.current;
    const p = progress.current ?? 0;
    const k = sampleKeys(keys, p);
    const snap = first.current || reduced;

    // Restrained pointer parallax.
    const ps = pointerSmooth.current;
    const pt = pointer.current ?? { x: 0, y: 0 };
    ps.x = lerp(ps.x, reduced ? 0 : pt.x, damp(3, dt));
    ps.y = lerp(ps.y, reduced ? 0 : pt.y, damp(3, dt));
    const parallax = 1 - range(p, 0.55, 0.62) * (1 - range(p, 0.66, 0.72));

    camGoal.set(k.cam[0] + ps.x * 0.35 * parallax, k.cam[1] + ps.y * 0.22 * parallax, k.cam[2]);
    tgtGoal.set(k.tgt[0], k.tgt[1], k.tgt[2]);
    const f = snap ? 1 : damp(5.5, dt);
    camera.position.lerp(camGoal, f);
    target.lerp(tgtGoal, f);
    camera.lookAt(target);

    if (coreGroup.current) {
      const g = coreGroup.current;
      g.position.set(lerp(g.position.x, k.pos[0], f), lerp(g.position.y, k.pos[1], f), lerp(g.position.z, k.pos[2], f));
      const idle = reduced ? 0 : Math.sin(t * 0.25) * 0.06;
      g.rotation.set(k.rot[0] + idle, k.rot[1] + t * 0.045, k.rot[2]);
      const breathe = reduced ? 1 : 1 + Math.sin(t * 0.9) * 0.012;
      g.scale.setScalar(k.s * breathe);
    }
    if (machineGroup.current && coreGroup.current) {
      machineGroup.current.position.copy(coreGroup.current.position);
      machineGroup.current.rotation.set(0.35 + k.rot[0] * 0.3, -0.5 + k.rot[1] * 0.25, k.rot[2] * 0.4);
    }

    // Chapter-driven state. Windows: 1 Intelligence .08–.20, 2 Systems .22–.34,
    // 3 Machines .38–.50, 4 Immersion .54–.66, 5 Integration .70–.80, manifesto .86–1.
    const systems = band(p, 0.16, 0.26, 0.36, 0.44);
    const machines = band(p, 0.36, 0.45, 0.5, 0.57);
    const immersion = band(p, 0.52, 0.6, 0.66, 0.73);
    const integration = range(p, 0.68, 0.78);
    const end = range(p, 0.9, 1);

    const c = core.current;
    c.time = t;
    c.energy = 0.35 + 0.65 * systems + 0.45 * integration;
    c.selected = systems;
    c.nodeIntensity = 0.75 + 0.6 * band(p, 0.1, 0.22, 0.44, 0.5) + 0.3 * integration;
    c.unfold = machines;
    c.immersion = immersion;
    c.travel = p * 140 + (reduced ? 0 : t * 0.6);
    c.opacity = Math.max(0, 1 - 0.45 * immersion - range(p, 0.86, 0.97));
    c.rim = 0.9 + 0.9 * integration;
    c.particleOpacity = (0.45 + 0.4 * immersion) * (1 - range(p, 0.66, 0.78));

    const m = machine.current;
    const late = range(p, 0.7, 0.8) * (1 - range(p, 0.86, 0.95));
    m.visibility = Math.max(machines, late * 0.85);
    m.scale = machines > late ? 1 : 0.52;
    m.drive = p * 16 + (reduced ? 0 : t * 0.15);

    const tu = tunnel.current;
    tu.visibility = immersion;
    tu.travel = p * 60;
    tu.cameraZ = camera.position.z;

    const sp = splines.current;
    sp.draw = range(p, 0.26, 0.5);
    sp.opacity = (0.0 + 0.55 * range(p, 0.26, 0.4) + 0.45 * range(p, 0.66, 0.8)) * (1 - 0.65 * end) * (1 - immersion * 0.7);
    sp.sweep = range(p, 0.4, 1);

    if (first.current) {
      first.current = false;
      requestAnimationFrame(() => markReady("scene"));
    }
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />
      <directionalLight position={[-4, -2, -3]} intensity={2.6} color="#00e89a" />
      <pointLight position={[0, 0, 2]} intensity={6} distance={6} color="#7dffc9" />
      <group ref={coreGroup}>
        <NeuralCore state={core} quality={quality} />
      </group>
      <group ref={machineGroup}>
        <MachineAssembly state={machine} />
      </group>
      <TunnelFrames state={tunnel} count={quality === "high" ? 26 : 18} />
      <ParticleField state={core} count={quality === "high" ? 700 : 260} />
      <FlowingSplines state={splines} />
    </>
  );
}
