"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CorePoster } from "@/components/three/CorePoster";
import { useIsMobile, useMediaQuery, usePrefersReducedMotion, useWebGL } from "@/lib/device";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { INTRO_EVENT, isIntroDone, markReady } from "@/lib/readiness";

const StoryCanvas = dynamic(() => import("@/components/three/StoryCanvas"), { ssr: false });

/** Chapter windows (progress 0–1) — must match the keyframes in StoryScene. */
const CHAPTERS = [
  {
    key: "intelligence",
    window: [0.08, 0.2],
    label: "Intelligence",
    title: "Intelligence, connected.",
    body: "AI and machine-learning applications, AI agents, computer vision and intelligent workflow automation.",
    vertical: "01 — Artificial Intelligence & Machine Learning",
  },
  {
    key: "systems",
    window: [0.22, 0.34],
    label: "Systems",
    title: "Systems, made useful.",
    body: "Data acquisition, industrial communication and monitoring that turn machines and processes into usable information.",
    vertical: "Data · Communication · Monitoring",
  },
  {
    key: "machines",
    window: [0.38, 0.5],
    label: "Machines",
    title: "Machines, made smarter.",
    body: "PLC, SCADA and HMI systems, servo and motion control, robotics and automated testing.",
    vertical: "02 — Industrial Automation & Robotics",
  },
  {
    key: "immersion",
    window: [0.54, 0.66],
    label: "Immersion",
    title: "Experiences beyond the screen.",
    body: "Commercial VR, AR and XR applications for training, safety simulation and interactive 3D environments.",
    vertical: "03 — Immersive Technologies: AR / VR / XR",
  },
  {
    key: "integration",
    window: [0.7, 0.8],
    label: "Integration",
    title: "Engineered as one.",
    body: "Hardware–software engineering that connects software intelligence with physical systems.",
    vertical: "04 — Hardware Engineering & Integration",
  },
] as const;

