import Image from "next/image";
import { founder } from "@/content/company";

/** Founder introduction. Shows an approved photograph only; otherwise a neutral, labelled placeholder. */
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
            <span className="visual-caption">Approved founder photograph to be supplied</span>
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
