"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { geographyCopy, locations } from "@/content/company";
import { usePrefersReducedMotion, useWebGL } from "@/lib/device";
import { useInViewState } from "@/lib/useInView";

const GlobeCanvas = dynamic(() => import("@/components/three/GlobeScene"), { ssr: false });

export function GlobalPresenceSection({ headingLevel = 2 }: { headingLevel?: 2 | 3 }) {
  const [active, setActive] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLElement | null)[]>([]);
  const { inView, seen } = useInViewState(ref);
  const webgl = useWebGL();
  const reduced = usePrefersReducedMotion();
  const H = headingLevel === 2 ? "h2" : "h3";

  return (
    <section className="section globe" data-theme="dark" aria-labelledby="globe-title">
      <div className="container globe__inner">
        <div className="globe__copy">
          <p className="t-utility">International engineering experience</p>
          <H id="globe-title" className="t-display globe__title">
            Engineering beyond borders.
          </H>
          <p className="t-lead muted">{geographyCopy}</p>
          <ul className="globe__list" aria-label="Geographies">
            {locations.map((l, i) => (
              <li key={l.key}>
                <button
                  type="button"
                  className="globe__item"
                  aria-pressed={active === i}
                  onClick={() => setActive(active === i ? null : i)}
                >
                  <span className="globe__dot" aria-hidden="true" />
                  <span className="globe__name">{l.name}</span>
                  {l.detail && <span className="globe__detail">{l.detail}</span>}
                </button>
              </li>
            ))}
          </ul>
          <p className="t-small muted globe__note">
            Geographies of the team&apos;s industrial automation and engineering experience. Markers do not indicate
            offices or specific deployments.
          </p>
        </div>
        <div className="globe__visual" ref={ref}>
          {webgl && seen && (
            <>
              <GlobeCanvas locations={locations} active={active} running={inView} reduced={reduced} labels={labels} />
              <div className="globe__labels" aria-hidden="true">
                {locations.map((l, i) => (
                  <span
                    key={l.key}
                    ref={(el) => {
                      labels.current[i] = el;
                    }}
                    className="globe__label"
                  >
                    {l.name}
                  </span>
                ))}
              </div>
            </>
          )}
          {webgl === false && (
            <div className="globe__fallback">
              <svg viewBox="-110 -110 220 220" aria-hidden="true">
                <circle r="100" fill="none" stroke="rgba(165,243,210,.25)" />
                {[30, 60, 90].map((r) => (
                  <ellipse key={r} rx={r} ry="100" fill="none" stroke="rgba(165,243,210,.12)" />
                ))}
                {[-60, -30, 0, 30, 60].map((y) => (
                  <ellipse key={y} cy={y} rx={Math.sqrt(100 * 100 - y * y)} ry="6" fill="none" stroke="rgba(165,243,210,.12)" />
                ))}
              </svg>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
