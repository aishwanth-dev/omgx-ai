import type { Metadata, Viewport } from "next";
import { Inter_Tight, Lexend } from "next/font/google";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { site } from "@/content/site";
import "./globals.css";
import "./home.css";
import "./pages.css";

// Temporary open-licence fallbacks for the owner-specified Switzer and Our Lexend.
const switzerFallback = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-switzer-fallback",
  display: "swap",
});

const lexendFallback = Lexend({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-lexend-fallback",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "OMGX AI — Think beyond. Engineer what's next.",
    template: "%s — OMGX AI",
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: "OMGX AI — Think beyond. Engineer what's next.",
    description: site.description,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#080b0d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${switzerFallback.variable} ${lexendFallback.variable}`} suppressHydrationWarning>
      <head>
        {/* Marks JS availability before paint so scroll-story states never flash. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body data-theme="dark">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
