"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FACTS } from "@/content/proof";
import { gsap, useGSAP } from "@/lib/gsap";
import { buildProofPath, CARD_DUR, cardStart, DRAW_END, HOLD_END, lineLength, PROOF_LINES } from "@/lib/motion/proofPaths";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { surfaceAttrs } from "@/lib/surfaces";

export function ProofCardsSection() {
  const root = useRef<HTMLElement>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLUListElement>(null);
  // Stage size in px: each line's `d` is rebuilt from it, so curves are drawn in stage pixels (K.3).
  const [size, setSize] = useState({ w: 1440, h: 900 });

  useEffect(() => {
    const svg = svgRef.current;
    const head = headRef.current;
    const cards = cardsRef.current;
    if (!svg || !head || !cards) return;
    // The lines are masked out of the head text block: to its right when the head sits beside the cards,
    // below its bottom edge when the head sits above them. The mask follows the text's real box.
    const clearText = () => {
      const s = svg.getBoundingClientRect();
      const h = head.getBoundingClientRect();
      const beside = h.right <= cards.getBoundingClientRect().left + 1;
      svg.dataset.clear = beside ? "x" : "y";
      svg.style.setProperty("--clear-x", `${Math.max(0, h.right - s.left + 24).toFixed(0)}px`);
      svg.style.setProperty("--clear-y", `${Math.max(0, h.bottom - s.top + 24).toFixed(0)}px`);
    };
    const ro = new ResizeObserver(() => {
      const w = Math.round(svg.clientWidth);
      const h = Math.round(svg.clientHeight);
      if (w > 0 && h > 0) setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
      clearText();
    });
    ro.observe(svg);
    ro.observe(head);
    clearText();
    document.fonts?.ready.then(clearText);
    return () => ro.disconnect();
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 900px)", () => {
        const cards = gsap.utils.toArray<HTMLElement>(".proof__card-motion", root.current);
        const lines = gsap.utils.toArray<SVGPathElement>(".proof__spline", root.current);
        const heads = gsap.utils.toArray<SVGPathElement>(".proof__spline-head", root.current);
        // One timeline of progress 0..1 on one short track (see proofPaths.ts for the phase contract):
        // lines draw and cards reveal by DRAW_END, a short settle, then the release. Scrubbed, so it reverses.
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: ".proof__track", start: "top top", end: "bottom bottom", scrub: true },
        });
        // The field: only --rise moves, so no box edge ever enters the stage (K.2).
        tl.fromTo(".proof__field", { "--rise": 0 }, { "--rise": 1, duration: DRAW_END }, 0);
        // pathLength = 1 and a dash offset draw each path from its start, so the lines alternate left-to-right and
        // right-to-left (K.3). The offset is written as an SVG attribute: GSAP's CSS plugin rounds `strokeDashoffset`
        // to whole px, which on a pathLength of 1 leaves only 0 or 1, so the lines used to jump instead of draw.
        const HEAD = 0.05;
        const draw = (p: number) => {
          PROOF_LINES.forEach((_, i) => {
            const len = lineLength(i, p);
            lines[i]?.setAttribute("stroke-dashoffset", (1 - len).toFixed(4));
            const head = heads[i];
            if (head) {
              head.setAttribute("stroke-dashoffset", (HEAD - len).toFixed(4));
              head.style.opacity = len > 0.002 && len < 0.998 ? "1" : "0";
            }
          });
        };
        const proxy = { p: 0 };
        tl.to(proxy, { p: 1, duration: 1, onUpdate: () => draw(proxy.p) }, 0);
        draw(0);
        gsap.set(cards, { transformPerspective: 1100, transformOrigin: "50% 100%" });
        cards.forEach((card, i) => {
          const at = cardStart(i);
          // Opaque almost at once, so a card face never lets a line show through it.
          tl.fromTo(card, { autoAlpha: 0 }, { autoAlpha: 1, duration: CARD_DUR * 0.35 }, at);
          tl.fromTo(
            card,
            { y: 170, rotationX: 24, rotationZ: i % 2 ? 2.5 : -2.5, scale: 0.94 },
            { y: 0, rotationX: 0, rotationZ: 0, scale: 1, duration: CARD_DUR, ease: "power3.out" },
            at,
          );
        });
        // Release: the whole stage content lifts a little, so the hand-off to the next section has motion.
        tl.to(".proof__cards, .proof__splines", { y: -48, duration: 1 - HOLD_END }, HOLD_END);
        return () => {
          [...lines, ...heads].forEach((el) => {
            el.removeAttribute("stroke-dashoffset");
            el.style.opacity = "";
          });
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="proof" {...surfaceAttrs("ink", "matcha")} aria-labelledby="proof-title">
      <div className="proof__track">
        <div className="proof__stage">
          <div className="proof__field" aria-hidden="true" />
          <svg ref={svgRef} className="proof__splines" viewBox={`0 0 ${size.w} ${size.h}`} aria-hidden="true">
            {PROOF_LINES.map((_, i) => {
              const d = buildProofPath(i, size.w, size.h);
              return (
                <g key={i} className={`proof__line proof__line--${i}`}>
                  <path className="proof__spline" d={d} pathLength={1} strokeDasharray="1 1" />
                  <path className="proof__spline-head" d={d} pathLength={1} strokeDasharray="0.05 1" />
                </g>
              );
            })}
          </svg>

          <div className="container proof__inner">
            <div ref={headRef} className="proof__head">
              <p className="t-utility">Selected engineering evidence</p>
              <RevealHeading id="proof-title" className="t-display proof__title" text="What the systems do." />
              <p className="proof__note t-small">
                Project-specific technical facts from documented work. They describe individual systems, not
                company-wide statistics.
              </p>
            </div>

            <ul ref={cardsRef} className="proof__cards">
              {FACTS.map((f, i) => (
                <li key={i} className={`proof__slot proof__slot--${i}`}>
                  <div className="proof__card-motion">
                    <Link href={`/work/${f.slug}`} className={`proof__card proof__card--${f.tone}`}>
                      <span className="proof__value">{f.value}</span>
                      <span className="proof__caption">{f.caption}</span>
                      <span className="proof__project t-utility">{f.project} →</span>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
