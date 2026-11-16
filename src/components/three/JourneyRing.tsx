"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useIsMobile, usePrefersReducedMotion, useWebGL } from "@/lib/device";
import { useInViewState } from "@/lib/useInView";
import { CorePoster } from "./CorePoster";
import { SceneErrorBoundary } from "./SceneErrorBoundary";
import "@/app/scenes.css";

const JourneyRingCanvas = dynamic(() => import("./JourneyRingCanvas"), { ssr: false });

/** The 3D layer, mounted only while the section is near the viewport. */
function LiveRing({
  cursor,
  host,
  inView,
  reduced,
  lite,
  onDrawn,
}: {
  cursor: React.RefObject<number>;
  host: React.RefObject<HTMLElement | null>;
  inView: boolean;
  reduced: boolean;
  lite: boolean;
  onDrawn: (drawn: boolean) => void;
}) {
  useEffect(() => () => onDrawn(false), [onDrawn]);
  return <JourneyRingCanvas cursor={cursor} host={host} live={inView} lite={lite} reduced={reduced} onFirstFrame={() => onDrawn(true)} />;
}

/**
 * The About section's object: the hero object, large and centred, in a calm
 * pose that follows the journey stage and the page scroll (JourneyRingCanvas).
 * Four stage markers sit on an orbit around it; the current stage rides at the
 * top in matcha. Without WebGL, with reduced motion, and until the first
 * frame, the server-rendered poster and the same markers show.
 * Decorative: place it inside an aria-hidden container.
 */
export function JourneyRing({ cursor, stages = 4 }: { cursor: number; stages?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const cursorRef = useRef(cursor);
  const { inView } = useInViewState(host, "300px");
  const webgl = useWebGL();
  const reduced = usePrefersReducedMotion();
  const mobile = useIsMobile();
  const [drawn, setDrawn] = useState(false);
  // Bumped after a lost WebGL context is restored: remounts the canvas.
  const [epoch, setEpoch] = useState(0);
  const [lost, setLost] = useState(false);
  const live3d = webgl === true && !reduced && inView && !lost;
  // A lost context falls back to the poster and the DOM dots until the browser restores it.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const onLost = (e: Event) => {
      e.preventDefault();
      setLost(true);
      setDrawn(false);
    };
    const onRestored = () => {
      setLost(false);
      setEpoch((n) => n + 1);
    };
    el.addEventListener("webglcontextlost", onLost, true);
    el.addEventListener("webglcontextrestored", onRestored, true);
    return () => {
      el.removeEventListener("webglcontextlost", onLost, true);
      el.removeEventListener("webglcontextrestored", onRestored, true);
    };
  }, []);

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  return (
    <div ref={host} className="journey-ring" data-live={live3d && drawn ? "true" : "false"}>
      <CorePoster className="journey-ring__poster" style={{ opacity: drawn ? 0 : 1 }} />
      {live3d && (
        // A failed chunk load or loader error lands here and leaves the poster and the dots.
        <SceneErrorBoundary key={epoch} fallback={null}>
          <LiveRing cursor={cursorRef} host={host} inView={inView} reduced={reduced} lite={mobile} onDrawn={setDrawn} />
        </SceneErrorBoundary>
      )}
      <div className="journey-ring__orbit">
        {Array.from({ length: stages }, (_, i) => {
          // Clockwise from the top: stage 1 top, 2 right, 3 bottom, 4 left.
          const a = (-90 + (i / stages) * 360) * (Math.PI / 180);
          return (
            <span
              key={i}
              className="journey-ring__dot"
              style={{ left: `${(50 + Math.cos(a) * 48).toFixed(2)}%`, top: `${(50 + Math.sin(a) * 48).toFixed(2)}%` }}
            />
          );
        })}
      </div>
      {cursor >= 0 && (
        <div className="journey-ring__rider" style={{ transform: `rotate(${(cursor * 360) / stages}deg)` }}>
          <span className="journey-ring__dot journey-ring__dot--active" style={{ left: "50%", top: "2%" }} />
        </div>
      )}
    </div>
  );
}