export function HomeStory() {
  const root = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const [active, setActive] = useState(true);
  const webgl = useWebGL();
  const mobile = useIsMobile();
  // Portrait tablets use the stacked (object above headline) composition too.
  const portrait = useMediaQuery("(max-aspect-ratio: 1/1)");
  const reduced = usePrefersReducedMotion();

  // Without WebGL (or with reduced motion handled by a static frame) the scene task resolves here.
  useEffect(() => {
    if (webgl === false) markReady("scene");
  }, [webgl]);

  // Pause the render loop when the story is off-screen.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useGSAP(
    () => {
      const el = root.current!;
      const q = gsap.utils.selector(el);
      const mm = gsap.matchMedia();

      // Hero intro: lines rise once the preloader has finished.
      const heroLines = q(".story__hero-line > span");
      const heroRest = q(".story__hero-fade");
      const playIntro = () => {
        gsap.to(heroLines, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.09 });
        gsap.to(heroRest, { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.06, delay: 0.25 });
      };

      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          small: "(max-width: 760px)",
        },
        (ctx) => {
          const { motion, small } = ctx.conditions as { motion: boolean; small: boolean };
          if (!motion) {
            progress.current = 0.1;
            return;
          }

          if (!isIntroDone()) {
            gsap.set(heroLines, { yPercent: 110 });
            gsap.set(heroRest, { autoAlpha: 0, y: 24 });
            window.addEventListener(INTRO_EVENT, playIntro, { once: true });
          }

          const stage = q(".story__stage")[0];
          const proxy = { p: 0 };
          const ticks = q(".story__tick");
          let theme = "dark";
          let activeTick = -1;

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: stage,
              start: "top top",
              end: small ? "+=520%" : "+=720%",
              pin: true,
              scrub: 0.9,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          tl.to(
            proxy,
            {
              p: 1,
              duration: 1,
              onUpdate: () => {
                const p = proxy.p;
                progress.current = p;
                const nextTheme = p > 0.9 ? "light" : "dark";
                if (nextTheme !== theme) {
                  theme = nextTheme;
                  el.dataset.theme = nextTheme;
                  window.dispatchEvent(new Event("omgx:theme-change"));
                }
                const idx = CHAPTERS.findIndex((c) => p >= c.window[0] - 0.02 && p <= c.window[1] + 0.02);
                if (idx !== activeTick) {
                  activeTick = idx;
                  ticks.forEach((t, i) => t.classList.toggle("is-active", i === idx));
                }
              },
            },
            0,
          );

          // Hero out.
          tl.to(q(".story__hero"), { autoAlpha: 0, y: -70, duration: 0.05, ease: "power1.in" }, 0.015);
          tl.to(q(".story__cue"), { autoAlpha: 0, duration: 0.02 }, 0);
          tl.fromTo(q(".story__progress"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.05);
          tl.to(q(".story__progress"), { autoAlpha: 0, duration: 0.03 }, 0.82);

          // Chapters in and out (crossfade with vertical drift and a slight blur resolve).
          CHAPTERS.forEach((c) => {
            const node = q(`[data-chapter="${c.key}"]`);
            const [a, b] = c.window;
            tl.fromTo(
              node,
              { autoAlpha: 0, y: 60, filter: "blur(10px)" },
              { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.035, ease: "power2.out" },
              a,
            );
            tl.to(node, { autoAlpha: 0, y: -60, filter: "blur(8px)", duration: 0.03, ease: "power2.in" }, b - 0.03);
          });

          // Environment: graphite → matcha light field → cool architectural light.
          tl.fromTo(q(".story__glow"), { opacity: 0, scale: 0.55 }, { opacity: 1, scale: 1.25, duration: 0.26, ease: "power1.inOut" }, 0.6);
          tl.fromTo(q(".story__glow-core"), { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.18, ease: "power1.inOut" }, 0.7);
          tl.fromTo(q(".story__light"), { opacity: 0 }, { opacity: 1, duration: 0.12, ease: "power1.inOut" }, 0.87);

          // Manifesto.
          const lines = q(".story__manifesto-line");
          tl.fromTo(
            lines,
            { autoAlpha: 0, yPercent: 40, scale: 0.96, filter: "blur(12px)" },
            { autoAlpha: 1, yPercent: 0, scale: 1, filter: "blur(0px)", duration: 0.05, stagger: 0.025, ease: "power2.out" },
            0.84,
          );
          tl.fromTo(q(".story__manifesto-sub"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, 0.92);

          return () => {
            window.removeEventListener(INTRO_EVENT, playIntro);
            el.dataset.theme = "dark";
          };
        },
      );

      // Refresh pin measurements once web fonts have settled.
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="story" data-theme="dark" data-header-bare="" aria-labelledby="hero-title">
      <div className="story__stage">
        <div className="story__bg" aria-hidden="true">
          <div className="story__glow" />
          <div className="story__glow-core" />
          <div className="story__light" />
        </div>

        <div className="story__canvas" aria-hidden="true">
          {webgl === true && (
            <StoryCanvas progress={progress} pointer={pointer} active={active} mobile={mobile} stacked={mobile || portrait} reduced={reduced} />
          )}
          {webgl === false && <CorePoster className="story__poster" />}
        </div>

        <div className="story__layer">
          <div className="story__hero container">
            <p className="story__eyebrow t-utility story__hero-fade">
              OMGX AI&nbsp;&nbsp;/&nbsp;&nbsp;Engineering intelligence
            </p>
            <h1 id="hero-title" className="story__title t-display-xl">
              <span className="story__hero-line">
                <span>Think beyond.</span>
              </span>
              <span className="story__hero-line">
                <span>Engineer what&apos;s next.</span>
              </span>
            </h1>
            <div className="story__hero-foot">
              <p className="story__lead t-lead story__hero-fade">
                We connect AI, industrial automation, immersive technologies and hardware engineering to solve complex
                real-world challenges.
              </p>
              <div className="story__ctas story__hero-fade">
                <Link href="/work" className="btn btn--primary">
                  Explore our work <span className="btn__arrow" aria-hidden="true">→</span>
                </Link>
                <Link href="/contact" className="btn">
                  Start a project <span className="btn__arrow" aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
            <ul className="story__disciplines t-utility story__hero-fade" aria-label="Disciplines">
              <li>AI &amp; ML</li>
              <li>Industrial automation</li>
              <li>AR / VR / XR</li>
              <li>Hardware engineering</li>
            </ul>
          </div>

          {CHAPTERS.map((c, i) => (
            <div key={c.key} className="story__chapter" data-chapter={c.key}>
              <p className="story__chapter-label t-utility">
                <span>{String(i + 1).padStart(2, "0")} / 05</span>
                <span className="story__chapter-rule" aria-hidden="true" />
                <span>{c.label}</span>
              </p>
              <h2 className="t-statement story__chapter-title">{c.title}</h2>
              <p className="story__chapter-body">{c.body}</p>
              <p className="story__chapter-vertical t-utility">{c.vertical}</p>
            </div>
          ))}

          <div className="story__manifesto" aria-label="Think beyond. Engineer what's next.">
            <p className="story__manifesto-line t-display-l" aria-hidden="true">
              Think beyond.
            </p>
            <p className="story__manifesto-line t-display-l" aria-hidden="true">
              Engineer what&apos;s next.
            </p>
            <p className="story__manifesto-sub t-utility">OMGX AI — Intelligence engineered for the real world</p>
          </div>
        </div>

        <div className="story__progress" aria-hidden="true">
          {CHAPTERS.map((c, i) => (
            <span key={c.key} className="story__tick">
              <span className="story__tick-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="story__tick-label">{c.label}</span>
            </span>
          ))}
        </div>

        <div className="story__cue t-utility" aria-hidden="true">
          <span className="story__cue-line" />
          Scroll to explore
        </div>

        <a className="story__skip t-utility" href="#capabilities">
          Skip the story ↓
        </a>
      </div>
    </section>
  );
}
