"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { capabilities, customRnd } from "@/content/capabilities";
import { workFilters } from "@/content/projects";

export type MegaKey = "capabilities" | "work";

export function MegaMenu({ which, onNavigate }: { which: MegaKey; onNavigate: () => void }) {
  return (
    <motion.div
      id={`mega-${which}`}
      className="mega"
      initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
      animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
      exit={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="container mega__inner">
        {which === "capabilities" ? (
          <>
            <div className="mega__intro">
              <p className="t-utility" style={{ color: "var(--omgx-mint)" }}>
                Four disciplines
              </p>
              <p>{customRnd.title} runs across all four.</p>
              <Link href="/capabilities" className="link-arrow" style={{ marginTop: 24 }} onClick={onNavigate}>
                All capabilities <span className="btn__arrow" aria-hidden="true">→</span>
              </Link>
            </div>
            <ul className="mega__grid">
              {capabilities.map((c) => (
                <li key={c.slug} style={{ display: "contents" }}>
                  <Link href={`/capabilities/${c.slug}`} className="mega__item" onClick={onNavigate}>
                    <span className="mega__item-index">{c.index}</span>
                    <span className="mega__item-title">{c.title}</span>
                    <span className="mega__item-body">{c.positioning}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <div className="mega__intro">
              <p className="t-utility" style={{ color: "var(--omgx-mint)" }}>
                Engineering, put to work
              </p>
              <p>Systems and projects across software, machines and immersive technology.</p>
              <Link href="/work" className="link-arrow" style={{ marginTop: 24 }} onClick={onNavigate}>
                Full project directory <span className="btn__arrow" aria-hidden="true">→</span>
              </Link>
            </div>
            <ul className="mega__grid mega__grid--work">
              {workFilters
                .filter((f) => f.key !== "all")
                .map((f, i) => (
                  <li key={f.key} style={{ display: "contents" }}>
                    <Link
                      href={`/work?filter=${f.key}`}
                      className="mega__item"
                      style={{ minHeight: 110 }}
                      onClick={onNavigate}
                    >
                      <span className="mega__item-index">{String(i + 1).padStart(2, "0")}</span>
                      <span className="mega__item-title">{f.label}</span>
                    </Link>
                  </li>
                ))}
              <li style={{ display: "contents" }}>
                <Link href="/products-research" className="mega__item" style={{ minHeight: 110 }} onClick={onNavigate}>
                  <span className="mega__item-index">R&amp;D</span>
                  <span className="mega__item-title">Products, concepts &amp; research</span>
                </Link>
              </li>
              <li style={{ display: "contents" }}>
                <Link href="/contact" className="mega__item" style={{ minHeight: 110 }} onClick={onNavigate}>
                  <span className="mega__item-index">→</span>
                  <span className="mega__item-title">Discuss a project</span>
                </Link>
              </li>
            </ul>
          </>
        )}
      </div>
    </motion.div>
  );
}
