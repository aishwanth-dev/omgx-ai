import Link from "next/link";
import { InitiativeList } from "@/components/ui/InitiativeList";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { surfaceAttrs } from "@/lib/surfaces";

export function ProductsResearchSection() {
  return (
    <section className="section products" {...surfaceAttrs("mist")} aria-labelledby="products-title">
      <div className="container">
        <div className="products__head">
          <div>
            <p className="t-utility">Products, concepts &amp; research</p>
            <RevealHeading id="products-title" className="t-display-l" text="Ideas, systems and research in motion." />
          </div>
          <div>
            <p className="t-lead muted">
              Alongside client engineering, the team develops its own applications, explores platform concepts and
              runs exploratory research. Each item is labelled by what it is.
            </p>
            <Link href="/products-research" className="link-arrow" style={{ marginTop: 20 }}>
              Products &amp; R&amp;D <span className="btn__arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <InitiativeList compact />
      </div>
    </section>
  );
}
