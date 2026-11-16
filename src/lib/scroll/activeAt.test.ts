import { describe, expect, test } from "vitest";
import { activeAt } from "./activeAt";

describe("activeAt", () => {
  test("the last header above the line", () => {
    expect(activeAt(400, [100, 300, 500, 700])).toBe(1);
    expect(activeAt(800, [100, 300, 500, 700])).toBe(3);
  });
  test("a header exactly on the line counts as above", () => {
    expect(activeAt(500, [100, 300, 500, 700])).toBe(2);
  });
  test("0 when none is above", () => {
    expect(activeAt(50, [100, 300, 500, 700])).toBe(0);
    expect(activeAt(50, [])).toBe(0);
  });
  test("ties: the later header wins", () => {
    expect(activeAt(400, [100, 300, 300, 700])).toBe(2);
  });
});
