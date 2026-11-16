"use client";

import { useState } from "react";
import { geographyCopy, locations } from "@/content/company";
import { usePrefersReducedMotion } from "@/lib/device";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { RouteGlobe } from "@/components/globe/RouteGlobe";
import { surfaceAttrs } from "@/lib/surfaces";

/** globe={false} renders the same copy and list as a plain text section (inner pages carry no 3D). */
export function GlobalPresenceSection({ headingLevel = 2, globe = true }: { headingLevel?: 2 | 3; globe?: boolean }) {
  const [active, setActive] = useState<number | null>(null);
  const reduced = usePrefersReducedMotion();
  const H = headingLevel === 2 ? "h2" : "h3";

  return (
    <section className="section globe" {...surfaceAttrs("ink")} aria-labelledby="globe-title">
      <div className={`container globe__inner${globe ? "" : " globe__inner--plain"}`}>
        <div className="globe__copy">
          <p className="t-utility">International engineering experience</p>
          <RevealHeading as={H} id="globe-title" className="t-display globe__title" text="Engineering beyond borders." />
          <p className="t-lead muted">{geographyCopy}</p>
          <ul className="globe__list" aria-label="Geographies">
            {locations.map((l, i) => (
              <li key={l.key}>
                {globe ? (
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
                ) : (
                  <div className="globe__item">
                    <span className="globe__dot" aria-hidden="true" />
                    <span className="globe__name">{l.name}</span>
                    {l.detail && <span className="globe__detail">{l.detail}</span>}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <p className="t-small muted globe__note">
            Geographies of the team&apos;s industrial automation and engineering experience. Markers do not indicate
            offices or specific deployments.
          </p>
        </div>
        {globe && (
          <div className="globe__visual">
            <RouteGlobe locations={locations} originKey="india" active={active} reduced={reduced} />
          </div>
        )}
      </div>
    </section>
  );
}
