/**
 * Hero-core poses for the story. The hero, the five chapter states and the exit
 * pose, interpolated by the reel cursor from timeline.ts. Pure and tested.
 * Where the object sits in the world and where the camera flies is journey.ts.
 */
import { reelCursor } from "./timeline";

export type V3 = [number, number, number];
export type CorePose = {
  /** Small offset from the journey position, in scene units. */
  position: V3;
  /** Uniform group scale. */
  scale: number;
  /** Euler rotations of Ring_Inner, Ring_Mid and Ring_Outer about the core. */
  rings: [V3, V3, V3];
  /** Radial spread of the rings (1 = modelled size); the Immersion portal opens them. */
  spread: number;
};

const H = Math.PI / 2;

/**
 * Index 0 hero, 1–5 the chapters (Intelligence, Systems, Machines, Immersion,
 * Integration), 6 the exit. The camera does the travelling; each state is a
 * different arrangement of the rings.
 */
export const CORE_STATES: readonly CorePose[] = [
  // Hero: small and centred (the stage places it under the headline), gently tilted.
  { position: [0, 0, 0], scale: 1.08, rings: [[0.35, 0, 0], [0.55, 0.2, 0], [0.75, -0.2, 0]], spread: 1 },
  // Intelligence: a near-aligned halo (the stage moves it clear of the reel).
  { position: [0, 0.05, 0], scale: 1, rings: [[0.2, 0, 0], [0.26, 0.04, 0], [0.32, -0.04, 0]], spread: 0.92 },
  // Systems: an orthogonal gimbal.
  { position: [0, -0.05, 0], scale: 1, rings: [[0, 0, 0], [H, 0, 0], [0, H, 0]], spread: 1.12 },
  // Machines: interlocked counter-rotation, centred for the dive.
  { position: [0, 0, 0], scale: 1, rings: [[H * 0.66, 0.6, 0], [-H * 0.66, -0.6, 0], [H, 0, H * 0.5]], spread: 1 },
  // Immersion: the rings open as a concentric portal around the flight path.
  { position: [0, 0, 0], scale: 1, rings: [[0, 0, 0], [0, 0, 0.3], [0, 0, -0.3]], spread: 1.6 },
  // Integration: everything aligned into one plane, seen from above.
  { position: [0, 0, 0], scale: 1, rings: [[1.15, 0, 0], [1.15, 0, 0], [1.15, 0, 0]], spread: 1 },
  // Exit: the same plane, tilting further as it leaves the frame.
  { position: [0, 0, 0], scale: 1, rings: [[0.9, 0, 0.3], [0.9, 0, 0.3], [0.9, 0, 0.3]], spread: 1 },
];

/** Idle behaviour: slow spin (rad/s) and breathing amplitude. */
export const IDLE = { spin: 0.045, breathe: 0.012, breatheRate: 0.9 } as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** Pose at cursor c ∈ [0, 6] (no idle motion). */
export function poseAtCursor(c: number): CorePose {
  const x = Math.min(CORE_STATES.length - 1, Math.max(0, c));
  const i = Math.min(CORE_STATES.length - 2, Math.floor(x));
  const t = x - i;
  const a = CORE_STATES[i];
  const b = CORE_STATES[i + 1];
  return {
    position: mix3(a.position, b.position, t),
    scale: lerp(a.scale, b.scale, t),
    rings: [mix3(a.rings[0], b.rings[0], t), mix3(a.rings[1], b.rings[1], t), mix3(a.rings[2], b.rings[2], t)],
    spread: lerp(a.spread, b.spread, t),
  };
}

/**
 * Pose at story progress p and idle time t (seconds). Idle adds a slow spin to
 * the outer ring and breathing to the scale; t = 0 gives the pure keyframe pose.
 */
export function corePose(p: number, t = 0): CorePose {
  const pose = poseAtCursor(reelCursor(p));
  const outer = pose.rings[2];
  pose.rings[2] = [outer[0], outer[1] + t * IDLE.spin, outer[2]];
  pose.scale *= 1 + Math.sin(t * IDLE.breatheRate) * IDLE.breathe;
  return pose;
}
