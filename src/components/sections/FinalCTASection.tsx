"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { CorePoster } from "@/components/three/CorePoster";
import { ContactForm } from "@/components/ui/ContactForm";
import { usePrefersReducedMotion, useWebGL } from "@/lib/device";
import { useInViewState } from "@/lib/useInView";

const CoreMini = dynamic(() => import("@/components/three/CoreMini"), { ssr: false });

export function FinalCTASection({ withForm = true }: { withForm?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { inView, seen } = useInViewState(ref);
  const webgl = useWebGL();
  const reduced = usePrefersReducedMotion();

  return (
    <section className="section final-cta" data-theme="dark" aria-labelledby="cta-title" id="start">
      <div className="final-cta__glow" aria-hidden="true" />
      <div className="final-cta__visual" ref={ref} aria-hidden="true">
        {webgl && seen && <CoreMini running={inView} reduced={reduced} />}
        {webgl === false && <CorePoster />}
      </div>
      <div className="container final-cta__inner">
        <div className="final-cta__copy">
          <p className="t-utility">Start a project</p>
          <h2 id="cta-title" className="t-display-l">
            Have a complex challenge?
          </h2>
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
