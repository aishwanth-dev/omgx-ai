"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { buildFramePoints } from "./neuralGeometry";

export type TunnelState = { visibility: number; travel: number; cameraZ: number };

const SPACING = 1.5;

/** Rounded frames receding along -z: the depth field of the "Immersion" chapter. */
export function TunnelFrames({ state, count = 26 }: { state: React.RefObject<TunnelState>; count?: number }) {
  const frames = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(buildFramePoints(2.3), 3));
    const materials = Array.from(
      { length: count },
      (_, i) =>
        new THREE.LineBasicMaterial({
          color: i % 4 === 0 ? "#ffffff" : "#00e89a",
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
    );
    return { geometry, materials };
  }, [count]);

  useEffect(
    () => () => {
      frames.geometry.dispose();
      frames.materials.forEach((m) => m.dispose());
    },
    [frames],
  );

  const group = useRef<THREE.Group>(null);
  const refs = useRef<(THREE.LineLoop | null)[]>([]);
  const length = count * SPACING;

  useFrame(() => {
    const s = state.current;
    if (!s || !group.current) return;
    group.current.visible = s.visibility > 0.002;
    if (!group.current.visible) return;
    for (let i = 0; i < count; i++) {
      const line = refs.current[i];
      if (!line) continue;
      // Frames flow toward the camera as the user scrolls, wrapping at the far end.
      const local = (((i * SPACING + s.travel) % length) + length) % length;
      const z = s.cameraZ - 1 - (length - local);
      line.position.z = z;
      line.rotation.z = i * 0.06 + s.travel * 0.01;
      const dist = s.cameraZ - z;
      const near = THREE.MathUtils.smoothstep(dist, 0.6, 3.5);
      const far = 1 - THREE.MathUtils.smoothstep(dist, length * 0.55, length);
      frames.materials[i].opacity = s.visibility * near * far * (i % 4 === 0 ? 0.55 : 0.85);
    }
  });

  return (
    <group ref={group}>
      {frames.materials.map((m, i) => (
        <lineLoop
          key={i}
          ref={(el: THREE.LineLoop | null) => {
            refs.current[i] = el;
          }}
          geometry={frames.geometry}
          material={m}
        />
      ))}
    </group>
  );
}
