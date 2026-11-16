"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * Studio lighting for the GLB objects (3.26): three's RoomEnvironment baked to
 * scene.environment through PMREMGenerator, plus key, fill and a red-tinted
 * rim. No drei Environment preset and no HDRI download. Everything is disposed
 * on unmount. Positions mirror the Blender poster rig (Z-up → Y-up).
 */
export function StudioLights({ envIntensity = 0.55, rim = 1 }: { envIntensity?: number; rim?: number }) {
  const get = useThree((s) => s.get);

  useEffect(() => {
    const { gl, scene } = get();
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = pmrem.fromScene(room, 0.04);
    const prev = { env: scene.environment, intensity: scene.environmentIntensity };
    scene.environment = target.texture;
    scene.environmentIntensity = envIntensity;
    return () => {
      scene.environment = prev.env;
      scene.environmentIntensity = prev.intensity;
      target.dispose();
      pmrem.dispose();
      room.dispose();
    };
  }, [get, envIntensity]);

  return (
    <>
      <directionalLight position={[-4.5, 5, 5.5]} intensity={2.4} color="#eef2ff" />
      <directionalLight position={[5.5, -1.5, 4]} intensity={1.0} color="#5b84ff" />
      <directionalLight position={[2.5, 3.5, -6.5]} intensity={3 * rim} color="#ff4a5e" />
    </>
  );
}
