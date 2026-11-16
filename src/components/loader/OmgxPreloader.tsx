"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/layout/Logo";
import { gsap } from "@/lib/gsap";
import { isIntroDone, markIntroDone, subscribeReadiness } from "@/lib/readiness";
import { startPreload } from "./startPreload";
import "@/app/loader.css";

const MAX_WAIT_MS = 12000;
const HOLD_MS = 250;
const LINES = [
  { d: "M-20 -20 C 260 60, 420 380, 760 520 S 1200 640, 1480 700", tone: "blue" },
  { d: "M300 -20 C 640 120, 900 380, 1200 470 S 1420 560, 1480 580", tone: "white" },
  { d: "M700 -20 C 1000 80, 1250 250, 1480 520", tone: "red" },
  { d: "M-20 360 C 300 420, 600 470, 860 700 S 1100 900, 1200 940", tone: "white" },
  { d: "M80 -20 C 350 150, 520 520, 900 660 S 1300 780, 1480 840", tone: "soft" },
] as const;

/**
 * The loader tracks real work (lib/readiness.ts, started by startPreload): fonts, the logo and
 * poster, the hero GLB with its Draco decode, scene chunks, a WebGL warm-up and the first hero
 * frame. The shown number eases toward the weighted progress, never goes backwards and reaches
 * 100 only when everything is ready. It then holds 250 ms, plays the exit and starts the hero
 * intro. After 12 s it finishes anyway; a failed asset counts as done. Scrolling is locked only
 * while it is visible; without JS it is hidden by CSS.
 */
export function OmgxPreloader() {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const brand = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const forced = useRef(false);
  const [gone, setGone] = useState(() => isIntroDone());
  const [announce, setAnnounce] = useState("Loading");

  useEffect(() => {
    if (gone) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.body.classList.add("is-locked");
    let snap = { progress: 0, pending: [] as string[], complete: false };
    const unsub = subscribeReadiness((s) => {
      snap = s;
    });
    startPreload((href) => router.prefetch(href));

    let shown = 0;
    let lastInt = -1;
    let lastMilestone = -1;
    let exiting = false;
    let raf = 0;
    let hold = 0;
    let tl: gsap.core.Timeline | null = null;
    const t0 = performance.now();
    let last = t0;

    const finish = () => {
      document.body.classList.remove("is-locked");
      markIntroDone();
      setGone(true);
    };
    const exit = (fast: boolean) => {
      if (reduced || fast) {
        tl = gsap.timeline({ onComplete: finish }).to(root.current, { autoAlpha: 0, duration: fast ? 0.2 : 0.3 });
        return;
      }
      tl = gsap
        .timeline({ onComplete: finish })
        .to(brand.current, { scale: 1.18, autoAlpha: 0, duration: 0.55, ease: "expo.in" }, 0)
        .to(counter.current, { autoAlpha: 0, y: 12, duration: 0.35, ease: "power2.in" }, 0)
        .to(root.current, { clipPath: "inset(0 0 100% 0)", duration: 0.7, ease: "expo.inOut" }, 0.2);
    };

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const skip = forced.current;
      const target = skip || now - t0 > MAX_WAIT_MS || snap.complete ? 100 : Math.min(99, snap.progress * 100);
      if (target > shown) shown = Math.min(target, shown + Math.max((target - shown) * (1 - Math.exp(-dt * 6)), dt * 0.4));
      if (target === 100 && 100 - shown < 0.4) shown = 100;
      if (skip) shown = 100;
      const int = shown >= 100 ? 100 : Math.min(99, Math.floor(shown));
      if (int !== lastInt) {
        lastInt = int;
        if (num.current) num.current.textContent = String(int).padStart(3, "0");
        counter.current?.setAttribute("aria-valuenow", String(int));
        const m = int === 100 ? 100 : Math.floor(int / 25) * 25;
        if (m !== lastMilestone) {
          lastMilestone = m;
          setAnnounce(m === 100 ? "Loaded" : m === 0 ? "Loading" : `Loading, ${m} percent`);
        }
      }
      if (int === 100 && !exiting) {
        exiting = true;
        if (skip) exit(true);
        else hold = window.setTimeout(() => exit(false), HOLD_MS);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(hold);
      tl?.kill();
      unsub();
      document.body.classList.remove("is-locked");
    };
  }, [gone, router]);

  if (gone) return null;
  return (
    <div ref={root} className="omx-loader" data-theme="dark" aria-busy="true">
      <svg className="omx-loader__lines" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {LINES.map((l, i) => (
          <path
            key={`l${i}`}
            className={`omx-loader__line omx-loader__line--${l.tone}`}
            d={l.d}
            pathLength={1}
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
        {LINES.map((l, i) => (
          <path
            key={`p${i}`}
            className={`omx-loader__pulse omx-loader__pulse--${l.tone === "red" ? "red" : l.tone === "white" ? "white" : "blue"}`}
            d={l.d}
            pathLength={1}
            style={{ animationDelay: `${1.2 + i * 0.7}s`, animationDuration: `${3.2 + (i % 3) * 0.6}s` }}
          />
        ))}
      </svg>
      <div ref={brand} className="omx-loader__brand">
        <p className="omx-loader__word" aria-hidden="true">
          OMGX<span>AI</span>
        </p>
        <LogoMark size={164} priority />
      </div>
      <div
        ref={counter}
        className="omx-loader__count"
        role="progressbar"
        aria-label="Loading OMGX AI"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
      >
        <span ref={num} aria-hidden="true">
          000
        </span>
        <small aria-hidden="true">%</small>
      </div>
      <p className="omx-loader__sr" role="status" aria-live="polite">
        {announce}
      </p>
      <button
        type="button"
        className="omx-loader__skip t-utility"
        onClick={() => {
          forced.current = true;
        }}
      >
        Skip intro
      </button>
    </div>
  );
}
