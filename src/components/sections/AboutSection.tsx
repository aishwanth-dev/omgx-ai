import Link from "next/link";
import { FounderCard } from "@/components/ui/FounderCard";
import { JourneyTimeline } from "@/components/ui/JourneyTimeline";
import { story } from "@/content/company";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { surfaceAttrs } from "@/lib/surfaces";

export function AboutSection() {
  return (
    <section className="section about-home" {...surfaceAttrs("mist")} aria-labelledby="about-title">
      <div className="container">
        <JourneyTimeline>
          <p className="t-utility">About OMGX AI</p>
          <RevealHeading id="about-title" className="t-display-l" text={["Built on engineering.", "Moving into what's next."]} />
          <p className="t-lead">{story.foundation}</p>
          <p className="muted">{story.expansion}</p>
          <p className="muted">{story.approach}</p>
          <Link href="/about" className="link-arrow">
            Our story <span className="btn__arrow" aria-hidden="true">→</span>
          </Link>
        </JourneyTimeline>
        <FounderCard />
      </div>
    </section>
  );
}
