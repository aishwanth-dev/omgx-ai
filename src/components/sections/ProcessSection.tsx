"use client";

import { useRef } from "react";
import { processNote, processSteps } from "@/content/company";
import { gsap, useGSAP } from "@/lib/gsap";
import { arrival, coverDepth, processTopIndex, UNITS } from "@/lib/motion/processDeck";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { surfaceAttrs } from "@/lib/surfaces";

const ICONS: Record<string, React.ReactNode> = {
  understand: (
    <g>
      <circle cx="30" cy="30" r="16" />
      <path d="M42 42 L56 56" />
      <circle cx="30" cy="30" r="5" className="pi-accent" />
    </g>
  ),
  research: (
    <g>
      <path d="M8 52 L24 30 L36 40 L56 12" />
      <circle cx="24" cy="30" r="3" className="pi-accent" />
      <circle cx="36" cy="40" r="3" className="pi-accent" />
      <path d="M8 56 H56" strokeDasharray="2 4" />
    </g>
  ),
  design: (
    <g>
      <rect x="8" y="8" width="20" height="20" />
      <rect x="36" y="8" width="20" height="20" />
      <rect x="22" y="38" width="20" height="18" className="pi-accent" />
      <path d="M18 28 V 34 H 32 V 38 M46 28 V 34 H 32" />
    </g>
  ),
  prototype: (
    <g>
      <path d="M32 6 L54 18 V44 L32 56 L10 44 V18 Z" />
      <path d="M10 18 L32 30 L54 18 M32 30 V56" />
      <circle cx="32" cy="30" r="4" className="pi-accent" />
    </g>
  ),
  engineer: (
    <g>
      <circle cx="20" cy="32" r="12" />
      <circle cx="44" cy="32" r="12" className="pi-accent" />
      <path d="M32 32 H32" />
      <path d="M4 32 H8 M56 32 H60" />
    </g>
  ),
};

export function ProcessSection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      // Desktop deck on deck time t = progress × UNITS(n) (design L.1–L.4).
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 900px)", () => {
        const cards = gsap.utils.toArray<HTMLElement>(".process__card", root.current);
        const dims = cards.map((c) => c.querySelector<HTMLElement>(".process__card-dim"));
        const steps = gsap.utils.toArray<HTMLElement>(".process__step", root.current);
        const bigline = root.current!.querySelector<HTMLElement>(".process__bigline");
        const n = cards.length;
        const total = UNITS(n);
        const pose = cards.map((c) => gsap.quickSetter(c, "css") as (v: gsap.TweenVars) => void);
        const dimSet = dims.map((d) => (d ? (gsap.quickSetter(d, "opacity") as (v: number) => void) : null));
        const lineSet = bigline ? (gsap.quickSetter(bigline, "xPercent") as (v: number) => void) : null;
        // CSS parks cards 02–05 with translateY(108%); GSAP would parse that as a fixed y in px and add
        // yPercent on top, leaving them below the clip. Zero x/y so only yPercent positions the cards.
        gsap.set(cards, { x: 0, y: 0, transformPerspective: 1400, transformOrigin: "50% 0%" });

        let top = -1;
        const apply = (t: number) => {
          for (let i = 0; i < n; i++) {
            const a = arrival(i, t);
            const depth = coverDepth(i, t, n);
            const blur = (1 - a) ** 2 * 12 + depth * 1.1;
            pose[i]({
              yPercent: (1 - a) * 108 - depth * 5,
              rotationX: -(1 - a) * 30 + depth * 5,
              scale: 0.9 + 0.1 * a - 0.05 * depth,
              filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none",
            });
            dimSet[i]?.(Math.min(0.6, depth * 0.2));
          }
          lineSet?.((-45 * t) / total);
          const nextTop = processTopIndex(t, n);
          if (nextTop !== top) {
            top = nextTop;
            steps.forEach((s, i) => s.classList.toggle("is-active", i === top));
            cards.forEach((c, i) => {
              const hidden = i > top;
              c.setAttribute("aria-hidden", String(hidden));
              c.inert = hidden;
            });
          }
        };

        const deck = { t: 0 };
        gsap.timeline({
          scrollTrigger: { trigger: ".process__track", start: "top top", end: "bottom bottom", scrub: true },
        }).to(deck, { t: total, duration: total, ease: "none", onUpdate: () => apply(deck.t) });
        apply(0);

        return () => {
          steps.forEach((s, i) => s.classList.toggle("is-active", i === 0));
          cards.forEach((c) => {
            c.removeAttribute("aria-hidden");
            c.inert = false;
          });
          gsap.set([...cards, ...dims.filter(Boolean), bigline].filter(Boolean), { clearProps: "all" });
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="process" {...surfaceAttrs("ink")} aria-labelledby="process-title">
      <div className="process__track">
        <div className="process__stage">
          <div className="process__bigline" aria-hidden="true">
            Understand — Research — Design — Prototype — Engineer &amp; Integrate — Understand — Research —
          </div>
          <div className="container process__inner">
            <div className="process__head">
              <p className="t-utility">How we engineer</p>
              <RevealHeading id="process-title" className="t-display process__title" text="From complex problem to working system." />
              <ol className="process__steps" aria-label="Process stages">
                {processSteps.map((s, i) => (
                  <li key={s.key} className={`process__step${i === 0 ? " is-active" : ""}`}>
                    <span>{s.index}</span> {s.title}
                  </li>
                ))}
              </ol>
              <p className="t-small muted process__note">{processNote}</p>
            </div>
            <ol className="process__cards">
              {processSteps.map((s, i) => (
                <li key={s.key} className="process__card" style={{ zIndex: i + 1, "--i": i } as React.CSSProperties}>
                  <div className="process__card-top">
                    <span className="process__card-index">{s.index}</span>
                    <svg viewBox="0 0 64 64" className="process__icon" aria-hidden="true">
                      {ICONS[s.key]}
                    </svg>
                  </div>
                  <h3 className="t-h3">{s.title}</h3>
                  <p>{s.body}</p>
                  <span className="process__card-dim" aria-hidden="true" />
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
