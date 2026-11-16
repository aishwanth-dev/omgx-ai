import { describe, expect, test } from "vitest";
import { COOLDOWN_MS, buildTemplateParams, cooldownRemaining, markSent } from "./emailjs";

const payload = {
  name: "Asha",
  email: "asha@example.org",
  company: "Acme",
  category: "Not sure yet",
  description: "A description that is long enough.",
  budget: "  ",
  website: "",
};

const memory = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};

describe("buildTemplateParams", () => {
  test("fills blank budget, mirrors the visitor email and stamps IST time", () => {
    const p = buildTemplateParams(payload, new Date("2025-01-15T06:30:00Z"));
    expect(p.budget).toBe("Not specified");
    expect(p.to_email).toBe(payload.email);
    expect(p.reply_to).toBe(payload.email);
    expect(p.time).toMatch(/IST$/);
    expect(p).not.toHaveProperty("website");
  });
});

describe("cooldown", () => {
  test("blocks for 30 s after a send, then allows again", () => {
    const store = memory();
    expect(cooldownRemaining(1000, store)).toBe(0);
    markSent(1000, store);
    expect(cooldownRemaining(1000 + 10_000, store)).toBe(COOLDOWN_MS - 10_000);
    expect(cooldownRemaining(1000 + COOLDOWN_MS, store)).toBe(0);
  });
});
