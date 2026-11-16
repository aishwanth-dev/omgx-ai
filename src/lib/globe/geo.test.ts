import fc from "fast-check";
import type { FeatureCollection } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { describe, expect, test } from "vitest";
import world from "world-atlas/countries-110m.json";
import { countryAt, fibonacciPoint as geoPoint, pointInPolygon, prepareCountries } from "../../../scripts/lib/geo.mjs";
import { fibonacciPoint } from "./fibonacci";

const topo = world as unknown as Topology<{ countries: GeometryCollection }>;
const countries = feature(topo, topo.objects.countries) as FeatureCollection;
const prepared = prepareCountries(countries.features);
const at = (lon: number, lat: number) => countryAt(prepared, lon, lat);

describe("geo: country lookup on world-atlas 110m", () => {
  test("78° E 21° N is India (356)", () => expect(at(78, 21)).toBe(356));
  test("Jakarta is Indonesia (360)", () => expect(at(106.85, -6.21)).toBe(360));
  test("Nairobi is Kenya (404)", () => expect(at(36.82, -1.29)).toBe(404));
  test("the mid-Atlantic is no country", () => expect(at(-30, 0)).toBeNull());
  test("Maseru is Lesotho (426), not South Africa (710)", () => expect(at(27.48, -29.31)).toBe(426));
});

describe("geo: fibonacci.ts matches geo.mjs", () => {
  test("first 2,000 points of N = 18,000 are identical", () => {
    for (let i = 0; i < 2000; i++) expect(fibonacciPoint(i, 18000)).toEqual(geoPoint(i, 18000));
  });
});

/** **Validates: Requirements 2.20** (Property 14) */
describe("Property 14: point-in-polygon with holes", () => {
  // A 10 × 10 square with a 4 × 4 hole in the middle.
  const square = [
    [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ],
    [
      [3, 3],
      [7, 3],
      [7, 7],
      [3, 7],
      [3, 3],
    ],
  ];
  test("points inside a hole are outside the polygon; points in the ring are inside", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 3.01, max: 6.99, noNaN: true }),
        fc.double({ min: 3.01, max: 6.99, noNaN: true }),
        fc.double({ min: 0.01, max: 2.99, noNaN: true }),
        (x, y, edge) => {
          expect(pointInPolygon(x, y, square)).toBe(false);
          expect(pointInPolygon(edge, y, square)).toBe(true);
          expect(pointInPolygon(x, 10 - edge, square)).toBe(true);
        },
      ),
      { numRuns: 200 },
    );
  });
});
