"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { IDLE, CORE_STATES } from "@/lib/story/coreStates";
import type { HeroDrive } from "@/lib/story/journey";
import { useInvalidateFrame } from "./FrameDriver";
import NODES from "./heroCoreNodes.json";
import { createTraceMaterial } from "./shaders";

export const HERO_CORE_URL = "/models/hero-core.glb";
export const HERO_CORE_LITE_URL = "/models/hero-core-lite.glb";

// Client-only module (loaded through next/dynamic with ssr: false): start the
// request before the canvas mounts. Phones get the lite model.
if (typeof window !== "undefined") {
  const lite = window.matchMedia("(max-width: 760px)").matches;
  useGLTF.preload(lite ? HERO_CORE_LITE_URL : HERO_CORE_URL, "/draco/gltf/");
}

const BASIS = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
const Y = new THREE.Vector3(0, 1, 0);
const GOLDEN = 2.399963; // golden angle: irregular, non-repeating bead phases

type Bead = { mat: THREE.MeshStandardMaterial; base: number; phase: number };

/** A calm, centred pose for callers that give no drive. */
const CALM: HeroDrive = {
  position: [0, 0, 0],
  scale: 1,
  yaw: 0,
  rings: CORE_STATES[2].rings,
  spread: 1,
  opacity: 1,
  coreOpacity: 1,
};

const setOpacity = (m: THREE.Material, o: number) => {
  if (m instanceof THREE.ShaderMaterial) {
    if (m.uniforms.uOpacity) m.uniforms.uOpacity.value = o;
  } else m.opacity = o;
  m.transparent = o < 0.999;
};

/**
 * The Blender-built hero object. Posed each frame by `drive(t)` (the story,
 * the About section and the closing call to action each supply their own);
 * idle spin and breathing ride on top. Beads pulse at offset phases and the
 * Trace_* strips carry a travelling energy window. Nodes are looked up by
 * name, so the lite model's missing beads are simply skipped. Every material
 * is cloned per instance, so canvases fade the object independently.
 */
export function HeroCore({
  lite = false,
  drive,
  reduced = false,
  onFirstFrame,
}: {
  lite?: boolean;
  /** Called every frame with idle time in seconds; omitted for a calm static pose. */
  drive?: (t: number) => HeroDrive;
  reduced?: boolean;
  onFirstFrame?: () => void;
}) {
  const { scene } = useGLTF(lite ? HERO_CORE_LITE_URL : HERO_CORE_URL, "/draco/gltf/");
  const invalidate = useInvalidateFrame();

  // One instance per canvas: the loader cache shares the parsed scene between
  // canvases, and an Object3D can only have one parent. Geometry stays shared;
  // the materials cloned here are disposed with the instance.
  const rig = useMemo(() => {
    const root = scene.clone(true);
    const find = (name: string) => root.getObjectByName(name) ?? null;
    const owned: THREE.Material[] = [];
    const fade: THREE.Material[] = [];
    root.traverse((o) => {
      if (!(o instanceof THREE.Mesh) || Array.isArray(o.material)) return;
      o.material = o.material.clone();
      owned.push(o.material);
      fade.push(o.material);
    });
    const rings = NODES.rings.map(find);
    const ribbon = find(NODES.ribbon);
    const core = find(NODES.core);
    const beads: Bead[] = [];
    NODES.nodes.forEach((name, i) => {
      const mesh = find(name);
      if (!(mesh instanceof THREE.Mesh) || !(mesh.material instanceof THREE.MeshStandardMaterial)) return;
      beads.push({ mat: mesh.material, base: mesh.material.emissiveIntensity || 1, phase: i * GOLDEN });
    });
    const traces: THREE.ShaderMaterial[] = [];
    NODES.traces.forEach((name, i) => {
      const mesh = find(name);
      if (!(mesh instanceof THREE.Mesh)) return;
      const old = mesh.material as THREE.Material;
      fade.splice(fade.indexOf(old), 1);
      owned.splice(owned.indexOf(old), 1);
      old.dispose();
      const mat = createTraceMaterial(i * 0.37);
      mesh.material = mat;
      owned.push(mat);
      fade.push(mat);
      traces.push(mat);
    });
    const coreMesh = core instanceof THREE.Mesh ? core : null;
    return {
      root,
      rings,
      ribbon,
      ribbonRest: ribbon ? ribbon.quaternion.clone() : new THREE.Quaternion(),
      core,
      coreMat: coreMesh && !Array.isArray(coreMesh.material) ? coreMesh.material : null,
      fade,
      beads,
      traces,
      owned,
    };
  }, [scene]);

  useEffect(() => () => rig.owned.forEach((m) => m.dispose()), [rig]);
  // Demand-mode canvases (reduced motion) need a frame once the model is in.
  useEffect(() => invalidate(), [invalidate, rig]);

  const tmp = useMemo(() => ({ e: new THREE.Euler(), q: new THREE.Quaternion(), s: new THREE.Quaternion() }), []);
  const time = useRef(0);
  const first = useRef(true);
  const lastOpacity = useRef(-1);
  const lastCore = useRef(-1);

  useFrame((_, delta) => {
    if (!reduced) time.current += Math.min(delta, 1 / 20);
    const t = time.current;
    const d = drive ? drive(t) : CALM;

    const g = rig.root;
    g.visible = d.opacity > 0.002;
    if (g.visible) {
      if (d.opacity !== lastOpacity.current) {
        lastOpacity.current = d.opacity;
        rig.fade.forEach((m) => {
          if (m !== rig.coreMat) setOpacity(m, d.opacity);
        });
        lastCore.current = -1;
      }
      if (rig.coreMat && d.coreOpacity !== lastCore.current) {
        lastCore.current = d.coreOpacity;
        setOpacity(rig.coreMat, d.opacity * d.coreOpacity);
        if (rig.core) rig.core.visible = d.coreOpacity > 0.002;
      }
    }

    const breathe = 1 + Math.sin(t * IDLE.breatheRate) * IDLE.breathe;
    g.position.set(d.position[0], d.position[1], d.position[2]);
    g.scale.setScalar(d.scale * (drive ? 1 : breathe));
    g.rotation.set(0, d.yaw + t * IDLE.spin, 0);

    // Rings are modelled flat in XZ; BASIS turns them to face +Z so the pose
    // Euler angles read as in coreStates.ts (0 = facing the viewer).
    rig.rings.forEach((ring, i) => {
      if (!ring) return;
      const r = d.rings[i];
      const spin = i === 2 && !drive ? t * IDLE.spin : 0;
      tmp.q.setFromEuler(tmp.e.set(r[0], r[1] + spin, r[2])).multiply(BASIS);
      ring.quaternion.copy(tmp.q);
      ring.scale.setScalar(d.spread);
    });
    if (rig.ribbon) {
      rig.ribbon.quaternion.copy(rig.ribbonRest).multiply(tmp.s.setFromAxisAngle(Y, -t * IDLE.spin * 1.6));
      rig.ribbon.scale.setScalar(1 + (d.spread - 1) * 1.15);
    }
    if (rig.core) rig.core.rotation.y = t * IDLE.spin * 2;

    for (const b of rig.beads) {
      const pulse = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(t * 1.6 + b.phase);
      b.mat.emissiveIntensity = b.base * (0.55 + 0.75 * pulse);
    }
    for (const m of rig.traces) m.uniforms.uTime.value = t;

    if (first.current) {
      first.current = false;
      if (onFirstFrame) requestAnimationFrame(onFirstFrame);
    }
  });

  return <primitive object={rig.root} />;
}
