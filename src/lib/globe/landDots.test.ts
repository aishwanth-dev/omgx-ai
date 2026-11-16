import fc from "fast-check";
import type { FeatureCollection } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { describe, expect, test } from "vitest";
import world from "world-atlas/countries-110m.json";
import { countryAt, fibonacciPoint, prepareCountries } from "../../../scripts/lib/geo.mjs";
import { decodeBitset, decodeDeltas, highlightIndices, landIndices, type HighlightKey } from "./landDots";

const topo = world as unknown as Topology<{ countries: GeometryCollection }>;
const prepared = prepareCountries((feature(topo, topo.objects.countries) as FeatureCollection).features);

describe("land-dots data decodes to the geo.mjs result (N = 18,000)", () => {
  const N = 18000;
  const ids: Record<string, number> = { india: 356, vietnam: 704, china: 156, indonesia: 360, kenya: 404 };
  const land: number[] = [];
  const byKey: Record<string, number[]> = Object.fromEntries(Object.keys(ids).map((k) => [k, []]));
  for (let i = 0; i < N; i++) {
    const { lon, lat } = fibonacciPoint(i, N);
    const id = countryAt(prepared, lon, lat);
    if (id == null) continue;
    land.push(i);
    for (const [k, v] of Object.entries(ids)) if (v === id) byKey[k].push(i);
  }

  test("land indices match", () => expect(landIndices(N)).toEqual(land));
  test.each(Object.keys(ids) as HighlightKey[])("%s highlight list matches", (key) =>
    expect(highlightIndices(N, key)).toEqual(byKey[key]),
  );
  test("highlight lists are non-trivial", () => {
    expect(byKey.india.length).toBeGreaterThan(50);
    expect(byKey.china.length).toBeGreaterThan(byKey.india.length);
  });
});

/** **Validates: Requirements 2.20** (Property 14) */
describe("Property 14: land-dot encodings round-trip", () => {
  const sortedSet = fc.uniqueArray(fc.integer({ min: 0, max: 2047 }), { maxLength: 300 }).map((a) => a.sort((x, y) => x - y));
  test("a bitset of any index set decodes to the same set", () => {
    fc.assert(
      fc.property(sortedSet, (set) => {
        const bytes = new Uint8Array(256);
        for (const i of set) bytes[i >> 3] |= 1 << (i & 7);
        expect(decodeBitset(Buffer.from(bytes).toString("base64"))).toEqual(set);
      }),
    );
  });
  test("delta decoding inverts delta encoding", () => {
    fc.assert(
      fc.property(sortedSet, (set) => {
        expect(decodeDeltas(set.map((v, k) => (k ? v - set[k - 1] : v)))).toEqual(set);
      }),
    );
  });
});
