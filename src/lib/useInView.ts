"use client";

import { useEffect, useState } from "react";

/** Tracks whether an element is near the viewport, and whether it has ever been. */
export function useInViewState(ref: React.RefObject<Element | null>, rootMargin = "200px") {
  const [state, setState] = useState({ inView: false, seen: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) =>
        setState((prev) =>
          prev.inView === entry.isIntersecting && (prev.seen || !entry.isIntersecting)
            ? prev
            : { inView: entry.isIntersecting, seen: prev.seen || entry.isIntersecting },
        ),
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return state;
}
