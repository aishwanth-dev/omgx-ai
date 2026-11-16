/**
 * The hero camera journey as a pure function of story progress p (0–1), the
 * same progress timeline.ts and the DOM chapters use. Scrolling back is exact:
 * there is no state and no damping here.
 *
 *   0.00–0.12  the object, small and centred under the headline, a slow push-in
 *   0.12–0.38  Intelligence, Systems: zoom in, a gentle orbit
 *   0.38–0.50  Machines: through the rings and into the core
 *   0.50–0.64  Immersion: out of the other side into the next universe
 *   0.64–0.77  Integration: the object returns ahead and settles
 *   0.77–0.90  it leaves the frame and is hidden for the rest of the page
 */
import { corePose, type CorePose, type V3 } from "./coreStates";
import { JOURNEY, smooth } from "./timeline";

type Key = readonly [number, number];

/** Monotone cubic (PCHIP): C1-smooth, never overshoots its keys, eases at both ends. */
const curve = (keys: readonly Key[]) => {
  const n = keys.length;
  const h: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h.push(keys[i + 1][0] - keys[i][0]);
    d.push((keys[i + 1][1] - keys[i][1]) / h[i]);
  }
  const m = new Array<number>(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) continue;
    const w1 = 2 * h[i] + h[i - 1];
    const w2 = h[i] + 2 * h[i - 1];
    m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  }
  return (p: number) => {
    if (p <= keys[0][0]) return keys[0][1];
    if (p >= keys[n - 1][0]) return keys[n - 1][1];
    let i = 0;
    while (p > keys[i + 1][0]) i++;
    const t = (p - keys[i][0]) / h[i];
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * keys[i][1] +
      (t3 - 2 * t2 + t) * h[i] * m[i] +
      (-2 * t3 + 3 * t2) * keys[i + 1][1] +
      (t3 - t2) * h[i] * m[i + 1]
    );
  };
};

const rng = (p: number, a: number, b: number) => smooth((p - a) / (b - a));

/** Hero distance: the object is small and centred (about a third of the viewport height). Speed ramps up into the core, peaks in the other universe and eases off as the object settles. */
export const HERO_CAM_Z = 11.4;
const camZ = curve([[0, HERO_CAM_Z], [0.06, 11.1], [0.12, 9.2], [0.25, 7.4], [0.38, 5.6], [0.45, 2.4], [0.5, 0], [0.56, -4.6], [0.62, -11], [0.68, -17], [0.74, -21], [0.8, -23.5], [0.9, -25], [1, -25.5]]);
const camX = curve([[0, 0], [0.25, 0], [0.31, 0.9], [0.38, 0.45], [0.45, 0], [1, 0]]);
const camY = curve([[0, 0], [0.12, 0.1], [0.25, 0.55], [0.38, 0.3], [0.46, 0.05], [0.5, 0], [1, 0]]);
const lookZ = curve([[0, 0], [0.38, 0], [0.45, -1.5], [0.5, -6], [0.58, -15], [0.64, -21], [0.77, -29], [0.9, -35], [1, -36]]);
const fov = curve([[0, 38], [0.38, 40], [0.45, 56], [0.5, 70], [0.58, 60], [0.64, 48], [0.77, 40], [1, 40]]);
const roll = curve([[0, 0], [0.38, 0], [0.44, 0.22], [0.5, 0.06], [0.58, -0.05], [0.64, 0], [1, 0]]);
/** Distance of the returning object ahead of the camera. */
const ahead = curve([[0, 40], [0.6, 40], [0.7, 9.5], [0.77, 6.6], [0.9, 3.2], [1, 3.4]]);
const offX = curve([[0, 0], [0.77, 0], [0.9, 6.8], [1, 6.8]]);
const offY = curve([[0, 0], [0.77, 0], [0.9, -4.4], [1, -4.4]]);
const objScale = curve([[0, 1], [0.6, 0.7], [0.7, 1], [0.77, 1], [0.9, 1.25], [1, 1.25]]);
const yaw = curve([[0, 0], [0.5, 0.5], [0.62, 0], [0.77, 0], [0.9, 2.6], [1, 2.6]]);

