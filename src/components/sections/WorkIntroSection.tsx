import Link from "next/link";
import type { CSSProperties } from "react";
import { workFilters } from "@/content/projects";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { surfaceAttrs } from "@/lib/surfaces";
import { WorkMotion } from "./WorkMotion";
import "@/app/sections.css";

function Arrow() {
  return (
    <svg className="wk__arrow-svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M4 12h15M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WorkIntroSection() {
  const cats = workFilters.filter((f) => f.key !== "all");

  return (
    <section className="section work-intro wk" {...surfaceAttrs("ink")} aria-labelledby="work-intro-title">
      <WorkMotion />
      <div className="wk__bg" aria-hidden="true">
        <div className="wk__grid-lines" />
        <div className="wk__glow" />
      </div>
      <div className="container wk__layout">
        <div className="wk__head">
          <p className="t-utility wk__eyebrow">
            <span>Work</span>
            <span className="wk__eyebrow-rule" />
            <span>{cats.length} fields</span>
          </p>
          <RevealHeading id="work-intro-title" className="t-display-xl wk__title" text={["Engineering,", "put to work."]} />
          <p className="t-lead wk__lead">
            Explore selected systems and projects across intelligent software, industrial automation, immersive
            technologies and integrated hardware.
          </p>
        </div>
        <ul className="wk__list">
          {cats.map((c, i) => (
            <li key={c.key} className="wk__item" style={{ "--i": i } as CSSProperties}>
              <Link href={`/work?filter=${c.key}`} className="wk__row">
                <span className="wk__name">{c.label}</span>
                <span className="wk__arrow">
                  <Arrow />
                </span>
                <span className="wk__rule" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
        <div className="wk__cta">
          <Link href="/work" className="btn btn--primary">
            Explore our work <span className="btn__arrow" aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
