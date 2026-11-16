"use client";

import type { VisualKind } from "@/content/projects";
import { SketchFrame, type SketchDef } from "./sketches/kit";
import { leadSketches } from "./sketches/lead";
import { industrialSketches } from "./sketches/industrial";
import { systemsSketches } from "./sketches/systems";
import { digitalSketches } from "./sketches/digital";

/**
 * Animated technical line sketch for a project, product or research entry.
 * A thin dispatcher: each VisualKind's drawing lives in a group file under
 * ./sketches (see kit.tsx for the shared contract).
 */

const SKETCHES: Partial<Record<VisualKind, SketchDef>> = {
  ...leadSketches,
  ...industrialSketches,
  ...systemsSketches,
  ...digitalSketches,
};

/** neutral frame if a kind has no drawing yet */
const FALLBACK: SketchDef = {
  fig: "FIG. · SYSTEM",
  cycle: 4,
  body: () => (
    <g>
      <rect x={60} y={60} width={280} height={170} rx={6} pathLength={1} className="s s--soft d" />
      <path d="M60 90 H 340" pathLength={1} className="s s--soft d" />
    </g>
  ),
};

export function ProjectVisual({
  kind,
  sketch,
  tone = "dark",
  caption = true,
  className,
}: {
  kind: VisualKind;
  /** optional drawing override (e.g. a per-initiative sketch); `kind` is the fallback */
  sketch?: { id: string; def: SketchDef } | null;
  tone?: "dark" | "light";
  caption?: boolean;
  className?: string;
}) {
  const id = sketch?.id ?? kind;
  const def = sketch?.def ?? SKETCHES[kind] ?? FALLBACK;
  return (
    <figure className={`pv pv--${tone}${className ? ` ${className}` : ""}`}>
      <SketchFrame id={id} def={def} tone={tone} variant={caption ? "hero" : "card"} caption={caption} className="pv__svg" />
    </figure>
  );
}
