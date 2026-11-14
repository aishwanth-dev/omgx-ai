"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/** Only documented, project-specific technical facts from the company profile. */
const FACTS = [
  {
    value: "18",
    caption: "DC nutrunners connected to a wireless data-acquisition system",
    project: "Bosch — Wireless Factory Floor Data Acquisition",
    slug: "bosch-wireless-nutrunner-monitoring",
    tone: "matcha",
  },
  {
    value: "~600 m",
    caption: "Approximate coverage area stated for that wireless system",
    project: "Bosch — Wireless Factory Floor Data Acquisition",
    slug: "bosch-wireless-nutrunner-monitoring",
    tone: "paper",
  },
  {
    value: "5 + 5",
    caption: "Hydraulic servo valves and LVDT feedback channels",
    project: "TVS Motor Company — Weld Frame Rectification",
    slug: "tvs-weld-frame-rectification",
    tone: "paper",
  },
  {
    value: "OK / NOK",
    caption: "Production status identification with timestamped events",
    project: "Ashok Leyland — H-Engine Assembly Line SCADA",
    slug: "ashok-leyland-h-engine-scada",
    tone: "ink",
  },
  {
    value: "Cp / Cpk",
    caption: "Statistical analysis of production and failure data",
    project: "Bosch — Wireless Factory Floor Data Acquisition",
    slug: "bosch-wireless-nutrunner-monitoring",
    tone: "paper",
  },
  {
    value: "RTSP",
    caption: "Live streaming from in-bus Wi-Fi IP cameras to a central data centre",
    project: "BMTC — Mobile Video Surveillance (proof of concept)",
    slug: "bmtc-mobile-video-surveillance",
    tone: "mint",
  },
] as const;

export function ProofCardsSection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 900px)", () => {
        const cards = gsap.utils.toArray<HTMLElement>(".proof__card-motion", root.current);
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: ".proof__track", start: "top top", end: "bottom bottom", scrub: 0.8 },
        });
        cards.forEach((card, i) => {
          const fromZ = -900 - i * 120;
          tl.fromTo(
            card,
            { z: fromZ, rotationX: 18 - i * 4, rotationY: i % 2 ? -28 : 24, autoAlpha: 0 },
            { z: 0, rotationX: 0, rotationY: i % 2 ? -6 : 5, autoAlpha: 1, duration: 0.45, ease: "power2.out" },
            i * 0.07,
          );
          tl.to(card, { y: -60 - i * 14, rotationY: i % 2 ? 4 : -4, duration: 0.45 }, 0.55);
        });
        tl.fromTo(".proof__spline", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.8, stagger: 0.05 }, 0);
        tl.fromTo(".proof__glow", { opacity: 0.2, scale: 0.7 }, { opacity: 1, scale: 1.15, duration: 1 }, 0);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="proof" data-theme="dark" aria-labelledby="proof-title">
      <div className="proof__track">
        <div className="proof__stage">
          <div className="proof__glow" aria-hidden="true" />
          <svg className="proof__splines" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
            {[
              "M-20 300 C 300 230, 600 120, 900 210 S 1400 380, 1620 260",
              "M-20 520 C 340 600, 700 380, 1000 470 S 1400 640, 1620 560",
              "M-20 760 C 300 700, 640 820, 980 720 S 1360 600, 1620 700",
            ].map((d, i) => (
              <path key={i} className="proof__spline" d={d} pathLength={1} strokeDasharray="1 1" />
            ))}
          </svg>

          <div className="container proof__inner">
            <div className="proof__head">
              <p className="t-utility">Selected engineering evidence</p>
              <h2 id="proof-title" className="t-display proof__title">
                What the systems do.
              </h2>
              <p className="proof__note t-small">
                Project-specific technical facts from documented work. They describe individual systems, not
                company-wide statistics.
              </p>
            </div>

            <ul className="proof__cards">
              {FACTS.map((f, i) => (
                <li key={i} className={`proof__slot proof__slot--${i}`}>
                  <div className="proof__card-motion">
                    <Link href={`/work/${f.slug}`} className={`proof__card proof__card--${f.tone}`}>
                      <span className="proof__value">{f.value}</span>
                      <span className="proof__caption">{f.caption}</span>
                      <span className="proof__project t-utility">{f.project} →</span>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
