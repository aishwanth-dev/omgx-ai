"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { buildCoreData, buildParticles, buildRibbonGeometry } from "./neuralGeometry";
import { createConnectionMaterial, createCoreMaterial, createNodeMaterial, createParticleMaterial } from "./shaders";

/** Mutable, per-frame state written by the parent scene. Never stored in React state. */
export type CoreState = {
  time: number;
  energy: number;
  selected: number;
  nodeIntensity: number;
  unfold: number;
  immersion: number;
  travel: number;
  opacity: number;
  rim: number;
  particleOpacity: number;
};

export const createCoreState = (): CoreState => ({
  time: 0,
  energy: 0.4,
  selected: 0,
  nodeIntensity: 0.8,
  unfold: 0,
  immersion: 0,
  travel: 0,
  opacity: 1,
  rim: 0.9,
  particleOpacity: 0.55,
});

export type CoreQuality = "high" | "low";

export function NeuralCore({
  state,
  quality = "high",
}: {
  state: React.RefObject<CoreState>;
  quality?: CoreQuality;
}) {
  const dpr = useThree((s) => s.viewport.dpr);
  const data = useMemo(
    () =>
      buildCoreData(
        quality === "high"
          ? { loops: 13, ribbons: 4, nodesPerLoop: 6 }
          : { loops: 8, ribbons: 3, nodesPerLoop: 5 },
      ),
    [quality],
  );

  const loopMeshes = useMemo(
    () =>
      data.loops.map((loop, i) => {
        const geometry =
          loop.kind === "ribbon"
            ? buildRibbonGeometry(loop.curve, loop.width, quality === "high" ? 360 : 220, 1 + (i % 2))
            : new THREE.TubeGeometry(loop.curve, quality === "high" ? 260 : 160, loop.width, 6, true);
        const material = createCoreMaterial({
          seed: loop.seed,
          edge: loop.kind === "ribbon" ? 1 : 0,
          base: loop.kind === "ribbon" ? "#141b1d" : "#3a4649",
        });
        return { geometry, material, loop };
      }),
    [data, quality],
  );

  const nodes = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.nodePositions, 3));
    g.setAttribute("aPhase", new THREE.BufferAttribute(data.nodePhase, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(data.nodeSize, 1));
    return { geometry: g, material: createNodeMaterial() };
  }, [data]);

  const connections = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.connPositions, 3));
    g.setAttribute("aT", new THREE.BufferAttribute(data.connT, 1));
    g.setAttribute("aSel", new THREE.BufferAttribute(data.connSel, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(data.connSeed, 1));
    return { geometry: g, material: createConnectionMaterial() };
  }, [data]);


  // Dispose GPU resources when the scene unmounts or quality changes.
  useEffect(
    () => () => {
      loopMeshes.forEach((m) => {
        m.geometry.dispose();
        m.material.dispose();
      });
      nodes.geometry.dispose();
      nodes.material.dispose();
      connections.geometry.dispose();
      connections.material.dispose();
    },
    [loopMeshes, nodes, connections],
  );

  const loopRefs = useRef<(THREE.Mesh | null)[]>([]);
  const networkRef = useRef<THREE.Group>(null);
  const tmpQ = useMemo(() => new THREE.Quaternion(), []);

  useFrame(() => {
    const s = state.current;
    if (!s) return;
    const spread = 1 + s.immersion * 2.6;
    loopMeshes.forEach((m, i) => {
      const mesh = loopRefs.current[i];
      if (!mesh) return;
      const u = m.material.uniforms;
      u.uTime.value = s.time;
      u.uEnergy.value = s.energy;
      u.uRim.value = s.rim;
      u.uOpacity.value = s.opacity * (m.loop.kind === "tube" ? 0.9 : 1) * (1 - s.unfold * 0.35);
      // Unfold: each loop drifts out along its own direction and turns about its own axis.
      const out = s.unfold * (1.0 + m.loop.seed * 1.1);
      mesh.position.copy(m.loop.unfoldDir).multiplyScalar(out);
      tmpQ.setFromAxisAngle(m.loop.unfoldAxis, s.unfold * (0.5 + m.loop.seed * 0.6));
      mesh.quaternion.copy(tmpQ);
      mesh.scale.setScalar(spread * (1 + s.unfold * 0.12));
    });

    const nu = nodes.material.uniforms;
    nu.uTime.value = s.time;
    nu.uPixelRatio.value = dpr;
    nu.uIntensity.value = s.nodeIntensity;
    nu.uOpacity.value = s.opacity * (1 - s.immersion * 0.6);
    const cu = connections.material.uniforms;
    cu.uTime.value = s.time;
    cu.uSelected.value = s.selected;
    cu.uOpacity.value = s.opacity * (1 - s.unfold * 0.85) * (1 - s.immersion);
    if (networkRef.current) networkRef.current.scale.setScalar(1 + s.unfold * 0.25);
  });

  return (
    <group>
      {loopMeshes.map((m, i) => (
        <mesh
          key={i}
          ref={(el) => {
            loopRefs.current[i] = el;
          }}
          geometry={m.geometry}
          material={m.material}
          renderOrder={1}
        />
      ))}
      <group ref={networkRef}>
        <lineSegments geometry={connections.geometry} material={connections.material} renderOrder={2} />
        <points geometry={nodes.geometry} material={nodes.material} renderOrder={3} />
      </group>

    </group>
  );
}

/** Ambient particle field in world space: an orbital shell that re-forms into a flowing tunnel. */
export function ParticleField({ state, count }: { state: React.RefObject<CoreState>; count: number }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const field = useMemo(() => {
    const { shell, tunnel, seeds } = buildParticles(count);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(shell, 3));
    g.setAttribute("aTunnel", new THREE.BufferAttribute(tunnel, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return { geometry: g, material: createParticleMaterial() };
  }, [count]);

  useEffect(
    () => () => {
      field.geometry.dispose();
      field.material.dispose();
    },
    [field],
  );

  useFrame(() => {
    const s = state.current;
    if (!s) return;
    const u = field.material.uniforms;
    u.uTime.value = s.time;
    u.uTunnel.value = s.immersion;
    u.uTravel.value = s.travel;
    u.uOpacity.value = s.particleOpacity;
    u.uPixelRatio.value = dpr;
  });

  return <points geometry={field.geometry} material={field.material} frustumCulled={false} />;
}
