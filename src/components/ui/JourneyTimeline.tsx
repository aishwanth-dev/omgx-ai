"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useRef, useState } from "react";
import { journey } from "@/content/company";

/**
 * Ring-based engineering-journey timeline. Stages only — no years are shown
 * because no dates have been confirmed for publication.
 */
export function JourneyTimeline() {
  const [active, setActive] = useState(0);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const stage = journey[active];
  const angleFor = (i: number) => -90 + (i / journey.length) * 360;

  const onKey = (e: React.KeyboardEvent) => {
    let next = active;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (active + 1) % journey.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (active - 1 + journey.length) % journey.length;
    else return;
    e.preventDefault();
    setActive(next);
    btns.current[next]?.focus();
  };

  return (
    <div className="journey">
      <div className="journey__ring" aria-hidden="true">
        <svg viewBox="-200 -200 400 400">
          {Array.from({ length: 18 }, (_, i) => (
            <circle
              key={i}
              r={92 + i * 4.2}
              cx={Math.sin(i * 0.7) * 2.2}
              cy={Math.cos(i * 0.9) * 2.2}
              fill="none"
              stroke="currentColor"
              strokeOpacity={i % 3 === 0 ? 0.55 : 0.22}
              strokeWidth={i % 3 === 0 ? 1.4 : 0.8}
            />
          ))}
          <circle r="182" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeDasharray="2 6" />
          {journey.map((_, i) => {
            const a = (angleFor(i) * Math.PI) / 180;
            return <circle key={i} cx={Math.cos(a) * 182} cy={Math.sin(a) * 182} r="4" fill="var(--surface)" stroke="currentColor" />;
          })}
        </svg>
        <div className="journey__orbit" style={{ transform: `rotate(${angleFor(active) + 90}deg)` }}>
          <span className="journey__marker" />
        </div>
      </div>

      <div className="journey__center" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={stage.key}
            id={`${id}-panel`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <p className="t-utility">{stage.label}</p>
            <p className="journey__title">{stage.title}</p>
            <p className="journey__body">{stage.body}</p>
          </motion.div>
        </AnimatePresence>
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
            onClick={() => setActive(i)}
          >
            <span>{String(i + 1).padStart(2, "0")}</span> {j.label}
          </button>
        ))}
      </div>
    </div>
  );
}
