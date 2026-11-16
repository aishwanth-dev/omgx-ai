import { describe, expect, test } from "vitest";
import { getProject } from "./projects";
import { FACTS } from "./proof";

/** v1 FACTS from `git show 70a17a7:src/components/sections/ProofCardsSection.tsx` (3.1, 3.6). */
const V1_FACTS = [
  ["18", "DC nutrunners connected to a wireless data-acquisition system", "Bosch — Wireless Factory Floor Data Acquisition", "bosch-wireless-nutrunner-monitoring"],
  ["~600 m", "Approximate coverage area stated for that wireless system", "Bosch — Wireless Factory Floor Data Acquisition", "bosch-wireless-nutrunner-monitoring"],
  ["5 + 5", "Hydraulic servo valves and LVDT feedback channels", "TVS Motor Company — Weld Frame Rectification", "tvs-weld-frame-rectification"],
  ["OK / NOK", "Production status identification with timestamped events", "Ashok Leyland — H-Engine Assembly Line SCADA", "ashok-leyland-h-engine-scada"],
  ["Cp / Cpk", "Statistical analysis of production and failure data", "Bosch — Wireless Factory Floor Data Acquisition", "bosch-wireless-nutrunner-monitoring"],
  ["RTSP", "Live streaming from in-bus Wi-Fi IP cameras to a central data centre", "BMTC — Mobile Video Surveillance (proof of concept)", "bmtc-mobile-video-surveillance"],
];

describe("proof facts", () => {
  test("the six facts, their order and project targets equal v1", () => {
    expect(FACTS.map((f) => [f.value, f.caption, f.project, f.slug])).toEqual(V1_FACTS);
  });

  test("every fact links to a documented project", () => {
    for (const f of FACTS) expect(getProject(f.slug), f.slug).toBeDefined();
  });
});
