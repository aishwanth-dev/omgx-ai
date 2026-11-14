import { initiativeTypeLabels, publicInitiatives, type InitiativeType } from "@/content/initiatives";

const ORDER: InitiativeType[] = ["product", "concept", "research", "other"];

/** Status-separated list of products, concepts and research. Every item carries type and status chips. */
export function InitiativeList({ compact = false, headingLevel = 3 }: { compact?: boolean; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  const groups = ORDER.map((type) => ({ type, items: publicInitiatives.filter((i) => i.type === type) })).filter(
    (g) => g.items.length > 0,
  );

  return (
    <div className={`initiatives${compact ? " initiatives--compact" : ""}`}>
      {groups.map(({ type, items }, gi) => (
        <section key={type} className="initiatives__group" aria-labelledby={`init-${type}`}>
          <div className="initiatives__group-head">
            <span className="initiatives__group-index">{String(gi + 1).padStart(2, "0")}</span>
            <H id={`init-${type}`} className="t-h4">
              {initiativeTypeLabels[type].group}
            </H>
            <p className="t-small muted">{initiativeTypeLabels[type].blurb}</p>
          </div>
          <ul className="initiatives__items">
            {items.map((item) => (
              <li key={item.slug} id={item.slug} className="initiative">
                <div className="initiative__top">
                  <span className="initiative__name">{item.name}</span>
                  <span className="initiative__chips">
                    <span className={`chip${type === "research" ? " chip--accent" : ""}`}>
                      {initiativeTypeLabels[type].label}
                    </span>
                    <span className="chip chip--pending">{item.status}</span>
                  </span>
                </div>
                <p className="initiative__desc">{item.description}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
