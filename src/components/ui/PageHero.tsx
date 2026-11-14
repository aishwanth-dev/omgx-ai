import Link from "next/link";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="crumbs">
      <ol>
        {items.map((c, i) => (
          <li key={i}>
            {c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHero({
  eyebrow,
  title,
  lead,
  crumbs,
  theme = "dark",
  children,
  aside,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  crumbs?: Crumb[];
  theme?: "dark" | "light";
  children?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className={`page-hero${aside ? " page-hero--split" : ""}`} data-theme={theme}>
      <div className="page-hero__glow" aria-hidden="true" />
      <div className="container page-hero__inner">
        <div className="page-hero__main">
          {crumbs && <Breadcrumbs items={crumbs} />}
          <p className="t-utility page-hero__eyebrow">{eyebrow}</p>
          <h1 className="t-display-xl page-hero__title">{title}</h1>
          {lead && <div className="t-lead page-hero__lead">{lead}</div>}
          {children}
        </div>
        {aside && <div className="page-hero__aside">{aside}</div>}
      </div>
    </section>
  );
}

export function CTABand({
  title = "Have a complex challenge?",
  body = "Let's understand the problem and engineer the right solution.",
  theme = "matcha",
}: {
  title?: string;
  body?: string;
  theme?: "matcha" | "dark" | "light";
}) {
  return (
    <section className="cta-band" data-theme={theme}>
      <div className="container cta-band__inner">
        <div>
          <h2 className="t-display cta-band__title">{title}</h2>
          <p className="t-lead">{body}</p>
        </div>
        <Link href="/contact" className="btn btn--primary">
          Start an engineering conversation <span className="btn__arrow" aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
