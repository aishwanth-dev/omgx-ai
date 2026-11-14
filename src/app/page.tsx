import { OmgxPreloader } from "@/components/loader/OmgxPreloader";
import { KineticMarquee } from "@/components/motion/KineticMarquee";
import { AboutSection } from "@/components/sections/AboutSection";
import { CapabilitiesSection } from "@/components/sections/CapabilitiesSection";
import { FinalCTASection } from "@/components/sections/FinalCTASection";
import { GlobalPresenceSection } from "@/components/sections/GlobalPresenceSection";
import { HomeStory } from "@/components/sections/HomeStory";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { ProductsResearchSection } from "@/components/sections/ProductsResearchSection";
import { ProjectShowcaseSection } from "@/components/sections/ProjectShowcaseSection";
import { ProofCardsSection } from "@/components/sections/ProofCardsSection";
import { WorkIntroSection } from "@/components/sections/WorkIntroSection";

export default function HomePage() {
  return (
    <>
      <OmgxPreloader />
      <HomeStory />
      <CapabilitiesSection />
      <KineticMarquee
        label="Intelligence connects the digital and physical worlds."
        rows={[
          { text: "Intelligence connects the digital and physical worlds —", direction: 1 },
          { text: "Think beyond the expected — Engineer what's next — From software to real-world systems —", direction: -1, outline: true },
        ]}
      />
      <WorkIntroSection />
      <ProofCardsSection />
      <ProjectShowcaseSection />
      <GlobalPresenceSection />
      <ProductsResearchSection />
      <ProcessSection />
      <AboutSection />
      <FinalCTASection />
    </>
  );
}
