import type { Metadata } from "next";
import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { Noto_Sans_Arabic } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { editionPath, isRtl } from "@/lib/i18n";
import chrome from "@/lib/i18n/chrome";
import { ui } from "@/lib/i18n/ui";
import { blocText, partyText } from "@/lib/i18n/overlays";
import { frank, sans } from "@/lib/fonts";
import { GA_ID } from "@/lib/analytics";
import { NAV_GROUPS, NAV_UTILITIES, type NavGroup, type NavItem } from "@/lib/site";
import { visibleNavItems } from "@/lib/navigation";
import { allPolls, averagePoll, blocs, exitPolls, mainPolls, parties } from "@/lib/data";
import { averageMeter, firstExit, navFacts } from "@/lib/nav-facts";
import { blocTotals, isExit } from "@/lib/polls";
import { resultsConfig } from "@/lib/results-live";
import briefingsJson from "@/data/briefings/_index.json";
import Logo from "./Logo";
import Countdown from "./Countdown";
import ResultsStrip from "./ResultsStrip";
import SiteNav from "./SiteNav";
import { LangLink } from "./LangSwitch";
import "@/app/globals.css";
import "./site-nav.css";
import "./he-chrome.css";

const arabic = Noto_Sans_Arabic({ variable: "--font-arabic", subsets: ["arabic"], weight: ["400", "500", "600", "700"] });
type Edition = "ar" | "fa" | "de" | "fr" | "zh";

export function toolMetadata(lang: Edition): Metadata {
  const t = chrome[lang];
  return {
    metadataBase: new URL("https://www.israelielection.org"),
    title: { default: t.siteName, template: `%s | ${t.siteName}` }, description: t.description, applicationName: t.siteName,
    openGraph: { type: "website", siteName: t.siteName, locale: ({ ar: "ar_AR", fa: "fa_IR", de: "de_DE", fr: "fr_FR", zh: "zh_CN" })[lang] },
    twitter: { card: "summary_large_image" }, appleWebApp: { title: t.siteName },
  };
}

const closedBy = (iso: string) => Date.now() >= Date.parse(iso);

export default function RtlLayout({ children, lang, provider: Provider }: { children: ReactNode; lang: Edition; provider: ComponentType<{ children: ReactNode }> }) {
  const t = chrome[lang];
  const translateItem = (n: NavItem): NavItem => {
    const href = editionPath(n.href, lang);
    return { ...n, href: href ?? n.href, label: ui(lang, n.label), description: ui(lang, n.description), short: n.short ? ui(lang, n.short) : undefined, hrefLang: href ? lang : "en" };
  };
  const groups: NavGroup[] = NAV_GROUPS.map(g => ({ ...g, label: ui(lang, g.label), items: g.items.map(translateItem) }));
  groups.splice(2, 0, { id: "lists", label: ui(lang, "Party profiles"), items: parties.map(p => {
    const name = partyText(p, "name", lang), leader = partyText(p, "leader", lang);
    return { href: `/${lang}/parties/${p.id}`, label: name.text, lang: name.lang, description: leader.text };
  }) });
  const utilities: NavItem[] = [{ href: `/${lang}`, label: ui(lang, "Home"), description: "" }, ...NAV_UTILITIES.map(translateItem)];
  const pollsClose = process.env.NODE_ENV === "development" && process.env.RESULTS_FIXTURE ? "2000-01-01T00:00:00Z" : resultsConfig.pollsClose;
  const closed = closedBy(pollsClose);
  const facts = navFacts({ newestPoll: allPolls.find(p => !isExit(p))?.published, newestBriefing: briefingsJson.map(b => b.date).sort().at(-1) }, lang);
  const meter = { average: averageMeter(blocTotals(averagePoll, parties), mainPolls.map(p => p.published).sort().at(-1)!, lang), exit: firstExit(exitPolls, parties) };
  const english = (n: NavItem) => n.hrefLang === "en" ? ` ${t.inEnglish}` : "";
  return <html lang={lang} dir={isRtl(lang) ? "rtl" : "ltr"} className={`${frank.variable} ${sans.variable} ${isRtl(lang) ? arabic.variable : ""}`}>
    <body className="min-h-screen flex flex-col">
      <Provider>
        <a href="#main" className="skip">{t.skip}</a>
        <header className="masthead he-masthead">
          <div className="row"><Logo lang={lang} /><Countdown lang={lang} /><SiteNav facts={facts} meter={meter} pollsClose={pollsClose} closedAtRender={closed} groups={groups} utilities={utilities} bar={[`/${lang}`, "/search", "/about"]} home={`/${lang}`} /></div>
          <ResultsStrip pollsClose={pollsClose} blocLabels={Object.fromEntries(blocs.map(b => [b.id, blocText(b, lang)]))} />
        </header>
        <main id="main" className="flex-1">{children}</main>
        <footer className="site-foot he-foot"><div className="row">
          <div className="about"><Logo lang={lang} /><p>{t.description}</p>
            <p>{ui(lang, "Machine-translated edition. Source material that has changed or has no translation is shown in English.")}</p>
            <p>{t.bylineBefore}<a href="https://danielbogard.com" hrefLang="en">{t.bylineName}</a>{t.bylineAfter}</p>
            <ul className="foot-links">{utilities.map(n => <li key={n.href}><Link href={n.href} hrefLang={n.hrefLang}>{n.label}{english(n)}</Link></li>)}<li><LangLink /></li></ul>
          </div>
          <nav className="cols" aria-label={t.siteMapLabel}>{groups.map(g => <div key={g.id}><p className="lbl">{g.label}</p><ul>{visibleNavItems(g.items, closed, "").map(n => <li key={n.href}><Link href={n.href} hrefLang={n.hrefLang}>{n.lang === "en" ? <span lang="en" dir="ltr">{n.label}</span> : n.label}{english(n)}</Link></li>)}</ul></div>)}</nav>
        </div></footer>
      </Provider>
    </body>
    {process.env.VERCEL_ENV === "production" && <GoogleAnalytics gaId={GA_ID} />}
  </html>;
}
