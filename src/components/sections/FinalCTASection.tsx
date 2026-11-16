"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { CorePoster } from "@/components/three/CorePoster";
import { ContactForm } from "@/components/ui/ContactForm";
import { usePrefersReducedMotion, useWebGL } from "@/lib/device";
import { useInViewState } from "@/lib/useInView";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { surfaceAttrs } from "@/lib/surfaces";
import "@/app/scenes.css";
import "@/app/sections.css";

const CoreMini = dynamic(() => import("@/components/three/CoreMini"), { ssr: false });

export function FinalCTASection({ withForm = true }: { withForm?: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const progress = useRef(0.5);
  const { inView } = useInViewState(ref, "300px");
  const webgl = useWebGL();
  const reduced = usePrefersReducedMotion();

  // Scroll progress through the section (0 = entering, 1 = leaving). It drives the model's turn
  // and tilt (via `progress`) and a gentle parallax (via --cta-p). Static under reduced motion.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (reduced) {
      progress.current = 0.5;
      el.style.setProperty("--cta-p", "0.5");
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      progress.current = p;
      el.style.setProperty("--cta-p", p.toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <section ref={sectionRef} className="section final-cta" {...surfaceAttrs("ink")} aria-labelledby="cta-title" id="start">
      <div className="final-cta__glow" aria-hidden="true" />
      <div className="final-cta__visual" ref={ref} aria-hidden="true">
        {webgl && inView && <CoreMini running={inView} reduced={reduced} progress={progress} />}
        {webgl === false && <CorePoster />}
      </div>
      <div className="container final-cta__inner">
        <div className="final-cta__copy">
          <p className="t-utility">Start a project</p>
          <RevealHeading id="cta-title" className="t-display-l" text="Have a complex challenge?" />
          <p className="t-lead muted">Let&apos;s understand the problem and engineer the right solution.</p>
        </div>
        {withForm && (
          <div className="final-cta__form">
            <ContactForm />
          </div>
        )}
      </div>
    </section>
  );
}
