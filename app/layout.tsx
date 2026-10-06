import type { Metadata } from "next";
import { Frank_Ruhl_Libre, Public_Sans } from "next/font/google";
import Link from "next/link";
import { GoogleAnalytics } from "@next/third-parties/google";
import Logo from "@/components/Logo";
import ResultsStrip from "@/components/ResultsStrip";
import SiteNav from "@/components/SiteNav";
import { resultsConfig } from "@/lib/results-live";
import Countdown from "@/components/Countdown";
import { DESCRIPTION, NAV_GROUPS, NAV_UTILITIES } from "@/lib/site";
import "./globals.css";

const GA_ID = "G-DB53C0NZHB";

// Frank Ruhl Libre is the Latin companion of Frank-Rühl, the face Hebrew newspapers have been
// set in since 1910: it carries the headlines, the seat numbers and the prose. Public Sans, the
// face of the teaching deck, carries the interface: labels, tables, controls.
const frank = Frank_Ruhl_Libre({ variable: "--font-frank", subsets: ["latin", "hebrew"], weight: ["400", "500", "700", "900"] });
const sans = Public_Sans({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.israelielection.org"),
  title: { default: "Israel Votes 2026", template: "%s | Israel Votes 2026" },
  description: DESCRIPTION,
  applicationName: "Israel Votes 2026",
  alternates: { types: { "application/rss+xml": [{ url: "/news/feed.xml", title: "Israel Votes 2026: daily briefing" }] } },
  // What Facebook, iMessage, Slack and X show when a link is shared. The picture is app/opengraph-image.png.
  openGraph: { type: "website", siteName: "Israel Votes 2026", locale: "en_US" },
  twitter: { card: "summary_large_image" },
  appleWebApp: { title: "Israel Votes" },
};

export const viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f6f5f1" }, { media: "(prefers-color-scheme: dark)", color: "#000000" }] };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${frank.variable} ${sans.variable}`}>
      <body className="min-h-screen flex flex-col">
        <a href="#main" className="skip">
          Skip to content
        </a>
        <header className="masthead">
          <div className="row">
            <Logo />
            <Countdown />
            <SiteNav extra={<Countdown />} />
          </div>
          {/* RESULTS_FIXTURE (next dev only) rehearses the night: the strip treats the polls as closed. */}
          <ResultsStrip pollsClose={process.env.NODE_ENV === "development" && process.env.RESULTS_FIXTURE ? "2000-01-01T00:00:00Z" : resultsConfig.pollsClose} />
        </header>
        <main id="main" className="flex-1">
          {children}
        </main>
        <footer className="site-foot">
          <div className="row">
            <div className="about">
              <Logo />
              <p>{DESCRIPTION}</p>
              <p>
                A project of <a href="https://danielbogard.com">Rabbi Daniel Bogard</a>.
              </p>
              <p className="privacy">
                This site uses Google Analytics to understand visits and page use. <Link href="/about#privacy">Privacy</Link>.
              </p>
            </div>
            <nav className="cols" aria-label="Site map">
              {NAV_GROUPS.map((g) => (
                <div key={g.label}>
                  <p className="lbl">{g.label}</p>
                  <ul>
                    {g.items.map((n) => (
                      <li key={n.href}>
                        <Link href={n.href}>{n.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="footer-utilities"><p className="lbl">Find your way</p><ul>{NAV_UTILITIES.map(n=><li key={n.href}><Link href={n.href}>{n.label}</Link></li>)}</ul></div>
            </nav>
          </div>
        </footer>
      </body>
      {/* Google Analytics on the production site only, so preview deploys do not count. */}
      {process.env.VERCEL_ENV === "production" && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  );
}
