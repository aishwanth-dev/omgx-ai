"use client";

import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Line2, LineMaterial } from "three-stdlib";

export type SplineState = { draw: number; opacity: number; sweep: number };

const SPECS: { pts: [number, number][]; color: string; width: number; alpha: number }[] = [
  { pts: [[-9, 3.6], [-4, 2.4], [0, 0.6], [4, -1.6], [9, -4.2]], color: "#00e89a", width: 1.3, alpha: 0.95 },
  { pts: [[-9, 1.2], [-5, 0.9], [-1, -0.4], [3, -2.2], [7, -5]], color: "#ffffff", width: 1, alpha: 0.7 },
  { pts: [[-6, 5], [-2, 3.1], [2, 1.9], [6, 1.2], [10, -0.6]], color: "#ffffff", width: 1, alpha: 0.55 },
  { pts: [[-9, -1.6], [-4, -2.2], [1, -1.4], [5, 0.4], [9, 2.4]], color: "#00e89a", width: 1.1, alpha: 0.8 },
  { pts: [[-8, -4.2], [-3, -3.4], [2, -3.8], [6, -2.6], [10, -1.2]], color: "#7dffc9", width: 1, alpha: 0.6 },
];

/**
 * A few intentional curved paths that sweep across the viewport. The group is
 * locked to the camera so the curves read as screen-space lines with depth.
 */
export function FlowingSplines({ state, depth = -8 }: { state: React.RefObject<SplineState>; depth?: number }) {
  const camera = useThree((s) => s.camera);
  const group = useRef<THREE.Group>(null);
  const lines = useRef<(Line2 | null)[]>([]);

  const curves = useMemo(
    () =>
      SPECS.map((spec, i) => {
        const curve = new THREE.CatmullRomCurve3(
          spec.pts.map(([x, y], k) => new THREE.Vector3(x, y, Math.sin(k + i) * 0.8)),
          false,
          "centripetal",
        );
        const points = curve.getPoints(120);
        return { ...spec, points, length: curve.getLength() };
      }),
    [],
  );

  useFrame(() => {
    const s = state.current;
    if (!s || !group.current) return;
    group.current.position.copy(camera.position);
    group.current.quaternion.copy(camera.quaternion);
    group.current.visible = s.opacity > 0.002;
    const inner = group.current.children[0];
    if (inner) {
      inner.rotation.z = -0.08 + s.sweep * 0.22;
      inner.position.y = s.sweep * -0.8;
    }
    curves.forEach((c, i) => {
      const line = lines.current[i];
      if (!line) return;
      const mat = line.material as LineMaterial;
      const lag = i * 0.08;
      const draw = THREE.MathUtils.clamp((s.draw - lag) / (1 - lag * 0.8), 0, 1);
      mat.dashOffset = c.length * (1 - draw);
      mat.opacity = s.opacity * c.alpha;
    });
  });

  return (
    <group ref={group}>
      <group position={[0, 0, depth]}>
        {curves.map((c, i) => (
          <Line
            key={i}
            ref={(el) => {
              lines.current[i] = el as unknown as Line2 | null;
            }}
            points={c.points}
            color={c.color}
            lineWidth={c.width}
            transparent
            opacity={0}
            dashed
            dashSize={c.length}
            gapSize={c.length * 1.05}
            dashOffset={c.length}
            depthWrite={false}
          />
        ))}
      </group>
    </group>
  );
}
