"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { damp, lerp, range } from "@/lib/math";
import { markReady } from "@/lib/readiness";
import { journeyAt, storyDrive, type JourneyFrame } from "@/lib/story/journey";
import { distanceScale, stageShift, type StoryLayout } from "@/lib/story/layout";
import { HeroCore } from "./HeroCore";
import { NextUniverse, type UniverseState } from "./NextUniverse";
import { StudioLights } from "./StudioLights";

/**
 * Homepage story scene: one camera journey, a pure function of the scroll
 * progress (journey.ts), so scrolling back reverses it exactly. The camera
 * zooms in, passes through the rings and the core, and comes out into the
 * next universe; the object returns, leaves the frame and is hidden. The
 * stage layout (where the object sits under the headline, and clear of the
 * statement reel) is applied as a projection-centre shift, so it never
 * disturbs the camera path. Pointer parallax is the only damped input.
 */
export function StoryScene({
  progress,
  pointer,
  layout,
  lite,
  mobile,
  reduced,
  onFirstFrame,
}: {
  progress: React.RefObject<number>;
  pointer: React.RefObject<{ x: number; y: number }>;
  layout: React.RefObject<StoryLayout>;
  lite: boolean;
  /** Stacked (portrait) layout: wider field of view and a camera that stands further back once the hero is over. */
  mobile: boolean;
  reduced: boolean;
  onFirstFrame?: () => void;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const pointerSmooth = useRef({ x: 0, y: 0 });
  const look = useMemo(() => new THREE.Vector3(), []);
  const cache = useRef<{ p: number; f: JourneyFrame } | null>(null);
  const universe = useRef<UniverseState>({ universe: 0, speed: 0, hue: 0, bloom: 0, center: [0, 0] });
  const zk = mobile ? 1.5 : 1;
  const fovK = mobile ? 1.26 : 1;

  const frame = () => {
    const p = progress.current ?? 0;
    if (!cache.current || cache.current.p !== p) cache.current = { p, f: journeyAt(p) };
    return cache.current.f;
  };

  const drive = (t: number) => storyDrive(progress.current ?? 0, t, 0);

  const read = (): UniverseState => {
    const j = frame();
    const u = universe.current;
    u.universe = j.universe;
    u.speed = j.speed;
    u.hue = j.hue;
    u.bloom = j.bloom;
    return u;
  };

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const p = progress.current ?? 0;
    const j = frame();
    const lay = layout.current;

    // Restrained pointer parallax, eased out while the camera is inside the object.
    const ps = pointerSmooth.current;
    const pt = pointer.current ?? { x: 0, y: 0 };
    ps.x = lerp(ps.x, reduced ? 0 : pt.x, damp(3, dt));
    ps.y = lerp(ps.y, reduced ? 0 : pt.y, damp(3, dt));
    const calm = 1 - 0.85 * range(p, 0.38, 0.46) * (1 - range(p, 0.6, 0.7));

    const fov = j.camera.fov * fovK;
    const [cx, cy, cz] = j.camera.position;
    const zs = cz > 0 ? distanceScale(p, lay, fov, zk) : 1;
    camera.position.set(cx + ps.x * 0.35 * calm, cy + ps.y * 0.22 * calm, cz * zs);
    look.set(j.camera.look[0], j.camera.look[1], j.camera.look[2]);
    camera.up.set(0, 1, 0);
    camera.lookAt(look);
    if (j.camera.roll) camera.rotateZ(j.camera.roll);
    camera.fov = fov;

    // Stage layout: shift the projection centre (fractions of the viewport) without moving the camera.
    const sh = stageShift(p, lay);
    if (Math.abs(sh.x) > 1e-4 || Math.abs(sh.y) > 1e-4) {
      camera.setViewOffset(size.width, size.height, -sh.x * size.width, -sh.y * size.height, size.width, size.height);
    } else if (camera.view?.enabled) {
      camera.clearViewOffset();
    } else {
      camera.updateProjectionMatrix();
    }
    universe.current.center = [2 * sh.x, -2 * sh.y];
  });

  const first = () => {
    markReady("scene");
    onFirstFrame?.();
  };

  return (
    <>
      <StudioLights />
      <NextUniverse read={read} particles={lite ? 650 : 1700} streaks={lite ? 40 : 96} stars={lite ? 0.5 : 1} reduced={reduced} />
      <Suspense fallback={null}>
        <HeroCore lite={lite} drive={drive} reduced={reduced} onFirstFrame={first} />
      </Suspense>
    </>
  );
}
