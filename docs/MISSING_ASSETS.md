# Content the owner still has to supply

The site works without these items. Each one has a placeholder or a neutral fallback.

## Brand
- Final logo files (SVG, horizontal and symbol) and clear-space rules. The site uses the current logo in `public/brand`.
- Helvetica is used as a system font stack (`--font-helvetica`). Supply a licensed file if a fixed face is wanted.

## People
- Approved photograph and biography for the founder, Gururaj. A labelled placeholder is shown; set `founder.photo` in `src/content/company.ts`.
- Team photographs. None are shown.

## Projects
- Real project photos, interface screenshots, diagrams and videos. Every project visual is a procedural illustration labelled as conceptual.
- Client logo permissions. Client names are shown as text.
- Project dates, outcomes and metrics. Only technical facts from the company profile are used.
- Testimonials. None are shown.

## Products, concepts and research
- Public status labels for BONA AI, BiziGPT, JEV Vision Integration, BinWin AI Applications, Pitwall, OMGX-OS, OMGX-app, Mallika AI Receptionist, OMG Now, Pattern Internet and Fruit Brain.
- OMG Collections stays hidden until approved (`site.showOmgCollections` in `src/content/site.ts`). OMG Glitz is excluded.

## Contact and legal
- Contact form: EmailJS, sent from the browser, configured (see README).
- Privacy policy and consent wording. The form links to none yet.
- Optional file attachment on the form is not built; it needs a secure upload destination.
- Registration details for the footer. It shows the company name and "Formerly Bona fide Digital Services".

## Launch
- Production domain and DNS.
- Analytics and cookie consent. None installed.
- Known harmless console warning: `THREE.Clock: This module has been deprecated`, logged by @react-three/fiber 9.8 internals with three 0.187.
