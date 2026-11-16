"use client";

// Halftone Wordmark Footer — adapted from the owner-supplied component
// ("some comp.txt"). The wordmark is set enormous, cropped by the bottom edge
// and printed as a field of halftone dots sized by letter coverage. Dots part
// around the pointer on springs and warm toward OMGX red; a click sends a
// shock ring through the word. Links are real Next.js links.

import Link from "next/link";
import * as React from "react";
import { capabilities } from "@/content/capabilities";
import { site, socials } from "@/content/site";
import { Logo } from "@/components/layout/Logo";
import { SocialLink } from "@/components/ui/SocialIcon";
import { getLenis } from "@/lib/lenis";
import { surfaceAttrs } from "@/lib/surfaces";

type FooterLink = { label: string; href?: string };
type FooterColumn = { title: string; links: FooterLink[] };

// Dots are white at the top of the word and soft blue toward the base; they warm to red at the pointer.
const PALETTE = { background: "#05070f", ink: "#f2f5ff", cool: "#8fa8ff", warm: "#ff4a5e" };

function hwfHex(hex: string) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Dot radius for a cell coverage in [0, 1]: area-true, so tone stays even. */
function hwfRadius(coverage: number, gap: number) {
  const c = coverage < 0 ? 0 : coverage > 1 ? 1 : coverage;
  return Math.sqrt(c) * gap * 0.56;
}

/** One spring step toward home plus the push from a pointer within radius r. */
function hwfStep(x: number, y: number, vx: number, vy: number, hx: number, hy: number, px: number, py: number, r: number) {
  const dx = x - px;
  const dy = y - py;
  const d2 = dx * dx + dy * dy;
  if (r > 0 && d2 < r * r) {
    const d = Math.sqrt(d2) + 0.001;
    const f = (1 - d / r) * 2.6;
    vx += (dx / d) * f;
    vy += (dy / d) * f;
  }
  vx = (vx + (hx - x) * 0.05) * 0.84;
  vy = (vy + (hy - y) * 0.05) * 0.84;
  return [x + vx, y + vy, vx, vy];
}

function hwfWarmth(x: number, y: number, hx: number, hy: number, span: number) {
  const d = Math.hypot(x - hx, y - hy);
  return span > 0 ? Math.min(1, d / span) : 0;
}

function hwfFitSize(measured: number, width: number) {
  return measured > 0 ? (width / measured) * 100 : 0;
}

