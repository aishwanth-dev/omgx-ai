import type { Metadata } from "next";
import Link from "next/link";
import { CapabilityGlyph } from "@/components/ui/CapabilityGlyph";
import { CTABand, PageHero } from "@/components/ui/PageHero";
import { capabilities, customRnd } from "@/content/capabilities";

export const metadata: Metadata = {
  title: "Capabilities",
  description:
    "Four disciplines: Artificial Intelligence & Machine Learning, Industrial Automation & Robotics, Immersive Technologies (AR / VR / XR) and Hardware Engineering & Integration.",
  alternates: { canonical: "/capabilities" },
};

export default function CapabilitiesPage() {
  return (
    <>
      <PageHero
        eyebrow="Capabilities"
        title={
          <>
            Four disciplines.
            <br />
            One engineering mindset.
          </>
        }
        lead="OMGX AI works across the software and physical systems needed to solve complex problems, from AI applications and intelligent workflows to industrial control, immersive simulations and integrated hardware."
        crumbs={[{ label: "Home", href: "/" }, { label: "Capabilities" }]}
      />

      <section className="section" data-theme="light" aria-label="The four disciplines">
        <div className="container">
          <ol className="cap-index">
            {capabilities.map((c) => (
              <li key={c.slug}>
                <Link href={`/capabilities/${c.slug}`} className={`cap-card cap-card--${c.slug}`}>
                  <div className="cap-card__visual">
                    <CapabilityGlyph slug={c.slug} />
                  </div>
                  <div className="cap-card__body">
                    <span className="cap-card__index">{c.index}</span>
                    <h2 className="t-h3">{c.title}</h2>
                    <p className="muted">{c.positioning}</p>
                    <ul className="cap-card__list">
                      {c.capabilities.slice(0, 4).map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                    <span className="link-arrow">
                      Explore <span className="btn__arrow" aria-hidden="true">→</span>
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--tight" data-theme="dark" aria-labelledby="rnd-title">
        <div className="container rnd">
          <div>
            <p className="t-utility">Across all four</p>
            <h2 id="rnd-title" className="t-display">
              {customRnd.title}
            </h2>
            <p className="t-lead muted" style={{ marginTop: 20 }}>
              {customRnd.note}
            </p>
          </div>
          <ul className="rnd__list">
            {customRnd.items.map((i, n) => (
              <li key={i}>
                <span>{String(n + 1).padStart(2, "0")}</span>
                {i}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CTABand />
    </>
  );
}
