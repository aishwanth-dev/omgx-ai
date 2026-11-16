import type { Metadata } from "next";
import Link from "next/link";
import { GlobalPresenceSection } from "@/components/sections/GlobalPresenceSection";
import { FounderCard } from "@/components/ui/FounderCard";
import { JourneyList } from "@/components/ui/JourneyList";
import { CTABand, PageHero } from "@/components/ui/PageHero";
import { capabilities } from "@/content/capabilities";
import { story } from "@/content/company";
import { site } from "@/content/site";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { surfaceAttrs } from "@/lib/surfaces";

export const metadata: Metadata = {
  title: "About",
  description:
    "OMGX AI Private Limited, formerly Bona fide Digital Services: an engineering-led company expanding from industrial automation into AI, robotics, immersive technologies and advanced engineering.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About OMGX AI"
        title={["Built on engineering.", "Moving into what's next."]}
        lead={story.short}
        crumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
      />

      <section className="section" {...surfaceAttrs("mist")} aria-labelledby="story-title">
        <div className="container about-story">
          <div className="about-story__copy">
            <p className="t-utility">Our story</p>
            <RevealHeading id="story-title" className="t-display" text={`From ${site.formerName} to ${site.name}.`} />
            <p className="t-lead">{story.foundation}</p>
            <p className="muted">{story.expansion}</p>
            <p className="muted">{story.approach}</p>
            <p className="muted">
              This is continuity, not reinvention: an engineering-led organisation adding new technology disciplines to
              an industrial foundation.
            </p>
          </div>
          <JourneyList />
        </div>
      </section>

      <section className="section section--tight" {...surfaceAttrs("matcha")} aria-labelledby="position-title">
        <div className="container about-position">
          <p className="t-utility">Positioning</p>
          <RevealHeading id="position-title" className="t-statement about-position__statement" text="We connect intelligence to the real world." />
          <p className="t-lead">{story.positioning.replace("We connect intelligence to the real world. ", "")}</p>
        </div>
      </section>

      <section className="section" {...surfaceAttrs("ink")} aria-labelledby="founder-title">
        <div className="container">
          <p className="t-utility">Founder</p>
          <RevealHeading id="founder-title" className="t-display" style={{ margin: "16px 0 48px" }} text="The engineering foundation." />
          <FounderCard detailed />
        </div>
      </section>

      <section className="section section--tight" {...surfaceAttrs("mist")} aria-labelledby="verticals-title">
        <div className="container">
          <p className="t-utility">Four disciplines</p>
          <RevealHeading id="verticals-title" className="t-display" style={{ marginTop: 16 }} text="What we engineer." />
          <ol className="about-verticals">
            {capabilities.map((c) => (
              <li key={c.slug}>
                <Link href={`/capabilities/${c.slug}`} className="about-vertical">
                  <span className="about-vertical__title">{c.title}</span>
                  <span className="about-vertical__body muted">{c.positioning}</span>
                  <span className="about-vertical__arrow" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <GlobalPresenceSection globe={false} />

      <section className="section section--tight about-brand" {...surfaceAttrs("ink")} aria-label="Brand statement">
        <div className="container">
          <p className="t-display-xl about-brand__line">Think beyond.</p>
          <p className="t-display-xl about-brand__line about-brand__line--accent">Engineer what&apos;s next.</p>
        </div>
      </section>

      <CTABand />
    </>
  );
}
