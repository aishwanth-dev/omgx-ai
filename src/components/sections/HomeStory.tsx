"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ScrollLines } from "@/components/motion/ScrollLines";
import { CorePoster } from "@/components/three/CorePoster";
import { HeroTitle } from "@/components/sections/HeroTitle";
import { useIsMobile, useMediaQuery, usePrefersReducedMotion, useWebGL } from "@/lib/device";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { INTRO_EVENT, isIntroDone, markReady } from "@/lib/readiness";
import { surfaceAttrs } from "@/lib/surfaces";
import { DEFAULT_LAYOUT, type StoryLayout } from "@/lib/story/layout";
import { chapterWindow, FIELD, JOURNEY, reelCursor, smooth } from "@/lib/story/timeline";
import "@/app/scenes.css";
import "@/app/hero.css";

const StoryCanvas = dynamic(() => import("@/components/three/StoryCanvas"), { ssr: false });

/** Chapter windows (progress 0–1) come from timeline.ts, the same clock the 3D camera journey uses. */
const CHAPTERS = [
  {
    key: "intelligence",
    window: chapterWindow(0),
    label: "Intelligence",
    title: "Intelligence, connected.",
    body: "AI and machine-learning applications, AI agents, computer vision and intelligent workflow automation.",
  },
  {
    key: "systems",
    window: chapterWindow(1),
    label: "Systems",
    title: "Systems, made useful.",
    body: "Data acquisition, industrial communication and monitoring that turn machines and processes into usable information.",
  },
  {
    key: "machines",
    window: chapterWindow(2),
    label: "Machines",
    title: "Machines, made smarter.",
    body: "PLC, SCADA and HMI systems, servo and motion control, robotics and automated testing.",
  },
  {
    key: "immersion",
    window: chapterWindow(3),
    label: "Immersion",
    title: "Experiences beyond the screen.",
    body: "Commercial VR, AR and XR applications for training, safety simulation and interactive 3D environments.",
  },
  {
    key: "integration",
    window: chapterWindow(4),
    label: "Integration",
    title: "Engineered as one.",
    body: "Hardware–software engineering that connects software intelligence with physical systems.",
  },
] as const;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const STACKED_QUERY = "(max-width: 900px), (max-aspect-ratio: 1/1)";

