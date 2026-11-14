"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { CapabilitySlug } from "@/content/capabilities";
import { mulberry32 } from "@/lib/math";
import { MachineAssembly, type MachineState } from "./MachineAssembly";
import { createCoreState, ParticleField } from "./NeuralCore";
import { createConnectionMaterial, createNodeMaterial } from "./shaders";
import { TunnelFrames, type TunnelState } from "./TunnelFrames";

/** AI — a flattened volumetric field of neural nodes with travelling connections. */
function NodeField({ reduced }: { reduced: boolean }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const group = useRef<THREE.Group>(null);
  const t = useRef(0);
  const data = useMemo(() => {
    const rand = mulberry32(11);
    const n = 240;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * 2.6;
      pts.push(new THREE.Vector3(Math.cos(a) * r, (rand() - 0.5) * 1.2 * (1 - r / 3.2), Math.sin(a) * r));
    }
    const pos = new Float32Array(n * 3);
    const phase = new Float32Array(n);
    const size = new Float32Array(n);
    pts.forEach((p, i) => {
      pos.set([p.x, p.y, p.z], i * 3);
      phase[i] = rand();
      size[i] = 1 + rand() * 2.6;
    });
    const seg: number[] = [];
    const tt: number[] = [];
    const sel: number[] = [];
    const seed: number[] = [];
    pts.forEach((a, i) => {
      pts
        .map((b, j) => ({ j, d: a.distanceTo(b) }))
        .filter((x) => x.j > i && x.d < 0.62)
        .slice(0, 2)
        .forEach(({ j }) => {
          const b = pts[j];
          const s = rand() < 0.3 ? 1 : 0;
          const sd = rand();
          seg.push(a.x, a.y, a.z, b.x, b.y, b.z);
          tt.push(0, 1);
          sel.push(s, s);
          seed.push(sd, sd);
        });
    });
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    nodeGeo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    nodeGeo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    const linkGeo = new THREE.BufferGeometry();
    linkGeo.setAttribute("position", new THREE.Float32BufferAttribute(seg, 3));
    linkGeo.setAttribute("aT", new THREE.Float32BufferAttribute(tt, 1));
    linkGeo.setAttribute("aSel", new THREE.Float32BufferAttribute(sel, 1));
    linkGeo.setAttribute("aSeed", new THREE.Float32BufferAttribute(seed, 1));
    const nodeMat = createNodeMaterial();
    const linkMat = createConnectionMaterial();
    linkMat.uniforms.uSelected.value = 0.8;
    linkMat.uniforms.uBase.value = 0.08;
    return { nodeGeo, linkGeo, nodeMat, linkMat };
  }, []);
  useEffect(() => () => Object.values(data).forEach((d) => d.dispose()), [data]);
  useFrame((state, delta) => {
    if (!reduced) t.current += Math.min(delta, 1 / 20);
    data.nodeMat.uniforms.uTime.value = t.current;
    data.nodeMat.uniforms.uPixelRatio.value = dpr;
    data.linkMat.uniforms.uTime.value = t.current;
    if (group.current) {
      group.current.rotation.y = t.current * 0.06 + state.pointer.x * 0.15;
      group.current.rotation.x = 0.38 + state.pointer.y * -0.08;
    }
  });
  return (
    <group ref={group}>
      <lineSegments geometry={data.linkGeo} material={data.linkMat} />
      <points geometry={data.nodeGeo} material={data.nodeMat} />
    </group>
  );
}

/** Industrial — the articulated gear assembly, driven continuously. */
function Machine({ reduced }: { reduced: boolean }) {
  const state = useRef<MachineState>({ visibility: 1, drive: 0, scale: 1.15 });
  const group = useRef<THREE.Group>(null);
  useFrame((s, delta) => {
    if (!reduced) state.current.drive += Math.min(delta, 1 / 20) * 0.5;
    if (group.current) {
      group.current.rotation.x = 0.35 + s.pointer.y * -0.1;
      group.current.rotation.y = -0.55 + s.pointer.x * 0.2;
    }
  });
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={2.4} />
      <directionalLight position={[-4, -2, -3]} intensity={2.2} color="#00e89a" />
      <group ref={group}>
        <MachineAssembly state={state} />
      </group>
    </>
  );
}

/** Immersive — the camera sits inside a flowing tunnel of frames and particles. */
function Tunnel({ reduced }: { reduced: boolean }) {
  const tunnel = useRef<TunnelState>({ visibility: 1, travel: 0, cameraZ: 0 });
  const core = useRef({ ...createCoreState(), immersion: 1, particleOpacity: 0.8 });
  const camera = useThree((s) => s.camera);
  useFrame((s, delta) => {
    const dt = reduced ? 0 : Math.min(delta, 1 / 20);
    tunnel.current.travel += dt * 2.2;
    core.current.travel += dt * 3;
    core.current.time += dt;
    tunnel.current.cameraZ = camera.position.z;
    camera.position.x = s.pointer.x * 0.3;
    camera.position.y = s.pointer.y * 0.2;
    camera.lookAt(0, 0, -20);
  });
  return (
    <>
      <TunnelFrames state={tunnel} count={30} />
      <ParticleField state={core} count={500} />
    </>
  );
}

