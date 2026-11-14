"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { buildGearGeometry } from "./neuralGeometry";

export type MachineState = { visibility: number; drive: number; scale: number };

/**
 * Abstract, original mechanical assembly: meshing gears, machined rings, a
 * shaft and an articulated arm. Purely illustrative; it does not depict any
 * client machine.
 */
export function MachineAssembly({ state }: { state: React.RefObject<MachineState> }) {
  const parts = useMemo(() => {
    const metal = new THREE.MeshStandardMaterial({
      color: "#6d7c80",
      metalness: 0.55,
      roughness: 0.3,
      transparent: true,
    });
    const accent = new THREE.MeshStandardMaterial({
      color: "#0c3a2b",
      emissive: new THREE.Color("#00e89a"),
      emissiveIntensity: 1.1,
      metalness: 0.4,
      roughness: 0.4,
      transparent: true,
    });
    return {
      metal,
      accent,
      gearA: buildGearGeometry(18, 0.78, 0.68, 0.12, 0.14),
      gearB: buildGearGeometry(11, 0.5, 0.4, 0.09, 0.14),
      gearC: buildGearGeometry(7, 0.33, 0.24, 0.06, 0.12),
      shaft: new THREE.CylinderGeometry(0.07, 0.07, 2.2, 24),
      ring: new THREE.TorusGeometry(1.08, 0.022, 10, 120),
      ring2: new THREE.TorusGeometry(0.92, 0.012, 8, 120),
      link: new THREE.BoxGeometry(0.62, 0.09, 0.09),
      joint: new THREE.SphereGeometry(0.07, 18, 12),
    };
  }, []);

  useEffect(
    () => () => {
      Object.values(parts).forEach((p) => (p as { dispose?: () => void }).dispose?.());
    },
    [parts],
  );

  const root = useRef<THREE.Group>(null);
  const gA = useRef<THREE.Mesh>(null);
  const gB = useRef<THREE.Mesh>(null);
  const gC = useRef<THREE.Mesh>(null);
  const rings = useRef<THREE.Group>(null);
  const arm1 = useRef<THREE.Group>(null);
  const arm2 = useRef<THREE.Group>(null);

  // Pitch radii for correct meshing ratios.
  const pA = 0.73;
  const pB = 0.45;
  const pC = 0.285;
  const bPos = useMemo(() => new THREE.Vector3(pA + pB, 0, 0.02).applyAxisAngle(new THREE.Vector3(0, 0, 1), -0.45), []);
  const cPos = useMemo(
    () => bPos.clone().add(new THREE.Vector3(pB + pC, 0, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), 0.9)),
    [bPos],
  );

  useFrame(() => {
    const s = state.current;
    if (!s || !root.current) return;
    const vis = s.visibility;
    root.current.visible = vis > 0.001;
    if (!root.current.visible) return;
    root.current.scale.setScalar(Math.max(0.0001, s.scale * (0.6 + 0.4 * vis)));
    parts.metal.opacity = vis;
    parts.accent.opacity = vis;
    const a = s.drive;
    if (gA.current) gA.current.rotation.z = a;
    if (gB.current) gB.current.rotation.z = -a * (pA / pB) + Math.PI / 11;
    if (gC.current) gC.current.rotation.z = a * (pA / pC);
    if (rings.current) {
      rings.current.rotation.x = 0.9 + a * 0.15;
      rings.current.rotation.y = a * 0.22;
    }
    if (arm1.current) arm1.current.rotation.z = 0.6 + Math.sin(a * 0.8) * 0.45;
    if (arm2.current) arm2.current.rotation.z = -1.1 + Math.sin(a * 0.8 + 1.2) * 0.6;
  });

  return (
    <group ref={root} position={[-0.25, 0.05, 0]}>
      <mesh ref={gA} geometry={parts.gearA} material={parts.metal} />
      <mesh geometry={parts.shaft} material={parts.accent} rotation={[Math.PI / 2, 0, 0]} />
      <mesh ref={gB} geometry={parts.gearB} material={parts.metal} position={bPos} />
      <mesh ref={gC} geometry={parts.gearC} material={parts.accent} position={cPos} />
      <group ref={rings}>
        <mesh geometry={parts.ring} material={parts.metal} />
        <mesh geometry={parts.ring2} material={parts.accent} rotation={[0.4, 0.6, 0]} />
      </group>
      <group position={[-0.1, -0.15, 0.24]}>
        <mesh geometry={parts.joint} material={parts.accent} />
        <group ref={arm1}>
          <mesh geometry={parts.link} material={parts.metal} position={[-0.31, 0, 0]} />
          <group position={[-0.62, 0, 0]}>
            <mesh geometry={parts.joint} material={parts.accent} />
            <group ref={arm2}>
              <mesh geometry={parts.link} material={parts.metal} position={[-0.31, 0, 0]} scale={[0.8, 0.8, 0.8]} />
              <mesh geometry={parts.joint} material={parts.accent} position={[-0.56, 0, 0]} />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
