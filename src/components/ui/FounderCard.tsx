import Image from "next/image";
import { founder } from "@/content/company";
import { SocialLink } from "@/components/ui/SocialIcon";

/** Founder introduction. Shows the photograph when one is set; otherwise the G monogram. */
export function FounderCard({ detailed = false }: { detailed?: boolean }) {
  return (
    <article className={`founder${detailed ? " founder--detailed" : ""}`} aria-labelledby="founder-name">
      <div className="founder__photo">
        {founder.photo ? (
          <Image src={founder.photo} alt={`${founder.name}, ${founder.role} of OMGX AI`} fill sizes="(max-width: 900px) 100vw, 420px" />
        ) : (
          <div className="founder__placeholder">
            <span className="founder__initial" aria-hidden="true">
              G
            </span>
          </div>
        )}
      </div>
      <div className="founder__body">
        <p className="t-utility">{founder.role}</p>
        <h3 id="founder-name" className="t-h3">
          {founder.name}
        </h3>
        <p>{founder.intro}</p>
        {detailed && <p>{founder.detail}</p>}
        <SocialLink href={founder.linkedin} icon="linkedin" label="Gururaj on LinkedIn" variant="pill">
          LinkedIn
        </SocialLink>
        {detailed && (
          <ul className="founder__list">
            {founder.experience.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
