import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CapabilityGlyph } from "@/components/ui/CapabilityGlyph";
import { CTABand, Breadcrumbs } from "@/components/ui/PageHero";
import { ProjectVisual } from "@/components/ui/ProjectVisual";
import { capabilities, getCapability } from "@/content/capabilities";
import { processSteps, processNote } from "@/content/company";
import { getInitiative, initiativeTypeLabels } from "@/content/initiatives";
import { getProject, projectDisplayName, type Project } from "@/content/projects";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { surfaceAttrs, themeSurface } from "@/lib/surfaces";

export const dynamicParams = false;

export function generateStaticParams() {
  return capabilities.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCapability(slug);
  if (!c) return {};
  return {
    title: c.title,
    description: `${c.positioning} ${c.intro}`,
    alternates: { canonical: `/capabilities/${c.slug}` },
    openGraph: { title: `${c.title} — OMGX AI`, description: c.positioning, url: `/capabilities/${c.slug}` },
  };
}

/** Each discipline gets its own composition; the design system is shared. */
const LAYOUT: Record<string, { hero: "split-right" | "split-left" }> = {
  "artificial-intelligence": { hero: "split-right" },
  "industrial-automation": { hero: "split-left" },
  "immersive-technologies": { hero: "split-right" },
  "hardware-engineering": { hero: "split-left" },
};

export default async function CapabilityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cap = getCapability(slug);
  if (!cap) notFound();
  const layout = LAYOUT[cap.slug].hero;
  const idx = capabilities.findIndex((c) => c.slug === cap.slug);
  const next = capabilities[(idx + 1) % capabilities.length];
  const related = cap.relatedProjects.map(getProject).filter(Boolean) as Project[];
  const initiatives = cap.relatedInitiatives.map(getInitiative).filter((i) => !!i);
  const tone = cap.theme;

  return (
    <article className={`cap-page cap-page--${cap.slug}`}>
      <section className={`cap-hero cap-hero--${layout}`} {...surfaceAttrs(themeSurface(tone))}>
        <div className="container cap-hero__inner">
          <div className="cap-hero__copy">
            <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Capabilities", href: "/capabilities" }, { label: cap.shortTitle }]} />
            <p className="t-utility cap-hero__index">Capability</p>
            <RevealHeading as="h1" className="t-display-xl cap-hero__title" text={cap.title} />
            <p className="t-lead cap-hero__lead">{cap.positioning}</p>
            <div className="cap-hero__ctas">
              <Link href="/contact" className="btn btn--primary">
                Discuss a project <span className="btn__arrow" aria-hidden="true">→</span>
              </Link>
              <a href="#related" className="btn">
                Related work <span className="btn__arrow" aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
          <div className="cap-hero__visual" aria-hidden="true">
            <CapabilityGlyph slug={cap.slug} />
          </div>
        </div>
      </section>

      <section className="section cap-what" {...surfaceAttrs(tone === "dark" ? "mist" : "ink")} aria-labelledby="what-title">
        <div className="container cap-what__grid">
          <div>
            <p className="t-utility">What OMGX does</p>
            <RevealHeading id="what-title" className="t-display cap-what__title" text={`${cap.shortTitle}, engineered for real operations.`} />
          </div>
          <div className="cap-what__copy">
            <p className="t-lead">{cap.intro}</p>
            <p className="muted">
              We study the problem first, research the technology options, design the system, prototype where it is
              useful, and then engineer and integrate the final solution around the client&apos;s requirements.
            </p>
          </div>
        </div>
      </section>

      <section className="section" {...surfaceAttrs(themeSurface(tone))} aria-labelledby="list-title">
        <div className="container cap-lists">
          <div className="cap-lists__col">
            <p className="t-utility">Capabilities</p>
            <h2 id="list-title" className="t-h3 cap-lists__title">
              What the team works with
            </h2>
            <ul className="cap-lists__items">
              {cap.capabilities.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
          <div className="cap-lists__col">
            <p className="t-utility">Solutions</p>
            <h2 className="t-h3 cap-lists__title">What we can develop or customise</h2>
            <ul className="cap-lists__chips">
              {cap.solutions.map((s) => (
                <li key={s} className="chip">
                  {s}
                </li>
              ))}
            </ul>
            <p className="t-small muted" style={{ marginTop: 18 }}>
              Solutions are designed, customised or developed to each client&apos;s requirements rather than sold as
              fixed products.
            </p>
          </div>
        </div>
      </section>

      <section id="related" className="section" {...surfaceAttrs("ink")} aria-labelledby="related-title">
        <div className="container">
          <div className="related__head">
            <p className="t-utility">Related documented work</p>
            <RevealHeading id="related-title" className="t-display" text={related.length > 0 ? "Where this has been applied." : "Related initiatives."} />
          </div>

          {related.length > 0 && (
            <ul className="work-grid work-grid--compact">
              {related.map((p) => (
                <li key={p.slug}>
                  <Link href={`/work/${p.slug}`} className="work-card">
                    <ProjectVisual kind={p.visual} tone="dark" caption={false} />
                    <span className="work-card__client t-utility">{p.client ?? p.category}</span>
                    <span className="work-card__title">{p.title}</span>
                    <span className="work-card__meta">
                      <span className="chip">{p.category}</span>
                      {p.status && <span className="chip chip--accent">{p.status}</span>}
                    </span>
                    <span className="sr-only">View {projectDisplayName(p)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {initiatives.length > 0 && (
            <div className="cap-initiatives">
              <h3 className="t-h4">Products, concepts and research in this discipline</h3>
              <ul>
                {initiatives.map((i) => (
                  <li key={i.slug}>
                    <Link href={`/products-research#${i.slug}`} className="cap-initiative">
                      <span className="cap-initiative__name">{i.name}</span>
                      <span className="chip">{initiativeTypeLabels[i.type].label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="section section--tight" {...surfaceAttrs("mist")} aria-labelledby="approach-title">
        <div className="container">
          <p className="t-utility">Engineering approach</p>
          <RevealHeading id="approach-title" className="t-display" style={{ marginTop: 16 }} text="From complex problem to working system." />
          <ol className="approach">
            {processSteps.map((s) => (
              <li key={s.key} className="approach__step">
                <span className="approach__index">{s.index}</span>
                <h3 className="t-h4">{s.title}</h3>
                <p className="muted t-small">{s.body}</p>
              </li>
            ))}
          </ol>
          <p className="t-small muted" style={{ marginTop: 20 }}>
            {processNote}
          </p>
        </div>
      </section>

      <section className="next-cap" {...surfaceAttrs("ink")}>
        <Link href={`/capabilities/${next.slug}`} className="container next-cap__link">
          <span className="t-utility">Next capability</span>
          <span className="t-display next-cap__title">{next.title}</span>
          <span className="next-cap__arrow" aria-hidden="true">
            →
          </span>
        </Link>
      </section>

      <CTABand />
    </article>
  );
}
