# OMGX AI website

Website for **OMGX AI Private Limited** (*Think beyond. Engineer what's next.*): a scroll-driven homepage story with a 3D hero, capability pages, a work directory, an about page and an EmailJS contact form.

## Stack

| Layer | Packages | Responsibility |
|---|---|---|
| Framework | Next.js 16.4 (App Router), React 19.3, TypeScript 5 | Routing, static prerendering, metadata and SEO |
| 3D | three 0.187, @react-three/fiber 9.8, @react-three/drei 10.7 | WebGL scenes, GLB models (Draco compressed) |
| Scroll | gsap 3.15 + ScrollTrigger, @gsap/react, lenis | Pinned homepage story, scrubbed timelines, smooth scrolling |
| UI motion | motion 14 (`motion/react`) | Menus, tabs, filters, route fade, form states |
| Contact | @emailjs/browser 5 | Enquiry delivery from the browser |
| Tests | vitest 4, fast-check, Playwright (system Edge) | Unit and property tests, browser QA scripts |

Styling is plain CSS with design tokens (`src/app/globals.css` and the other `*.css` files in `src/app`). There is no Tailwind. GSAP owns scroll timelines, R3F owns 3D objects, Motion owns UI transitions.

`cacheComponents` is off in `next.config.ts` on purpose, so visited routes unmount and release their WebGL contexts and ScrollTrigger pins.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:3000 (`predev` runs `scripts/copy-draco.mjs`) |
| `npm run build` | Production build (`prebuild` runs `copy-draco.mjs`) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | `vitest --run` |
| `npx tsc --noEmit` | Type check |
| `npm run art:build` | Rebuild the hero GLBs with Blender (see below) |
| `npm run check:glb` | Validate `public/models/*.glb` (sizes, Draco, structure) |
| `npm run build:land` | Regenerate the globe land-dot data |
| `node scripts/check-encoding.mjs` | Check that source files are valid UTF-8 |

Browser QA scripts live in `scripts/qa-*.mjs`. They drive the installed Microsoft Edge through Playwright against a running server and write screenshots to `qa-output/` (git-ignored). Examples:

```powershell
node scripts/qa-home.mjs http://localhost:3000 1440 900 desktop
node scripts/qa-home.mjs http://localhost:3000 390 844 mobile
node scripts/qa-routes.mjs http://localhost:3000
node scripts/qa-navigation.mjs http://localhost:3000
node scripts/qa-3d.mjs http://localhost:3000
```

If drive `C:` is short on space, point npm and temp at the project:

```powershell
$env:npm_config_cache = "$PWD\.cache\npm"; $env:TEMP = "$PWD\.cache\tmp"; $env:TMP = $env:TEMP
```

## Fonts

Fonts are self-hosted from `src/fonts` through `next/font/local` (`src/lib/fonts.ts`). No font request leaves the site's origin. Licence files sit next to the fonts.

| Font | Use | Licence |
|---|---|---|
| Geist (static Regular, Medium, SemiBold, Bold, Black) | Body, UI and headings | SIL OFL 1.1 (`Geist-OFL.txt`) |
| Lexend (variable) | Registered, not preloaded | SIL OFL 1.1 (`Lexend-OFL.txt`) |
| Switzer (variable) | Registered, not preloaded | Indian Type Foundry FFL (`Switzer-ITF-FFL.txt`) |

## 3D models and the Blender pipeline

`public/models` holds `hero-core.glb`, `hero-core-lite.glb` and `journey-ring.glb`, with poster images in `public/images`. The Draco decoder is copied from `node_modules/three` into `public/draco/gltf` by `scripts/copy-draco.mjs` on every `dev` and `build`; the copy is also committed.

The hero models are built headlessly in Blender from `art/hero-core/build_hero_core.py`:

```powershell
npm run art:build
# same as: powershell -NoProfile -File scripts/blender/run-blender.ps1
```

`scripts/blender/run-blender.ps1` expects Blender in `A:\OMGX-AI\tools\blender-5.2.4-windows-x64` and keeps its temp files on drive A:. The build report is written to `art/hero-core/build-report.json`. Run `npm run check:glb` afterwards.

## Contact form (EmailJS)

The form sends from the browser with the EmailJS SDK (`src/lib/emailjs.ts`). It sends one notification to the OMGX AI inbox and one auto-reply to the visitor. There is no server route and no webhook. All values are public client-side IDs and have defaults in code, so nothing needs to be configured. To override them, copy `.env.example` to `.env.local`:

- `NEXT_PUBLIC_EMAILJS_SERVICE_ID`
- `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`
- `NEXT_PUBLIC_EMAILJS_TEMPLATE_NOTIFY`
- `NEXT_PUBLIC_EMAILJS_TEMPLATE_REPLY`
- `NEXT_PUBLIC_OMGX_SITE_URL` (canonical URL, sitemap, Open Graph)

The EmailJS private key is not used by the site and must never be added to the repository. `.env*` files are git-ignored except `.env.example`.

## Dev origins

`allowedDevOrigins` in `next.config.ts` lets the dev server be opened as `127.0.0.1` or from a LAN address (`192.168.*.*`, `10.*.*.*`) without HMR WebSocket errors. It affects `next dev` only.

## Deployment (Vercel)

- Framework preset: Next.js
- Root directory: the repository root
- Build command: `npm run build`
- Install command: `npm install` (default)
- Environment variables: none required, the defaults are in code

## Structure

```text
src/app/          routes, layout, CSS, sitemap, robots, social images
src/content/      capabilities, projects, initiatives, company, site config
src/components/   layout, loader, three, sections, motion, globe, ui
src/lib/          gsap and lenis setup, device hooks, readiness store, emailjs, fonts
src/fonts/        self-hosted fonts and licences
art/hero-core/    Blender source for the hero models
scripts/          copy-draco, check-glb, check-encoding, Blender runner, qa-*.mjs
public/           models, draco, brand, images
```

Open items and decisions for the owner are in [`docs/MISSING_ASSETS.md`](docs/MISSING_ASSETS.md).
