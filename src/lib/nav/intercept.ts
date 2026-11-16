/** Link interception for the route curtain. Pure, unit- and property-tested. */
export type ClickInfo = {
  button: number;
  meta: boolean;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  defaultPrevented: boolean;
};
export type AnchorInfo = { href: string; target: string | null; download: boolean };

export function shouldIntercept(c: ClickInfo, a: AnchorInfo | null, here: URL): URL | null {
  if (!a || c.defaultPrevented || c.button !== 0) return null;
  if (c.meta || c.ctrl || c.shift || c.alt) return null;
  if ((a.target && a.target !== "_self") || a.download) return null;
  let url: URL;
  try {
    url = new URL(a.href, here);
  } catch {
    return null;
  }
  if (url.origin !== here.origin || !/^https?:$/.test(url.protocol)) return null;
  if (url.pathname.startsWith("/api/")) return null;
  if (url.pathname === here.pathname && url.search === here.search) return null; // hash-only: in-page
  return url;
}

/** The minimal event surface the handler needs (a real MouseEvent satisfies it). */
export type InterceptEvent = Pick<
  MouseEvent,
  "button" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey" | "defaultPrevented" | "preventDefault" | "stopPropagation"
> & { target: EventTarget | null };

type AnchorLike = Element & { getAttribute(name: string): string | null; hasAttribute(name: string): boolean };

/**
 * Builds the capture-phase click handler. When a link qualifies it calls
 * preventDefault() only, never stopPropagation(), so Next Link still runs the
 * user onClick (for example the menus' closeAll) and then skips its own push.
 */
export function createInterceptHandler(opts: {
  here: () => URL;
  onIntercept: (url: URL, anchor: AnchorLike) => void;
}) {
  return (e: InterceptEvent) => {
    const t = e.target as (Element & { closest?: (s: string) => Element | null }) | null;
    const a = (t?.closest?.("a[href]") ?? null) as AnchorLike | null;
    const info: AnchorInfo | null = a
      ? { href: a.getAttribute("href") ?? "", target: a.getAttribute("target"), download: a.hasAttribute("download") }
      : null;
    const url = shouldIntercept(
      {
        button: e.button,
        meta: e.metaKey,
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
        defaultPrevented: e.defaultPrevented,
      },
      info,
      opts.here(),
    );
    if (!url || !a) return;
    e.preventDefault();
    opts.onIntercept(url, a);
  };
}
