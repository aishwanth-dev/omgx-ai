"use client";

import { useEffect } from "react";
import { onRouteCommit } from "@/lib/nav/routeEvents";

const SELECTOR = '[data-reveal]:not([data-reveal="intro"]):not(.is-in)';

/**
 * One shared IntersectionObserver for every RevealHeading. Adds `is-in` once,
 * when 35% of a heading is in view, and re-scans after each route commit.
 * `trigger="intro"` headings are left to the homepage intro.
 */
export function RevealObserver() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      const showAll = () => document.querySelectorAll(SELECTOR).forEach((el) => el.classList.add("is-in"));
      showAll();
      return onRouteCommit(() => requestAnimationFrame(showAll));
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.35 },
    );
    const scan = () => {
      io.disconnect(); // drops headings from the previous route
      document.querySelectorAll(SELECTOR).forEach((el) => io.observe(el));
    };
    scan();
    let raf = 0;
    const off = onRouteCommit(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(scan);
    });
    return () => {
      off();
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);
  return null;
}
