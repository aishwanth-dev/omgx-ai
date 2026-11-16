"use client";

import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import type { StoryLayout } from "@/lib/story/layout";
import { CorePoster } from "./CorePoster";
import { FrameDriver } from "./FrameDriver";
import { SceneErrorBoundary } from "./SceneErrorBoundary";
import { StoryScene } from "./StoryScene";

const posterStyle = (visible: boolean): React.CSSProperties => ({
  position: "absolute",
  left: "50%",
  top: "var(--hero-cy, 57%)",
  width: "calc(var(--hero-h, 33svh) * 1.3)",
  height: "auto",
  translate: "-50% -50%",
  opacity: visible ? 1 : 0,
  transition: "opacity 0.6s ease",
  pointerEvents: "none",
});

/** WebGL layer for the homepage story. Loaded client-side only via next/dynamic. */
export default function StoryCanvas({
  progress,
  pointer,
  layout,
  active,
  mobile,
  stacked,
  reduced,
}: {
  progress: React.RefObject<number>;
  pointer: React.RefObject<{ x: number; y: number }>;
  layout: React.RefObject<StoryLayout>;
  active: boolean;
  mobile: boolean;
  stacked: boolean;
  reduced: boolean;
}) {
  const [drawn, setDrawn] = useState(false);
  // The poster stands in for the hero object only; remounting further into the story must not flash it.
  const [atStart] = useState(() => (progress.current ?? 0) < 0.06);
  return (
    <>
      {/* Placeholder until the first frame; also the fallback if the GLB or decoder fails. */}
      {atStart && <CorePoster style={posterStyle(!drawn)} />}
      <SceneErrorBoundary scene fallback={null}>
        <Canvas
          className="story-canvas__el"
          dpr={mobile ? [1, 1.25] : [1, 1.6]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          camera={{ fov: stacked ? 48 : 38, near: 0.05, far: 140, position: [0, 0, 11.4] }}
          frameloop="never"
          aria-hidden="true"
        >
          <FrameDriver live={active} demand={reduced}>
            <StoryScene
              progress={progress}
              pointer={pointer}
              layout={layout}
              lite={mobile}
              mobile={stacked}
              reduced={reduced}
              onFirstFrame={() => setDrawn(true)}
            />
          </FrameDriver>
        </Canvas>
      </SceneErrorBoundary>
    </>
  );
}
