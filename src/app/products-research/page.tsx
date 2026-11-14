import type { Metadata } from "next";
import { InitiativeList } from "@/components/ui/InitiativeList";
import { CTABand, PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Products & R&D",
  description:
    "OMGX AI products and applications, platform concepts and research initiatives, each labelled by type and status.",
  alternates: { canonical: "/products-research" },
};

export default function ProductsResearchPage() {
  return (
    <>
      <PageHero
        eyebrow="Products & R&D"
        title={
          <>
            Ideas, systems and
            <br />
            research in motion.
          </>
        }
        lead="Applications and software initiatives, platform concepts and exploratory research. Each entry is labelled as what it is, so a concept is never presented as a launched product."
        crumbs={[{ label: "Home", href: "/" }, { label: "Products & R&D" }]}
      >
        <div className="legend" aria-label="Label key">
          <span className="chip">Product / application initiative</span>
          <span className="chip">Concept / platform initiative</span>
          <span className="chip chip--accent">Research</span>
          <span className="chip chip--pending">Status to be confirmed</span>
        </div>
      </PageHero>
      <section className="section section--tight" data-theme="light" aria-label="Initiatives">
        <div className="container">
          <InitiativeList headingLevel={2} />
          <p className="pending-note" style={{ marginTop: 40 }}>
            Public launch status has not been confirmed for any initiative listed here. Labels will be updated once OMGX
            AI confirms each one.
          </p>
        </div>
      </section>
      <CTABand />
    </>
  );
}
