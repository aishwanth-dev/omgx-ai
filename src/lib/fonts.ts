import localFont from "next/font/local";

/**
 * Owner-supplied font files (copied into src/fonts from the workspace).
 * The site is set in Geist (SIL OFL 1.1): body and UI at 400, headings at their
 * own true weights. See --font-geist in globals.css, which the older Switzer
 * and Lexend tokens alias.
 * Switzer (Indian Type Foundry FFL) and Lexend (SIL OFL 1.1) stay registered
 * with their licences but are not preloaded, since nothing renders in them.
 */
export const geist = localFont({
  // The owner's variable file (Geist-Variable.ttf) has a non-standard wght axis (32–240), so CSS
  // weights 400/700 would all clamp to its heaviest master. The owner's static cuts carry the true
  // weights instead.
  src: [
    { path: "../fonts/Geist-Regular.otf", weight: "400", style: "normal" },
    { path: "../fonts/Geist-Medium.otf", weight: "500", style: "normal" },
    { path: "../fonts/Geist-SemiBold.otf", weight: "600", style: "normal" },
    { path: "../fonts/Geist-Bold.otf", weight: "700", style: "normal" },
    { path: "../fonts/Geist-Black.otf", weight: "800", style: "normal" },
  ],
  variable: "--font-geist-local",
  display: "swap",
});

export const switzer = localFont({
  src: "../fonts/Switzer-Variable.woff2",
  variable: "--font-switzer-local",
  weight: "100 900",
  display: "swap",
  preload: false,
});

export const lexend = localFont({
  src: "../fonts/Lexend-Variable.ttf",
  variable: "--font-lexend-local",
  weight: "100 900",
  display: "swap",
  preload: false,
});
