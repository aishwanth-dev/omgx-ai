"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useRef, type MutableRefObject } from "react";
import { damp, lerp } from "@/lib/math";
import { CORE_STATES, type V3 } from "@/lib/story/coreStates";
import type { HeroDrive } from "@/lib/story/journey";
import { FrameDriver } from "./FrameDriver";
import { HeroCore } from "./HeroCore";
import { SceneErrorBoundary } from "./SceneErrorBoundary";
import { StudioLights } from "./StudioLights";

const fill: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" };

/**
 * The hero object as a calm backdrop for the closing call to action. The
 * section's CSS places it behind the form on the right and dims it. Scroll
 * progress through the section (0..1, a ref written by the section) turns it,
 * tilts the rings and lifts it slightly. The canvas takes no pointer input.
 */
function BackdropCore({ lite, reduced, progress }: { lite: boolean; reduced: boolean; progress: MutableRefObject<number> }) {
  const state = useRef({ p: progress.current, t: -1 });
  const drive = (t: number): HeroDrive => {
    const st = state.current;
    const dt = st.t < 0 ? 1 / 60 : Math.min(1 / 20, Math.max(0, t - st.t));
    st.t = t;
    const target = reduced ? 0.5 : progress.current;
    st.p = lerp(st.p, target, reduced ? 1 : damp(3, Math.max(dt, 1 / 60)));
    const k = st.p - 0.5;
    const base = CORE_STATES[2].rings;
    const rings = base.map((r) => [r[0] + k * 0.9 + Math.sin(t * 0.21) * 0.05, r[1] + k * 1.6 + t * 0.05, r[2] + k * 0.35]) as [V3, V3, V3];
    return {
      position: [0, k * -0.9, 0],
      scale: 1 + (reduced ? 0 : Math.sin(t * 0.7) * 0.012),
      yaw: 0.35 + k * 1.8,
      rings,
      spread: 1,
      opacity: 1,
      coreOpacity: 1,
    };
  };
  return <HeroCore lite={lite} drive={drive} reduced={reduced} />;
}

function Fit() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const z = size.width / Math.max(1, size.height) < 1 ? 11 : 9.2;
  useFrame(() => {
    camera.position.z = z;
  });
  return null;
}

/** The hero object (lite model) as the backdrop of the closing call to action. */
export default function CoreMini({
  running,
  reduced,
  progress,
}: {
  running: boolean;
  reduced: boolean;
  progress: MutableRefObject<number>;
}) {
  return (
    <SceneErrorBoundary fallback={null}>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        camera={{ fov: 34, position: [0, 0, 9.2] }}
        frameloop="never"
        aria-hidden="true"
        style={fill}
      >
        <FrameDriver live={running} demand={reduced}>
          <Fit />
          <StudioLights rim={0.9} envIntensity={0.6} />
          <Suspense fallback={null}>
            <BackdropCore lite reduced={reduced} progress={progress} />
          </Suspense>
        </FrameDriver>
      </Canvas>
    </SceneErrorBoundary>
  );
}
