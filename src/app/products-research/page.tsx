import type { Metadata } from "next";
import { InitiativeList } from "@/components/ui/InitiativeList";
import { CTABand, PageHero } from "@/components/ui/PageHero";
import { surfaceAttrs } from "@/lib/surfaces";

export const metadata: Metadata = {
  title: "Products & R&D",
  description:
    "OMGX AI products and applications, platform concepts and research initiatives, each labelled by type.",
  alternates: { canonical: "/products-research" },
};

export default function ProductsResearchPage() {
  return (
    <>
      <PageHero
        eyebrow="Products & R&D"
        title={["Ideas, systems and", "research in motion."]}
        lead="Applications and software initiatives, platform concepts and exploratory research. Each entry is labelled as what it is, so a concept is never presented as a launched product."
        crumbs={[{ label: "Home", href: "/" }, { label: "Products & R&D" }]}
      >
        <div className="legend" aria-label="Label key">
          <span className="chip">Product / application initiative</span>
          <span className="chip">Concept / platform initiative</span>
          <span className="chip chip--accent">Research</span>
        </div>
      </PageHero>
      <section className="section section--tight" {...surfaceAttrs("mist")} aria-label="Initiatives">
        <div className="container">
          <InitiativeList headingLevel={2} />
        </div>
      </section>
      <CTABand />
    </>
  );
}
