"use client";

import { useSyncExternalStore } from "react";

let webglSupport: boolean | null = null;

/** Checks for a usable WebGL context once and caches the result. */
export const hasWebGL = () => {
  if (webglSupport !== null) return webglSupport;
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl2") as WebGL2RenderingContext | null) ??
      (canvas.getContext("webgl") as WebGLRenderingContext | null);
    webglSupport = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
};

const subscribeMedia = (query: string) => (cb: () => void) => {
  const mql = window.matchMedia(query);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
};

/** SSR-safe media query hook. Returns `serverValue` during server rendering. */
export function useMediaQuery(query: string, serverValue = false) {
  return useSyncExternalStore(
    subscribeMedia(query),
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export const usePrefersReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");
export const useIsMobile = () => useMediaQuery("(max-width: 760px)");

const noopSubscribe = () => () => {};

/** `true` once on the client, `false` on the server and during hydration. */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/** WebGL availability; `null` until known on the client. */
export function useWebGL(): boolean | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => hasWebGL(),
    () => null,
  );
}