/** Hardware — a tilted circuit plane with traces, components and pulsing sensor points. */
function Circuit({ reduced }: { reduced: boolean }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const group = useRef<THREE.Group>(null);
  const t = useRef(0);
  const data = useMemo(() => {
    const rand = mulberry32(3);
    const seg: number[] = [];
    const tt: number[] = [];
    const sel: number[] = [];
    const seed: number[] = [];
    const pads: number[] = [];
    const chips: { x: number; z: number; w: number; d: number }[] = [
      { x: 0, z: 0, w: 0.9, d: 0.9 },
      { x: -1.7, z: -0.6, w: 0.5, d: 0.35 },
      { x: 1.6, z: 0.7, w: 0.6, d: 0.4 },
      { x: 0.9, z: -1.3, w: 0.35, d: 0.35 },
      { x: -1.1, z: 1.2, w: 0.45, d: 0.3 },
    ];
    for (let i = 0; i < 46; i++) {
      let x = (rand() - 0.5) * 0.6;
      let z = (rand() - 0.5) * 0.6;
      const sd = rand();
      const s = rand() < 0.45 ? 1 : 0;
      let prog = 0;
      for (let k = 0; k < 4; k++) {
        const horizontal = (k + i) % 2 === 0;
        const len = (rand() < 0.5 ? -1 : 1) * (0.25 + rand() * 0.75);
        const nx = horizontal ? x + len : x;
        const nz = horizontal ? z : z + len;
        seg.push(x, 0, z, nx, 0, nz);
        tt.push(prog, prog + 0.25);
        prog += 0.25;
        sel.push(s, s);
        seed.push(sd, sd);
        x = nx;
        z = nz;
      }
      pads.push(x, 0.01, z);
    }
    const linkGeo = new THREE.BufferGeometry();
    linkGeo.setAttribute("position", new THREE.Float32BufferAttribute(seg, 3));
    linkGeo.setAttribute("aT", new THREE.Float32BufferAttribute(tt, 1));
    linkGeo.setAttribute("aSel", new THREE.Float32BufferAttribute(sel, 1));
    linkGeo.setAttribute("aSeed", new THREE.Float32BufferAttribute(seed, 1));
    const padGeo = new THREE.BufferGeometry();
    padGeo.setAttribute("position", new THREE.Float32BufferAttribute(pads, 3));
    const n = pads.length / 3;
    const phase = new Float32Array(n).map(() => rand());
    const size = new Float32Array(n).map(() => 1.4 + rand() * 1.6);
    padGeo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    padGeo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    const linkMat = createConnectionMaterial();
    linkMat.uniforms.uSelected.value = 1;
    linkMat.uniforms.uBase.value = 0.4;
    const padMat = createNodeMaterial();
    const chipGeo = new THREE.BoxGeometry(1, 0.08, 1);
    const chipMat = new THREE.MeshStandardMaterial({ color: "#151d20", metalness: 0.6, roughness: 0.35 });
    const boardGeo = new THREE.PlaneGeometry(4.8, 3.6);
    const boardMat = new THREE.MeshBasicMaterial({ color: "#0b1214", transparent: true, opacity: 0.9 });
    return { linkGeo, padGeo, linkMat, padMat, chipGeo, chipMat, boardGeo, boardMat, chips };
  }, []);
  useEffect(
    () => () => {
      [data.linkGeo, data.padGeo, data.linkMat, data.padMat, data.chipGeo, data.chipMat, data.boardGeo, data.boardMat].forEach((d) => d.dispose());
    },
    [data],
  );
  useFrame((s, delta) => {
    if (!reduced) t.current += Math.min(delta, 1 / 20);
    data.linkMat.uniforms.uTime.value = t.current;
    data.padMat.uniforms.uTime.value = t.current;
    data.padMat.uniforms.uPixelRatio.value = dpr;
    if (group.current) {
      group.current.rotation.x = 0.85 + s.pointer.y * -0.08;
      group.current.rotation.z = -0.35 + s.pointer.x * 0.1;
    }
  });
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 5, 3]} intensity={2} />
      <pointLight position={[0, 1, 0]} intensity={4} distance={4} color="#00e89a" />
      <group ref={group}>
        <mesh geometry={data.boardGeo} material={data.boardMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} />
        <lineSegments geometry={data.linkGeo} material={data.linkMat} />
        <points geometry={data.padGeo} material={data.padMat} />
        {data.chips.map((c, i) => (
          <mesh key={i} geometry={data.chipGeo} material={data.chipMat} position={[c.x, 0.04, c.z]} scale={[c.w, 1, c.d]} />
        ))}
      </group>
    </>
  );
}

const CAMERAS: Record<CapabilitySlug, { position: [number, number, number]; fov: number }> = {
  "artificial-intelligence": { position: [0, 0.8, 8.4], fov: 38 },
  "industrial-automation": { position: [0, 0, 7.6], fov: 34 },
  "immersive-technologies": { position: [0, 0, 2], fov: 60 },
  "hardware-engineering": { position: [0, 0, 7.4], fov: 36 },
};

export default function CapabilityHeroCanvas({
  slug,
  running,
  reduced,
}: {
  slug: CapabilitySlug;
  running: boolean;
  reduced: boolean;
}) {
  const cam = CAMERAS[slug];
  return (
    <Canvas
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: cam.fov, position: cam.position, near: 0.1, far: 80 }}
      frameloop={running ? (reduced ? "demand" : "always") : "never"}
      aria-hidden="true"
    >
      {slug === "artificial-intelligence" && <NodeField reduced={reduced} />}
      {slug === "industrial-automation" && <Machine reduced={reduced} />}
      {slug === "immersive-technologies" && <Tunnel reduced={reduced} />}
      {slug === "hardware-engineering" && <Circuit reduced={reduced} />}
    </Canvas>
  );
}
