import type { Initiative } from "@/content/initiatives";
import type { VisualKind } from "@/content/projects";
import { digitalSketches, initiativeSketches } from "./digital";
import type { SketchDef } from "./kit";

/** Initiatives that are one of the shared kinds use that drawing; the rest have their own. */
const SHARED_KIND: Record<string, VisualKind> = { "omgx-os": "agent" };

/**
 * The sketch for an initiative: its own "init-<slug>" drawing if one exists,
 * else a shared kind (research -> research, products/concepts -> platform).
 * Returns null for "other" items without a drawing.
 */
export function initiativeSketchFor(item: Pick<Initiative, "slug" | "type">): { id: string; def: SketchDef } | null {
  const own = initiativeSketches[`init-${item.slug}`];
  if (own) return { id: `init-${item.slug}`, def: own };
  const kind = SHARED_KIND[item.slug] ?? (item.type === "research" ? "research" : item.type === "other" ? null : "platform");
  const def = kind ? digitalSketches[kind] : undefined;
  return kind && def ? { id: kind, def } : null;
}
