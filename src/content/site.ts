/**
 * Site-wide configuration. Contact details come only from environment
 * variables so nothing is invented. Empty values render as "to be confirmed".
 */

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
    email: clean(process.env.NEXT_PUBLIC_OMGX_CONTACT_EMAIL),
    phone: clean(process.env.NEXT_PUBLIC_OMGX_CONTACT_PHONE),
    address: clean(process.env.NEXT_PUBLIC_OMGX_CONTACT_ADDRESS),
    linkedin: clean(process.env.NEXT_PUBLIC_OMGX_LINKEDIN_URL),
  },
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
