import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { projects } from "@/content/projects";
import { CTABand, PageHero } from "@/components/ui/PageHero";
import { WorkDirectory } from "@/components/ui/WorkDirectory";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Filterable directory of documented OMGX AI work across AI and software, industrial automation, immersive technologies, hardware and embedded systems, video streaming and networking, and underwater monitoring.",
  alternates: { canonical: "/work" },
};

export default function WorkPage() {
  return (
    <>
      <PageHero
        eyebrow="Work"
        title={
          <>
            Engineering,
            <br />
            put to work.
          </>
        }
        lead="Systems and projects across intelligent software, industrial automation, immersive technologies and integrated hardware. Filter by discipline; each entry links to its own record."
        crumbs={[{ label: "Home", href: "/" }, { label: "Work" }]}
      >
        <p className="pending-note" style={{ marginTop: 28 }}>
          Illustrations on this page are conceptual line drawings. Approved project photography and client logos have not
          been supplied yet, so client names are shown as text.
        </p>
      </PageHero>
      <section className="section section--tight" data-theme="dark" aria-label="Project directory">
        <div className="container">
          <Suspense
            fallback={
              <ul className="work-grid">
                {projects.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/work/${p.slug}`} className="work-card">
                      <span className="work-card__client t-utility">{p.client ?? "Project"}</span>
                      <span className="work-card__title">{p.title}</span>
                      <span className="work-card__summary">{p.summary}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            }
          >
            <WorkDirectory />
          </Suspense>
        </div>
      </section>
      <CTABand />
    </>
  );
}
