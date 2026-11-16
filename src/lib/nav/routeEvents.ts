"use client";

import type { NavType } from "@/lib/scroll/routeScroll";
import { resetLenis } from "@/lib/lenis";

/**
 * Why the next route commit happens, and a commit emitter fed by <RouteWatcher />.
 * The first commit is "initial"; the curtain sets "push"; popstate sets "pop".
 */
let navType: NavType = "initial";
let lastRouteKey: string | null = null;
type Listener = (routeKey: string, nav: NavType) => void;
const listeners = new Set<Listener>();

export const getNavType = () => navType;
export const setNavType = (t: NavType) => {
  navType = t;
};
export const getLastRouteKey = () => lastRouteKey;
export const currentRouteKey = () =>
  typeof window === "undefined" ? "" : window.location.pathname + window.location.search;

export function onRouteCommit(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Fired by ScrollRouter once a commit's scroll decision has been applied. */
const settledListeners = new Set<(routeKey: string) => void>();
export function onRouteSettled(fn: (routeKey: string) => void) {
  settledListeners.add(fn);
  return () => {
    settledListeners.delete(fn);
  };
}
export function emitRouteSettled(routeKey: string) {
  for (const fn of [...settledListeners]) fn(routeKey);
}

/** Called by RouteWatcher after each commit. Skips repeated keys (re-renders). */
export function emitRouteCommit(routeKey: string) {
  if (routeKey === lastRouteKey) return;
  const nav = lastRouteKey === null ? "initial" : navType;
  lastRouteKey = routeKey;
  for (const fn of [...listeners]) fn(routeKey, nav);
  // Commits that bypass the curtain (router.replace for work filters) keep the position.
  navType = "in-page";
}

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    navType = "pop";
    resetLenis(); // leftover inertia must not overwrite the restored position
  });
}
