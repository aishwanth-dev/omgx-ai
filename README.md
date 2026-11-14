# OMGX AI — standalone website

New, independent website for **OMGX AI Private Limited** — *Think beyond. Engineer what's next.*
Built from a clean project directory from the build pack in `../Prompts and Imgs/`. It does not reuse or connect to any other project or service.

## Stack

| Layer | Package (version installed) | Responsibility |
|---|---|---|
| Framework | Next.js 16.4 App Router, React 19.3, TypeScript 5 | Routing, static prerendering, metadata/SEO |
| 3D | three 0.187, @react-three/fiber 9.8, @react-three/drei 10.7 | WebGL scenes (procedural geometry + custom GLSL) |
| Scroll choreography | gsap 3.15 + ScrollTrigger, @gsap/react | Pinned homepage story, scrubbed timelines, marquee, proof cards, process stack |
| UI motion | motion 14 (`motion/react`, formerly Framer Motion) | Menus, mega menu, tab panels, filters, route fade, form states |
| Styling | Plain CSS with design tokens (`src/app/globals.css`, `home.css`, `pages.css`) | No Tailwind |

Animation ownership: R3F owns 3D objects/uniforms, GSAP owns scroll timelines and the shared story progress (`progress` ref, 0–1), Motion owns UI-level transitions, CSS owns small decorative loops. GSAP and Motion never animate the same element.

`cacheComponents` is disabled in `next.config.ts` on purpose: with it on, Next keeps visited routes mounted in a hidden `<Activity>`, which would keep WebGL contexts and ScrollTrigger pins alive. All routes are static anyway.

## Run locally

```powershell
npm install
npm run dev          # http://localhost:3000
npm run build        # production build (all pages prerendered)
npm run start        # serve the production build
npm run lint
npx tsc --noEmit
```

**Note for this machine:** drive `C:` was full when the project was set up, so npm's cache and temp files were redirected into a git-ignored folder inside the project:

```powershell
$env:npm_config_cache = "$PWD\.cache\npm"; $env:TEMP = "$PWD\.cache\tmp"; $env:TMP = $env:TEMP
```

Free space on `C:` (or keep these variables) before installing packages.

## Environment

Copy `.env.example` to `.env.local`. Every value is an OMGX-specific placeholder and is empty by default:

- `NEXT_PUBLIC_OMGX_SITE_URL`: canonical/base URL.
- `NEXT_PUBLIC_OMGX_CONTACT_EMAIL`, `_PHONE`, `_ADDRESS`, `_LINKEDIN_URL`: shown only when set; otherwise "To be confirmed".
- `OMGX_CONTACT_WEBHOOK_URL` (+ optional `OMGX_CONTACT_WEBHOOK_TOKEN`): HTTPS endpoint of the OMGX-approved enquiry delivery service. `/api/contact` validates and forwards enquiries there. **When unset, the form tells the user plainly that the message was not sent** (HTTP 503). It never fakes success.

## Structure

```text
src/
├── app/                      routes, layout, CSS, sitemap/robots, /api/contact
├── content/                  single source of truth transcribed from ABOUT_OMGX_AI.md
│   ├── capabilities.ts       four verticals in the required order + Custom R&D
│   ├── projects.ts           26 canonical project records + work filters
│   ├── initiatives.ts        products / concepts / research (OMG Collections hidden; OMG Glitz excluded)
│   ├── company.ts            story, founder, journey stages, geography, process
│   └── site.ts               brand + env-driven contact config
├── components/
│   ├── layout/               SiteHeader (mega menu, mobile overlay), SiteFooter, Logo
│   ├── loader/               OmgxPreloader (real readiness: page, fonts, first WebGL frame)
│   ├── three/                NeuralCore, StoryScene, MachineAssembly, TunnelFrames, FlowingSplines,
│   │                         CapabilityBand, GlobeScene, CapabilityHeroScene, CoreMini, shaders
│   ├── sections/             homepage sections (HomeStory owns the pinned GSAP timeline)
│   ├── motion/               KineticMarquee
│   └── ui/                   ProjectVisual (labelled conceptual SVG), WorkDirectory, ContactForm, …
└── lib/                      gsap registration, device/WebGL/reduced-motion hooks, readiness store, math
scripts/                      Playwright QA scripts (use the installed Microsoft Edge)
```

## Routes

`/`, `/capabilities`, `/capabilities/{artificial-intelligence | industrial-automation | immersive-technologies | hardware-engineering}`, `/work`, `/work/{26 project slugs}`, `/products-research`, `/about`, `/contact`, plus `sitemap.xml`, `robots.txt` and a custom 404.

## Browser QA

The scripts drive the system's Microsoft Edge through Playwright (no browser download needed):

```powershell
node scripts/qa-home.mjs http://localhost:3000 1440 900 desktop     # loader, story checkpoints, sections
node scripts/qa-home.mjs http://localhost:3000 390 844 mobile
$env:QA_REDUCED="1"; node scripts/qa-home.mjs http://localhost:3000 1440 900 reduced
$env:QA_NOWEBGL="1"; node scripts/qa-home.mjs http://localhost:3000 1440 900 nowebgl
node scripts/qa-routes.mjs http://localhost:3000        # every route, filters, mega menu, form, mobile menu
node scripts/qa-interactions.mjs http://localhost:3000  # capability tabs (mouse + keyboard), globe
node scripts/qa-navigation.mjs http://localhost:3000    # client navigation, back/forward, teardown
node scripts/check-encoding.mjs                         # source files are valid UTF-8
```

Screenshots are written to `qa-output/` (git-ignored).

## Not done / needs approval

See [`docs/MISSING_ASSETS.md`](docs/MISSING_ASSETS.md). Nothing has been pushed, deployed or connected to any external service.
