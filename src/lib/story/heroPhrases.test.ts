import { describe, expect, test } from "vitest";
import { HERO_ACCESSIBLE_NAME, HERO_PHRASES, HERO_STATIC, LOOP_SECONDS, PHRASE_SECONDS } from "./heroPhrases";

describe("hero phrases", () => {
  test("the accessible name is the original headline", () => {
    expect(HERO_ACCESSIBLE_NAME).toBe("Think beyond. Engineer what's next.");
    expect(HERO_STATIC).toBe("Think beyond");
  });

  test("six approved phrases, the first one is the static fallback", () => {
    expect(HERO_PHRASES).toHaveLength(6);
    expect(HERO_PHRASES[0]).toBe("Engineer what's next.");
    expect(new Set(HERO_PHRASES).size).toBe(6);
  });

  test("the loop is one slot per phrase", () => {
    expect(PHRASE_SECONDS).toBe(2.4);
    expect(LOOP_SECONDS).toBeCloseTo(14.4, 6);
  });
});
