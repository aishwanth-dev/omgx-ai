"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { capabilities } from "@/content/capabilities";
import { useHydrated, useMediaQuery, usePrefersReducedMotion, useWebGL } from "@/lib/device";
import { ScrollTrigger } from "@/lib/gsap";
import { getLenis, scrollToY } from "@/lib/lenis";
import { activeAt } from "@/lib/scroll/activeAt";
import { useTrackIndex } from "@/lib/scroll/useTrackIndex";
import { useInViewState } from "@/lib/useInView";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { CapabilityGlyph } from "@/components/ui/CapabilityGlyph";
import { CapabilityLabels } from "@/components/ui/CapabilityLabels";
import "@/app/scenes.css";
import { surfaceAttrs } from "@/lib/surfaces";

const CapabilityModelsCanvas = dynamic(() => import("@/components/three/CapabilityModels"), { ssr: false });

/** Fraction of the stage's shorter side that a model's circle spans when the labels ring it. */
const RING_FILL = 0.64;
/** The same on phones and tablets: no labels, but room for the idle turn and the transition without clipping. */
const PHONE_FILL = 0.84;

/** Gap between the pinned stage's bottom edge and the reading line, in px (phones). */
const LINE_GAP = 12;
/** The reading line on desktop with reduced motion (no pinned stage), as a fraction of the viewport height. */
const READ_LINE = 0.45;

/** The reading line in viewport px: just under the pinned stage on phones, else a fixed fraction. */
function readingLine(stage: HTMLElement | null, stuck = false): number {
  if (stage) {
    const cs = getComputedStyle(stage);
    if (cs.position === "sticky") {
      const bottom = stage.getBoundingClientRect().bottom;
      // `stuck`: where the stage's bottom will be once it is pinned (for scroll targets computed before it is).
      const pinned = (parseFloat(cs.top) || 0) + stage.offsetHeight;
      return (stuck ? pinned : Math.max(bottom, pinned)) + LINE_GAP;
    }
  }
  return window.innerHeight * READ_LINE;
}

/**
 * Phones and reduced motion: no track. The open row is the last header above the
 * reading line (the bottom of the pinned stage on phones), recomputed on scroll.
 * `select(i)` scrolls header i to the line under a lock, so no row in between opens.
 */
