/** Route, hash and anchor landing decision. Pure, unit- and property-tested. */
export type NavType = "initial" | "push" | "pop" | "in-page";
export type ScrollDecision = { kind: "top" } | { kind: "hash"; id: string } | { kind: "keep" };

const safeDecode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

export function decideRouteScroll(nav: NavType, hash: string, targetExists: boolean): ScrollDecision {
  const id = safeDecode(hash.replace(/^#/, ""));
  if (nav === "pop") return { kind: "keep" }; // keep what Next or the browser restored
  if (id && targetExists) return { kind: "hash", id }; // initial, push or in-page
  if (nav === "push") return { kind: "top" };
  return { kind: "keep" }; // initial without a hash, or a missing target
}
