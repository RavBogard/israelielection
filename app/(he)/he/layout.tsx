import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { IBM_Plex_Sans_Hebrew } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import Logo from "@/components/Logo";
import Countdown from "@/components/Countdown";
import ResultsStrip from "@/components/ResultsStrip";
import SiteNav from "@/components/SiteNav";
import LangSwitch from "@/components/LangSwitch";
import { GA_ID } from "@/lib/analytics";
import { frank, sans } from "@/lib/fonts";
import chrome, { HE_NAV_BAR, HE_NAV_GROUPS, HE_NAV_UTILITIES } from "@/lib/i18n/chrome";
import { HebrewProvider } from "@/lib/i18n/HebrewProvider";
import { HE_PUBLIC } from "@/lib/i18n";
import { blocText, partyText } from "@/lib/i18n/overlays";
import briefingsJson from "@/data/briefings/_index.json";
import { allPolls, averagePoll, blocs, exitPolls, mainPolls, parties } from "@/lib/data";
import { averageMeter, firstExit, navFacts } from "@/lib/nav-facts";
import { visibleNavItems } from "@/lib/navigation";
import { blocTotals, isExit } from "@/lib/polls";
import { resultsConfig } from "@/lib/results-live";
import type { NavGroup } from "@/lib/site";
import "../../globals.css";
import "@/components/site-nav.css";
import "@/components/he-chrome.css";

// The Hebrew edition's root layout (/he and below): its own <html lang="he" dir="rtl">, so crossing between
// editions is a full page load. The same one-bar masthead as English (components/EnglishShell.tsx): the wordmark
// פתק 2026 with the countdown, the seat meter, four group menus listing the Hebrew pages, the parties and the
// English guides, then Home, Search, About and the English link. All words come from lib/i18n/chrome.ts.

// IBM Plex Sans Hebrew sets the interface's Hebrew (--font-he; the :root:lang(he) stack in globals.css puts
// Public Sans first for Latin and digits). Declared only here so English pages never load it.
const heSans = IBM_Plex_Sans_Hebrew({ variable: "--font-he", subsets: ["hebrew"], weight: ["400", "500", "600", "700"] });

const t = chrome.he;

export const metadata: Metadata = {
  metadataBase: new URL("https://www.israelielection.org"),
  title: { default: t.siteName, template: `%s | ${t.siteName}` },
  description: t.description,
  applicationName: t.siteName,
  // The English share card for v1 (PLAN.md section 1): satori's bidi handling is unreliable.
  openGraph: { type: "website", siteName: t.siteName, locale: "he_IL" },
  twitter: { card: "summary_large_image" },
  appleWebApp: { title: t.siteName },
  // Not indexed until the Hebrew is reviewed and HE_PUBLIC is on.
  ...(HE_PUBLIC ? {} : { robots: { index: false, follow: false } }),
};

export const viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f6f5f1" }, { media: "(prefers-color-scheme: dark)", color: "#121210" }] };

const FACTS = navFacts(
  {
    newestPoll: allPolls.find((p) => !isExit(p))?.published,
    newestBriefing: (briefingsJson as { date: string }[]).map((b) => b.date).sort().at(-1),
  },
  "he",
);
const METER = { average: averageMeter(blocTotals(averagePoll, parties), mainPolls.map((p) => p.published).sort().at(-1)!, "he"), exit: firstExit(exitPolls, parties) };

/** The menus, with the parties group filled from the party data: each name in Hebrew where the overlay has it. */
const GROUPS: NavGroup[] = HE_NAV_GROUPS.map((g) =>
  g.id !== "parties"
    ? g
    : {
        ...g,
        items: parties.map((p) => {
          const name = partyText(p, "name", "he"), leader = partyText(p, "leader", "he");
          return { href: `/he/parties/${p.id}`, label: name.text, lang: name.lang === "en" ? ("en" as const) : undefined, description: leader.lang === "he" ? leader.text : "" };
        }),
      },
);
/** Bloc labels for the results strip, as the overlay gives them. */
const BLOC_LABELS = Object.fromEntries(blocs.map((b) => [b.id, blocText(b, "he")]));

const closedBy = (iso: string) => Date.now() >= Date.parse(iso);
const inEnglish = (lang?: string) => (lang === "en" ? ` ${t.inEnglish}` : "");

export default function HebrewLayout({ children }: { children: ReactNode }) {
  // RESULTS_FIXTURE (next dev only) rehearses the night, as in the English shell.
  const pollsClose = process.env.NODE_ENV === "development" && process.env.RESULTS_FIXTURE ? "2000-01-01T00:00:00Z" : resultsConfig.pollsClose;
  return (
    <html lang="he" dir="rtl" className={`${frank.variable} ${sans.variable} ${heSans.variable}`}>
      <body className="min-h-screen flex flex-col">
        <HebrewProvider>
          <a href="#main" className="skip">
            {t.skip}
          </a>
          <header className="masthead he-masthead">
            <div className="row">
              <Logo lang="he" />
              <Countdown lang="he" />
              <SiteNav facts={FACTS} meter={METER} pollsClose={pollsClose} closedAtRender={closedBy(pollsClose)} groups={GROUPS} utilities={HE_NAV_UTILITIES} bar={HE_NAV_BAR} home="/he" />
            </div>
            <ResultsStrip pollsClose={pollsClose} blocLabels={BLOC_LABELS} />
          </header>
          <main id="main" className="flex-1">
            {children}
          </main>
          <footer className="site-foot he-foot">
            <div className="row">
              <div className="about">
                <Logo lang="he" />
                <p>{t.description}</p>
                <p>{t.footNote}</p>
                <p>
                  {t.bylineBefore}
                  <a href="https://danielbogard.com" hrefLang="en">{t.bylineName}</a>
                  {t.bylineAfter}
                </p>
                <ul className="foot-links">
                  {HE_NAV_UTILITIES.map((n) => (
                    <li key={n.href}>
                      <Link href={n.href} hrefLang={n.hrefLang}>{n.label}{inEnglish(n.hrefLang)}</Link>
                    </li>
                  ))}
                  <li>
                    <LangSwitch />
                  </li>
                </ul>
              </div>
              {/* As in English: election-night pages join once polls close. */}
              <nav className="cols" aria-label={t.siteMapLabel}>
                {GROUPS.map((g) => (
                  <div key={g.id}>
                    <p className="lbl">{g.label}</p>
                    <ul>
                      {visibleNavItems(g.items, closedBy(pollsClose), "").map((n) => (
                        <li key={n.href}>
                          <Link href={n.href} hrefLang={n.hrefLang}>
                            {n.lang === "en" ? <span lang="en" dir="ltr">{n.label}</span> : n.label}
                            {inEnglish(n.hrefLang)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </div>
          </footer>
        </HebrewProvider>
      </body>
      {/* Google Analytics on the production site only, so preview deploys do not count. */}
      {process.env.VERCEL_ENV === "production" && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  );
}
