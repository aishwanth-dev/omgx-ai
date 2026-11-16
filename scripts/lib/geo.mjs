// Build-time geography helpers for the land-dot globe. Plain ESM so build scripts
// can use it without a TypeScript step. Must match src/lib/globe/fibonacci.ts.

const GOLDEN_DEG = 180 * (3 - Math.sqrt(5)); // ≈ 137.508°

/** Fibonacci-sphere point i of n, in degrees. */
export function fibonacciPoint(i, n) {
  const y = 1 - (2 * (i + 0.5)) / n;
  const lat = (Math.asin(y) * 180) / Math.PI;
  const lon = ((((i * GOLDEN_DEG) % 360) + 360) % 360) - 180;
  return { lat, lon };
}

export function fibonacciPoints(n) {
  return Array.from({ length: n }, (_, i) => fibonacciPoint(i, n));
}

/** Ray-casting point-in-ring test; ring is an array of [lon, lat]. */
export function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Polygon = [outer, ...holes]. Inside the outer ring and outside every hole. */
export function pointInPolygon(lon, lat, polygon) {
  if (!polygon.length || !pointInRing(lon, lat, polygon[0])) return false;
  for (let h = 1; h < polygon.length; h++) if (pointInRing(lon, lat, polygon[h])) return false;
  return true;
}

/** Polygons of a GeoJSON geometry (Polygon or MultiPolygon). */
export function polygonsOf(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  return [];
}

function bboxOf(polygon) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of polygon[0]) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY];
}

/**
 * Prepares features for repeated lookups: numeric ids, polygons and a bounding
 * box per polygon for the prefilter. Features without an id are skipped.
 */
export function prepareCountries(features) {
  const out = [];
  for (const f of features) {
    if (f.id == null) continue;
    const id = Number(f.id);
    for (const polygon of polygonsOf(f.geometry)) out.push({ id, polygon, bbox: bboxOf(polygon) });
  }
  return out;
}

/** Numeric country id at a point, or null over the sea. */
export function countryAt(prepared, lon, lat) {
  for (const { id, polygon, bbox } of prepared) {
    if (lon < bbox[0] || lon > bbox[2] || lat < bbox[1] || lat > bbox[3]) continue;
    if (pointInPolygon(lon, lat, polygon)) return id;
  }
  return null;
}
