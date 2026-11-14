export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const smoothstep = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

/** Normalised, eased progress of `p` through the window [a, b]. */
export const range = (p: number, a: number, b: number) => smoothstep((p - a) / (b - a));

/** Rises across [a, b], holds, then falls across [c, d]. */
export const band = (p: number, a: number, b: number, c: number, d: number) =>
  range(p, a, b) * (1 - range(p, c, d));

/** Frame-rate independent damping factor. */
export const damp = (lambda: number, dt: number) => 1 - Math.exp(-lambda * dt);

/** Deterministic pseudo-random generator so procedural geometry is stable between renders. */
export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
