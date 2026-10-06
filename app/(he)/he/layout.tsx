import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Sans_Hebrew } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Mark } from "@/components/Logo";
import LangSwitch from "@/components/LangSwitch";
import { GA_ID } from "@/lib/analytics";
import { frank, sans } from "@/lib/fonts";
import chrome, { HE_NAV } from "@/lib/i18n/chrome";
import { LangProvider } from "@/lib/i18n/lang";
import { HE_PUBLIC } from "@/lib/i18n";
import "../../globals.css";
import "@/components/he-chrome.css";

// The Hebrew edition's root layout (/he and below): its own <html lang="he" dir="rtl">, so crossing between
// editions is a full page load. The English one is app/(en)/layout.tsx. All words come from lib/i18n/chrome.ts.

// IBM Plex Sans Hebrew sets the interface's Hebrew (--font-he; the :root:lang(he) stack in globals.css puts
// Public Sans first for Latin and digits). Declared only here so English pages never load it.
const heSans = IBM_Plex_Sans_Hebrew({ variable: "--font-he", subsets: ["hebrew"], weight: ["400", "500", "600", "700"] });

const t = chrome.he;

export const metadata: Metadata = {
  metadataBase: new URL("https://www.israelielection.org"),
  title: { default: t.siteName, template: `%s | ${t.siteName}` },
  applicationName: t.siteName,
  // The English share card for v1 (PLAN.md section 1): satori's bidi handling is unreliable.
  openGraph: { type: "website", siteName: t.siteName, locale: "he_IL" },
  twitter: { card: "summary_large_image" },
  appleWebApp: { title: t.siteName },
  // Not indexed until the Hebrew is reviewed and HE_PUBLIC is on.
  ...(HE_PUBLIC ? {} : { robots: { index: false, follow: false } }),
};

export const viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f6f5f1" }, { media: "(prefers-color-scheme: dark)", color: "#121210" }] };

export default function HebrewLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${frank.variable} ${sans.variable} ${heSans.variable}`}>
      <body className="min-h-screen flex flex-col">
        <LangProvider lang="he">
          <a href="#main" className="skip">
            {t.skip}
          </a>
          <header className="he-mast">
            <div className="row">
              <a href="/he" className="brand" aria-label={t.homeLabel}>
                <Mark className="mark" />
                <span className="word">{t.siteName}</span>
              </a>
              <nav aria-label={t.menuLabel}>
                <ul>
                  {HE_NAV.map((n) => (
                    <li key={n.href}>
                      <a href={n.href}>{t.nav[n.key]}</a>
                    </li>
                  ))}
                </ul>
              </nav>
              <LangSwitch />
            </div>
          </header>
          <main id="main" className="flex-1">
            {children}
          </main>
          <footer className="site-foot he-foot">
            <div className="row">
              <div className="about">
                <a href="/he" className="brand" aria-label={t.homeLabel}>
                  <Mark className="mark" />
                  <span className="word">{t.siteName}</span>
                </a>
                <p>{t.footNote}</p>
                <p>{t.byline}</p>
                <ul className="foot-links">
                  {HE_NAV.map((n) => (
                    <li key={n.href}>
                      <a href={n.href}>{t.nav[n.key]}</a>
                    </li>
                  ))}
                  <li>
                    <a href="/" hrefLang="en" lang="en" dir="ltr">
                      {t.englishSite}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </footer>
        </LangProvider>
      </body>
      {/* Google Analytics on the production site only, so preview deploys do not count. */}
      {process.env.VERCEL_ENV === "production" && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  );
}
