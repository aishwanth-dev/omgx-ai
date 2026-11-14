import Link from "next/link";
import { capabilities } from "@/content/capabilities";
import { primaryNav, site } from "@/content/site";
import { Logo } from "./Logo";

export function SiteFooter() {
  const { email, phone, address, linkedin } = site.contact;
  const hasContact = email || phone || address || linkedin;

  return (
    <footer className="site-footer" data-theme="dark">
      <div className="container">
        <div className="site-footer__top">
          <div>
            <Logo size={34} />
            <p className="t-statement" style={{ marginTop: 32, fontSize: "clamp(26px, 2.6vw, 40px)" }}>
              Think beyond.
              <br />
              Engineer what&apos;s next.
            </p>
            <Link href="/contact" className="btn btn--primary" style={{ marginTop: 32 }}>
              Start an engineering conversation <span className="btn__arrow" aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="site-footer__cols">
            <div className="site-footer__col">
              <h2 className="t-utility">Explore</h2>
              <ul>
                <li>
                  <Link href="/">Home</Link>
                </li>
                {primaryNav.map((n) => (
                  <li key={n.href}>
                    <Link href={n.href}>{n.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="site-footer__col">
              <h2 className="t-utility">Capabilities</h2>
              <ul>
                {capabilities.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/capabilities/${c.slug}`}>{c.shortTitle}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="site-footer__col">
              <h2 className="t-utility">Contact</h2>
              {hasContact ? (
                <ul>
                  {email && (
                    <li>
                      <a href={`mailto:${email}`}>{email}</a>
                    </li>
                  )}
                  {phone && (
                    <li>
                      <a href={`tel:${phone.replace(/\s+/g, "")}`}>{phone}</a>
                    </li>
                  )}
                  {address && <li className="muted">{address}</li>}
                  {linkedin && (
                    <li>
                      <a href={linkedin} rel="noopener noreferrer" target="_blank">
                        LinkedIn
                      </a>
                    </li>
                  )}
                </ul>
              ) : (
                <p className="muted t-small">
                  Public contact details will be published once confirmed. Use the{" "}
                  <Link href="/contact" style={{ textDecoration: "underline" }}>
                    enquiry form
                  </Link>
                  .
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="site-footer__wordmark" aria-hidden="true">
        <div className="container">OMGX AI</div>
      </div>

      <div className="site-footer__bottom">
        <div className="container" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 16 }}>
          <p className="t-small muted">© {new Date().getFullYear()} {site.legalName}</p>
          <p className="t-small muted">Formerly {site.formerName}</p>
        </div>
      </div>
    </footer>
  );
}
