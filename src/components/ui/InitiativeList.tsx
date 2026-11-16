"use client";

import { initiativeTypeLabels, publicInitiatives, type InitiativeType } from "@/content/initiatives";
import { initiativeSketchFor as sketchFor } from "./sketches/initiatives";
import { SketchFrame } from "./sketches/kit";

const ORDER: InitiativeType[] = ["product", "concept", "research", "other"];

/**
 * Status-separated list of products, concepts and research. Every item carries
 * a type chip; the full list also gives each item an animated sketch.
 */
export function InitiativeList({ compact = false, headingLevel = 3 }: { compact?: boolean; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  const groups = ORDER.map((type) => ({ type, items: publicInitiatives.filter((i) => i.type === type) })).filter(
    (g) => g.items.length > 0,
  );

  return (
    <div className={`initiatives${compact ? " initiatives--compact" : ""}`}>
      {groups.map(({ type, items }) => (
        <section key={type} className="initiatives__group" aria-labelledby={`init-${type}`}>
          <div className="initiatives__group-head">
            <H id={`init-${type}`} className="t-h4">
              {initiativeTypeLabels[type].group}
            </H>
            <p className="t-small muted">{initiativeTypeLabels[type].blurb}</p>
          </div>
          <ul className="initiatives__items">
            {items.map((item) => {
              const top = (
                <div className="initiative__top">
                  <span className="initiative__name">{item.name}</span>
                  <span className="initiative__chips">
                    <span className={`chip${type === "research" ? " chip--accent" : ""}`}>
                      {initiativeTypeLabels[type].label}
                    </span>
                  </span>
                </div>
              );
              const desc = <p className="initiative__desc">{item.description}</p>;
              const sketch = compact ? null : sketchFor(item);
              if (!sketch) {
                return (
                  <li key={item.slug} id={item.slug} className="initiative">
                    {top}
                    {desc}
                  </li>
                );
              }
              return (
                <li key={item.slug} id={item.slug} className="initiative initiative--sketch">
                  <div className="initiative__text">
                    {top}
                    {desc}
                  </div>
                  <div className="initiative__visual" aria-hidden="true">
                    <SketchFrame id={sketch.id} def={sketch.def} tone="light" variant="card" />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
