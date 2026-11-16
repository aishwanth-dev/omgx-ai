import type { LenisOptions } from "lenis";

/** The single place to tune Lenis (option names from lenis 1.3.27 dist/lenis.d.ts). */
export const SCROLL_FEEL = {
  lerp: 0.075, // wheel and trackpad glide, tunable 0.07–0.085
  wheelMultiplier: 0.95,
  syncTouch: true, // owner's decision: touch gets the same heavy glide
  syncTouchLerp: 0.075, // glide after a touch is released, tunable 0.06–0.09
  touchMultiplier: 1, // touchInertiaExponent stays at its default (1.7)
  gestureOrientation: "vertical",
} satisfies LenisOptions;
