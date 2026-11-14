"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import type { CapabilitySlug } from "@/content/capabilities";
import { usePrefersReducedMotion, useWebGL } from "@/lib/device";
import { useInViewState } from "@/lib/useInView";
import { CapabilityGlyph } from "./CapabilityGlyph";

const CapabilityHeroCanvas = dynamic(() => import("@/components/three/CapabilityHeroScene"), { ssr: false });

/** Client wrapper: lazy-mounts the discipline-specific WebGL scene, with an SVG fallback. */
export function CapabilityHeroVisual({ slug, className }: { slug: CapabilitySlug; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { inView, seen } = useInViewState(ref, "100px");
  const webgl = useWebGL();
  const reduced = usePrefersReducedMotion();
  return (
    <div ref={ref} className={`cap-hero-visual${className ? ` ${className}` : ""}`} aria-hidden="true">
      {webgl && seen && <CapabilityHeroCanvas slug={slug} running={inView} reduced={reduced} />}
      {webgl === false && <CapabilityGlyph slug={slug} />}
      <span className="visual-caption cap-hero-visual__caption">Conceptual visualisation</span>
    </div>
  );
}
