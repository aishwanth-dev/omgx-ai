"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { createCoreState, NeuralCore } from "./NeuralCore";

function MiniScene({ reduced }: { reduced: boolean }) {
  const state = useRef(createCoreState());
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const s = state.current;
    if (!reduced) s.time += Math.min(delta, 1 / 20);
    s.energy = 0.7;
    s.rim = 1.3;
    s.nodeIntensity = 1;
    if (group.current) {
      group.current.rotation.set(0.5, s.time * 0.08, -0.35);
    }
  });
  return (
    <group ref={group}>
      <NeuralCore state={state} quality="low" />
    </group>
  );
}

/** Restrained neural-core visual for the closing call to action. */
export default function CoreMini({ running, reduced }: { running: boolean; reduced: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 34, position: [0, 0, 6] }}
      frameloop={running ? (reduced ? "demand" : "always") : "never"}
      aria-hidden="true"
    >
      <MiniScene reduced={reduced} />
    </Canvas>
  );
}
