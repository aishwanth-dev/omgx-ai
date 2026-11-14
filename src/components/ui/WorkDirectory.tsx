"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { initiativeTypeLabels, publicInitiatives } from "@/content/initiatives";
import { projects, workFilters, type FilterKey, type VisualKind } from "@/content/projects";
import { ProjectVisual } from "./ProjectVisual";

type Entry = {
  key: string;
  href: string;
  client?: string;
  title: string;
  category: string;
  status?: string;
  summary: string;
  tags: FilterKey[];
  visual: VisualKind;
  kind: "project" | "initiative";
};

const ENTRIES: Entry[] = [
  ...projects.map<Entry>((p) => ({
    key: p.slug,
    href: `/work/${p.slug}`,
    client: p.client,
    title: p.title,
    category: p.category,
    status: p.status,
    summary: p.summary,
    tags: p.tags,
    visual: p.visual,
    kind: "project",
  })),
  ...publicInitiatives.map<Entry>((i) => ({
    key: i.slug,
    href: `/products-research#${i.slug}`,
    title: i.name,
    category: initiativeTypeLabels[i.type].label,
    status: i.status,
    summary: i.description,
    tags: i.tags,
    visual: i.type === "research" ? "research" : "agent",
    kind: "initiative",
  })),
];

const isFilter = (v: string | null): v is FilterKey | "all" => !!v && workFilters.some((f) => f.key === v);

export function WorkDirectory() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = params.get("filter");
  const filter: FilterKey | "all" = isFilter(raw) ? raw : "all";
  const list = filter === "all" ? ENTRIES : ENTRIES.filter((e) => e.tags.includes(filter));
  const label = workFilters.find((f) => f.key === filter)?.label ?? "All Work";

  const select = (key: FilterKey | "all") => {
    const qs = key === "all" ? "" : `?filter=${key}`;
    router.replace(`${pathname}${qs}`, { scroll: false });
  };

  return (
    <div className="work-dir">
      <div className="work-dir__filters" role="group" aria-label="Filter work by category">
        {workFilters.map((f) => (
          <button
            key={f.key}
            type="button"
            className="work-dir__filter"
            aria-pressed={filter === f.key}
            onClick={() => select(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="work-dir__status t-small muted" aria-live="polite">
        {label}: showing {list.length} {list.length === 1 ? "entry" : "entries"}.
        {filter === "research" || filter === "ai-software"
          ? " Products, concepts and research link to their canonical entry on the Products & R&D page."
          : ""}
      </p>

      <motion.ul layout className="work-grid">
        <AnimatePresence mode="popLayout" initial={false}>
          {list.map((e) => (
            <motion.li
              key={e.key}
              layout
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link href={e.href} className={`work-card work-card--${e.kind}`}>
                <ProjectVisual kind={e.visual} tone="dark" caption={false} />
                <span className="work-card__client t-utility">
                  {e.kind === "initiative" ? "OMGX AI initiative" : (e.client ?? "Project")}
                </span>
                <span className="work-card__title">{e.title}</span>
                <span className="work-card__meta">
                  <span className="chip">{e.category}</span>
                  {e.status && (
                    <span className={`chip ${e.status === "Status to be confirmed" ? "chip--pending" : "chip--accent"}`}>{e.status}</span>
                  )}
                </span>
                <span className="work-card__summary">{e.summary}</span>
                <span className="work-card__cta t-utility">
                  {e.kind === "initiative" ? "View entry" : "View project"} <span aria-hidden="true">→</span>
                </span>
              </Link>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}
