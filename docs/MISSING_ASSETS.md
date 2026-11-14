# Missing assets, decisions and approvals

The site is complete and functional with placeholders. The items below have to come from OMGX AI before launch. Nothing here was invented, borrowed from another project or downloaded without a licence.

## Build-pack files that were not in the workspace

- `docs/HOW_TO_USE_THIS_PACK.md`: not present. The pack was supplied flat in `Prompts and Imgs/` instead of the `prompts/ content/ docs/ references/ .kiro/` layout the README describes.
- `references/TIB_Visual_Reference_01.png` (board for frames 01–09): not present. Screenshots `Screenshots/1.png`–`9.png` were used in its place, and `TIB_Visual_Reference_02.png` was used for frames 10–18.

## Brand

| Item | Current state | Where to change |
|---|---|---|
| Official OMGX AI logo (SVG, horizontal + symbol) | Temporary original mark: a ring crossed by two neural paths with nodes | `src/components/layout/Logo.tsx`, `src/app/icon.svg`, preloader |
| Logo clear-space and colour rules | Not supplied | — |
| **Switzer** font files + webfont licence | Not supplied. Fallback: Inter Tight (OFL, via `next/font`) | `src/app/layout.tsx`, `--font-switzer` in `globals.css` |
| **Our Lexend** font files + licence | Not supplied. Fallback: Lexend (OFL, via `next/font`) | same |
| Helvetica | Used as a system font (`Helvetica Neue`, Helvetica, Arial). Confirm whether a licensed file should be supplied instead | `--font-helvetica` |
| Final palette and contrast sign-off | Owner tokens used as given; `--omgx-green-deep` is used for light-surface accents to keep contrast | `globals.css` |
| Open Graph / social share image | Not created | add `src/app/opengraph-image.*` |

## People

- Approved founder photograph of **Gururaj**: missing. A neutral, labelled placeholder is shown. Set `founder.photo` in `src/content/company.ts`. No portrait was generated.
- Approved founder biography, dates and milestones: missing. Only the profile text is used. The journey timeline shows stages without years.
- Team photographs: none supplied, none shown.

## Projects

- Real project photos, interface screenshots, diagrams and videos: none supplied. Every visual is a procedural line illustration labelled "Conceptual visualisation — not project imagery". The 3D scenes are labelled conceptual too.
- Client logo permissions: none, so client names are shown as text only.
- Project dates, outcomes and metrics: none published. The proof cards use only project-specific technical facts from the profile (18 nutrunners, ~600 m, 5 + 5 servo/LVDT channels, OK/NOK, Cp/Cpk, RTSP).
- Project status: shown only where the profile documents it (Completed: Log9, Fishin' India; Proof of concept: BMTC, GVK Airstream, ANSSIRD Mobicast; Concept: Industrial AR Safety & Training). Confirm the status of the others if one should be shown.
- Fishin' India: Walmart is not mentioned anywhere.
- Testimonials: none. None are shown.

## Products, concepts and research

Every item shows "Status to be confirmed". Confirm the public label for: BONA AI, BiziGPT, JEV Vision Integration, BinWin AI Applications, Pitwall, OMGX-OS, OMGX-app, Mallika AI Receptionist, OMG Now, Pattern Internet and Fruit Brain.

- **OMG Collections** is hidden until approved (`site.showOmgCollections` in `src/content/site.ts`).
- **OMG Glitz** is excluded.

## Contact and legal

- Public email, phone, address and LinkedIn URL: not supplied. The site shows "To be confirmed". Set the `NEXT_PUBLIC_OMGX_*` variables.
- **Enquiry delivery service:** not configured. The form is fully built and validated client- and server-side, and it returns an honest "not sent" message until `OMGX_CONTACT_WEBHOOK_URL` points at an OMGX-approved HTTPS endpoint (for example a form or webhook service created for this site). Decide the recipient and service.
- Optional file attachment: not built. It needs a secure upload destination first.
- Privacy policy and consent wording: not supplied. The form says a policy will be linked once published.
- Response-time promise: none shown.
- Legal footer wording and registration details: the footer shows "© {year} OMGX AI Private Limited" and "Formerly Bona fide Digital Services" only.

## Technical and launch

- Repository host, production branch, deployment platform, domain/DNS plan and launch owner: not decided. A local Git repository exists in `website/`. Nothing has been pushed or deployed.
- Analytics and consent: none installed.
- The checklist mentions a "current Juskoe site". It was not inspected or touched, and this site shares nothing with it.
- Known upstream warning: `THREE.Clock: This module has been deprecated` is logged in the browser console. It comes from @react-three/fiber 9.8 internals with three 0.187, not from this project's code. It is harmless and should clear when R3F moves to `THREE.Timer`.
