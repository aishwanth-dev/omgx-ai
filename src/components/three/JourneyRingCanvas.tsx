"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import { clamp01, damp, lerp } from "@/lib/math";
import { CORE_STATES, type V3 } from "@/lib/story/coreStates";
import type { HeroDrive } from "@/lib/story/journey";
import { FrameDriver } from "./FrameDriver";
import { HeroCore } from "./HeroCore";
import { SceneErrorBoundary } from "./SceneErrorBoundary";
import { StudioLights } from "./StudioLights";

/** The ring arrangement and size for each journey stage (calm states of the hero object). */
const STAGE_POSE = [
  { rings: CORE_STATES[2].rings, spread: 1, scale: 1 },
  { rings: CORE_STATES[3].rings, spread: 1, scale: 1 },
  { rings: CORE_STATES[4].rings, spread: 1.2, scale: 0.82 },
  { rings: CORE_STATES[5].rings, spread: 1, scale: 1.04 },
] as const;

const EMPTY: V3 = [0, 0, 0];

/**
 * Fits the object to the host square. The camera stands back until the
 * widest ring (portal state included) fits on a phone-width canvas.
 */
function Fit() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const aspect = size.width / Math.max(1, size.height);
  const z = aspect < 1 ? 8.5 / aspect ** 0.55 : 8.5;
  useFrame(() => {
    camera.position.z = z;
  });
  return null;
}

/**
 * The hero object in a calm pose for the About section. The stage picks the
 * ring arrangement (eased), the section's position in the viewport tilts and
 * turns it directly (no smoothing: it is the scroll), pointer parallax is
 * restrained, and the slow idle spin comes from HeroCore.
 */
function AboutCore({
  cursor,
  host,
  lite,
  reduced,
  onFirstFrame,
}: {
  cursor: React.RefObject<number>;
  host: React.RefObject<HTMLElement | null>;
  lite: boolean;
  reduced: boolean;
  onFirstFrame: () => void;
}) {
  const pointer = useThree((s) => s.pointer);
  const s = useRef({
    t: -1,
    rings: STAGE_POSE[0].rings.map((r) => [...r]) as unknown as [V3, V3, V3],
    spread: 1,
    scale: 1,
    px: 0,
    py: 0,
  });

  const drive = (t: number): HeroDrive => {
      const st = s.current;
      const dt = st.t < 0 ? 1 : Math.min(1 / 20, Math.max(0, t - st.t));
      st.t = t;
      const k = reduced || dt >= 1 ? 1 : damp(6, dt);
      const i = Math.round(Math.min(STAGE_POSE.length - 1, Math.max(0, cursor.current ?? 0)));
      const goal = STAGE_POSE[i];
      for (let r = 0; r < 3; r++) for (let a = 0; a < 3; a++) st.rings[r][a] = lerp(st.rings[r][a], goal.rings[r][a], k);
      st.spread = lerp(st.spread, goal.spread, k);
      st.scale = lerp(st.scale, goal.scale, k);
      st.px = lerp(st.px, reduced ? 0 : pointer.x, damp(3, Math.max(dt, 1 / 60)));
      st.py = lerp(st.py, reduced ? 0 : pointer.y, damp(3, Math.max(dt, 1 / 60)));

      // Scroll position of the host in the viewport, -1 (entering below) … +1 (leaving above).
      const el = host.current;
      let sp = 0;
      if (el) {
        const r = el.getBoundingClientRect();
        sp = Math.max(-1, Math.min(1, (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight));
      }
      const enter = clamp01(1 - Math.max(0, sp) * 1.4);
      // Ring Euler X/Y get the scroll tilt; the whole object turns with the page.
      const rings = st.rings.map((r) => [r[0] + sp * 0.4 + st.py * 0.12, r[1] + sp * 0.7 + st.px * 0.18 + (reduced ? 0 : t * 0.045), r[2]]) as [V3, V3, V3];
      return {
        position: EMPTY,
        scale: st.scale * (0.9 + 0.1 * enter) * (1 + Math.sin(t * 0.9) * 0.012),
        yaw: sp * -0.9,
        rings,
        spread: st.spread,
        opacity: 1,
        coreOpacity: 1,
      };
  };

  return <HeroCore lite={lite} drive={drive} reduced={reduced} onFirstFrame={onFirstFrame} />;
}

/** WebGL layer of the About object. Loaded client-side only via next/dynamic. */
export default function JourneyRingCanvas({
  cursor,
  host,
  live,
  lite,
  reduced,
  onFirstFrame,
}: {
  cursor: React.RefObject<number>;
  host: React.RefObject<HTMLElement | null>;
  live: boolean;
  lite: boolean;
  reduced: boolean;
  onFirstFrame: () => void;
}) {
  return (
    <SceneErrorBoundary fallback={null}>
      <Canvas
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true }}
        camera={{ fov: 34, position: [0, 0, 8.5], near: 0.1, far: 60 }}
        frameloop="never"
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <FrameDriver live={live} demand={reduced}>
          <Fit />
          <StudioLights rim={1.1} envIntensity={0.7} />
          <Suspense fallback={null}>
            <AboutCore cursor={cursor} host={host} lite={lite} reduced={reduced} onFirstFrame={onFirstFrame} />
          </Suspense>
        </FrameDriver>
      </Canvas>
    </SceneErrorBoundary>
  );
}
