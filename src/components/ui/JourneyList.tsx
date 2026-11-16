import { journey } from "@/content/company";
import "@/app/about.css";

/**
 * The engineering journey as a plain ordered list (no 3D, no dates): the four
 * stages in order. Used on /about.
 */
export function JourneyList() {
  return (
    <ol className="journey-list" aria-label="Engineering journey">
      {journey.map((j, i) => (
        <li key={j.key} className="journey-list__item">
          <span className="journey-list__num">{String(i + 1).padStart(2, "0")}</span>
          <p className="t-utility journey-list__label">{j.label}</p>
          <p className="journey-list__title">{j.title}</p>
          <p className="journey-list__body">{j.body}</p>
        </li>
      ))}
    </ol>
  );
}
