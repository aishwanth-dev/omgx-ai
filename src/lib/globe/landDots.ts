/** Decodes the build-time land-dot data (land-dots.data.ts) into point indices and unit vectors. */
import { fibonacciPoint } from "./fibonacci";
import { LAND_DOTS } from "./land-dots.data";
import { toVec } from "./math";

export type DotCount = keyof typeof LAND_DOTS;
export type HighlightKey = keyof (typeof LAND_DOTS)[DotCount]["highlight"];

/** Indices of the set bits in a base64 bitset. */
export function decodeBitset(b64: string): number[] {
  const bin = atob(b64);
  const out: number[] = [];
  for (let b = 0; b < bin.length; b++) {
    const byte = bin.charCodeAt(b);
    if (!byte) continue;
    for (let k = 0; k < 8; k++) if (byte & (1 << k)) out.push(b * 8 + k);
  }
  return out;
}

/** Running sum of a delta-encoded list. */
export function decodeDeltas(deltas: readonly number[]): number[] {
  const out: number[] = [];
  let v = 0;
  for (const d of deltas) out.push((v += d));
  return out;
}

export const landIndices = (n: DotCount) => decodeBitset(LAND_DOTS[n].land);

export const highlightIndices = (n: DotCount, key: HighlightKey) => decodeDeltas(LAND_DOTS[n].highlight[key]);

export const isHighlightKey = (key: string): key is HighlightKey => key in LAND_DOTS[18000].highlight;

/** Packed xyz unit vectors for the given point indices. */
export function dotVectors(indices: readonly number[], n: number): Float32Array {
  const out = new Float32Array(indices.length * 3);
  indices.forEach((i, k) => {
    const { lat, lon } = fibonacciPoint(i, n);
    out.set(toVec(lat, lon), k * 3);
  });
  return out;
}
