import Link from "next/link";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { surfaceAttrs } from "@/lib/surfaces";

export default function NotFound() {
  return (
    <section className="not-found" {...surfaceAttrs("ink")}>
      <div className="container">
        <p className="t-utility">404</p>
        <RevealHeading as="h1" className="t-display-xl" text="This route doesn't exist." />
        <p className="t-lead muted" style={{ marginTop: 24, maxWidth: "40ch" }}>
          The page may have moved, or the address may be mistyped.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 36 }}>
          <Link href="/" className="btn btn--primary">
            Back to home <span className="btn__arrow" aria-hidden="true">→</span>
          </Link>
          <Link href="/work" className="btn">
            Explore our work <span className="btn__arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
