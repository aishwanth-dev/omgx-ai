/** Site-wide configuration and the single source of truth for company contact details. */

const clean = (value: string | undefined) => (value && value.trim().length > 0 ? value.trim() : null);

export const site = {
  legalName: "OMGX AI Private Limited",
  name: "OMGX AI",
  formerName: "Bona fide Digital Services",
  tagline: ["THINK BEYOND.", "ENGINEER WHAT'S NEXT."] as const,
  taglineFlat: "Think beyond. Engineer what's next.",
  positioning: "Artificial Intelligence · Industrial Automation · Immersive Technologies · Hardware Engineering",
  description:
    "OMGX AI is a multidisciplinary technology and engineering company building intelligent systems, advanced automation solutions, immersive technologies and integrated hardware–software systems.",
  url: clean(process.env.NEXT_PUBLIC_OMGX_SITE_URL) ?? "http://localhost:3000",
  contact: {
    supportEmail: "support@omgxai.com",
    salesEmail: "sales@omgxai.com",
    /** Address as display lines, top to bottom. */
    addressLines: [
      "No 15, 5th Main Road, Ramanjeneya Nagar",
      "Chikkalsandra",
      "Bengaluru, Karnataka 560061",
      "India",
    ] as readonly string[],
    /** Single-line form for schema and meta. */
    addressLine: "No 15, 5th Main Road, Ramanjeneya Nagar, Chikkalsandra, Bengaluru, Karnataka, India - 560061",
    postal: {
      streetAddress: "No 15, 5th Main Road, Ramanjeneya Nagar, Chikkalsandra",
      addressLocality: "Bengaluru",
      addressRegion: "Karnataka",
      postalCode: "560061",
      addressCountry: "IN",
    },
  },
  x: { handle: "@omgxai", url: "https://x.com/omgxai" },
  /**
   * OMG Collections is a ladies' fashion retail initiative. The profile says it
   * may be shown only if approved for public inclusion. Hidden until approved.
   */
  showOmgCollections: false,
};

export const primaryNav = [
  { label: "Capabilities", href: "/capabilities", mega: "capabilities" as const },
  { label: "Work", href: "/work", mega: "work" as const },
  { label: "Products & R&D", href: "/products-research" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export type SocialIconKey = "x" | "linkedin";

/** Company social profiles, shown as icon links in the footer. */
export const socials: { label: string; href: string; icon: SocialIconKey }[] = [
  { label: "OMGX AI on X", href: site.x.url, icon: "x" },
];
