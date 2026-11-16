"use client";

import { useEffect, useRef } from "react";

/**
 * Drives the Work section's motion without owning its markup: adds `is-in` to the
 * enclosing section once it is on screen (the rows then reveal one after another)
 * and writes the scroll progress to --wk-p for the moving grid and glow.
 * Under reduced motion nothing is written, so the section shows its final state.
 */
export function WorkMotion() {
  const mark = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = mark.current?.closest("section");
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { threshold: 0.18 },
    );
    io.observe(el);

    let raf = 0;
    let visible = true;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      el.style.setProperty("--wk-p", p.toFixed(4));
    };
    const onScroll = () => {
      if (visible && !raf) raf = requestAnimationFrame(update);
    };
    const vio = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible) onScroll();
    });
    vio.observe(el);
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io.disconnect();
      vio.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <span ref={mark} hidden />;
}
