"use client";

import { Canvas } from "@react-three/fiber";
import { StoryScene } from "./StoryScene";
import type { CoreQuality } from "./NeuralCore";

/** WebGL layer for the homepage story. Loaded client-side only via next/dynamic. */
export default function StoryCanvas({
  progress,
  pointer,
  active,
  mobile,
  stacked,
  reduced,
}: {
  progress: React.RefObject<number>;
  pointer: React.RefObject<{ x: number; y: number }>;
  active: boolean;
  mobile: boolean;
  stacked: boolean;
  reduced: boolean;
}) {
  const quality: CoreQuality = mobile ? "low" : "high";
  return (
    <Canvas
      className="story-canvas__el"
      dpr={mobile ? [1, 1.25] : [1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: stacked ? 48 : 38, near: 0.1, far: 120, position: [0, 0, 7.6] }}
      frameloop={active ? (reduced ? "demand" : "always") : "never"}
      aria-hidden="true"
    >
      <StoryScene progress={progress} pointer={pointer} quality={quality} mobile={stacked} reduced={reduced} />
    </Canvas>
  );
}
