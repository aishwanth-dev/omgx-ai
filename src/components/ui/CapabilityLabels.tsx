"use client";

import { useLayoutEffect, useRef, useState } from "react";

type Leader = { x1: number; y1: number; x2: number; y2: number };

/** Corner slots, clockwise from the top left. Each label sits in the corner of the box, outside the model's circle. */
const SLOTS = ["tl", "tr", "bl", "br"] as const;

/**
 * Four labels in a ring around the model, each with a straight leader that
 * runs from the label towards the centre and stops on the circle that holds
 * the model. Leaders are radial and sit in four different quadrants, so they
 * never cross each other or the model. Measured once on mount and on resize.
 */
export function CapabilityLabels({
  boxRef,
  labels,
  fill,
  title,
}: {
  boxRef: React.RefObject<HTMLElement | null>;
  labels: readonly string[];
  /** Fraction of the box's shorter side that the model's circle spans. */
  fill: number;
  title: string;
}) {
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => {
      const b = box.getBoundingClientRect();
      const cx = b.width / 2;
      const cy = b.height / 2;
      const r = 0.5 * fill * Math.min(b.width, b.height) * 0.95;
      const next: Leader[] = [];
      itemRefs.current.forEach((li, i) => {
        if (!li) return;
        const p = li.getBoundingClientRect();
        const left = i % 2 === 0;
        // Leader starts at the label's inner side, level with its middle.
        const x1 = (left ? p.right : p.left) - b.left + (left ? 6 : -6);
        const y1 = p.top + p.height / 2 - b.top;
        const dx = cx - x1;
        const dy = cy - y1;
        const len = Math.hypot(dx, dy);
        if (len < r + 14) return;
        next[i] = { x1, y1, x2: cx - (dx / len) * r, y2: cy - (dy / len) * r };
      });
      setLeaders(next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
  }, [boxRef, labels, fill]);

  return (
    <div className="cap-ring">
      <svg className="cap-ring__lines" aria-hidden="true">
        {leaders.map((l, i) =>
          l ? (
            <g key={i}>
              <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} className="cap-ring__line" />
              <circle cx={l.x2} cy={l.y2} r={2.5} className="cap-ring__dot" />
            </g>
          ) : null,
        )}
      </svg>
      <ul className="cap-ring__labels" aria-label={title}>
        {SLOTS.map((slot, i) => (
          <li
            key={slot}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className={`cap-ring__label cap-ring__label--${slot}`}
          >
            <span className="cap-visual__chip">
              <span className="cap-visual__chip-box" aria-hidden="true" />
              {labels[i]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
