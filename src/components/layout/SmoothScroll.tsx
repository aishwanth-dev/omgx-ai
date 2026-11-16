"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { setLenis } from "@/lib/lenis";
import { SCROLL_FEEL } from "@/lib/scroll/config";

/**
 * Site-wide inertia smooth scrolling with Lenis, created only when motion is
 * allowed (3.12: no smoother at all with reduced motion). Lenis runs first on
 * GSAP's ticker, so ScrollTrigger and every scrub:true timeline update before
 * any canvas renders in the same tick. Route and anchor landing is owned by
 * <ScrollRouter />, so nothing here scrolls on a route change.
 */
export function SmoothScroll() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;
    const tick = (time: number) => lenis?.raf(time * 1000); // gsap ticker time is in seconds

    // Freeze the page while the preloader or the mobile menu holds the body.
    const sync = () => {
      if (!lenis) return;
      if (document.body.classList.contains("is-locked")) lenis.stop();
      else lenis.start();
    };

    const start = () => {
      if (mq.matches || lenis) return;
      lenis = new Lenis({
        ...SCROLL_FEEL,
        smoothWheel: true,
        anchors: false,
        stopInertiaOnNavigate: true,
        autoRaf: false,
      });
      lenis.on("scroll", ScrollTrigger.update);
      setLenis(lenis);
      sync();
    };
    const stop = () => {
      lenis?.destroy();
      lenis = null;
      setLenis(null);
    };
    const onPref = () => {
      document.documentElement.classList.toggle("motion", !mq.matches);
      if (mq.matches) stop();
      else start();
      ScrollTrigger.refresh();
    };

    gsap.ticker.add(tick, false, true); // prioritised: before canvas drivers
    gsap.ticker.lagSmoothing(0);
    mq.addEventListener("change", onPref);
    start();

    const mo = new MutationObserver(sync);
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return () => {
      mo.disconnect();
      mq.removeEventListener("change", onPref);
      gsap.ticker.remove(tick);
      stop();
    };
  }, []);

  return null;
}
