"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { LogoMark } from "@/components/layout/Logo";
import { gsap } from "@/lib/gsap";
import { createInterceptHandler } from "@/lib/nav/intercept";
import { currentRouteKey, getLastRouteKey, onRouteSettled, setNavType } from "@/lib/nav/routeEvents";

const LABEL_MAX = 60;
const HIDDEN_BITS = '[aria-hidden="true"], .sr-only, .visually-hidden, .btn__arrow, [class*="__body"], [class*="__desc"]';
const TITLE_BITS = '[data-label], [class*="__title"], [class*="-title"], h2, h3';

/**
 * The page name shown on the curtain. Prefers data-label, then a title child,
 * then the anchor text without hidden, decorative or descriptive parts. Arrows,
 * index numbers and extra whitespace are stripped; long text is cut at a word.
 */
export function curtainLabel(anchor: Element): string {
  const a = anchor as HTMLElement;
  let text = a.dataset?.label;
  if (!text) {
    const title = [...a.querySelectorAll<HTMLElement>(TITLE_BITS)].find((n) => !n.closest('svg, [aria-hidden="true"]'));
    if (title) text = title.dataset.label ?? title.textContent ?? "";
  }
  if (!text) {
    const copy = a.cloneNode(true) as HTMLElement;
    copy.querySelectorAll(HIDDEN_BITS).forEach((n) => n.remove());
    text = copy.textContent ?? "";
  }
  const clean = text
    .replace(/[→←↑↓↗↘›»]/g, "")
    .replace(/(?<![A-Za-z])\d{1,2}(?![A-Za-z0-9])/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length <= LABEL_MAX) return clean;
  const cut = clean.slice(0, LABEL_MAX);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 1)).trim()}…`;
}

/**
 * Route transition curtain: the only transition layer. Internal link clicks
 * (search-only changes included) are intercepted with preventDefault() only, so
 * Next Link still runs the link's own onClick (for example closeAll) and then
 * skips its own navigation. The curtain covers, the route commits, ScrollRouter
 * applies the landing, and the curtain reveals. Back/forward covers instantly.
 */
export function PageTransition() {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const inner = () => el.querySelectorAll(".curtain__inner > *");
    const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let pendingKey: string | null = null;
    let covered = false;
    let safety: number | undefined;

    const reveal = () => {
      if (!covered) return;
      covered = false;
      pendingKey = null;
      window.clearTimeout(safety);
      gsap.killTweensOf(el);
      if (reduced()) {
        gsap.timeline().to(el, { opacity: 0, duration: 0.25 }).set(el, { visibility: "hidden", opacity: 1 });
        return;
      }
      gsap
        .timeline()
        .to(inner(), { autoAlpha: 0, y: -12, duration: 0.25 })
        .to(el, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.8, ease: "expo.inOut" }, 0.1)
        .set(el, { visibility: "hidden" });
    };

    const armSafety = () => {
      window.clearTimeout(safety);
      safety = window.setTimeout(reveal, 4000);
    };

    const go = (url: URL, anchor: Element) => {
      const href = url.pathname + url.search + url.hash;
      pendingKey = url.pathname + url.search;
      const label = el.querySelector<HTMLElement>(".curtain__label");
      if (label) label.textContent = curtainLabel(anchor);
      const navigate = () => {
        setNavType("push");
        router.push(href, { scroll: false });
      };
      covered = true;
      armSafety();
      gsap.killTweensOf(el);
      if (reduced()) {
        gsap
          .timeline()
          .set(el, { visibility: "visible", clipPath: "inset(0% 0% 0% 0%)", opacity: 0 })
          .set(inner(), { autoAlpha: 1, y: 0 })
          .to(el, { opacity: 1, duration: 0.18 })
          .add(navigate);
        return;
      }
      gsap
        .timeline()
        .set(el, { visibility: "visible", opacity: 1, clipPath: "inset(100% 0% 0% 0%)" })
        .to(el, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.6, ease: "expo.inOut" })
        .fromTo(inner(), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.05 }, 0.25)
        .add(navigate);
    };

    const onClick = createInterceptHandler({ here: () => new URL(window.location.href), onIntercept: go });

    // Back/forward: cover instantly when the route (not just the hash) changes.
    const onPop = () => {
      const key = currentRouteKey();
      if (key === getLastRouteKey()) return;
      pendingKey = key;
      covered = true;
      armSafety();
      gsap.killTweensOf(el);
      gsap.set(el, { visibility: "visible", opacity: 1, clipPath: "inset(0% 0% 0% 0%)" });
      gsap.set(inner(), { autoAlpha: 0 });
    };

    const offSettled = onRouteSettled((key) => {
      if (covered && key === pendingKey) reveal();
    });

    window.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
      offSettled();
      window.clearTimeout(safety);
    };
  }, [router]);

  return (
    <div ref={root} className="curtain" aria-hidden="true">
      <div className="curtain__edge" />
      <div className="curtain__inner">
        <LogoMark size={44} />
        <span className="curtain__label t-utility" />
      </div>
    </div>
  );
}
