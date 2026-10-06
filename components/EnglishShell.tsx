import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { GoogleAnalytics } from "@next/third-parties/google";
import Logo from "@/components/Logo";
import ResultsStrip from "@/components/ResultsStrip";
import SiteNav from "@/components/SiteNav";
import { resultsConfig } from "@/lib/results-live";
import Countdown from "@/components/Countdown";
import { DESCRIPTION, NAV_GROUPS, NAV_UTILITIES } from "@/lib/site";
import briefingsJson from "@/data/briefings/_index.json";
import { allPolls, averagePoll, exitPolls, mainPolls, parties } from "@/lib/data";
import { averageMeter, firstExit, navFacts } from "@/lib/nav-facts";
import { visibleNavItems } from "@/lib/navigation";
import { blocTotals, isExit } from "@/lib/polls";
import { RSS } from "@/lib/canonical";
import { frank, sans } from "@/lib/fonts";
import { GA_ID } from "@/lib/analytics";

/**
 * The English edition's document: <html>, masthead, main and footer. Shared by app/(en)/layout.tsx and
 * app/global-not-found.tsx, so an unmatched URL gets the same chrome as every English page.
 */

export const EN_METADATA: Metadata = {
  metadataBase: new URL("https://www.israelielection.org"),
  title: { default: "Israel Votes 2026", template: "%s | Israel Votes 2026" },
  description: DESCRIPTION,
  applicationName: "Israel Votes 2026",
  alternates: { types: RSS },
  // What Facebook, iMessage, Slack and X show when a link is shared. The picture is drawn by app/(en)/opengraph-image.tsx.
  openGraph: { type: "website", siteName: "Israel Votes 2026", locale: "en_US" },
  twitter: { card: "summary_large_image" },
  appleWebApp: { title: "Israel Votes" },
};

export const VIEWPORT = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f6f5f1" }, { media: "(prefers-color-scheme: dark)", color: "#121210" }] };

const FACTS = navFacts({
  newestPoll: allPolls.find((p) => !isExit(p))?.published,
  newestBriefing: (briefingsJson as { date: string }[]).map((b) => b.date).sort().at(-1),
});
/** The masthead seat meter: the average until polls close, then the first channel's exit poll until the count arrives. */
const METER = { average: averageMeter(blocTotals(averagePoll, parties), mainPolls.map((p) => p.published).sort().at(-1)!), exit: firstExit(exitPolls, parties) };

/** Whether polls have closed as this page renders; the menus re-check in the browser. */
const closedBy = (iso: string) => Date.now() >= Date.parse(iso);

export default function EnglishShell({ children }: { children: ReactNode }) {
  // RESULTS_FIXTURE (next dev only) rehearses the night: the strip and the menus treat the polls as closed.
  const pollsClose = process.env.NODE_ENV === "development" && process.env.RESULTS_FIXTURE ? "2000-01-01T00:00:00Z" : resultsConfig.pollsClose;
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
            <SiteNav facts={FACTS} meter={METER} pollsClose={pollsClose} closedAtRender={closedBy(pollsClose)} />
          </div>
          <ResultsStrip pollsClose={pollsClose} />
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
              <ul className="foot-links">
                {NAV_UTILITIES.map((n) => (
                  <li key={n.href}>
                    <Link href={n.href}>{n.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* The header menus' rule: election-night pages join once polls close. Search, the sitemap and All resources always list them. */}
            <nav className="cols" aria-label="Site map">
              {NAV_GROUPS.map((g) => (
                <div key={g.label}>
                  <p className="lbl">{g.label}</p>
                  <ul>
                    {visibleNavItems(g.items, closedBy(pollsClose), "").map((n) => (
                      <li key={n.href}>
                        <Link href={n.href}>{n.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </footer>
      </body>
      {/* Google Analytics on the production site only, so preview deploys do not count. */}
      {process.env.VERCEL_ENV === "production" && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  );
}
