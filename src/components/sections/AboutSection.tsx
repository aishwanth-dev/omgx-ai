import Link from "next/link";
import { FounderCard } from "@/components/ui/FounderCard";
import { JourneyTimeline } from "@/components/ui/JourneyTimeline";
import { story } from "@/content/company";

export function AboutSection() {
  return (
    <section className="section about-home" data-theme="light" aria-labelledby="about-title">
      <div className="container">
        <div className="about-home__head">
          <p className="t-utility">About OMGX AI</p>
          <h2 id="about-title" className="t-display-l">
            Built on engineering.
            <br />
            Moving into what&apos;s next.
          </h2>
        </div>
        <div className="about-home__grid">
          <div className="about-home__story">
            <p className="t-lead">{story.foundation}</p>
            <p className="muted">{story.expansion}</p>
            <p className="muted">{story.approach}</p>
            <Link href="/about" className="link-arrow">
              Our story <span className="btn__arrow" aria-hidden="true">→</span>
            </Link>
          </div>
          <JourneyTimeline />
        </div>
        <FounderCard />
      </div>
    </section>
  );
}