/** Everything HeroCore needs for one frame. */
export type HeroDrive = {
  position: V3;
  scale: number;
  /** Rotation about Y, added to the idle spin. */
  yaw: number;
  rings: CorePose["rings"];
  spread: number;
  opacity: number;
  coreOpacity: number;
};

export type JourneyFrame = {
  camera: { position: V3; look: V3; roll: number; fov: number };
  object: {
    position: V3;
    yaw: number;
    scale: number;
    /** 0–1 for the whole object. */
    opacity: number;
    /** 0–1 for the core alone: it clears while the camera passes through it. */
    coreOpacity: number;
    visible: boolean;
  };
  /** 0–1 opacity of the next-universe particles and light streaks. */
  universe: number;
  /** 0–1 camera speed, which stretches the streaks. */
  speed: number;
  /** 0–1 colour shift: graphite, deep blue, red. */
  hue: number;
  /** 0–1 soft glow ahead of the camera, peaking as it passes through the core. */
  bloom: number;
};

/**
 * How far the 3D scene is shifted on screen, as fractions of the viewport. `hero` is the
 * weight of the start composition (object below the headline), `reel` the weight of the
 * chapter composition (object off to the side, clear of the statement reel).
 */
export function screenWeights(p: number) {
  const pc = Math.min(1, Math.max(0, p));
  const hero = 1 - rng(pc, 0.03, 0.2);
  const reel = rng(pc, 0.08, 0.17) * (1 - rng(pc, 0.34, 0.46)) + rng(pc, 0.58, 0.68) * (1 - rng(pc, 0.8, 0.88));
  return { hero, reel };
}

export function journeyAt(p: number): JourneyFrame {
  const pc = Math.min(1, Math.max(0, p));
  const cz = camZ(pc);
  const cx = camX(pc);
  const cy = camY(pc);

  const away = rng(pc, JOURNEY.passCore + 0.02, JOURNEY.reappear - 0.02);
  const opacity =
    pc < 0.58 ? 1 - rng(pc, JOURNEY.passCore, JOURNEY.behind) : rng(pc, JOURNEY.reappear, 0.7) * (1 - rng(pc, 0.83, JOURNEY.gone));
  const coreOpacity = Math.min(1, 1 - rng(pc, 0.39, 0.45) + rng(pc, 0.52, JOURNEY.reappear - 0.02));
  const d = ahead(pc);
  const objectPos: V3 = [
    (cx + offX(pc)) * away,
    (cy + offY(pc)) * away,
    (cz - d) * away,
  ];

  const dz = Math.abs(camZ(Math.min(1, pc + 0.004)) - camZ(Math.max(0, pc - 0.004))) / 0.008;
  const universe = rng(pc, 0.44, 0.58) * (1 - rng(pc, 0.8, 0.93));
  return {
    camera: { position: [cx, cy, cz], look: [0, 0, lookZ(pc)], roll: roll(pc), fov: fov(pc) },
    object: { position: objectPos, yaw: yaw(pc), scale: objScale(pc), opacity, coreOpacity, visible: opacity > 0.002 },
    universe,
    speed: Math.min(1, dz / 100),
    hue: rng(pc, 0.44, 0.82),
    bloom: universe * 0.22 + 0.78 * rng(pc, 0.42, 0.51) * (1 - rng(pc, 0.52, 0.64)),
  };
}

/** The hero object's drive for story progress p and idle time t, with an optional vertical shift for stacked layouts. */
export function storyDrive(p: number, t: number, lift = 0): HeroDrive {
  const j = journeyAt(p);
  const pose = corePose(p, t);
  const o = j.object;
  return {
    position: [o.position[0] + pose.position[0], o.position[1] + pose.position[1] + lift, o.position[2] + pose.position[2]],
    scale: pose.scale * o.scale,
    yaw: o.yaw,
    rings: pose.rings,
    spread: pose.spread,
    opacity: o.opacity,
    coreOpacity: o.coreOpacity,
  };
}
