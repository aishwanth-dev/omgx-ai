"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ProjectVisual } from "@/components/ui/ProjectVisual";
import { featuredProjectSlugs, getProject, type Project } from "@/content/projects";

export function ProjectShowcaseSection() {
  const featured = featuredProjectSlugs.map((s) => getProject(s)).filter(Boolean) as Project[];
  const [active, setActive] = useState(0);
  const current = featured[active];

  return (
    <section className="section showcase" data-theme="dark" aria-labelledby="showcase-title">
      <div className="container">
        <div className="showcase__head">
          <div>
            <p className="t-utility">Featured case studies</p>
            <h2 id="showcase-title" className="t-display">
              Selected projects.
            </h2>
          </div>
          <div>
            <p className="t-lead muted showcase__intro">
              Five documented systems, from engine assembly lines to underwater monitoring. Hover or focus a project to
              preview it.
            </p>
            <Link href="/work" className="link-arrow" style={{ marginTop: 20 }}>
              View all work <span className="btn__arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="showcase__body">
          <div className="showcase__visual" aria-hidden="true">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={current.slug}
                className="showcase__visual-inner"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <ProjectVisual kind={current.visual} tone="dark" />
                <p className="showcase__visual-label t-utility">{current.category}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <ol className="showcase__list">
            {featured.map((p, i) => (
              <li key={p.slug}>
                <Link
                  href={`/work/${p.slug}`}
                  className={`showcase__item${i === active ? " is-active" : ""}`}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                >
                  <span className="showcase__num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="showcase__text">
                    <span className="showcase__client t-utility">{p.client?.split(",")[0]}</span>
                    <span className="showcase__title t-h3">{p.title}</span>
                    <span className="showcase__meta">
                      <span className="chip">{p.category}</span>
                      {p.status && <span className="chip chip--accent">{p.status}</span>}
                    </span>
                    <span className="showcase__summary">{p.summary.split(". ")[0].replace(/\.$/, "")}.</span>
                    <span className="showcase__mobile-visual">
                      <ProjectVisual kind={p.visual} tone="dark" />
                    </span>
                  </span>
                  <span className="showcase__cta t-utility">
                    View project <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
