"use client";

import { useRef } from "react";
import { processNote, processSteps } from "@/content/company";
import { gsap, useGSAP } from "@/lib/gsap";

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
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 900px)", () => {
        const cards = gsap.utils.toArray<HTMLElement>(".process__card", root.current);
        const steps = gsap.utils.toArray<HTMLElement>(".process__step", root.current);
        let current = -1;
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: ".process__track",
            start: "top top",
            end: "bottom bottom",
            scrub: 0.7,
            onUpdate: (self) => {
              const idx = Math.min(cards.length - 1, Math.floor(self.progress * cards.length * 0.999));
              if (idx !== current) {
                current = idx;
                steps.forEach((s, i) => s.classList.toggle("is-active", i === idx));
                cards.forEach((c, i) => c.setAttribute("aria-hidden", String(i > idx)));
              }
            },
          },
        });
        tl.fromTo(".process__bigline", { xPercent: 0 }, { xPercent: -45, duration: 1 }, 0);
        cards.forEach((card, i) => {
          if (i === 0) return;
          const at = (i - 1) / (cards.length - 1);
          tl.fromTo(card, { yPercent: 115, rotation: 3 }, { yPercent: 0, rotation: 0, duration: 0.18, ease: "power2.out" }, at);
          for (let j = 0; j < i; j++) {
            const depth = i - j;
            tl.to(
              cards[j],
              { y: -28 * depth, scale: 1 - 0.05 * depth, filter: `brightness(${1 - 0.18 * depth})`, duration: 0.18, ease: "power2.out" },
              at,
            );
          }
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="process" data-theme="dark" aria-labelledby="process-title">
      <div className="process__track">
        <div className="process__stage">
          <div className="process__bigline" aria-hidden="true">
            Understand — Research — Design — Prototype — Engineer &amp; Integrate — Understand — Research —
          </div>
          <div className="container process__inner">
            <div className="process__head">
              <p className="t-utility">How we engineer</p>
              <h2 id="process-title" className="t-display process__title">
                From complex problem to working system.
              </h2>
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
                <li key={s.key} className="process__card" style={{ zIndex: i + 1 }}>
                  <div className="process__card-top">
                    <span className="process__card-index">{s.index}</span>
                    <svg viewBox="0 0 64 64" className="process__icon" aria-hidden="true">
                      {ICONS[s.key]}
                    </svg>
                  </div>
                  <h3 className="t-h3">{s.title}</h3>
                  <p>{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
