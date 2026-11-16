import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "lenis/dist/lenis.css";
import { HalftoneFooter } from "@/components/layout/HalftoneFooter";
import { PageTransition } from "@/components/layout/PageTransition";
import { Providers } from "@/components/layout/Providers";
import { RouteWatcher } from "@/components/layout/RouteWatcher";
import { ScrollRouter } from "@/components/layout/ScrollRouter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { RevealObserver } from "@/components/motion/RevealObserver";
import { site } from "@/content/site";
import { geist, lexend, switzer } from "@/lib/fonts";
import "./globals.css";
import "./home.css";
import "./pages.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: "OMGX AI",
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: "OMGX AI",
    description: site.description,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: "OMGX AI" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#05070f",
  colorScheme: "dark",
};

const BOOT =
  "(function(d){d.classList.add('js');try{if(matchMedia('(prefers-reduced-motion: no-preference)').matches)d.classList.add('motion')}catch(e){}" +
  "try{var a='bis_skin_checked',s=function(n){n.removeAttribute&&n.removeAttribute(a)},o=new MutationObserver(function(l){for(var i=0;i<l.length;i++){var m=l[i];if(m.type==='attributes')s(m.target)}});o.observe(d,{attributes:true,attributeFilter:[a],subtree:true});d.querySelectorAll('['+a+']').forEach(s);setTimeout(function(){o.disconnect()},15000)}catch(e){}})(document.documentElement)";

const ORG_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.legalName,
  alternateName: site.name,
  url: site.url,
  description: site.description,
  email: site.contact.supportEmail,
  address: { "@type": "PostalAddress", ...site.contact.postal },
  sameAs: [site.x.url],
}).replace(/</g, "\\u003c");

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${geist.variable} ${switzer.variable} ${lexend.variable}`} suppressHydrationWarning>
      <body data-theme="dark" suppressHydrationWarning>
        {/* One inline script, first in <body> and not in <head>: before paint it sets `js` always and `motion`
            only when reduced motion is not requested (start states exist only under html.motion, so no-JS and
            reduced motion show final states). It also strips `bis_skin_checked`, which browser security
            extensions stamp on every <div> before hydration.
            It is not in <head> because extensions append their own <script> there while the document parses;
            React then matches that node against this script and reports a hydration mismatch, which is the
            dev overlay's "1 Issue". <body>'s first child is left alone. */}
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: BOOT }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ORG_JSON_LD }} />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Providers>
          <SmoothScroll />
          <ScrollRouter />
          <Suspense fallback={null}>
            <RouteWatcher />
          </Suspense>
          <RevealObserver />
          <SiteHeader />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <HalftoneFooter />
          <PageTransition />
        </Providers>
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
