"use client";

import { useEffect, useRef, useState } from "react";
import { LOGO_PATHS } from "@/components/layout/Logo";
import { gsap, useGSAP } from "@/lib/gsap";
import { markIntroDone, markReady, READINESS_LABELS, subscribeReadiness, type ReadinessTask } from "@/lib/readiness";

const TASKS: ReadinessTask[] = ["document", "fonts", "scene"];
const SEEN_KEY = "omgx-intro-seen";
const MAX_WAIT_MS = 7000;

/**
 * Original OMGX identity reveal. Progress is the real count of critical tasks
 * resolved (page hydrated, web fonts loaded, first WebGL frame rendered). It
 * never invents intermediate percentages, is shortened on repeat visits and
 * exits after MAX_WAIT_MS even if the 3D scene is still loading.
 */
export function OmgxPreloader() {
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState<Set<ReadinessTask>>(new Set());
  const [gone, setGone] = useState(false);
  const exiting = useRef(false);
  const drawn = useRef(false);
  const repeat = useRef(false);
  const exitRef = useRef<() => void>(() => {});

  useEffect(() => {
    const unsub = subscribeReadiness(setDone);
    markReady("document");
    if (document.fonts) document.fonts.ready.then(() => markReady("fonts"));
    else markReady("fonts");
    return unsub;
  }, []);

  useGSAP(
    (_ctx, contextSafe) => {
      const q = gsap.utils.selector(root);
      repeat.current = sessionStorage.getItem(SEEN_KEY) === "1";
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.body.classList.add("is-locked");

      // Exit sequence: the mark expands and the overlay wipes up into the hero.
      exitRef.current = contextSafe!(() => {
        if (exiting.current) return;
        exiting.current = true;
        sessionStorage.setItem(SEEN_KEY, "1");
        const finish = () => {
          document.body.classList.remove("is-locked");
          markIntroDone();
          setGone(true);
        };
        if (reduced) {
          gsap.to(root.current, { autoAlpha: 0, duration: 0.3, onComplete: finish });
          return;
        }
        gsap
          .timeline({ onComplete: finish })
          .to(q(".loader__mark"), { scale: 9, autoAlpha: 0, duration: 0.7, ease: "expo.in" }, 0)
          .to(q(".loader__word, .loader__meta, .loader__splines"), { autoAlpha: 0, duration: 0.3 }, 0)
          .to(root.current, { clipPath: "inset(0 0 100% 0)", duration: 0.7, ease: "expo.inOut" }, 0.3);
      });

      if (reduced || repeat.current) {
        gsap.set(q(".loader__draw"), { strokeDashoffset: 0 });
        gsap.set(q(".loader__node, .loader__word, .loader__meta"), { autoAlpha: 1 });
        drawn.current = true;
        return;
      }
      gsap
        .timeline({ onComplete: () => void (drawn.current = true) })
        .fromTo(q(".loader__ring"), { strokeDashoffset: 82 }, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" })
        .fromTo(q(".loader__path"), { strokeDashoffset: 46 }, { strokeDashoffset: 0, duration: 0.7, ease: "power2.out", stagger: 0.12 }, 0.35)
        .fromTo(q(".loader__node"), { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.4, stagger: 0.05, transformOrigin: "50% 50%" }, 0.8)
        .fromTo(q(".loader__spline"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, ease: "power2.out", stagger: 0.08 }, 0.4)
        .fromTo(q(".loader__word"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "expo.out" }, 1.0)
        .fromTo(q(".loader__meta"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0.2);
    },
    { scope: root },
  );

  // Exit when every task is ready and the mark has finished drawing, or after the safety timeout.
  useEffect(() => {
    if (gone) return;
    const allReady = TASKS.every((t) => done.has(t));
    let poll: number | undefined;
    if (allReady) {
      const tryExit = () => {
        if (drawn.current) exitRef.current();
        else poll = window.setTimeout(tryExit, 80);
      };
      tryExit();
    }
    return () => {
      if (poll) window.clearTimeout(poll);
    };
  }, [done, gone]);

  // Safety net: never hold the page for longer than MAX_WAIT_MS.
  useEffect(() => {
    const timeout = window.setTimeout(() => exitRef.current(), MAX_WAIT_MS);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => () => document.body.classList.remove("is-locked"), []);

  if (gone) return null;

  const count = TASKS.filter((t) => done.has(t)).length;
  const pending = TASKS.find((t) => !done.has(t));
  const pct = Math.round((count / TASKS.length) * 100);

  return (
    <div ref={root} className="loader" data-theme="dark">
      <svg className="loader__splines" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
        {[
          "M-40 120 C 360 220, 620 420, 800 450 S 1300 720, 1660 820",
          "M-40 760 C 300 640, 640 520, 800 450 S 1240 160, 1660 60",
          "M200 -40 C 380 220, 640 380, 800 450 S 1100 760, 1180 960",
          "M1640 300 C 1300 360, 1000 420, 800 450 S 280 520, -40 600",
        ].map((d, i) => (
          <path key={i} className="loader__spline" d={d} pathLength={1} strokeDasharray="1 1" />
        ))}
      </svg>
      <div className="loader__center">
        <svg className="loader__mark" viewBox="0 0 40 40" width="96" height="96" fill="none" aria-hidden="true">
          <path className="loader__draw loader__ring" d={LOGO_PATHS.ring} stroke="#fff" strokeWidth="1.4" strokeDasharray="82" />
          <path className="loader__draw loader__path" d={LOGO_PATHS.pathA} stroke="#00e89a" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="46" />
          <path className="loader__draw loader__path" d={LOGO_PATHS.pathB} stroke="#00e89a" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="46" />
          {LOGO_PATHS.nodes.map(([x, y]) => (
            <circle key={`${x}-${y}`} className="loader__node" cx={x} cy={y} r="1.8" fill="#fff" />
          ))}
          <circle className="loader__node" cx="20" cy="20" r="2.2" fill="#00e89a" />
        </svg>
        <p className="loader__word">
          OMGX <span>AI</span>
        </p>
      </div>
      <div className="loader__meta">
        <p className="t-utility" role="status" aria-live="polite">
          {pending ? `Loading ${READINESS_LABELS[pending].toLowerCase()} — ${count} of ${TASKS.length} ready` : "Ready"}
        </p>
        <p className="loader__count" aria-hidden="true">
          {String(pct).padStart(3, "0")}
        </p>
        <button type="button" className="loader__skip t-utility" onClick={() => exitRef.current()}>
          Skip intro
        </button>
      </div>
    </div>
  );
}
