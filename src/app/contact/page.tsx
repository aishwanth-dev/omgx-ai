import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/PageHero";
import { ContactForm } from "@/components/ui/ContactForm";
import { site } from "@/content/site";
import { RevealHeading } from "@/components/motion/RevealHeading";
import { surfaceAttrs } from "@/lib/surfaces";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start an engineering conversation with OMGX AI about AI, industrial automation, immersive technologies or hardware engineering.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const { supportEmail, addressLines } = site.contact;

  return (
    <section className="contact" {...surfaceAttrs("ink")}>
      <div className="contact__glow" aria-hidden="true" />
      <div className="container contact__inner">
        <div className="contact__copy">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
          <p className="t-utility">Contact</p>
          <RevealHeading as="h1" className="t-display-xl contact__title" text={["Let's engineer", "the details."]} />
          <p className="t-lead muted">
            Tell us about the challenge: the process or product, the constraints, and what the system needs to do. We&apos;ll
            start by understanding the problem.
          </p>
          <dl className="contact__details">
            <div className="contact__detail">
              <dt className="t-utility">Email</dt>
              <dd>
                <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
              </dd>
            </div>
            <div className="contact__detail">
              <dt className="t-utility">Address</dt>
              <dd>
                <address style={{ fontStyle: "normal" }}>
                  {addressLines.map((line) => (
                    <span key={line} style={{ display: "block" }}>
                      {line}
                    </span>
                  ))}
                </address>
              </dd>
            </div>
          </dl>
        </div>
        <div className="contact__form">
          <h2 className="t-h3" style={{ marginBottom: 8 }}>
            Tell us about your project
          </h2>
          <p className="t-small muted" style={{ marginBottom: 32 }}>
            We&apos;ll review your brief and reply by email.
          </p>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
