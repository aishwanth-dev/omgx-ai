"use client";

import type Lenis from "lenis";

/** Single shared Lenis instance (created by <SmoothScroll /> only when motion is allowed). */
let instance: Lenis | null = null;

export const setLenis = (l: Lenis | null) => {
  instance = l;
};

export const getLenis = () => instance;

/**
 * Drops leftover inertia so the animated position equals the real one.
 * `reset()` is marked private in the lenis 1.3.27 typings but exists at runtime.
 */
export const resetLenis = () => {
  if (!instance) return;
  const reset = (instance as unknown as { reset?: () => void }).reset;
  if (typeof reset === "function") reset.call(instance);
  else instance.scrollTo(window.scrollY, { immediate: true, force: true });
};

/** Smoothly scroll to a document Y position, falling back to native scrolling. */
export const scrollToY = (
  y: number,
  opts?: { immediate?: boolean; duration?: number; onComplete?: () => void },
) => {
  if (instance) {
    instance.scrollTo(y, {
      duration: opts?.duration ?? 1.6,
      immediate: opts?.immediate,
      force: true,
      onComplete: opts?.onComplete ? () => opts.onComplete?.() : undefined,
    });
  } else {
    window.scrollTo({ top: y, behavior: opts?.immediate ? "auto" : "smooth" });
    opts?.onComplete?.();
  }
};
