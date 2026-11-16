/** 2D-canvas drawing for RouteGlobe: land dots, highlighted dots, great-circle arcs with comets, markers. */
import { rotate, slerp, type Vec3 } from "./math";

export type GlobeView = { cx: number; cy: number; r: number; yaw: number; pitch: number };
export type ScreenPoint = { x: number; y: number; z: number };

/** Projects a unit vector lifted `lift` times the radius (1 = on the surface). */
export function projectView(v: Vec3, view: GlobeView, lift = 1): ScreenPoint {
  const [x, y, z] = rotate(v, view.yaw, view.pitch);
  return { x: view.cx + x * view.r * lift, y: view.cy - y * view.r * lift, z };
}

/** Soft disc behind the dots so the sphere reads as a body. */
export function drawBody(ctx: CanvasRenderingContext2D, view: GlobeView, fill: string, glow: string) {
  const { cx, cy, r } = view;
  const halo = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.25);
  halo.addColorStop(0, glow);
  halo.addColorStop(1, "transparent");
  ctx.fillStyle = halo;
  ctx.fillRect(cx - r * 1.3, cy - r * 1.3, r * 2.6, r * 2.6);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Front-hemisphere dots from packed xyz vectors, faded towards the limb in three
 * alpha bands (one Path2D each, so a frame is three fills).
 */
export function drawDots(
  ctx: CanvasRenderingContext2D,
  vecs: Float32Array,
  view: GlobeView,
  color: string,
  size: number,
  alpha = 1,
) {
  const { cx, cy, r, yaw, pitch } = view;
  const cyw = Math.cos(yaw);
  const syw = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const bands = [new Path2D(), new Path2D(), new Path2D()];
  const h = size / 2;
  for (let k = 0; k < vecs.length; k += 3) {
    const vx = vecs[k];
    const vy = vecs[k + 1];
    const vz = vecs[k + 2];
    const x1 = vx * cyw + vz * syw;
    const z1 = -vx * syw + vz * cyw;
    const z = vy * sp + z1 * cp;
    if (z <= 0.02) continue;
    const y = vy * cp - z1 * sp;
    bands[z < 0.25 ? 0 : z < 0.55 ? 1 : 2].rect(cx + x1 * r - h, cy - y * r - h, size, size);
  }
  ctx.fillStyle = color;
  [0.28, 0.6, 1].forEach((a, i) => {
    ctx.globalAlpha = a * alpha;
    ctx.fill(bands[i]);
  });
  ctx.globalAlpha = 1;
}

/** Great-circle arc from a to b, lifted off the surface by an amount that grows with distance. */
export function arcPoints(a: Vec3, b: Vec3, view: GlobeView, segments = 48): ScreenPoint[] {
  const ang = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
  const height = 0.04 + ang * 0.12;
  const pts: ScreenPoint[] = [];
  for (let k = 0; k <= segments; k++) {
    const u = k / segments;
    pts.push(projectView(slerp(a, b, u), view, 1 + Math.sin(Math.PI * u) * height));
  }
  return pts;
}

/** True when a lifted point is hidden behind the sphere. */
const occluded = (p: ScreenPoint, view: GlobeView) => p.z < 0 && Math.hypot(p.x - view.cx, p.y - view.cy) < view.r;

/**
 * Draws the arc (faint where it passes behind the globe) and, when `phase` is a number
 * in [0, 1), a comet running along it. Returns the phase of the arrival pulse (0..1) or -1.
 */
export function drawArc(
  ctx: CanvasRenderingContext2D,
  pts: ScreenPoint[],
  view: GlobeView,
  color: string,
  phase: number | null,
  emphasis = 1,
): number {
  const n = pts.length - 1;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineWidth = 1.1;
  for (let k = 0; k < n; k++) {
    const a = pts[k];
    const b = pts[k + 1];
    ctx.globalAlpha = (occluded(a, view) ? 0.06 : 0.34) * emphasis;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  if (phase === null) return -1;
  const run = Math.min(1, phase / 0.7);
  const head = Math.floor(run * n);
  const tail = Math.round(n / 5);
  ctx.lineWidth = 2.2;
  for (let k = Math.max(0, head - tail); k < head; k++) {
    const a = pts[k];
    const b = pts[k + 1];
    if (occluded(a, view)) continue;
    ctx.globalAlpha = (1 - (head - k) / tail) * 0.95;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return phase > 0.7 ? (phase - 0.7) / 0.3 : -1;
}

/** A marker dot with an optional ring; `pulse` in [0, 1] draws an expanding ring. */
export function drawMarker(
  ctx: CanvasRenderingContext2D,
  p: ScreenPoint,
  color: string,
  opts: { radius?: number; ring?: number; pulse?: number } = {},
) {
  const { radius = 2.6, ring = 0, pulse = -1 } = opts;
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
  ctx.fill();
  if (ring > 0) {
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, ring, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (pulse >= 0 && pulse <= 1) {
    ctx.lineWidth = 1.4;
    ctx.globalAlpha = 1 - pulse;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius + 1 + pulse * 16, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
