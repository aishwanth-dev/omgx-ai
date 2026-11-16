"use client";

/**
 * RouteGlobe: a dotted 2D-canvas globe with great-circle arcs from one origin.
 * Adapted from the owner's RouteGlobe (use_comps.txt). Drag to spin; it turns
 * slowly on its own after 2.5 s without input. Draws from the GSAP ticker, pauses
 * off-screen and in hidden tabs, and is a single static frame with reduced motion.
 */
import { useEffect, useRef } from "react";
import type { Location } from "@/content/company";
import { gsap } from "@/lib/gsap";
import { arcPoints, drawArc, drawBody, drawDots, drawMarker, projectView, type GlobeView } from "@/lib/globe/draw";
import { dotVectors, highlightIndices, isHighlightKey, landIndices, type DotCount } from "@/lib/globe/landDots";
import { facing, toVec, type Vec3 } from "@/lib/globe/math";
import "@/app/globe.css";

const RAD = Math.PI / 180;
const THEME = {
  body: "#080c18",
  glow: "rgba(79, 124, 255, 0.10)",
  land: "#7d869e",
  accent: "#4f7cff",
  origin: "#ff4a5e",
};
const BASE_PITCH = 12 * RAD;
const IDLE_MS = 2500;
const SPIN = 0.08; // rad/s
const TAU = 0.35; // s, easing towards a selected geography
const MAX_PITCH = 0.9;
const COMET_CYCLE = 3.6; // s

type Props = {
  locations: Location[];
  /** Key of the location the arcs start from. */
  originKey: string;
  active: number | null;
  reduced: boolean;
};

