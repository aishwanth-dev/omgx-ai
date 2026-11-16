"use client";

import { useId, useRef } from "react";
import { JourneyRing } from "@/components/three/JourneyRing";
import { journey } from "@/content/company";
import { usePrefersReducedMotion } from "@/lib/device";
import { useTrackIndex } from "@/lib/scroll/useTrackIndex";
import "@/app/scenes.css";
import "@/app/about.css";

/**
 * The homepage About block: the story copy on the left, the ring and the
 * engineering-journey stages on the right, as one two-column grid. Stages
 * only: no years are shown because no dates have been confirmed.
 *
 * With motion allowed the right column is a scroll track (4 × 50svh on
 * desktop, 4 × 40svh on phones). The ring stays pinned while the scroll
 * position picks the stage, 1 → 4, straight from `indexFromProgress`; the
 * copy column is pinned alongside it on desktop. The next section follows
 * the moment the track ends. The stage buttons and the arrow keys scroll to
 * a stage's segment. With reduced motion the poster and all four stages are
 * listed.
 */
export function JourneyTimeline({ children }: { children?: React.ReactNode }) {
  const n = journey.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const reduced = usePrefersReducedMotion();
  const tracked = !reduced;
  const [active, select] = useTrackIndex(trackRef, n, tracked);
  const stage = journey[active];

  const onKey = (e: React.KeyboardEvent) => {
    let next = active;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (active + 1) % n;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (active - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    else return;
    e.preventDefault();
    select(next);
    btns.current[next]?.focus({ preventScroll: true });
  };

  if (reduced) {
    return (
      <div className="about-home__grid">
        <div className="about-home__story">{children}</div>
        <div className="journey journey--static">
          <div className="journey__ring" aria-hidden="true">
            <JourneyRing cursor={-1} stages={n} />
          </div>
          <ol className="journey__list">
            {journey.map((j, i) => (
              <li key={j.key} className="journey__item">
                <p className="t-utility">
                  {String(i + 1).padStart(2, "0")} · {j.label}
                </p>
                <p className="journey__title">{j.title}</p>
                <p className="journey__body">{j.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="about-home__grid is-tracked">
      <div className="about-home__story">{children}</div>
      <div className="journey-track is-tracked" ref={trackRef}>
        <div className="journey">
          <div className="journey__ring" aria-hidden="true">
            <JourneyRing cursor={active} stages={n} />
          </div>

          <div className="journey__center" aria-live="polite">
            <div key={stage.key} id={`${id}-panel`} className="journey__stage">
              <p className="t-utility">
                <span className="journey__num">{String(active + 1).padStart(2, "0")}</span> · {stage.label}
              </p>
              <p className="journey__title">{stage.title}</p>
              <p className="journey__body">{stage.body}</p>
            </div>
          </div>

          <div className="journey__controls" role="group" aria-label="Journey stages" onKeyDown={onKey}>
            {journey.map((j, i) => (
              <button
                key={j.key}
                ref={(el) => {
                  btns.current[i] = el;
                }}
                type="button"
                className="journey__btn"
                aria-pressed={active === i}
                aria-controls={`${id}-panel`}
                onClick={() => select(i)}
              >
                <span>{String(i + 1).padStart(2, "0")}</span> {j.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
