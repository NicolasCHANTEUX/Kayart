import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { RouteLoadingIndicator } from "@/components/layout/route-loading-indicator";
import { PageBackground } from "@/components/layout/page-background";
import { siteConfig } from "@/config/site";
import { getIndexableOrigin } from "@/config/seo";
import "./globals.css";
import "./atelier-v2.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - ${siteConfig.tagline}`,
    template: `%s - ${siteConfig.name}`
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  robots: getIndexableOrigin() ? { index: true, follow: true } : { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: "black-translucent"
  },
  openGraph: {
    title: `${siteConfig.name} - ${siteConfig.tagline}`,
    description: siteConfig.description,
    siteName: siteConfig.name,
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <head>
        {/* Discovered from the initial HTML instead of three levels deep inside a CSS @import, so the browser can start the font fetch immediately. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap" />
      </head>
      <body>
        <a className="skip-link" href="#main-content">Aller au contenu</a>
        <Suspense fallback={null}>
          <RouteLoadingIndicator />
        </Suspense>
        <div className="shell">
          <PageBackground />
          <SiteHeader />
          <main id="main-content" tabIndex={-1}>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
