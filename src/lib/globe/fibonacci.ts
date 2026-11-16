/**
 * Fibonacci-sphere points (degrees). Must match scripts/lib/geo.mjs exactly,
 * because the land bitset built at build time is indexed by these points.
 */
const GOLDEN_DEG = 180 * (3 - Math.sqrt(5)); // ≈ 137.508°

export function fibonacciPoint(i: number, n: number): { lat: number; lon: number } {
  const y = 1 - (2 * (i + 0.5)) / n;
  const lat = (Math.asin(y) * 180) / Math.PI;
  const lon = ((((i * GOLDEN_DEG) % 360) + 360) % 360) - 180;
  return { lat, lon };
}

export function fibonacciPoints(n: number) {
  return Array.from({ length: n }, (_, i) => fibonacciPoint(i, n));
}