export function HalftoneFooter({
  wordmark = "OMGX AI",
  dotGap = 6,
  radius = 90,
  crop = 0.18,
  grain = 0.5,
  fontFamily = "var(--font-geist-local)",
  fontWeight = 800,
}: {
  wordmark?: string;
  dotGap?: number;
  radius?: number;
  crop?: number;
  grain?: number;
  fontFamily?: string;
  fontWeight?: number;
}) {
  const rootRef = React.useRef<HTMLElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const columns: FooterColumn[] = [
    {
      title: "Explore",
      links: [
        { label: "Home", href: "/" },
        { label: "Work", href: "/work" },
        { label: "Products & R&D", href: "/products-research" },
        { label: "About", href: "/about" },
      ],
    },
    {
      title: "Capabilities",
      links: capabilities.map((c) => ({ label: c.shortTitle, href: `/capabilities/${c.slug}` })),
    },
    {
      title: "Contact",
      links: [
        { label: "Start a project", href: "/contact" },
        { label: site.contact.supportEmail, href: `mailto:${site.contact.supportEmail}` },
        ...site.contact.addressLines.map((line) => ({ label: line })),
      ],
    },
  ];

  React.useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resolve CSS-variable font stacks to a real family list for canvas text.
    const resolveFont = () => {
      if (!fontFamily.startsWith("var(")) return fontFamily;
      const name = fontFamily.slice(4, -1).trim();
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || "Helvetica, Arial, sans-serif";
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let px = -1e5;
    let py = -1e5;
    let raf = 0;
    let visible = true;
    let awake = true;
    let ring = { x: 0, y: 0, t: -1 };
    let dots = new Float32Array(0);
    let count = 0;
    let grainTile: HTMLCanvasElement | null = null;
    const ink = hwfHex(PALETTE.ink) || [242, 245, 255];
    const cool = hwfHex(PALETTE.cool) || [143, 168, 255];
    const warm = hwfHex(PALETTE.warm) || [255, 74, 94];

    const layout = () => {
      const rect = root.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      const mask = document.createElement("canvas");
      mask.width = w;
      mask.height = h;
      const m = mask.getContext("2d", { willReadFrequently: true });
      if (!m) return;
      const family = resolveFont();
      m.font = `${fontWeight} 100px ${family}`;
      const word = wordmark || " ";
      const fit = hwfFitSize(m.measureText(word).width, w * (w < 720 ? 0.94 : 1.02));
      m.font = `${fontWeight} ${fit}px ${family}`;
      const box = m.measureText(word);
      const cap = box.actualBoundingBoxAscent || fit * 0.72;
      const c = Math.max(0, Math.min(0.6, crop));
      m.fillStyle = "#000";
      m.textBaseline = "alphabetic";
      m.fillText(word, (w - box.width) / 2, h + cap * c);
      const img = m.getImageData(0, 0, w, h).data;

      const gap = Math.max(3, dotGap);
      const cols = Math.ceil(w / gap);
      const rows = Math.ceil(h / gap);
      const tmp: number[] = [];
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          let sum = 0;
          for (let sy = 0; sy < 3; sy++) {
            for (let sx = 0; sx < 3; sx++) {
              const x = Math.min(w - 1, Math.floor(gx * gap + ((sx + 0.5) * gap) / 3));
              const y = Math.min(h - 1, Math.floor(gy * gap + ((sy + 0.5) * gap) / 3));
              sum += img[(y * w + x) * 4 + 3];
            }
          }
          const cov = sum / (9 * 255);
          if (cov < 0.06) continue;
          const hx = gx * gap + gap / 2;
          const hy = gy * gap + gap / 2;
          tmp.push(hx, hy, 0, 0, hx, hy, hwfRadius(cov, gap));
        }
      }
      dots = new Float32Array(tmp);
      count = tmp.length / 7;

      grainTile = document.createElement("canvas");
      grainTile.width = 256;
      grainTile.height = 256;
      const g = grainTile.getContext("2d");
      if (g) {
        const id = g.createImageData(256, 256);
        for (let i = 0; i < id.data.length; i += 4) {
          const v = Math.random() * 255;
          id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
          id.data[i + 3] = Math.random() < 0.5 ? 0 : 255;
        }
        g.putImageData(id, 0, 0);
      }
      awake = true;
    };

    const draw = (now: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = PALETTE.background;
      ctx.fillRect(0, 0, w, h);
      // Soft blue (lower left) and red (lower right) blooms behind the word, a faint violet
      // where they meet. Each is an ellipse that reaches zero well before the footer's top
      // edge, so the top row is exactly the page colour and meets the section above without a seam.
      const bloom = (cx: number, cy: number, rx: number, ry: number, rgb: string, a: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(rx / ry, 1);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, ry);
        g.addColorStop(0, `rgba(${rgb}, ${a})`);
        g.addColorStop(0.35, `rgba(${rgb}, ${a * 0.58})`);
        g.addColorStop(0.7, `rgba(${rgb}, ${a * 0.17})`);
        g.addColorStop(1, `rgba(${rgb}, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(-rx * 2, -ry * 2, rx * 4, ry * 4);
        ctx.restore();
      };
      bloom(w * 0.16, h * 0.98, w * 0.62, h * 0.8, "31, 79, 216", 0.34);
      bloom(w * 0.5, h * 1.02, w * 0.5, h * 0.55, "91, 42, 140", 0.14);
      bloom(w * 0.86, h * 1.04, w * 0.58, h * 0.78, "212, 33, 61", 0.3);

      const r = !reduced ? Math.max(0, radius) : 0;
      const ringAge = ring.t < 0 ? 1e9 : now - ring.t;
      const ringR = ringAge * 0.9;
      let moving = false;
      for (let i = 0; i < count; i++) {
        const j = i * 7;
        let x = dots[j];
        let y = dots[j + 1];
        let vx = dots[j + 2];
        let vy = dots[j + 3];
        const hx = dots[j + 4];
        const hy = dots[j + 5];
        if (!reduced) {
          if (ringAge < 900) {
            const dx = hx - ring.x;
            const dy = hy - ring.y;
            const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
            const band = 1 - Math.min(1, Math.abs(d - ringR) / 26);
            if (band > 0) {
              const f = band * 3.2 * (1 - ringAge / 900);
              vx += (dx / d) * f;
              vy += (dy / d) * f;
            }
          }
          const s = hwfStep(x, y, vx, vy, hx, hy, px, py, r);
          x = s[0];
          y = s[1];
          vx = s[2];
          vy = s[3];
          if (Math.abs(vx) + Math.abs(vy) > 0.02 || Math.abs(x - hx) + Math.abs(y - hy) > 0.05) moving = true;
          else {
            x = hx;
            y = hy;
            vx = 0;
            vy = 0;
          }
          dots[j] = x;
          dots[j + 1] = y;
          dots[j + 2] = vx;
          dots[j + 3] = vy;
        }
        const k = hwfWarmth(x, y, hx, hy, 28);
        const t = Math.max(0, Math.min(1, (hy - h * 0.76) / (h * 0.3)));
        const br = ink[0] + (cool[0] - ink[0]) * t;
        const bg = ink[1] + (cool[1] - ink[1]) * t;
        const bb = ink[2] + (cool[2] - ink[2]) * t;
        ctx.fillStyle = `rgb(${Math.round(br + (warm[0] - br) * k)},${Math.round(bg + (warm[1] - bg) * k)},${Math.round(bb + (warm[2] - bb) * k)})`;
        ctx.beginPath();
        ctx.arc(x, y, dots[j + 6], 0, 6.2832);
        ctx.fill();
      }

      if (grainTile && grain > 0) {
        ctx.globalAlpha = Math.min(1, grain) * 0.09;
        ctx.globalCompositeOperation = "overlay";
        const pattern = ctx.createPattern(grainTile, "repeat");
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, w, h);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }
      awake = moving || ringAge < 900 || px > -1e4;
    };

    const loop = (now: number) => {
      raf = 0;
      if (!visible) return;
      draw(now);
      if (awake) raf = requestAnimationFrame(loop);
    };
    const wake = () => {
      awake = true;
      if (!raf && visible) raf = requestAnimationFrame(loop);
    };
    const toLocal = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect();
      return [e.clientX - b.left, e.clientY - b.top];
    };
    const onMove = (e: PointerEvent) => {
      const p = toLocal(e);
      px = p[0];
      py = p[1];
      wake();
    };
    const onLeave = () => {
      px = -1e5;
      py = -1e5;
      wake();
    };
    const onDown = (e: PointerEvent) => {
      if (reduced) return;
      if ((e.target as HTMLElement).closest("a,button")) return;
      const p = toLocal(e);
      ring = { x: p[0], y: p[1], t: performance.now() };
      wake();
    };

    layout();
    draw(performance.now());
    wake();

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerdown", onDown);
    const ro = new ResizeObserver(() => {
      layout();
      wake();
    });
    ro.observe(root);
    const io = new IntersectionObserver((entries) => {
      visible = entries[0] ? entries[0].isIntersecting : true;
      if (visible) wake();
    });
    io.observe(root);
    let alive = true;
    document.fonts?.ready.then(() => {
      if (!alive) return;
      layout();
      wake();
    });

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerdown", onDown);
    };
  }, [wordmark, dotGap, radius, crop, grain, fontFamily, fontWeight]);

  const toTop = () => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { duration: 2.2 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer ref={rootRef} className="hwf-root" {...surfaceAttrs("footer")}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <span className="sr-only">{wordmark}</span>
      <div className="hwf-top">
        <div className="hwf-brand">
          <Link href="/" className="hwf-logo" aria-label="OMGX AI — home">
            <Logo size={44} />
          </Link>
          <strong>{site.legalName}</strong>
          <span>
            © {new Date().getFullYear()} · Formerly {site.formerName}
          </span>
          <span className="hwf-tag">Think beyond. Engineer what&apos;s next.</span>
          <ul className="hwf-social" aria-label="Social media">
            {socials.map((s) => (
              <li key={s.icon}>
                <SocialLink href={s.href} icon={s.icon} label={s.label} variant="chip" />
              </li>
            ))}
          </ul>
        </div>
        {columns.map((col) => (
          <nav className="hwf-col" key={col.title} aria-label={col.title}>
            <h2>{col.title}</h2>
            <ul>
              {col.links.map((l) => (
                <li key={l.label}>
                  {!l.href ? (
                    <span className="hwf-addr">{l.label}</span>
                  ) : l.href.startsWith("/") ? (
                    <Link href={l.href}>{l.label}</Link>
                  ) : (
                    <a href={l.href} {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="hwf-rule">
        <button type="button" className="hwf-up" onClick={toTop}>
          Back to top ↑
        </button>
      </div>
    </footer>
  );
}
