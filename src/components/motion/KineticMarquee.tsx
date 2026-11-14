"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * Oversized horizontal typography tied to scroll position. The track is
 * clipped by an overflow-hidden mask so it never causes page-level horizontal
 * scroll. With reduced motion the rows stay still.
 */
export function KineticMarquee({
  rows,
  label,
  theme = "dark",
}: {
  rows: { text: string; direction: 1 | -1; outline?: boolean }[];
  label: string;
  theme?: "dark" | "light";
}) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".marquee__track", root.current).forEach((track) => {
          const dir = Number(track.dataset.direction) || 1;
          gsap.fromTo(
            track,
            { xPercent: dir > 0 ? 0 : -25 },
            {
              xPercent: dir > 0 ? -25 : 0,
              ease: "none",
              scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.6 },
            },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="marquee" data-theme={theme} aria-label={label}>
      <p className="sr-only">{label}</p>
      {rows.map((row, i) => (
        <div key={i} className={`marquee__row${row.outline ? " marquee__row--outline" : ""}`} aria-hidden="true">
          <div className="marquee__track" data-direction={row.direction}>
            {Array.from({ length: 4 }, (_, k) => (
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
