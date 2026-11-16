"use client";

import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";
import "./kit.css";

/**
 * Sketch kit: shared pieces for the animated technical line sketches
 * (CapabilityGlyph and ProjectVisual).
 *
 * CONTRACT (group files code against this API):
 * - Drawings use a 400x300 viewBox and fixed coordinates only (no Math.random
 *   at render), so server and client markup match.
 * - Strokes: className "s" plus modifiers "s--soft", "s--blue", "s--red",
 *   "s--dash". Spread {...DRAW} (pathLength 1, "s d") on a shape to have it
 *   draw in once, delayed by style={dl(seconds)}. "sk-fade" fades in with the
 *   same --d delay. "sk-note" is the tiny mono label, "sk-dot" a small blue dot.
 * - Shared loops: "pulse" (a dash travelling along a pathLength=1 line, add
 *   "pulse--red") and "flash" (a fill that blinks, add "flash--red"). Offset
 *   them inside the cycle with style={lp(seconds)}.
 * - SketchFrame sets data-drawn when the svg first enters view and
 *   data-run="1" while it is in view and the tab is visible ("0" otherwise).
 *   It also sets --loop (seconds before loops start, default 2.2s) and --cyc
 *   (the loop cycle length) on the svg.
 * - Each group file exports `<name>Sketches: Partial<Record<VisualKind, SketchDef>>`.
 *   Kind-specific CSS lives in the group's own CSS file, scoped under
 *   `.sketch--<kind>`, with loops written as (data-run sits on the svg itself)
 *   `.sketch--x.sketch[data-run="1"] .thing
 *   { animation: name var(--cyc) ease calc(var(--loop) + var(--l, 0s)) infinite both; }`.
 *   Off-screen or in a hidden tab, every animation in a .sketch is paused.
 * - Reduced motion: kit.css removes every animation inside .sketch and shows
 *   .d and .sk-fade finished. Elements that are hidden until a loop shows them
 *   should get a static reduced-motion state in the group CSS.
 * - tone "dark" | "light" sets stroke and accent colours; leaving tone unset
 *   inherits currentColor from the parent (used by CapabilityGlyph).
 * - variant "card" hides .sk-note, .sk-dim and the fig title block.
 * - SketchDef.body is a function, so SketchFrame must be rendered from a client
 *   module (CapabilityGlyph and ProjectVisual are "use client").
 */

export type Vars = CSSProperties & Record<`--${string}`, string>;

/** draw-in delay */
export const dl = (s: number): Vars => ({ "--d": `${s}s` });
/** loop delay offset inside the cycle */
export const lp = (s: number): Vars => ({ "--l": `${s}s` });
/** round to 0.1 */
export const r1 = (v: number) => Math.round(v * 10) / 10;

export const DRAW = { pathLength: 1, className: "s d" } as const;

export function Dim({ x1, y1, x2, y2, label, d = 2 }: { x1: number; y1: number; x2: number; y2: number; label: string; d?: number }) {
  const vertical = x1 === x2;
  const tx = vertical ? x1 + 10 : (x1 + x2) / 2;
  const ty = vertical ? (y1 + y2) / 2 : y1 + 12;
  return (
    <g className="sk-dim sk-fade" style={dl(d)}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} className="s s--soft" />
      {vertical ? (
        <>
          <line x1={x1 - 4} y1={y1} x2={x1 + 4} y2={y1} className="s s--soft" />
          <line x1={x1 - 4} y1={y2} x2={x1 + 4} y2={y2} className="s s--soft" />
        </>
      ) : (
        <>
          <line x1={x1} y1={y1 - 4} x2={x1} y2={y1 + 4} className="s s--soft" />
          <line x1={x2} y1={y1 - 4} x2={x2} y2={y1 + 4} className="s s--soft" />
        </>
      )}
      <text x={tx} y={ty} className="sk-note" textAnchor="middle" transform={vertical ? `rotate(90 ${tx} ${ty})` : undefined}>
        {label}
      </text>
    </g>
  );
}

export function Note({ x, y, children, anchor = "start", d = 2 }: { x: number; y: number; children: ReactNode; anchor?: "start" | "middle" | "end"; d?: number }) {
  return (
    <text x={x} y={y} textAnchor={anchor} className="sk-note sk-fade" style={dl(d)}>
      {children}
    </text>
  );
}

export type SketchDef = { fig: string; cycle: number; loop?: number; body: () => ReactNode };

export function SketchFrame({
  id,
  def,
  tone,
  variant = "hero",
  caption = true,
  className,
}: {
  id: string;
  def: SketchDef;
  tone?: "dark" | "light";
  variant?: "hero" | "card";
  caption?: boolean;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const grid = `sk-grid-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let inView = false;
    const sync = () => el.setAttribute("data-run", inView && !document.hidden ? "1" : "0");
    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        if (inView) el.setAttribute("data-drawn", "");
        sync();
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const cls = ["sketch", `sketch--${id}`, `sketch--${variant}`, tone ? `sketch--tone-${tone}` : "", className ?? ""].filter(Boolean).join(" ");

  return (
    <svg
      ref={ref}
      viewBox="0 0 400 300"
      className={cls}
      style={{ "--loop": `${def.loop ?? 2.2}s`, "--cyc": `${def.cycle}s` } as Vars}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id={grid} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0 H 0 V 20" className="sk-gridline" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="400" height="300" fill={`url(#${grid})`} className="sk-grid" />
      {def.body()}
      {caption && variant !== "card" && (
        <g className="sk-title sk-fade" style={dl(1.8)}>
          <line x1={250} y1={282} x2={392} y2={282} className="s s--soft" />
          <text x={392} y={294} textAnchor="end" className="sk-note">
            {def.fig}
          </text>
        </g>
      )}
    </svg>
  );
}
