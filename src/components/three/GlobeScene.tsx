"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Location } from "@/content/company";
import { damp, lerp } from "@/lib/math";

const R = 1;

const toVec = (lat: number, lon: number, r = R) => {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
};

const facing = (lat: number, lon: number) => {
  const v = toVec(lat, lon);
  return { y: -Math.atan2(v.x, v.z), x: THREE.MathUtils.degToRad(lat) * 0.7 };
};

function Globe({
  locations,
  active,
  reduced,
  labels,
}: {
  locations: Location[];
  active: number | null;
  reduced: boolean;
  labels: React.RefObject<(HTMLElement | null)[]>;
}) {
  const group = useRef<THREE.Group>(null);
  const size = useThree((s) => s.size);
  const markerRefs = useRef<(THREE.Mesh | null)[]>([]);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const drag = useRef({ active: false, x: 0, y: 0, offY: 0, offX: 0 });
  const time = useRef(0);

  const assets = useMemo(() => {
    // Graticule every 15°.
    const pts: number[] = [];
    for (let lat = -75; lat <= 75; lat += 15) {
      for (let lon = 0; lon < 360; lon += 3) {
        const a = toVec(lat, lon);
        const b = toVec(lat, lon + 3);
        pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    for (let lon = 0; lon < 360; lon += 15) {
      for (let lat = -87; lat < 87; lat += 3) {
        const a = toVec(lat, lon);
        const b = toVec(lat + 3, lon);
        pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    const grid = new THREE.BufferGeometry();
    grid.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const gridMat = new THREE.LineBasicMaterial({ color: "#a5f3d2", transparent: true, opacity: 0.12, depthWrite: false });

    // Fibonacci dot shell for texture.
    const n = 1400;
    const dots = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = i * Math.PI * (3 - Math.sqrt(5));
      dots.set([Math.cos(th) * r * R, y * R, Math.sin(th) * r * R], i * 3);
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute("position", new THREE.BufferAttribute(dots, 3));
    const dotMat = new THREE.PointsMaterial({ color: "#5d6a66", size: 0.008, transparent: true, opacity: 0.8 });

    const sphere = new THREE.SphereGeometry(R * 0.995, 48, 32);
    const sphereMat = new THREE.MeshBasicMaterial({ color: "#0b1012", transparent: true, opacity: 0.92 });
    const marker = new THREE.SphereGeometry(0.018, 16, 12);
    const markerMat = new THREE.MeshBasicMaterial({ color: "#00e89a" });
    const halo = new THREE.RingGeometry(0.03, 0.036, 40);
    const haloMat = new THREE.MeshBasicMaterial({ color: "#00e89a", transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false });
    return { grid, gridMat, dotGeo, dotMat, sphere, sphereMat, marker, markerMat, halo, haloMat };
  }, []);

  useEffect(
    () => () => {
      Object.values(assets).forEach((a) => a.dispose());
    },
    [assets],
  );

  const positions = useMemo(() => locations.map((l) => toVec(l.lat, l.lon, R * 1.002)), [locations]);
  const home = useMemo(() => facing(12, 82), []);

  // Mouse drag to rotate (touch keeps native page scrolling).
  useEffect(() => {
    const el = gl.domElement;
    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      drag.current.active = true;
      drag.current.x = e.clientX;
      drag.current.y = e.clientY;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d.active) return;
      d.offY += (e.clientX - d.x) * 0.006;
      d.offX = THREE.MathUtils.clamp(d.offX + (e.clientY - d.y) * 0.004, -0.6, 0.6);
      d.x = e.clientX;
      d.y = e.clientY;
    };
    const up = () => {
      drag.current.active = false;
      el.style.cursor = "grab";
    };
    el.style.cursor = "grab";
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [gl]);

  // Selecting a location resets the manual drag offset and turns the globe to face it.
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (active !== null) {
      drag.current.offY = 0;
      drag.current.offX = 0;
    }
    invalidate();
  }, [active, invalidate]);

  const tmp = useMemo(() => new THREE.Vector3(), []);
  const camDir = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    if (!reduced && active === null && !drag.current.active) time.current += dt;
    const g = group.current;
    if (!g) return;
    const goal = active !== null ? facing(locations[active].lat, locations[active].lon) : home;
    const orbit = active === null && !reduced ? Math.sin(time.current * 0.12) * 0.35 : 0;
    const k = reduced ? 1 : damp(3, dt);
    g.rotation.y = lerp(g.rotation.y, goal.y + orbit + drag.current.offY, k);
    g.rotation.x = lerp(g.rotation.x, goal.x + drag.current.offX, k);
    g.updateMatrixWorld();

    camDir.copy(camera.position).normalize();
    positions.forEach((p, i) => {
      tmp.copy(p).applyMatrix4(g.matrixWorld).normalize();
      const front = tmp.dot(camDir);
      const label = labels.current?.[i];
      if (label) {
        label.style.opacity = String(THREE.MathUtils.smoothstep(front, 0.05, 0.35));
        label.dataset.active = String(active === i);
        tmp.copy(p).applyMatrix4(g.matrixWorld).project(camera);
        const x = ((tmp.x + 1) / 2) * size.width;
        const y = ((1 - tmp.y) / 2) * size.height;
        label.style.transform = `translate(${x + 12}px, ${y}px) translateY(-50%)`;
      }
      const m = markerRefs.current[i];
      if (m) {
        const pulse = reduced ? 1 : 1 + 0.35 * Math.sin(time.current * 2 + i);
        m.scale.setScalar(active === i ? 1.9 : pulse);
      }
    });
  });

  return (
    <group ref={group}>
      <mesh geometry={assets.sphere} material={assets.sphereMat} />
      <lineSegments geometry={assets.grid} material={assets.gridMat} />
      <points geometry={assets.dotGeo} material={assets.dotMat} />
      {locations.map((l, i) => {
        const p = positions[i];
        const normal = p.clone().normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        return (
          <group key={l.key} position={p}>
            <mesh geometry={assets.marker} material={assets.markerMat} />
            <mesh
              ref={(el) => {
                markerRefs.current[i] = el;
              }}
              geometry={assets.halo}
              material={assets.haloMat}
              quaternion={q}
            />
          </group>
        );
      })}
    </group>
  );
}

export default function GlobeCanvas({
  locations,
  active,
  running,
  reduced,
  labels,
}: {
  locations: Location[];
  active: number | null;
  running: boolean;
  reduced: boolean;
  labels: React.RefObject<(HTMLElement | null)[]>;
}) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 32, position: [0, 0, 4.1] }}
      frameloop={running ? (reduced ? "demand" : "always") : "never"}
      aria-hidden="true"
    >
      <Globe locations={locations} active={active} reduced={reduced} labels={labels} />
    </Canvas>
  );
}
