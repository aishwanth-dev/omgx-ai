import fc from "fast-check";
import { describe, expect, test } from "vitest";
import { facing, project, rotate, slerp, toVec, type Vec3 } from "./math";

const norm = (v: Vec3) => Math.hypot(v[0], v[1], v[2]);
const close = (a: Vec3, b: Vec3, eps = 1e-9) => a.every((x, i) => Math.abs(x - b[i]) < eps);

describe("globe math", () => {
  test("toVec axes", () => {
    expect(close(toVec(0, 0), [0, 0, 1])).toBe(true);
    expect(close(toVec(90, 0), [0, 1, 0])).toBe(true);
    expect(close(toVec(0, 90), [1, 0, 0])).toBe(true);
  });
  test("facing brings India (21° N, 78° E) to the front centre", () => {
    const f = facing(21, 78);
    const v = rotate(toVec(21, 78), f.yaw, f.pitch);
    expect(close(v, [0, 0, 1], 1e-9)).toBe(true);
    const p = project(v, 200, 200, 100);
    expect(p.visible).toBe(true);
    expect(p.x).toBeCloseTo(200, 6);
    expect(p.y).toBeCloseTo(200, 6);
  });
  test("the far side is not visible", () => {
    expect(project(toVec(0, 180), 0, 0, 1).visible).toBe(false);
  });
});

/** **Validates: Requirements 2.20** (Property 14) */
describe("Property 14: globe geometry", () => {
  const lat = fc.double({ min: -90, max: 90, noNaN: true });
  const lon = fc.double({ min: -180, max: 180, noNaN: true });
  const ang = fc.double({ min: -10, max: 10, noNaN: true });

  test("unit norms, slerp endpoints and norm-preserving rotation", () => {
    fc.assert(
      fc.property(lat, lon, lat, lon, ang, ang, fc.double({ min: 0, max: 1, noNaN: true }), (la1, lo1, la2, lo2, yaw, pitch, t) => {
        const a = toVec(la1, lo1);
        const b = toVec(la2, lo2);
        expect(norm(a)).toBeCloseTo(1, 9);
        expect(norm(rotate(a, yaw, pitch))).toBeCloseTo(1, 9);
        expect(close(slerp(a, b, 0), a, 1e-7)).toBe(true);
        // Antipodal endpoints have no unique great circle; skip the t = 1 check there.
        const d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
        if (d > -0.999999) {
          expect(close(slerp(a, b, 1), b, 1e-6)).toBe(true);
          expect(norm(slerp(a, b, t))).toBeCloseTo(1, 6);
        }
      }),
      { numRuns: 200 },
    );
  });
});
