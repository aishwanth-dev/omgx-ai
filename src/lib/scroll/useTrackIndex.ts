"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { getLenis, scrollToY } from "@/lib/lenis";
import { indexFromScroll, progressToY, segmentMid } from "./segments";

const SELECT_DURATION = 0.9; // s, Lenis scroll for a click or key selection
const LOCK_MAX_MS = 1500; // the selection lock never outlives this
const USER_INPUT = ["wheel", "touchstart"] as const; // scrolling by hand ends the lock at once
const REMEASURE_DEBOUNCE_MS = 130; // resize, orientation change and observer bursts settle before one refresh

/**
 * Scroll-driven index over a track split into `n` equal segments (design I.1).
 * Creates a ScrollTrigger with no pin on `trackRef`; on every update the index
 * is derived from the live scroll position and the trigger's start/end (`indexFromScroll`),
 * never from a cached `self.progress`, so layout changes without a scroll event cannot leave it stale.
 * `select(i)` sets the index under a lock and scrolls to segment i's middle, so
 * intermediate indices are never emitted during that scroll.
 * When `enabled` is false no trigger exists and `select` only sets the index.
 */
export function useTrackIndex(
  trackRef: RefObject<HTMLElement | null>,
  n: number,
  enabled = true,
): [number, (i: number) => void] {
  const [index, setIndex] = useState(0);
  const st = useRef<ScrollTrigger | null>(null);
  const lock = useRef<{ target: number; timer: number } | null>(null);

  const release = useCallback(() => {
    if (!lock.current) return;
    window.clearTimeout(lock.current.timer);
    lock.current = null;
    // The scroll ends mid-segment of the target, so the next update agrees with it.
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!enabled || !el) return;
    const sync = (start: number, end: number) => {
      if (lock.current) return;
      setIndex(indexFromScroll(window.scrollY, start, end, n));
    };
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      invalidateOnRefresh: true,
      onUpdate: (self) => sync(self.start, self.end),
      onRefresh: (self) => sync(self.start, self.end),
    });
    st.current = trigger;
    // A restored scroll position or an anchor must not show a stale index.
    sync(trigger.start, trigger.end);

    // The track is measured before fonts, images, the canvas and sibling pins settle:
    // re-measure once they have, and whenever the viewport or page height changes.
    let raf = 0;
    let timer = 0;
    const remeasure = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        sync(trigger.start, trigger.end);
      });
    };
    const remeasureSoon = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(remeasure, REMEASURE_DEBOUNCE_MS);
    };
    void document.fonts?.ready.then(remeasure);
    window.addEventListener("load", remeasure);
    window.addEventListener("resize", remeasureSoon);
    window.addEventListener("orientationchange", remeasureSoon);
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(remeasureSoon);
    ro?.observe(document.body);
    ro?.observe(el);
    // Safety net: while the track is near the screen, re-derive the index from scrollY (no layout reads).
    let scrollRaf = 0;
    const onScroll = () => {
      if (scrollRaf) return;
      scrollRaf = window.requestAnimationFrame(() => {
        scrollRaf = 0;
        const y = window.scrollY;
        const vh = window.innerHeight;
        if (y > trigger.start - vh && y < trigger.end + vh) sync(trigger.start, trigger.end);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    // A visitor who scrolls by hand while a selection is still gliding takes over at once.
    const drop = () => release();
    for (const t of USER_INPUT) window.addEventListener(t, drop, { passive: true });

    return () => {
      window.cancelAnimationFrame(raf);
      window.cancelAnimationFrame(scrollRaf);
      window.clearTimeout(timer);
      window.removeEventListener("load", remeasure);
      window.removeEventListener("resize", remeasureSoon);
      window.removeEventListener("orientationchange", remeasureSoon);
      window.removeEventListener("scroll", onScroll);
      ro?.disconnect();
      for (const t of USER_INPUT) window.removeEventListener(t, drop);
      trigger.kill();
      st.current = null;
      if (lock.current) window.clearTimeout(lock.current.timer);
      lock.current = null;
    };
  }, [trackRef, n, enabled, release]);

  const select = useCallback(
    (i: number) => {
      const target = Math.max(0, Math.min(n - 1, i));
      setIndex(target);
      const trigger = st.current;
      if (!trigger) return;
      if (lock.current) window.clearTimeout(lock.current.timer);
      lock.current = { target, timer: window.setTimeout(release, LOCK_MAX_MS) };
      const y = progressToY(segmentMid(target, n), trigger.start, trigger.end);
      const smooth = getLenis() !== null;
      scrollToY(y, { immediate: !smooth, duration: SELECT_DURATION, onComplete: release });
    },
    [n, release],
  );

  return [index, select];
}
