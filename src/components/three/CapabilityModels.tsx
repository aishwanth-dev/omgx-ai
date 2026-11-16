"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { damp, lerp, smoothstep } from "@/lib/math";
import { MODEL_BUILDERS, MODEL_FIT } from "./capabilityBuilders";
import { FrameDriver, useInvalidateFrame } from "./FrameDriver";
import { SceneErrorBoundary } from "./SceneErrorBoundary";
import { StudioLights } from "./StudioLights";

/** Seconds for one model to fade fully out (or in). */
const FADE = 0.32;
/** The incoming model starts once the outgoing one is below this level, so they overlap by at most 30%. */
const GATE = 0.3;
/** Hidden below this opacity: no draw calls at all. */
const VISIBLE_MIN = 0.01;

/**
 * One canvas for the four discipline models (neural network, robot head, VR
 * headset, circuit board), all built once up front. The open row picks the
 * model: the outgoing one fades and scales away first, then the incoming one
 * resolves in, with only a short overlap. At most those two are ever visible,
 * and hidden models are not drawn. The camera is fitted so each model's
 * bounding sphere fills `fill` of the shorter side of the canvas. Nothing is
 * allocated per frame. Geometry and materials are disposed on unmount.
 */
function Stage({ active, reduced, fill }: { active: number; reduced: boolean; fill: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const rigs = useMemo(() => MODEL_BUILDERS.map((build) => build()), []);
  // Holders are real scene-graph groups (not built in a memo), so a strict-mode double render cannot steal a rig.
  const holderRefs = useRef<(THREE.Group | null)[]>([]);
  useEffect(() => () => rigs.forEach((r) => r.dispose()), [rigs]);

  const levels = useRef<number[]>(MODEL_BUILDERS.map((_, i) => (i === active ? 1 : 0)));
  const dir = useRef(1);
  const last = useRef(active);
  const time = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const idle = useRef([0, 0, 0]);
  const invalidate = useInvalidateFrame();

  // Fit the camera so a bounding sphere of radius 1 fills `fill` of the shorter side.
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const tanHalf = Math.tan((camera.fov * Math.PI) / 360);
    camera.position.set(0, 0, 1 / (fill * tanHalf * Math.min(1, aspect)));
    camera.near = 0.1;
    camera.far = 60;
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size, fill, invalidate]);

  useEffect(() => {
    invalidate();
  }, [active, invalidate]);

  // Compile every shader once, with all models visible, so a row change never stalls on a first draw.
  useEffect(() => {
    const holders = holderRefs.current;
    const was = holders.map((h) => h?.visible ?? false);
    holders.forEach((h) => h && (h.visible = true));
    let cancelled = false;
    const restore = () => {
      if (cancelled) return;
      // One draw with everything visible uploads every buffer now; the clear below means it is never presented.
      try {
        gl.render(scene, camera);
        gl.clear();
      } catch {
        /* a failed warm-up draw is harmless */
      }
      holders.forEach((h, i) => h && (h.visible = was[i]));
    };
    gl.compileAsync(scene, camera).then(restore, restore);
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    if (!reduced) time.current += dt;
    const t = time.current;
    const lv = levels.current;
    if (last.current !== active) {
      dir.current = Math.sign(active - last.current) || 1;
      last.current = active;
    }
    const pk = reduced ? 1 : damp(3, dt);
    const ptr = pointer.current;
    ptr.x = lerp(ptr.x, reduced ? 0 : state.pointer.x, pk);
    ptr.y = lerp(ptr.y, reduced ? 0 : state.pointer.y, pk);

    // One outgoing model at most: the most visible non-active one fades; any other is dropped.
    const step = reduced ? 1 : dt / FADE;
    let lead = -1;
    let leadLevel = 0;
    for (let i = 0; i < lv.length; i++) {
      if (i !== active && lv[i] > leadLevel) {
        lead = i;
        leadLevel = lv[i];
      }
    }
    for (let i = 0; i < lv.length; i++) {
      if (i === active) continue;
      lv[i] = i === lead ? Math.max(0, lv[i] - step) : 0;
    }
    if (lead < 0 || lv[lead] <= GATE) lv[active] = Math.min(1, lv[active] + step);

    const holders = holderRefs.current;
    const o = idle.current;
    for (let i = 0; i < rigs.length; i++) {
      const h = holders[i];
      if (!h) continue;
      const e = smoothstep(lv[i]);
      h.visible = e > VISIBLE_MIN;
      if (!h.visible) continue;
      const rig = rigs[i];
      const d = 1 - e;
      const side = i === active ? dir.current : -dir.current;
      rig.setOpacity(e);
      rig.update(t);
      rig.idle(t, o);
      h.rotation.set(o[0] + ptr.y * -0.1, o[1] + side * d * 0.7 + ptr.x * 0.2, o[2]);
      h.position.set(side * d * 0.45, 0, -d * 0.5);
      h.scale.setScalar((MODEL_FIT[i] / rig.radius) * (0.78 + 0.22 * e));
    }
  });

  return (
    <>
      {rigs.map((r, i) => (
        <group
          key={i}
          visible={i === active}
          ref={(el) => {
            if (el) el.rotation.order = "YXZ";
            holderRefs.current[i] = el;
          }}
        >
          <primitive object={r.root} />
        </group>
      ))}
    </>
  );
}

export default function CapabilityModelsCanvas({
  active,
  running,
  reduced,
  fill = 0.6,
  lite = false,
}: {
  active: number;
  running: boolean;
  reduced: boolean;
  /** Fraction of the canvas's shorter side that a model's bounding sphere fills. */
  fill?: number;
  /** Phones and tablets: a lower pixel-ratio cap to keep mid-range GPUs smooth. */
  lite?: boolean;
}) {
  return (
    <SceneErrorBoundary fallback={null}>
      <Canvas
        dpr={lite ? [1, 1.25] : [1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ fov: 34, position: [0, 0, 8.2] }}
        frameloop="never"
        shadows={false}
        aria-hidden="true"
      >
        <FrameDriver live={running} demand={reduced}>
          <StudioLights envIntensity={0.8} rim={1.1} />
          <Stage active={active} reduced={reduced} fill={fill} />
        </FrameDriver>
      </Canvas>
    </SceneErrorBoundary>
  );
}
