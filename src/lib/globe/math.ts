/** Globe maths for the 2D-canvas RouteGlobe. Pure, unit- and property-tested. */
export type Vec3 = [number, number, number];

const RAD = Math.PI / 180;

/** Unit vector for a latitude and longitude in degrees (y up, lon 0 facing +z). */
export function toVec(lat: number, lon: number): Vec3 {
  const la = lat * RAD;
  const lo = lon * RAD;
  return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
}

/** Rotate by yaw about the y axis, then by pitch about the x axis (radians). Preserves the norm. */
export function rotate(v: Vec3, yaw: number, pitch: number): Vec3 {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x1 = v[0] * cy + v[2] * sy;
  const z1 = -v[0] * sy + v[2] * cy;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return [x1, v[1] * cp - z1 * sp, v[1] * sp + z1 * cp];
}

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Spherical interpolation between unit vectors a and b (great-circle arcs). */
export function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  const d = Math.min(1, Math.max(-1, dot(a, b)));
  const omega = Math.acos(d);
  if (omega < 1e-9) return [a[0], a[1], a[2]];
  const s = Math.sin(omega);
  const ka = Math.sin((1 - t) * omega) / s;
  const kb = Math.sin(t * omega) / s;
  return [a[0] * ka + b[0] * kb, a[1] * ka + b[1] * kb, a[2] * ka + b[2] * kb];
}

/** Orthographic projection onto a canvas: centre (cx, cy), radius r; front hemisphere is z > 0. */
export function project(v: Vec3, cx: number, cy: number, r: number) {
  return { x: cx + v[0] * r, y: cy - v[1] * r, z: v[2], visible: v[2] > 0 };
}

/** Yaw and pitch that bring a latitude/longitude to the front centre. */
export const facing = (lat: number, lon: number) => ({ yaw: -lon * RAD, pitch: lat * RAD });
