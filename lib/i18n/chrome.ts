/**
 * The site chrome's words in both editions: masthead, menus, countdown, results strip, footer, language switch.
 * English values are the English site's own words (the English pages read them, so they must not change).
 * Hebrew is written fresh in Israeli political-media Hebrew (STYLE.md; Daniel, 2026-10-06), doing each English
 * element's job. Daniel reviews it here, in one place. `he` is typed as `typeof en`, so both carry the same keys.
 */
import type { Lang } from "./index";
import { editionText } from "./edition-text";
import { heText } from "./he-text";

const en = {
  siteName: "Israel Votes",
  homeLabel: "Israel Votes, home",
  skip: "Skip to content",
  /** The masthead nav. */
  navLabel: "Primary navigation",
  openMenu: "Open menu",
  closeMenu: "Close menu",
  menu: "Menu",
  close: "Close",
  more: "More",
  /** Appended to a Hebrew menu link whose page is English only. Unused in English. */
  inEnglish: "",
  /** The language switch: the label for a link to the other edition. */
  switchTo: { en: "English", he: "עברית" },
  switchLabel: "This page in the other language",
  /** The masthead language toggle (components/LangSwitch.tsx): the group's name, and the Hebrew cell's title on a page with no Hebrew version. Unused in Hebrew, where every page has an English one. */
  langGroup: "Language",
  noHebrew: "This page is in English only. Opens the Hebrew edition's home page.",
  englishSite: "The full site in English",
  description:
    "An English-language reference on Israeli elections: the 2026 result, the parties, the polls, the system, and how a government gets built. Every number dated and sourced.",
  footNote: "",
  bylineBefore: "A project of ",
  bylineName: "Rabbi Daniel Bogard",
  bylineAfter: ".",
  siteMapLabel: "Site map",
  /** The masthead countdown. */
  countdown: {
    /** The figure and its noun as separate text, as the English masthead has always rendered them. */
    days: (d: number): string[] => [String(d), " days"],
    daysAfter: " to Election Day, Tuesday, October 27",
    tomorrow: "Election Day is tomorrow",
    tomorrowAfter: ", Tuesday, October 27",
    today: "Election Day.",
    todayAfter: " Polls close at 10 pm Israel time",
    after: "Israel voted on October 27. ",
    formation: "Forming a government",
  },
  /** The line under the masthead once polls close. */
  strip: {
    closed: "Polls have closed",
    closedNote: "The committee is counting; the results page shows the count as it is published.",
    stale: "Saved count (stale)",
    early: "Early count",
    count: "The count so far",
    localities: (n: number) => `${n.toLocaleString("en-US")} regular localities`,
    turnout: (pct: string) => `, turnout where counted ${pct}%`,
    captured: "Captured",
    israelTime: "Israel time",
    sourceTime: "Source time",
    notProvided: "not provided",
  },
  /** Shared components (CiteButton, SourcesBox, Sources, SeatGrid) in every page. */
  cite: { label: "Cite this", copied: "Copied", failed: "Copy failed." },
  sources: { title: "Sources", show: "Show", hide: "Hide", correction: "Report a correction" },
  grid: {
    majority: (m: number, total: number) => `${m} of ${total} is a majority`,
    seat: (label: string, i: number) => `${label}, seat ${i}`,
    shown: (label: string, seats: number, i: number) => `${label}: ${seats} seats; shown cell ${i}`,
    explore: (label: string, seats: number) => `Explore ${label}: ${seats} seats`,
  },
};


const chrome = {
  en,
  /** Loaded on Hebrew pages only (lib/i18n/he/register.ts). */
  get ar(): Chrome { return editionText<Chrome>("ar", "chrome"); },
  get fa(): Chrome { return editionText<Chrome>("fa", "chrome"); },
  get de(): Chrome { return editionText<Chrome>("de", "chrome"); },
  get fr(): Chrome { return editionText<Chrome>("fr", "chrome"); },
  get zh(): Chrome { return editionText<Chrome>("zh", "chrome"); },

  get he(): Chrome {
    return heText<Chrome>("chrome");
  },
};
export default chrome;
export type Chrome = typeof en;

