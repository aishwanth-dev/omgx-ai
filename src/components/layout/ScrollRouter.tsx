"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { getLenis, resetLenis } from "@/lib/lenis";
import { emitRouteSettled, getLastRouteKey, onRouteCommit } from "@/lib/nav/routeEvents";
import { decideRouteScroll, type NavType } from "@/lib/scroll/routeScroll";

const twoFrames = (fn: () => void) => requestAnimationFrame(() => requestAnimationFrame(fn));

const headerOffset = () => (document.querySelector(".site-header")?.getBoundingClientRect().height ?? 72) + 16;

const findTarget = (id: string) => (id ? document.getElementById(id) : null);

const jumpTo = (y: number) => {
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
  else window.scrollTo(0, y);
};

const focusTarget = (el: HTMLElement) => {
  if (!el.matches("a[href], button, input, select, textarea, [tabindex]")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
};

const markTarget = (el: HTMLElement | null) => {
  document.querySelectorAll(".is-target").forEach((n) => n !== el && n.classList.remove("is-target"));
  el?.classList.add("is-target");
};

const targetY = (el: HTMLElement) => Math.max(0, el.getBoundingClientRect().top + window.scrollY - headerOffset());

const decodeHash = (hash: string) => {
  try {
    return decodeURIComponent(hash.replace(/^#/, ""));
  } catch {
    return hash.replace(/^#/, "");
  }
};

/** Applies the route-scroll decision after each commit, and owns same-page `#` links. */
export function ScrollRouter() {
  useEffect(() => {
    let raf = 0;
    const handle = (routeKey: string, nav: NavType) => {
      cancelAnimationFrame(raf);
      raf = twoFrames(() => {
        ScrollTrigger.refresh();
        const hash = window.location.hash;
        const target = findTarget(decodeHash(hash));
        const d = decideRouteScroll(nav, hash, !!target);
        if (d.kind === "top") {
          jumpTo(0);
          markTarget(null);
          document.getElementById("main")?.focus({ preventScroll: true });
        } else if (d.kind === "hash" && target) {
          jumpTo(targetY(target));
          focusTarget(target);
          markTarget(target);
        } else {
          getLenis()?.resize();
          resetLenis();
        }
        emitRouteSettled(routeKey);
      });
    };
    const off = onRouteCommit(handle);
    // RouteWatcher may have committed before this effect subscribed.
    const first = getLastRouteKey();
    if (first !== null) handle(first, "initial");

    // Same-page `#` links (skip link, "Skip the story", "Related work").
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self")) return;
      const raw = a.getAttribute("href") ?? "";
      if (!raw.includes("#")) return;
      const url = new URL(raw, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname !== window.location.pathname || url.search !== window.location.search) return;
      const target = findTarget(decodeHash(url.hash));
      if (!target) return;
      e.preventDefault();
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(targetY(target), { duration: 1.2, force: true });
      else window.scrollTo(0, targetY(target));
      focusTarget(target);
      markTarget(target);
      history.replaceState(history.state, "", url.hash);
    };
    document.addEventListener("click", onClick);

    return () => {
      off();
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
