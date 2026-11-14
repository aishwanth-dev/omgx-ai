import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/PageHero";
import { ContactForm } from "@/components/ui/ContactForm";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start an engineering conversation with OMGX AI about AI, industrial automation, immersive technologies or hardware engineering.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const { email, phone, address, linkedin } = site.contact;
  const rows = [
    { label: "Email", value: email, href: email ? `mailto:${email}` : undefined },
    { label: "Phone", value: phone, href: phone ? `tel:${phone.replace(/\s+/g, "")}` : undefined },
    { label: "Address", value: address },
    { label: "LinkedIn", value: linkedin ? "OMGX AI on LinkedIn" : null, href: linkedin ?? undefined },
  ];

  return (
    <section className="contact" data-theme="dark">
      <div className="contact__glow" aria-hidden="true" />
      <div className="container contact__inner">
        <div className="contact__copy">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
          <p className="t-utility">Contact</p>
          <h1 className="t-display-xl contact__title">
            Let&apos;s engineer
            <br />
            the details.
          </h1>
          <p className="t-lead muted">
            Tell us about the challenge: the process or product, the constraints, and what the system needs to do. We&apos;ll
            start by understanding the problem.
          </p>
          <dl className="contact__details">
            {rows.map((r) => (
              <div key={r.label} className="contact__detail">
                <dt className="t-utility">{r.label}</dt>
                <dd>
                  {r.value ? (
                    r.href ? (
                      <a href={r.href} {...(r.label === "LinkedIn" ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                        {r.value}
                      </a>
                    ) : (
                      r.value
                    )
                  ) : (
                    <span className="muted">To be confirmed</span>
                  )}
                </dd>
              </div>
            ))}
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