/**
 * The Hebrew edition's menus: the same four-group disclosure menus as English, listing the Hebrew pages, the
 * parties (filled in by the layout from the party data) and the guides. `hrefLang: "en"` marks a page whose content
 * is still only in English; the menu adds "(באנגלית)" after it. Results and Forming a government join once
 * polls close, as in English.
 */
type HeItem = { href: string; label: string; description: string; short?: string; hrefLang?: Lang; afterClose?: true };
export const HE_NAV_GROUPS: { id: string; label: string; items: HeItem[] }[] = [
  {
    id: "polls",
    label: "סקרים ותוצאות",
    items: [
      { href: "/he/polls", label: "סקרים", description: "כל סקרי המנדטים של מערכת הבחירות וממוצע הסקרים העדכני." },
      { href: "/he/forecast", label: "התחזית", description: "תחזית המנדטים של האתר, איך חישבנו אותה ואיך היא תיבחן." },
      { href: "/he/news", label: "התדריך היומי", description: "תדריך מתוארך בכל יום, עם קישורים לדיווחים המקוריים." },
      { href: "/he/results", label: "תוצאות", afterClose: true, description: "ספירת הקולות בליל הבחירות, עם המקור ושעת העדכון." },
      { href: "/he/government", label: "הרכבת הממשלה", description: "המגעים להרכבת הממשלה הבאה והממשלה היוצאת." },
    ],
  },
  {
    id: "tools",
    label: "קואליציה ועמדות",
    items: [
      { href: "/he/coalition-builder", label: "מרכיבים קואליציה", description: "בחרו מפלגות מכל סקר ובדקו אם מגיעים ל-61." },
      { href: "/he/compare", label: "השוואת עמדות", description: "עמדות המפלגות בסוגיות המרכזיות, זו לצד זו, עם מקורות." },
      { href: "/he/parties", label: "מפת המפלגות", description: "כל הרשימות לפי ממוצע הסקרים, ולכל אחת פרופיל עם מקורות." },
      { href: "/he/ballot", label: "כל הרשימות שהוגשו", description: "כל הרשימות שהגישו מועמדות, גם הקטנות, ומצב כל אחת." },
    ],
  },
  // The parties group: one link per party to its Hebrew profile, filled in by app/(he)/he/layout.tsx.
  { id: "parties", label: "המפלגות", items: [] },
  {
    id: "how",
    label: "מדריכים",
    items: [
      { href: "/he/how-it-works", label: "איך הבחירות עובדות", description: "הפתק, זכות הבחירה, חלוקת המנדטים והרכבת הממשלה." },
      { href: "/he/vote-map", label: "מפת ההצבעה", description: "איך הצביע כל יישוב בחמש מערכות הבחירות, 2019 עד 2022." },
      { href: "/party-history", label: "אילן היוחסין של המפלגות", hrefLang: "en", description: "מאיפה באה כל מפלגה: פילוגים, איחודים ובריתות." },
      { href: "/he/timeline", label: "ציר זמן", description: "בחירות, ראשי ממשלה ואירועי מפתח מ-1977 עד 2026." },
      { href: "/he/glossary", label: "מילון מונחים", description: "מונחי הבחירות, עם התעתיק וההגייה באנגלית." },
    ],
  },
];
/** The utilities: Home, Search and About sit in the bar; the rest at the foot of every open panel, the phone menu and the footer. */
export const HE_NAV_UTILITIES: HeItem[] = [
  { href: "/he", label: "ראשי", description: "" },
  { href: "/he/search", label: "חיפוש", description: "" },
  { href: "/he/about", label: "אודות", description: "" },
  { href: "/he/start", label: "מסלול היכרות", description: "" },
  { href: "/corrections", label: "תיקונים ופניות", hrefLang: "en", description: "" },
];
export const HE_NAV_BAR = ["/he", "/he/search", "/he/about"];
