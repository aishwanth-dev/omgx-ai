import Link from "next/link";
import { workFilters } from "@/content/projects";

export function WorkIntroSection() {
  const cats = workFilters.filter((f) => f.key !== "all");

  return (
    <section className="section work-intro" data-theme="dark" aria-labelledby="work-intro-title">
      <div className="container work-intro__grid">
        <div>
          <p className="t-utility">Work</p>
          <h2 id="work-intro-title" className="t-display-l">
            Engineering,
            <br />
            put to work.
          </h2>
        </div>
        <div className="work-intro__side">
          <p className="t-lead">
            Explore selected systems and projects across intelligent software, industrial automation, immersive
            technologies and integrated hardware.
          </p>
          <ul className="work-intro__cats">
            {cats.map((c) => (
              <li key={c.key}>
                <Link href={`/work?filter=${c.key}`} className="work-intro__cat">
                  <span>{c.label}</span>
                  <span className="work-intro__count" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/work" className="btn btn--primary">
            Explore our work <span className="btn__arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