const wrapPi = (a: number) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smoothstep = (x: number, a: number, b: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export function RouteGlobe({ locations, originKey, active, reduced }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const labels = useRef<(HTMLSpanElement | null)[]>([]);
  const activeRef = useRef(active);
  const api = useRef<{ select: (i: number | null) => void } | null>(null);

  useEffect(() => {
    const el = host.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!el || !cv || !ctx) return;

    const n: DotCount = window.matchMedia("(max-width: 760px)").matches ? 18000 : 30000;
    const land = dotVectors(landIndices(n), n);
    const places = locations.map((l, i) => ({
      l,
      v: toVec(l.lat, l.lon) as Vec3,
      dots: isHighlightKey(l.key) ? dotVectors(highlightIndices(n, l.key), n) : null,
      offset: i / locations.length,
    }));
    const origin = places.find((p) => p.l.key === originKey) ?? places[0];
    const routes = places.filter((p) => p !== origin);

    const home = facing(BASE_PITCH / RAD, origin.l.lon - 3);
    const st = {
      yaw: home.yaw,
      pitch: BASE_PITCH,
      vy: 0,
      vp: 0,
      idle: performance.now(),
      focus: null as { yaw: number; pitch: number } | null,
      t: 0,
    };
    const drag = { on: false, pending: false, touch: false, id: -1, sx: 0, sy: 0, px: 0, py: 0, ts: 0 };
    let W = 0;
    let H = 0;
    let dpr = 1;

    const view = (): GlobeView => ({ cx: W / 2, cy: H / 2, r: Math.min(W, H) * 0.4, yaw: st.yaw, pitch: st.pitch });

    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = el.clientWidth;
      H = el.clientHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!W || !H) return;
      const vw = view();
      const sel = activeRef.current;
      const dot = Math.max(1.3, vw.r / 170);
      drawBody(ctx, vw, THEME.body, THEME.glow);
      drawDots(ctx, land, vw, THEME.land, dot, 0.85);
      places.forEach((p, i) => {
        if (p.dots) drawDots(ctx, p.dots, vw, THEME.accent, dot, sel === null ? 0.5 : sel === i ? 1 : 0.28);
      });

      const pulses = new Map<number, number>();
      for (const rt of routes) {
        const i = places.indexOf(rt);
        const phase = reduced ? null : (st.t / COMET_CYCLE + rt.offset) % 1;
        const emphasis = sel === null || sel === places.indexOf(origin) ? 1 : sel === i ? 2.4 : 0.6;
        pulses.set(i, drawArc(ctx, arcPoints(origin.v, rt.v, vw), vw, THEME.accent, phase, emphasis));
      }

      places.forEach((p, i) => {
        const s = projectView(p.v, vw);
        const isOrigin = p === origin;
        const isActive = sel === i;
        if (s.z > 0) {
          drawMarker(ctx, s, isOrigin ? THEME.origin : THEME.accent, {
            radius: isOrigin ? 3.6 : isActive ? 4 : 2.6,
            ring: isOrigin ? 8 + (reduced ? 0 : Math.sin(st.t * 2.4)) : isActive ? 9 : 0,
            pulse: pulses.get(i) ?? -1,
          });
        }
        const label = labels.current[i];
        if (label) {
          // Singapore sits beside Jakarta, so its label shows only when selected.
          const show = p.dots || isOrigin || isActive ? 1 : 0;
          label.style.opacity = String(show * smoothstep(s.z, 0.05, 0.3));
          label.style.transform = `translate(${s.x + 10}px, ${s.y}px) translateY(-50%)`;
        }
      });
    };

    const tick = (_time: number, deltaMs: number) => {
      const dt = Math.min(0.05, Math.max(0, deltaMs) / 1000);
      st.t += dt;
      if (!drag.on) {
        if (st.focus) {
          const k = 1 - Math.exp(-dt / TAU);
          st.yaw += wrapPi(st.focus.yaw - st.yaw) * k;
          st.pitch += (st.focus.pitch - st.pitch) * k;
        } else {
          st.yaw += st.vy * dt;
          st.pitch = clamp(st.pitch + st.vp * dt, -MAX_PITCH, MAX_PITCH);
          const decay = Math.pow(0.05, dt);
          st.vy *= decay;
          st.vp *= decay;
          if (performance.now() - st.idle > IDLE_MS) {
            st.yaw += SPIN * dt;
            st.pitch += (BASE_PITCH - st.pitch) * Math.min(1, dt * 0.4);
          }
        }
      }
      draw();
    };

    let visible = false;
    let running = false;
    const sync = () => {
      const want = !reduced && visible && !document.hidden;
      if (want && !running) gsap.ticker.add(tick);
      if (!want && running) gsap.ticker.remove(tick);
      running = want;
    };

    (window as unknown as { __globe: unknown }).__globe = st;
    api.current = {
      select: (i) => {
        if (i === null) {
          st.focus = null;
          st.idle = performance.now();
        } else {
          const f = facing(locations[i].lat, locations[i].lon);
          st.focus = { yaw: st.yaw + wrapPi(f.yaw - st.yaw), pitch: clamp(f.pitch, -MAX_PITCH, MAX_PITCH) };
          st.vy = st.vp = 0;
          if (reduced) {
            st.yaw = st.focus.yaw;
            st.pitch = st.focus.pitch;
          }
        }
        if (!running) draw();
      },
    };

    const begin = (e: PointerEvent) => {
      drag.on = true;
      drag.pending = false;
      st.focus = null;
      st.vy = st.vp = 0;
      cv.setPointerCapture(e.pointerId);
      el.dataset.dragging = "";
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      drag.id = e.pointerId;
      drag.touch = e.pointerType !== "mouse";
      drag.sx = drag.px = e.clientX;
      drag.sy = drag.py = e.clientY;
      drag.ts = e.timeStamp;
      drag.pending = drag.touch;
      if (!drag.touch) begin(e);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== drag.id) return;
      if (drag.pending) {
        // Touch: horizontal movement spins the globe; vertical movement stays a page scroll.
        const dx = Math.abs(e.clientX - drag.sx);
        const dy = Math.abs(e.clientY - drag.sy);
        if (dy > 6 && dy >= dx) drag.pending = false;
        else if (dx > 6) begin(e);
        if (!drag.on) return;
      }
      if (!drag.on) return;
      const r = Math.min(W, H) * 0.4 || 1;
      const dx = (e.clientX - drag.px) / r;
      const dy = drag.touch ? 0 : (e.clientY - drag.py) / r;
      const dtm = Math.max((e.timeStamp - drag.ts) / 1000, 1 / 120);
      drag.px = e.clientX;
      drag.py = e.clientY;
      drag.ts = e.timeStamp;
      st.yaw += dx;
      st.pitch = clamp(st.pitch + dy, -MAX_PITCH, MAX_PITCH);
      st.vy = clamp(dx / dtm, -4, 4);
      st.vp = clamp(dy / dtm, -4, 4);
      st.idle = performance.now();
      if (!running) draw();
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== drag.id) return;
      drag.pending = false;
      drag.id = -1;
      if (!drag.on) return;
      drag.on = false;
      st.idle = performance.now();
      if (reduced) st.vy = st.vp = 0;
      delete el.dataset.dragging;
    };
    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerup", onUp);
    cv.addEventListener("pointercancel", onUp);

    const ro = new ResizeObserver(() => {
      size();
      draw();
    });
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    size();
    if (activeRef.current !== null) api.current.select(activeRef.current);
    draw();

    return () => {
      gsap.ticker.remove(tick);
      running = false;
      api.current = null;
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      cv.removeEventListener("pointerdown", onDown);
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerup", onUp);
      cv.removeEventListener("pointercancel", onUp);
    };
  }, [locations, originKey, reduced]);

  useEffect(() => {
    activeRef.current = active;
    api.current?.select(active);
  }, [active]);

  const destinations = locations.filter((l) => l.key !== originKey).map((l) => l.name);
  const originName = locations.find((l) => l.key === originKey)?.name ?? "";

  return (
    <div ref={host} className="globe__stage">
      <canvas
        ref={canvas}
        className="globe__canvas"
        role="img"
        aria-label={`Dotted globe with arcs from ${originName} to ${destinations.join(", ")}`}
      />
      <div className="globe__labels" aria-hidden="true">
        {locations.map((l, i) => (
          <span
            key={l.key}
            ref={(node) => {
              labels.current[i] = node;
            }}
            className="globe__label"
            data-active={String(active === i)}
          >
            {l.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default RouteGlobe;
