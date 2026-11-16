"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

/** Normalised control points (x across the width, y down the stage height; y > 1 enters as the page scrolls). */
const LINES = [
  { pts: [[-0.05, 0.2], [0.2, 0.12], [0.5, 0.22], [0.8, 0.1], [1.05, 0.18]], color: "#4f7cff", width: 1.2, alpha: 0.5, speed: 0.08, glow: true },
  { pts: [[-0.05, 0.36], [0.25, 0.47], [0.5, 0.31], [0.78, 0.41], [1.05, 0.22]], color: "#ffffff", width: 1, alpha: 0.3, speed: 0.14, glow: false },
  { pts: [[-0.05, 0.6], [0.3, 0.53], [0.5, 0.65], [0.7, 0.56], [1.05, 0.63]], color: "#ffffff", width: 0.9, alpha: 0.22, speed: 0.2, glow: false },
  { pts: [[-0.05, 0.8], [0.18, 0.64], [0.42, 0.72], [0.66, 0.5], [1.05, 0.57]], color: "#4f7cff", width: 1.3, alpha: 0.55, speed: 0.28, glow: true },
  { pts: [[-0.05, 0.93], [0.3, 0.83], [0.55, 0.96], [0.8, 0.79], [1.05, 0.87]], color: "#ffffff", width: 0.9, alpha: 0.26, speed: 0.4, glow: false },
  { pts: [[-0.05, 1.1], [0.25, 1.0], [0.5, 1.15], [0.75, 0.98], [1.05, 1.05]], color: "#ff6b7d", width: 1.1, alpha: 0.4, speed: 0.55, glow: true },
  { pts: [[-0.05, 1.3], [0.3, 1.22], [0.6, 1.34], [1.05, 1.18]], color: "#ffffff", width: 0.9, alpha: 0.2, speed: 0.75, glow: false },
] as const;

type Pt = readonly [number, number];

/** Catmull-Rom through the points, as a cubic Bezier path in pixel space. */
const toPath = (pts: readonly Pt[], w: number, h: number) => {
  const P = pts.map(([x, y]) => [x * w, y * h] as const);
  let d = `M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)];
    const p1 = P[i];
    const p2 = P[i + 1];
    const p3 = P[Math.min(P.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
};

const smooth = (v: number) => {
  const x = Math.min(1, Math.max(0, v));
  return x * x * (3 - 2 * x);
};

/**
 * Thin white and matcha curves behind the story. They draw with the scroll, drift
 * upward at different speeds (parallax), and carry a brighter travelling head. The
 * soft glow is a wider, fainter copy of the stroke, so no CSS filter runs per frame.
 * Nothing is drawn at progress 0; reduced motion shows them fully drawn and still, below the first screen (hero.css).
 */
export function ScrollLines({ progress, reduced }: { progress: React.RefObject<number>; reduced: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const groups = useRef<(SVGGElement | null)[]>([]);
  const bases = useRef<(SVGPathElement | null)[]>([]);
  const glows = useRef<(SVGPathElement | null)[]>([]);
  const heads = useRef<(SVGPathElement | null)[]>([]);
  const lengths = useRef<number[]>([]);
  const [size, setSize] = useState({ w: 1440, h: 900 });
  const last = useRef(-1);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setSize((s) => (s.w === Math.round(r.width) && s.h === Math.round(r.height) ? s : { w: Math.round(r.width), h: Math.round(r.height) }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const paths = useMemo(() => LINES.map((l) => toPath(l.pts, size.w, size.h)), [size]);

  useEffect(() => {
    lengths.current = bases.current.map((p) => p?.getTotalLength() ?? 1);
    last.current = -1;

    // Nothing is drawn at progress 0. Line i starts at START(i) and takes SPAN of progress to draw;
    // its bright head rides the drawing front, then keeps circling once the line is complete.
    const START = (i: number) => 0.006 + 0.017 * i;
    const SPAN = 0.2;
    const apply = (p: number, fixed = false) => {
      const fade = 1 - smooth((p - 0.8) / 0.1);
      if (host.current) host.current.style.opacity = String(fade);
      LINES.forEach((l, i) => {
        const L = lengths.current[i] || 1;
        const draw = fixed ? 1 : smooth((p - START(i)) / SPAN);
        const g = groups.current[i];
        if (g) g.setAttribute("display", draw <= 0.001 ? "none" : "inline");
        if (draw <= 0.001) return;
        const head = fixed ? 0.55 : draw < 1 ? draw : (((p - START(i) - SPAN) * (1.2 + 0.2 * i)) % 1 + 1) % 1;
        const dash = `${L} ${L + 2}`;
        const off = String(L * (1 - draw));
        for (const el of [bases.current[i], glows.current[i]]) {
          if (!el) continue;
          el.setAttribute("stroke-dasharray", dash);
          el.setAttribute("stroke-dashoffset", off);
        }
        const hd = heads.current[i];
        if (hd) {
          const hl = Math.max(30, L * 0.06);
          hd.setAttribute("stroke-dasharray", `${hl} ${L * 2}`);
          hd.setAttribute("stroke-dashoffset", String(hl - head * L));
          const lead = draw < 1 ? Math.min(1, draw * 14) * Math.min(1, (1 - draw) * 10) : Math.min(1, head * 8) * Math.min(1, (1 - head) * 8);
          hd.style.opacity = fixed ? "0.45" : String(0.95 * lead);
        }
        g?.setAttribute(
          "transform",
          fixed
            ? "translate(0 0)"
            : `translate(${((i % 2 ? 1 : -1) * p * l.speed * 0.12 * size.w).toFixed(1)} ${(-p * l.speed * size.h * 0.9).toFixed(1)})`,
        );
      });
    };
    if (reduced) {
      apply(0.3, true);
      return;
    }
    const tick = () => {
      const p = progress.current ?? 0;
      if (p === last.current) return;
      last.current = p;
      apply(p);
    };
    tick();
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [paths, progress, reduced, size]);

  return (
    <div ref={host} className="story__lines" aria-hidden="true">
      <svg width="100%" height="100%" viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="none" fill="none">
        {LINES.map((l, i) => (
          <g key={i} ref={(el) => { groups.current[i] = el; }}>
            {l.glow && (
              <path ref={(el) => { glows.current[i] = el; }} d={paths[i]} stroke={l.color} strokeWidth={l.width * 6} strokeOpacity={l.alpha * 0.16} strokeLinecap="round" />
            )}
            <path ref={(el) => { bases.current[i] = el; }} d={paths[i]} stroke={l.color} strokeWidth={l.width} strokeOpacity={l.alpha} strokeLinecap="round" />
            <path ref={(el) => { heads.current[i] = el; }} d={paths[i]} stroke={l.color === "#ffffff" ? "#e9efff" : "#c9d8ff"} strokeWidth={l.width * 2.2} strokeLinecap="round" />
          </g>
        ))}
      </svg>
    </div>
  );
}
