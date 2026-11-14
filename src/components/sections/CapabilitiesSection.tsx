"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useId, useRef, useState } from "react";
import { capabilities } from "@/content/capabilities";
import { useMediaQuery, usePrefersReducedMotion, useWebGL } from "@/lib/device";
import { useInViewState } from "@/lib/useInView";

const CapabilityBandCanvas = dynamic(() => import("@/components/three/CapabilityBand"), { ssr: false });

/** Label anchor positions inside the visual box (percent). Lines run from here to the object. */
const LABEL_POS = [
  { x: 10, y: 14, align: "left" },
  { x: 86, y: 10, align: "right" },
  { x: 6, y: 74, align: "left" },
  { x: 90, y: 84, align: "right" },
] as const;

function BandFallback() {
  return (
    <svg viewBox="-200 -200 400 400" className="cap-visual__fallback" role="img" aria-label="Striped loop illustration">
      {Array.from({ length: 9 }, (_, i) => (
        <path
          key={i}
          d={trefoil(118 + i * 7)}
          fill="none"
          stroke={i % 2 ? "#f4f6f4" : "#0e1416"}
          strokeWidth="5"
        />
      ))}
    </svg>
  );
}

const trefoil = (r: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const th = (i / 120) * Math.PI * 2;
    const rr = r * (1 + 0.16 * Math.cos(3 * th));
    pts.push(`${(rr * Math.cos(th)).toFixed(1)},${(rr * Math.sin(th) * 0.8).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
};

export function CapabilitiesSection() {
  const [active, setActive] = useState(0);
  const visualRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { inView, seen } = useInViewState(visualRef);
  const webgl = useWebGL();
  const reduced = usePrefersReducedMotion();
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  const baseId = useId();
  const cap = capabilities[active];

  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = capabilities.length - 1;
    let next = active;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = active === last ? 0 : active + 1;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = active === 0 ? last : active - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;
    e.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section id="capabilities" className="section caps" data-theme="light" aria-labelledby="caps-title">
      <div className="container">
        <div className="caps__head">
          <div>
            <p className="t-utility">What we do</p>
            <h2 id="caps-title" className="t-display-l caps__title">
              Four disciplines.
              <br />
              One engineering mindset.
            </h2>
          </div>
          <p className="t-lead caps__intro">
            We combine software intelligence with physical engineering. Each discipline stands on its own, and the
            strongest work happens where they meet.
          </p>
        </div>

        <div className="caps__body">
          <div className="cap-visual" ref={visualRef}>
            <div className="cap-visual__canvas">
              {webgl && seen && (
                <CapabilityBandCanvas active={active} running={inView} anchors={lineRefs} reduced={reduced} />
              )}
              {webgl === false && <BandFallback />}
            </div>
            <svg className="cap-visual__lines" aria-hidden="true">
              {LABEL_POS.map((p, i) => (
                <line
                  key={`${active}-${i}`}
                  ref={(el) => {
                    lineRefs.current[i] = el;
                  }}
                  x1={`${p.x}%`}
                  y1={`${p.y}%`}
                  x2="50%"
                  y2="50%"
                  className="cap-visual__line"
                />
              ))}
            </svg>
            <ul className="cap-visual__labels" aria-label={`${cap.shortTitle} focus areas`}>
              {LABEL_POS.map((p, i) => (
                <li
                  key={i}
                  className={`cap-visual__label cap-visual__label--${p.align}`}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={`${active}-${i}`}
                      className="cap-visual__chip"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: 0.05 * i, duration: 0.35 } }}
                      exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                    >
                      <span className="cap-visual__chip-box" aria-hidden="true" />
                      {cap.keywords[i]}
                    </motion.span>
                  </AnimatePresence>
                </li>
              ))}
            </ul>
            <p className="visual-caption cap-visual__caption">Interactive visual · {cap.shortTitle}</p>
          </div>

          <div className="caps__list">
            <div role="tablist" aria-orientation="vertical" aria-label="Capabilities" onKeyDown={onKeyDown}>
              {capabilities.map((c, i) => {
                const selected = i === active;
                return (
                  <div key={c.slug} className={`cap-row${selected ? " is-active" : ""}`}>
                    <button
                      ref={(el) => {
                        tabRefs.current[i] = el;
                      }}
                      type="button"
                      role="tab"
                      id={`${baseId}-tab-${i}`}
                      aria-selected={selected}
                      aria-controls={`${baseId}-panel-${i}`}
                      tabIndex={selected ? 0 : -1}
                      className="cap-row__tab"
                      onClick={() => setActive(i)}
                      // pointermove (not pointerenter) so layout shifts under a resting cursor never change selection.
                      onPointerMove={() => finePointer && i !== active && setActive(i)}
                    >
                      <span className="cap-row__num" aria-hidden="true">
                        {i + 1}
                      </span>
                      <span className="cap-row__title">{c.title}</span>
                    </button>
                    <AnimatePresence initial={false}>
                      {selected && (
                        <motion.div
                          id={`${baseId}-panel-${i}`}
                          role="tabpanel"
                          aria-labelledby={`${baseId}-tab-${i}`}
                          className="cap-row__panel"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <div className="cap-row__panel-inner">
                            <p>{c.intro}</p>
                            <ul className="cap-row__tags">
                              {c.capabilities.slice(0, 5).map((t) => (
                                <li key={t} className="chip">
                                  {t}
                                </li>
                              ))}
                            </ul>
                            <Link href={`/capabilities/${c.slug}`} className="link-arrow">
                              Explore {c.shortTitle} <span className="btn__arrow" aria-hidden="true">→</span>
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
            <Link href="/capabilities" className="btn btn--primary caps__all">
              Explore capabilities <span className="btn__arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
