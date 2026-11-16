"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { emitRouteCommit } from "@/lib/nav/routeEvents";

/**
 * Emits `pathname + search` after every route commit, search-only changes
 * included. Rendered inside <Suspense> in the layout so pages stay static.
 */
export function RouteWatcher() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useEffect(() => {
    emitRouteCommit(pathname + (search ? `?${search}` : ""));
  }, [pathname, search]);
  return null;
}
