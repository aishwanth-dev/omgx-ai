"use client";

import { useThree } from "@react-three/fiber";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { nextSeconds } from "@/lib/frameStep";

/** Marks the driver dirty so a demand-mode canvas renders exactly one frame. */
const FrameDirtyContext = createContext<() => void>(() => {});
export const useInvalidateFrame = () => useContext(FrameDirtyContext);

/**
 * Rendered inside every <Canvas frameloop="never">. Advances the canvas from
 * GSAP's ticker, after Lenis and ScrollTrigger have updated in the same tick.
 * Time is in seconds (R3F stores it as clock.elapsedTime in "never" mode).
 * No frames while not live or while the tab is hidden (3.24).
 */
export function FrameDriver({
  live,
  demand = false,
  children,
}: {
  live: boolean;
  demand?: boolean;
  children?: React.ReactNode;
}) {
  const advance = useThree((s) => s.advance);
  const size = useThree((s) => s.size);
  const seconds = useRef(0);
  const dirty = useRef(true);

  useEffect(() => {
    dirty.current = true;
  }, [size, live, demand]);

  // A re-render from the parent (a state change) also needs a frame in demand mode.
  useEffect(() => {
    dirty.current = true;
  });

  useEffect(() => {
    const tick = (_time: number, deltaMs: number) => {
      if (!live || document.hidden || (demand && !dirty.current)) return;
      seconds.current = nextSeconds(seconds.current, deltaMs);
      dirty.current = false;
      advance(seconds.current, false);
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [live, demand, advance]);

  const markDirty = useCallback(() => {
    dirty.current = true;
  }, []);
  const value = useMemo(() => markDirty, [markDirty]);

  return <FrameDirtyContext.Provider value={value}>{children}</FrameDirtyContext.Provider>;
}
