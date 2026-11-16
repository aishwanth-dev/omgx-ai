"use client";

import { Component, type ReactNode } from "react";
import { markReady } from "@/lib/readiness";

/**
 * Wraps a <Canvas>. R3F rethrows errors from inside the canvas (a failed GLB
 * request, a decoder failure, a lost context during setup) into the DOM tree,
 * where this boundary shows the poster instead. With `scene`, it also resolves
 * the preloader's "scene" task so the preloader still exits (3.22).
 */
export class SceneErrorBoundary extends Component<
  { fallback: ReactNode; scene?: boolean; children?: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (this.props.scene) markReady("scene");
    if (process.env.NODE_ENV !== "production") console.warn("[3D] scene failed, showing poster:", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