export function HomeStory() {
  const root = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const layout = useRef<StoryLayout>({ ...DEFAULT_LAYOUT });
  const [active, setActive] = useState(true);
  const webgl = useWebGL();
  const mobile = useIsMobile();
  // Portrait tablets use the stacked (object between headline and copy) composition too.
  const portrait = useMediaQuery("(max-aspect-ratio: 1/1)");
  const reduced = usePrefersReducedMotion();

  // Without WebGL (or with reduced motion handled by a static frame) the scene task resolves here.
  useEffect(() => {
    if (webgl === false) markReady("scene");
  }, [webgl]);

  // The canvas lives only while the story is near the viewport: it is unmounted (and its GPU
  // resources released) once the visitor has scrolled past, and mounted again on the way back.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: "50% 0px" });
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

  // The headline dissolves in word by word once the preloader has left (or after 7.5 s at the latest).
  useEffect(() => {
    const h1 = root.current?.querySelector<HTMLElement>('[data-reveal="intro"]');
    if (!h1) return;
    const go = () => h1.classList.add("is-intro");
    if (isIntroDone()) {
      go();
      return;
    }
    window.addEventListener(INTRO_EVENT, go, { once: true });
    const timer = window.setTimeout(go, 7500);
    return () => {
      window.removeEventListener(INTRO_EVENT, go);
      window.clearTimeout(timer);
    };
  }, []);

  useGSAP(
    () => {
      const el = root.current!;
      const q = gsap.utils.selector(el);
      const mm = gsap.matchMedia();
      const stage = q(".story__stage")[0] as HTMLElement;

      // Where the object sits: the free space between the headline block and the copy blocks.
      const measure = () => {
        const sr = q(".story__hero")[0].getBoundingClientRect();
        const H = sr.height;
        if (!H) return;
        const topEl = q(".story__top")[0];
        const footEl = q(".story__foot")[0];
        const top = topEl.getBoundingClientRect().bottom - sr.top - (Number(gsap.getProperty(topEl, "y")) || 0);
        const foot = footEl.getBoundingClientRect().top - sr.top - (Number(gsap.getProperty(footEl, "y")) || 0);
        const a = top + 0.02 * H;
        const b = foot - 0.02 * H;
        // The rings are about 1.9 times wider than the object is tall: keep that inside the viewport width.
        const size = clamp(Math.min(0.34 * H, 0.9 * Math.max(0, b - a), (0.88 * sr.width) / 1.9) / H, 0.14, 0.36);
        const cy = (a + b) / 2;
        const stacked = window.matchMedia(STACKED_QUERY).matches;
        layout.current = { heroY: (cy - H / 2) / H, heroSize: size, reelX: 0, reelY: stacked ? -0.12 : 0 };
        stage.style.setProperty("--hero-cy", `${cy.toFixed(1)}px`);
        stage.style.setProperty("--hero-h", `${(size * H).toFixed(1)}px`);
      };
      measure();
      ScrollTrigger.addEventListener("refresh", measure);
      window.addEventListener("resize", measure);

      // Hero copy fades in after the preloader.
      const heroRest = q(".story__hero-fade");
      const playIntro = () => {
        gsap.to(heroRest, { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.12, delay: 0.5 });
      };

      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          small: "(max-width: 760px)",
        },
        (ctx) => {
          const { motion, small } = ctx.conditions as { motion: boolean; small: boolean };
          if (!motion) {
            progress.current = 0;
            return;
          }

          if (!isIntroDone()) {
            gsap.set(heroRest, { autoAlpha: 0, y: 24 });
            window.addEventListener(INTRO_EVENT, playIntro, { once: true });
          }

          const proxy = { p: 0 };
          const ticks = q(".story__tick") as HTMLElement[];
          const nodes = q(".story__chapter") as HTMLElement[];
          let theme = "dark";
          let activeTick = -2;
          const title = q(".story__title")[0] as HTMLElement | undefined;
          let loopPaused = false;

          // The centred reel: slot s = chapter − cursor. s = 0 is the current block (bright, centred on the
          // stage), −1 the previous title (dimmed and blurred, above), +1 the next title (waiting, below).
          // Tops are measured from the real copy, so the current block is centred whatever its height.
          const GAP = 22;
          let tops: { above: number; mid: number; below: number }[] = nodes.map(() => ({ above: -120, mid: -60, below: 120 }));
          const measureReel = () => {
            const h = nodes.map((n) => n.offsetHeight);
            const hh = nodes.map((n) => (n.firstElementChild as HTMLElement | null)?.offsetHeight ?? 0);
            tops = nodes.map((_, i) => ({
              above: -(h[i + 1] ?? h[i]) / 2 - GAP - hh[i],
              mid: -h[i] / 2,
              below: (h[i - 1] ?? h[i]) / 2 + GAP,
            }));
          };
          measureReel();
          ScrollTrigger.addEventListener("refresh", measureReel);

          const updateReel = (p: number) => {
            const c = reelCursor(p);
            const gate = smooth((p - 0.035) / 0.03) * (1 - smooth((p - 0.8) / 0.04));
            nodes.forEach((n, i) => {
              const s = i + 1 - c;
              const abs = Math.abs(s);
              const near = smooth(Math.min(abs, 1));
              const t = tops[i];
              const sc = clamp(s, -1.6, 2.2);
              const y = sc >= 0 ? t.mid + (t.below - t.mid) * sc : t.mid + (t.above - t.mid) * -sc;
              const floor = s < 0 ? 0.3 : 0.34;
              const out = smooth((abs - 1) / (s < 0 ? 0.5 : 0.6));
              const o = (1 - (1 - floor) * near) * (1 - out) * gate;
              const blur = (s < 0 ? 5.5 : 3.5) * near;
              const more = 1 - smooth(abs / 0.5);
              n.style.opacity = o.toFixed(3);
              n.style.visibility = o > 0.01 ? "visible" : "hidden";
              n.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(${(1 - 0.04 * near).toFixed(4)})`;
              n.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";
              n.style.setProperty("--more", more.toFixed(3));
              ticks[i]?.style.setProperty("--on", (1 - smooth(Math.min(1, abs * 1.1))).toFixed(3));
            });
            const idx = c < 0.5 ? -1 : Math.min(4, Math.round(c) - 1);
            if (idx !== activeTick) {
              activeTick = idx;
              ticks.forEach((t, i) => t.classList.toggle("is-active", i === idx));
            }
          };
          updateReel(0);

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: stage,
              start: "top top",
              end: small ? "+=520%" : "+=720%",
              pin: true,
              scrub: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              // The pin adds scroll space that every trigger below it must measure after it. matchMedia
              // re-creates this trigger on a layout change; without a priority it would be refreshed last.
              refreshPriority: 1,
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
                // The headline loop only runs while the headline is on screen.
                const hide = p > 0.06;
                if (hide !== loopPaused) {
                  loopPaused = hide;
                  title?.classList.toggle("is-paused", hide);
                }
                const nextTheme = p > 0.9 ? "light" : "dark";
                if (nextTheme !== theme) {
                  theme = nextTheme;
                  el.dataset.theme = nextTheme;
                  window.dispatchEvent(new Event("omgx:theme-change"));
                }
                updateReel(p);
              },
            },
            0,
          );

          // Hero out: the headline block lifts away and the copy blocks sink, as the object moves on.
          tl.to(q(".story__top"), { autoAlpha: 0, y: -50, filter: "blur(8px)", duration: 0.05, ease: "power1.in" }, 0.012);
          tl.to(q(".story__foot"), { autoAlpha: 0, y: 40, duration: 0.045, ease: "power1.in" }, 0.012);
          tl.to(q(".story__cue"), { autoAlpha: 0, duration: 0.02 }, 0);
          tl.fromTo(q(".story__progress"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.05);
          tl.to(q(".story__progress"), { autoAlpha: 0, duration: 0.03 }, 0.82);

          // Environment: graphite, then the deep teal and matcha bloom of the next universe while the camera
          // is through the object, then the matcha light field and cool architectural light as it leaves.
          tl.fromTo(q(".story__deep"), { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.14, ease: "power1.inOut" }, 0.44);
          tl.to(q(".story__deep"), { opacity: 0, duration: 0.1, ease: "power1.inOut" }, JOURNEY.exitFrom + 0.02);
          tl.fromTo(q(".story__glow"), { opacity: 0, scale: 0.55 }, { opacity: 1, scale: 1.25, duration: FIELD.full - FIELD.start, ease: "power1.inOut" }, FIELD.start);
          tl.fromTo(q(".story__glow-core"), { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.12, ease: "power1.inOut" }, FIELD.start + 0.06);
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
            ScrollTrigger.removeEventListener("refresh", measureReel);
            window.removeEventListener(INTRO_EVENT, playIntro);
            el.dataset.theme = "dark";
          };
        },
      );

      // Refresh pin measurements once web fonts have settled.
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
      return () => {
        ScrollTrigger.removeEventListener("refresh", measure);
        window.removeEventListener("resize", measure);
        mm.revert();
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} className="story" {...surfaceAttrs("ink", "mist")} data-header-bare="" aria-labelledby="hero-title">
      <div className="story__stage">
        <div className="story__bg" aria-hidden="true">
          <div className="story__deep" />
          <div className="story__glow" />
          <div className="story__glow-core" />
          <div className="story__light" />
        </div>

        <ScrollLines progress={progress} reduced={reduced} />

        <div className="story__canvas" aria-hidden="true">
          {webgl === true && active && (
            <StoryCanvas
              progress={progress}
              pointer={pointer}
              layout={layout}
              active={active}
              mobile={mobile}
              stacked={mobile || portrait}
              reduced={reduced}
            />
          )}
          {webgl === false && <CorePoster className="story__poster" />}
        </div>

        <div className="story__layer">
          <div className="story__hero">
            <div className="story__top">
              <HeroTitle />
            </div>
            <div className="story__foot">
              <div className="story__foot-left story__hero-fade">
                <p className="story__label t-utility">Disciplines</p>
                <ul className="story__disciplines t-utility" aria-label="Disciplines">
                  <li>AI &amp; ML</li>
                  <li>Industrial automation</li>
                  <li>AR / VR / XR</li>
                  <li>Hardware engineering</li>
                </ul>
                <div className="story__ctas">
                  <Link href="/work" className="btn btn--primary">
                    Explore our work <span className="btn__arrow" aria-hidden="true">→</span>
                  </Link>
                  <Link href="/contact" className="btn">
                    Start a project <span className="btn__arrow" aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
              <div className="story__foot-right story__hero-fade">
                <p className="story__label t-utility">Built across disciplines. Made for real-world complexity.</p>
                <p className="story__lead t-lead">
                  We connect AI, industrial automation, immersive technologies and hardware engineering to solve complex
                  real-world challenges.
                </p>
              </div>
            </div>
          </div>

          <div className="story__reel">
            {CHAPTERS.map((c, i) => (
              <div key={c.key} className="story__chapter" data-chapter={c.key}>
                <div className="story__chapter-head">
                  <p className="story__chapter-label t-utility">
                    <span>{String(i + 1).padStart(2, "0")} / 05</span>
                    <span className="story__chapter-rule" aria-hidden="true" />
                    <span>{c.label}</span>
                  </p>
                  <h2 className="t-statement story__chapter-title">{c.title}</h2>
                </div>
                <div className="story__chapter-more">
                  <p className="story__chapter-body">{c.body}</p>
                </div>
              </div>
            ))}
          </div>

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
