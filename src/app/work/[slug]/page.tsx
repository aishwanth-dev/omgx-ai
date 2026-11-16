import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, CTABand } from "@/components/ui/PageHero";
import { ProjectVisual } from "@/components/ui/ProjectVisual";
import { capabilities } from "@/content/capabilities";
import { getProject, projectDisplayName, projects, relatedProjects, workFilters } from "@/content/projects";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { surfaceAttrs } from "@/lib/surfaces";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return {};
  const title = projectDisplayName(p);
  return {
    title,
    description: p.summary,
    alternates: { canonical: `/work/${p.slug}` },
    openGraph: { title: `${title} — OMGX AI`, description: p.summary, url: `/work/${p.slug}` },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();

  const idx = projects.findIndex((x) => x.slug === p.slug);
  const prev = projects[(idx - 1 + projects.length) % projects.length];
  const next = projects[(idx + 1) % projects.length];
  const related = relatedProjects(p, 3);
  const verticals = capabilities.filter((c) => c.relatedProjects.includes(p.slug));
  const tagLabels = p.tags.map((t) => workFilters.find((f) => f.key === t)?.label).filter(Boolean) as string[];

  const facts: { label: string; value: string }[] = [];
  if (p.client) facts.push({ label: p.clientLabel ?? "Client", value: p.client });
  facts.push({ label: "Category", value: p.category });
  if (p.status) facts.push({ label: "Status", value: p.status });
  if (p.location) facts.push({ label: "Location", value: p.location });
  if (p.associatedOrganisation) facts.push({ label: "Associated organisation", value: p.associatedOrganisation });

  return (
    <article className="project">
      <header className="project__hero" {...surfaceAttrs("ink")}>
        <div className="container">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Work", href: "/work" }, { label: p.title }]} />
          <p className="t-utility project__eyebrow">{p.client ? p.client.split(",")[0] : p.category}</p>
          <RevealHeading as="h1" className="t-display-l project__title" text={p.title} />
          <ul className="project__tags" aria-label="Disciplines">
            {tagLabels.map((t) => (
              <li key={t} className="chip">
                {t}
              </li>
            ))}
            {p.status && <li className="chip chip--accent">{p.status}</li>}
          </ul>
        </div>
      </header>

      <section className="section section--tight" {...surfaceAttrs("ink")} aria-label="Project record">
        <div className="container project__grid">
          <aside className="project__facts" aria-label="Project facts">
            <dl>
              {facts.map((f) => (
                <div key={f.label} className="project__fact">
                  <dt className="t-utility">{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
              {verticals.length > 0 && (
                <div className="project__fact">
                  <dt className="t-utility">Capability</dt>
                  <dd>
                    {verticals.map((v, i) => (
                      <span key={v.slug}>
                        {i > 0 && ", "}
                        <Link href={`/capabilities/${v.slug}`} className="project__link">
                          {v.title}
                        </Link>
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </aside>

          <div className="project__main">
            <ProjectVisual kind={p.visual} tone="dark" />

            <section className="project__block" aria-labelledby="summary-h">
              <h2 id="summary-h" className="t-utility">
                {p.status === "Concept" ? "Concept" : "Solution developed"}
              </h2>
              <p className="t-lead">{p.summary}</p>
            </section>

            {p.functionality && (
              <section className="project__block" aria-labelledby="func-h">
                <h2 id="func-h" className="t-utility">
                  {p.functionalityLabel ?? "Documented functionality"}
                </h2>
                <ul className="project__list">
                  {p.functionality.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </section>
            )}

            {p.technologies && (
              <section className="project__block" aria-labelledby="tech-h">
                <h2 id="tech-h" className="t-utility">
                  {p.technologyLabel ?? "Technologies"}
                </h2>
                <ul className="project__chips">
                  {p.technologies.map((t) => (
                    <li key={t} className="chip">
                      {t}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section section--tight" {...surfaceAttrs("mist")} aria-labelledby="rel-h">
          <div className="container">
            <RevealHeading id="rel-h" className="t-display" text="Related projects" />
            <ul className="work-grid work-grid--compact" style={{ marginTop: 40 }}>
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/work/${r.slug}`} className="work-card work-card--light">
                    <ProjectVisual kind={r.visual} tone="light" caption={false} />
                    <span className="work-card__client t-utility">{r.client ?? r.category}</span>
                    <span className="work-card__title">{r.title}</span>
                    <span className="work-card__meta">
                      <span className="chip">{r.category}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <nav className="project-pager" {...surfaceAttrs("ink")} aria-label="More projects">
        <div className="container project-pager__inner">
          <Link href={`/work/${prev.slug}`} className="project-pager__link">
            <span className="t-utility">← Previous</span>
            <span className="project-pager__title">{projectDisplayName(prev)}</span>
          </Link>
          <Link href="/work" className="project-pager__all t-utility">
            All work
          </Link>
          <Link href={`/work/${next.slug}`} className="project-pager__link project-pager__link--next">
            <span className="t-utility">Next →</span>
            <span className="project-pager__title">{projectDisplayName(next)}</span>
          </Link>
        </div>
      </nav>

      <CTABand title="Working on something similar?" body="Tell us about the system, the constraints and what it needs to do." />
    </article>
  );
}