function useReadingLineIndex(
  enabled: boolean,
  headers: React.RefObject<(HTMLElement | null)[]>,
  stage: React.RefObject<HTMLElement | null>,
  n: number,
) {
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const locked = useRef<number | null>(null);

  const apply = useCallback((i: number) => {
    indexRef.current = i;
    setIndex(i);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const els = (headers.current ?? []).slice(0, n).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    let raf = 0;
    const recompute = () => {
      raf = 0;
      if (locked.current !== null) return;
      const line = readingLine(stage.current);
      apply(activeAt(line, els.map((e) => e.getBoundingClientRect().top)));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(recompute);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    recompute();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled, headers, stage, n, apply]);

  const select = useCallback(
    (i: number) => {
      const prev = indexRef.current;
      apply(i);
      const el = headers.current?.[i];
      if (!enabled || !el) return;
      if (locked.current !== null) window.clearTimeout(locked.current);
      const unlock = () => {
        if (locked.current !== null) window.clearTimeout(locked.current);
        locked.current = null;
      };
      locked.current = window.setTimeout(unlock, 2000);
      // Rows below the open one move up by its panel's height when it closes.
      const closing = i > prev ? (el.closest(".caps__tablist")?.querySelectorAll<HTMLElement>(".cap-row__panel")[0]?.offsetHeight ?? 0) : 0;
      const y = window.scrollY + el.getBoundingClientRect().top - closing - readingLine(stage.current, true) + 2;
      scrollToY(Math.max(0, y), { immediate: getLenis() === null, duration: 1.0, onComplete: unlock });
    },
    [enabled, headers, stage, apply],
  );

  return [index, select] as const;
}
/**
 * Phone stack: card k (k >= 1) slides up from the bottom of the card area while the track progress passes
 * [k/n - STACK_SPAN/2, k/n + STACK_SPAN/2], so it has landed by the middle of its segment (where select() scrolls to).
 * A landed card dims the cards below it to STACK_DIM. Only the transform and the content opacity (--dim) are written, straight from the scroll.
 */
const STACK_SPAN = 0.2;
const STACK_DIM = 0.72;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
function useCardStack(enabled: boolean, track: React.RefObject<HTMLElement | null>, rows: React.RefObject<HTMLElement | null>, n: number) {
  useEffect(() => {
    const host = track.current;
    const cards = rows.current ? Array.from(rows.current.children, (c) => c as HTMLElement) : [];
    if (!enabled || !host || cards.length < n) return;
    const apply = (p: number) => {
      const arrival = cards.map((_, k) => (k === 0 ? 1 : clamp01((p - (k / n - STACK_SPAN / 2)) / STACK_SPAN)));
      cards.forEach((el, i) => {
        let above = 0;
        for (let k = i + 1; k < n; k++) above += arrival[k];
        el.style.transform = i === 0 ? "" : `translate3d(0, ${((1 - arrival[i]) * 100).toFixed(2)}%, 0)`;
        el.style.setProperty("--dim", String(1 - (1 - STACK_DIM) * Math.min(1, above)));
      });
    };
    const st = ScrollTrigger.create({ trigger: host, start: "top top", end: "bottom bottom", scrub: true, onUpdate: (s) => apply(s.progress), onRefresh: (s) => apply(s.progress) });
    apply(st.progress);
    return () => {
      st.kill();
      for (const el of cards) {
        el.style.transform = "";
        el.style.removeProperty("--dim");
      }
    };
  }, [enabled, track, rows, n]);
}

export function CapabilitiesSection() {
  const n = capabilities.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const tablistRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { inView } = useInViewState(visualRef, "300px");
  // Mount the canvas well before the stage arrives, so building the models never lands mid-scroll.
  const { seen } = useInViewState(visualRef, "1400px");
  const webgl = useWebGL();
  const reduced = usePrefersReducedMotion();
  const hydrated = useHydrated();
  // Desktop with motion: a scroll track; otherwise the reading line (I.2, I.3).
  const wide = useMediaQuery("(min-width: 961px)");
  const fill = wide ? RING_FILL : PHONE_FILL;
  const trackMode = useMediaQuery("(min-width: 961px) and (prefers-reduced-motion: no-preference)");
  // Phones and tablets with motion: the same track, with the stage pinned and one card open per quarter (scenes.css).
  const phoneTrack = useMediaQuery("(max-width: 960px) and (min-height: 521px) and (prefers-reduced-motion: no-preference)");
  const tracked = trackMode || phoneTrack;
  const [trackIndex, selectTrack] = useTrackIndex(trackRef, n, tracked);
  useCardStack(phoneTrack, trackRef, tablistRef, n);
  const [lineIndex, selectLine] = useReadingLineIndex(hydrated && !tracked, tabRefs, visualRef, n);
  const active = tracked ? trackIndex : lineIndex;
  const select = tracked ? selectTrack : selectLine;
  const baseId = useId();
  const cap = capabilities[active];
  const [reserve, setReserve] = useState<number | undefined>(undefined);

  // Reserve every row plus the tallest panel, so the content below never shifts (I.3).
  useEffect(() => {
    const list = listRef.current;
    const measure = measureRef.current;
    const tablist = tablistRef.current;
    if (!list || !measure || !tablist) return;
    const update = () => {
      const rows = Array.from(tablist.children, (c) => c as HTMLElement);
      const open = tablist.querySelector<HTMLElement>(".cap-row__panel");
      const rowsH = rows.reduce((sum, r) => sum + r.offsetHeight, 0);
      const gaps = (parseFloat(getComputedStyle(tablist).rowGap) || 0) * Math.max(0, rows.length - 1);
      const tallest = Math.max(0, ...Array.from(measure.children, (c) => (c as HTMLElement).offsetHeight));
      setReserve(rowsH > 0 ? Math.ceil(rowsH - (open?.offsetHeight ?? 0) + tallest + gaps) : undefined);
    };
    const ro = new ResizeObserver(update);
    ro.observe(list);
    ro.observe(measure);
    update();
    return () => ro.disconnect();
  }, [n]);
  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = n - 1;
    let next = active;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = active === last ? 0 : active + 1;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = active === 0 ? last : active - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;
    e.preventDefault();
    select(next);
    tabRefs.current[next]?.focus({ preventScroll: true });
  };

  // Phones show the four short focus areas as pills (the ring labels are desktop only); desktop lists capabilities.
  const panelBody = (c: (typeof capabilities)[number]) => (
    <>
      <p>{c.intro}</p>
      <ul className="cap-row__tags">
        {(wide ? c.capabilities.slice(0, 5) : c.keywords).map((t) => (
          <li key={t} className="chip">
            {t}
          </li>
        ))}
      </ul>
    </>
  );
  const allLink = (
    <Link href="/capabilities" className="btn btn--primary caps__all">
      Explore capabilities <span className="btn__arrow" aria-hidden="true">→</span>
    </Link>
  );
  return (
    <section id="capabilities" className="section caps" {...surfaceAttrs("mist")} aria-labelledby="caps-title">
      <div className="container">
        <div className="caps__head">
          <div>
            <p className="t-utility">What we do</p>
            <RevealHeading id="caps-title" className="t-display-l caps__title" text={["Four disciplines.", "One engineering mindset."]} />
          </div>
          <p className="t-lead caps__intro">
            We combine software intelligence with physical engineering. Each discipline stands on its own, and the
            strongest work happens where they meet.
          </p>
        </div>
      </div>

      <div className="caps__track" ref={trackRef}>
        <div className="caps__stage">
          <div className="container caps__body">
            <div className="cap-visual" ref={visualRef}>
              <div className="cap-visual__canvas">
                {/* One canvas, mounted the first time the stage nears the viewport and kept (paused off-screen). */}
                {webgl && seen && <CapabilityModelsCanvas active={active} running={inView} reduced={reduced} fill={fill} lite={!wide} />}
                {webgl === false && (
                  <div className="cap-visual__fallback">
                    <CapabilityGlyph slug={cap.slug} />
                  </div>
                )}
              </div>
              {wide && (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  className="cap-ring-wrap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: reduced ? 0 : 0.35, delay: reduced ? 0 : 0.1 } }}
                  exit={{ opacity: 0, transition: { duration: reduced ? 0 : 0.18 } }}
                >
                  <CapabilityLabels boxRef={visualRef} labels={cap.keywords} fill={fill} title={`${cap.shortTitle} focus areas`} />
                </motion.div>
              </AnimatePresence>
              )}
              <p className="visual-caption cap-visual__caption">Interactive visual · {cap.shortTitle}</p>
            </div>

            <div className="caps__list" ref={listRef}>
              <div className="caps__progress" aria-hidden="true">
                {capabilities.map((c, i) => (
                  <span key={c.slug} className={i <= active ? "is-on" : undefined} />
                ))}
              </div>
              <div
                role="tablist"
                aria-orientation="vertical"
                aria-label="Capabilities"
                onKeyDown={onKeyDown}
                ref={tablistRef}
                className="caps__tablist"
                style={!tracked && reserve ? { minHeight: reserve } : undefined}
              >
                {capabilities.map((c, i) => {
                  const selected = i === active;
                  return (
                    <div key={c.slug} className={`cap-row${selected ? " is-active" : ""}`} style={{ "--i": i } as React.CSSProperties}>
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
                        onClick={() => select(i)}
                      >
                        <span className="cap-row__num" aria-hidden="true">
                          {i + 1}
                        </span>
                        <span className="cap-row__title">{c.title}</span>
                      </button>
                      {phoneTrack ? (
                        // Stack: every panel stays rendered (later cards cover earlier ones); only the newest is reachable.
                        <div
                          id={`${baseId}-panel-${i}`}
                          role="tabpanel"
                          aria-labelledby={`${baseId}-tab-${i}`}
                          className="cap-row__panel"
                          aria-hidden={selected ? undefined : true}
                          inert={!selected}
                        >
                          <div className="cap-row__panel-inner">
                            {panelBody(c)}
                            <Link href={`/capabilities/${c.slug}`} className="link-arrow">
                              Explore {c.shortTitle} <span className="btn__arrow" aria-hidden="true">→</span>
                            </Link>
                          </div>
                        </div>
                      ) : (
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
                            transition={{ duration: reduced ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
                          >
                            <div className="cap-row__panel-inner">
                              {panelBody(c)}
                              <Link href={`/capabilities/${c.slug}`} className="link-arrow">
                                Explore {c.shortTitle} <span className="btn__arrow" aria-hidden="true">→</span>
                              </Link>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Off-screen copies of every panel, measured to reserve the tallest one. */}
              <div className="caps__measure" ref={measureRef} aria-hidden="true" inert>
                {capabilities.map((c) => (
                  <div key={c.slug} className="cap-row__panel-inner">
                    {panelBody(c)}
                    <span className="link-arrow">Explore {c.shortTitle} →</span>
                  </div>
                ))}
              </div>
              {!phoneTrack && allLink}
            </div>
          </div>
        </div>
      </div>
      {phoneTrack && <div className="container caps__after">{allLink}</div>}
    </section>
  );
}
