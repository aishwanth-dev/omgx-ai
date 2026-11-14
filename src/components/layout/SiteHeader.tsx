"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { primaryNav } from "@/content/site";
import { Logo } from "./Logo";
import { MegaMenu, type MegaKey } from "./MegaMenu";

type HeaderTheme = "dark" | "light";

export function SiteHeader() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [mega, setMega] = useState<{ key: MegaKey; path: string } | null>(null);
  const [mobile, setMobile] = useState<{ path: string } | null>(null);
  const [theme, setTheme] = useState<HeaderTheme>("dark");
  const [scrolled, setScrolled] = useState(false);
  const [bare, setBare] = useState(false);

  // Menus are only considered open on the route where they were opened.
  const megaKey = mega && mega.path === pathname ? mega.key : null;
  const mobileOpen = !!mobile && mobile.path === pathname;
  const anyOpen = !!megaKey || mobileOpen;

  const closeAll = useCallback(() => {
    setMega(null);
    setMobile(null);
  }, []);

  // Detect the theme of the section beneath the header so text stays legible.
  useEffect(() => {
    let raf = 0;
    const sample = () => {
      raf = 0;
      const header = headerRef.current;
      const y = 36;
      const xs = [24, window.innerWidth / 2, window.innerWidth - 24];
      let found: HeaderTheme | null = null;
      let overBare = false;
      for (const x of xs) {
        const stack = document.elementsFromPoint(x, y);
        for (const el of stack) {
          if (header && header.contains(el)) continue;
          if (el.closest(".mega, .mobile-menu")) continue;
          const themed = el.closest<HTMLElement>("[data-theme]");
          // The pinned story manages its own backdrop; with reduced motion it scrolls normally.
          if (el.closest("[data-header-bare]") && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            overBare = true;
          }
          if (themed && themed !== document.body) {
            found = themed.dataset.theme === "dark" ? "dark" : "light";
            break;
          }
        }
        if (found) break;
      }
      if (found) setTheme((prev) => (prev === found ? prev : found));
      setBare((prev) => (prev === overBare ? prev : overBare));
      const isScrolled = window.scrollY > 24;
      setScrolled((prev) => (prev === isScrolled ? prev : isScrolled));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(sample);
    };
    sample();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("omgx:theme-change", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("omgx:theme-change", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pathname]);

  // Escape closes menus and restores focus; body scroll lock for the mobile overlay.
  useEffect(() => {
    if (!anyOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const key = megaKey;
        closeAll();
        if (key) triggerRefs.current[key]?.focus();
        else headerRef.current?.querySelector<HTMLButtonElement>(".menu-toggle")?.focus();
      }
      // Simple focus trap for the full-screen mobile menu.
      if (e.key === "Tab" && mobileOpen && headerRef.current) {
        const focusables = Array.from(
          headerRef.current.querySelectorAll<HTMLElement>(
            ".site-header__logo, .menu-toggle, .mobile-menu a, .mobile-menu button",
          ),
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!megaKey) return;
      const target = e.target as Node;
      if (headerRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest?.(".mega")) return;
      setMega(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    if (mobileOpen) document.body.classList.add("is-locked");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      document.body.classList.remove("is-locked");
    };
  }, [anyOpen, megaKey, mobileOpen, closeAll]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      ref={headerRef}
      className={`site-header${scrolled && !bare ? " is-scrolled" : ""}${anyOpen ? " is-open" : ""}`}
      data-header-theme={anyOpen ? "dark" : theme}
    >
      <div className="container site-header__inner">
        <Link href="/" className="site-header__logo" aria-label="OMGX AI — home" onClick={closeAll}>
          <Logo />
        </Link>

        <nav className="site-header__nav" aria-label="Primary">
          {primaryNav.map((item) =>
            item.mega ? (
              <button
                key={item.href}
                ref={(el) => {
                  triggerRefs.current[item.mega!] = el;
                }}
                type="button"
                className="nav-link"
                aria-expanded={megaKey === item.mega}
                aria-controls={`mega-${item.mega}`}
                aria-current={isActive(item.href) ? "page" : undefined}
                onClick={() =>
                  setMega((m) => (m && m.key === item.mega && m.path === pathname ? null : { key: item.mega!, path: pathname }))
                }
              >
                {item.label}
                <span className="nav-link__caret" aria-hidden="true" />
              </button>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link"
                aria-current={isActive(item.href) ? "page" : undefined}
                onClick={closeAll}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <Link href="/contact" className="btn btn--primary site-header__cta" onClick={closeAll}>
          Start a project <span className="btn__arrow" aria-hidden="true">→</span>
        </Link>

        <button
          type="button"
          className="menu-toggle"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobile((m) => (m && m.path === pathname ? null : { path: pathname }))}
        >
          <span>{mobileOpen ? "Close" : "Menu"}</span>
          <span className="menu-toggle__bars" aria-hidden="true" />
        </button>
      </div>

      <AnimatePresence>
        {megaKey && <MegaMenu key={megaKey} which={megaKey} onNavigate={closeAll} />}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            className="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <nav aria-label="Mobile">
              <ul className="mobile-menu__list">
                {[{ label: "Home", href: "/" }, ...primaryNav].map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={item.href}
                      className="mobile-menu__link"
                      aria-current={isActive(item.href) ? "page" : undefined}
                      onClick={closeAll}
                    >
                      <span>{item.label}</span>
                      <span>{String(i).padStart(2, "0")}</span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </nav>
            <div className="mobile-menu__foot">
              <Link href="/contact" className="btn btn--primary" onClick={closeAll}>
                Start a project <span className="btn__arrow" aria-hidden="true">→</span>
              </Link>
              <p className="t-utility" style={{ color: "var(--omgx-mint)" }}>
                Think beyond. Engineer what&apos;s next.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
