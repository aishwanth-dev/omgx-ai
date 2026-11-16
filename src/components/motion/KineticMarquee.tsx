"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { MARQUEE_DEFAULTS, stepMarquee, type MarqueeState } from "@/lib/motion/marquee";
import { surfaceAttrs } from "@/lib/surfaces";

type Row = { text: string; direction: 1 | -1; outline?: boolean };

/**
 * Oversized horizontal typography that runs on its own (design J). A single
 * gsap.ticker callback moves each track at a base speed, in the row's
 * direction, and scroll velocity (measured from the Lenis-smoothed position)
 * adds momentum that eases back to base. The loop pauses off-screen and in
 * hidden tabs; with reduced motion the rows stay still.
 */
export function KineticMarquee({ rows, label, theme = "dark" }: { rows: Row[]; label: string; theme?: "dark" | "light" }) {
  const root = useRef<HTMLElement>(null);
  // Copies per row: ceil(viewport / copyWidth) + 1, measured after mount.
  const [copies, setCopies] = useState<number[]>(() => rows.map(() => 2));

  // Measure the first copy of each row (ResizeObserver also catches font swaps).
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => {
      const vw = el.clientWidth || window.innerWidth;
      const next = Array.from(el.querySelectorAll<HTMLElement>(".marquee__track")).map((track) => {
        const first = track.firstElementChild as HTMLElement | null;
        const w = first?.offsetWidth ?? 0;
        return w > 0 ? Math.ceil(vw / w) + 1 : 2;
      });
      setCopies((prev) => (prev.length === next.length && prev.every((c, i) => c === next[i]) ? prev : next));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.querySelectorAll(".marquee__item:first-child").forEach((n) => ro.observe(n));
    measure();
    return () => ro.disconnect();
  }, [rows.length]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tracks = Array.from(el.querySelectorAll<HTMLElement>(".marquee__track"));
    const dirs = tracks.map((t) => (Number(t.dataset.direction) === -1 ? -1 : 1) as 1 | -1);
    const states: MarqueeState[] = tracks.map(() => ({ x: 0, boost: 0 }));
    const setters = tracks.map((t) => gsap.quickSetter(t, "x", "px") as (v: number) => void);
    const widths = () => tracks.map((t) => (t.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0);
    let w = widths();
    let lastY = window.scrollY;
    let lastT = 0;
    let visible = false;
    let running = false;

    const tick = (time: number) => {
      const dt = lastT ? Math.min(0.1, Math.max(0, time - lastT)) : 0;
      lastT = time;
      const y = window.scrollY;
      const v = dt > 0 ? (y - lastY) / dt : 0;
      lastY = y;
      if (dt === 0) return;
      for (let i = 0; i < tracks.length; i++) {
        // Scrolling down pushes each row forward in its own direction; x stays in (−w, 0].
        states[i] = stepMarquee(states[i], dirs[i], dt, v, MARQUEE_DEFAULTS, w[i]);
        setters[i](states[i].x);
      }
    };

    const sync = () => {
      const should = visible && !document.hidden && !mq.matches;
      if (should && !running) {
        lastT = 0;
        lastY = window.scrollY;
        gsap.ticker.add(tick);
        running = true;
      } else if (!should && running) {
        gsap.ticker.remove(tick);
        running = false;
      }
      if (mq.matches) {
        states.forEach((s) => ((s.x = 0), (s.boost = 0)));
        setters.forEach((set) => set(0));
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { rootMargin: "100px 0px" },
    );
    io.observe(el);
    const ro = new ResizeObserver(() => (w = widths()));
    tracks.forEach((t) => t.firstElementChild && ro.observe(t.firstElementChild));
    document.addEventListener("visibilitychange", sync);
    mq.addEventListener("change", sync);
    return () => {
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", sync);
      mq.removeEventListener("change", sync);
      gsap.ticker.remove(tick);
    };
  }, [copies]);

  return (
    <section ref={root} className="marquee" {...surfaceAttrs(theme === "light" ? "mist" : "ink")} aria-label={label}>
      <p className="sr-only">{label}</p>
      {rows.map((row, i) => (
        <div key={i} className={`marquee__row${row.outline ? " marquee__row--outline" : ""}`} aria-hidden="true">
          <div className="marquee__track" data-direction={row.direction}>
            {Array.from({ length: copies[i] ?? 2 }, (_, k) => (
              <span key={k} className="marquee__item">
                {row.text}&nbsp;
              </span>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
