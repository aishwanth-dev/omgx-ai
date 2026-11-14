import type { Metadata } from "next";
import Link from "next/link";
import { GlobalPresenceSection } from "@/components/sections/GlobalPresenceSection";
import { FounderCard } from "@/components/ui/FounderCard";
import { JourneyTimeline } from "@/components/ui/JourneyTimeline";
import { CTABand, PageHero } from "@/components/ui/PageHero";
import { capabilities } from "@/content/capabilities";
import { story } from "@/content/company";
import { site } from "@/content/site";

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
        title={
          <>
            Built on engineering.
            <br />
            Moving into what&apos;s next.
          </>
        }
        lead={story.short}
        crumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
      />

      <section className="section" data-theme="light" aria-labelledby="story-title">
        <div className="container about-story">
          <div className="about-story__copy">
            <p className="t-utility">Our story</p>
            <h2 id="story-title" className="t-display">
              From {site.formerName} to {site.name}.
            </h2>
            <p className="t-lead">{story.foundation}</p>
            <p className="muted">{story.expansion}</p>
            <p className="muted">{story.approach}</p>
            <p className="muted">
              This is continuity, not reinvention: an engineering-led organisation adding new technology disciplines to
              an industrial foundation.
            </p>
          </div>
          <JourneyTimeline />
        </div>
      </section>

      <section className="section section--tight" data-theme="matcha" aria-labelledby="position-title">
        <div className="container about-position">
          <p className="t-utility">Positioning</p>
          <h2 id="position-title" className="t-statement about-position__statement">
            We connect intelligence to the real world.
          </h2>
          <p className="t-lead">{story.positioning.replace("We connect intelligence to the real world. ", "")}</p>
        </div>
      </section>

      <section className="section" data-theme="dark" aria-labelledby="founder-title">
        <div className="container">
          <p className="t-utility">Founder</p>
          <h2 id="founder-title" className="t-display" style={{ margin: "16px 0 48px" }}>
            The engineering foundation.
          </h2>
          <FounderCard detailed />
        </div>
      </section>

      <section className="section section--tight" data-theme="light" aria-labelledby="verticals-title">
        <div className="container">
          <p className="t-utility">Four disciplines</p>
          <h2 id="verticals-title" className="t-display" style={{ marginTop: 16 }}>
            What we engineer.
          </h2>
          <ol className="about-verticals">
            {capabilities.map((c) => (
              <li key={c.slug}>
                <Link href={`/capabilities/${c.slug}`} className="about-vertical">
                  <span className="about-vertical__index">{c.index}</span>
                  <span className="about-vertical__title">{c.title}</span>
                  <span className="about-vertical__body muted">{c.positioning}</span>
                  <span className="about-vertical__arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <GlobalPresenceSection />

      <section className="section section--tight about-brand" data-theme="dark" aria-label="Brand statement">
        <div className="container">
          <p className="t-display-xl about-brand__line">Think beyond.</p>
          <p className="t-display-xl about-brand__line about-brand__line--accent">Engineer what&apos;s next.</p>
        </div>
      </section>

      <CTABand />
    </>
  );
}
