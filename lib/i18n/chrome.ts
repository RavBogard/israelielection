/**
 * The site chrome's words in both editions: masthead, menus, countdown, results strip, footer, language switch.
 * English values are the English site's own words (the English pages read them, so they must not change).
 * Hebrew is written fresh in Israeli political-media Hebrew (STYLE.md; Daniel, 2026-10-06), doing each English
 * element's job. Daniel reviews it here, in one place. `he` is typed as `typeof en`, so both carry the same keys.
 */
import type { Lang } from "./index";
import { seatsHe } from "./he-grammar";

const en = {
  siteName: "Israel Votes 2026",
  homeLabel: "Israel Votes 2026, home",
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
  englishSite: "The full site in English",
  description:
    "An English-language reference on Israel's October 27, 2026 election: the parties, the polls, the system, and how a government gets built. Every number dated and sourced.",
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
    closedNote: "The channels' exit polls are on the results page; the committee's count follows.",
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

const he: typeof en = {
  siteName: "פתק 2026",
  homeLabel: "פתק 2026, לעמוד הראשי",
  skip: "דלגו לתוכן",
  navLabel: "ניווט ראשי",
  openMenu: "פתיחת התפריט",
  closeMenu: "סגירת התפריט",
  menu: "תפריט",
  close: "סגירה",
  more: "עוד",
  inEnglish: "(באנגלית)",
  switchTo: { en: "English", he: "עברית" },
  switchLabel: "העמוד הזה בשפה האחרת",
  englishSite: "האתר המלא באנגלית",
  description: "הסקרים, המפלגות, העמדות והדרך ל-61 לקראת הבחירות לכנסת ה-26, ב-27 באוקטובר 2026. כל מספר מתוארך, ולכל נתון יש מקור.",
  footNote: "בעברית: הסקרים, הרכבת הקואליציה, השוואת העמדות, דפי המפלגות והתוצאות. המדריכים ושאר דפי הרקע באנגלית.",
  bylineBefore: "פרויקט של ",
  bylineName: "הרב דניאל בוגרד",
  bylineAfter: ".",
  siteMapLabel: "מפת האתר",
  countdown: {
    days: (d: number) => (d === 2 ? ["יומיים"] : [String(d), " ימים"]),
    daysAfter: " לבחירות, יום שלישי, 27 באוקטובר",
    tomorrow: "הבחירות מחר",
    tomorrowAfter: ", יום שלישי, 27 באוקטובר",
    today: "יום הבחירות.",
    todayAfter: " הקלפיות נסגרות ב-22:00",
    after: "הבחירות התקיימו ב-27 באוקטובר. ",
    formation: "הרכבת הממשלה (באנגלית)",
  },
  strip: {
    closed: "הקלפיות נסגרו",
    closedNote: "מדגמי הערוצים בעמוד התוצאות; ספירת ועדת הבחירות המרכזית בהמשך.",
    stale: "ספירה שמורה (לא מעודכנת)",
    early: "תוצאות אמת ראשונות",
    count: "הספירה עד כה",
    localities: (n: number) => `${n.toLocaleString("en-US")} יישובים רגילים`,
    turnout: (pct: string) => `, אחוז ההצבעה ביישובים שנספרו ${pct}%`,
    captured: "נקלט:",
    israelTime: "שעון ישראל",
    sourceTime: "עדכון המקור:",
    notProvided: "לא צוין",
  },
  cite: { label: "לציטוט", copied: "הועתק", failed: "ההעתקה נכשלה." },
  sources: { title: "מקורות", show: "הצגה", hide: "הסתרה", correction: "דווחו על טעות (באנגלית)" },
  grid: {
    majority: (m: number, total: number) => `רוב: ${m} מתוך ${total}`,
    seat: (label: string, i: number) => `${label}, משבצת ${i}`,
    shown: (label: string, seats: number, i: number) => `${label}: ${seatsHe(seats)}; משבצת ${i}`,
    explore: (label: string, seats: number) => `${label}: ${seatsHe(seats)}. לפרופיל`,
  },
};

const chrome = { en, he };
export default chrome;
export type Chrome = typeof en;

/**
 * The Hebrew edition's menus: the same four-group disclosure menus as English, listing the Hebrew pages, the
 * parties (filled in by the layout from the party data) and the English guides. `hrefLang: "en"` marks a page
 * that exists only in English; the menu adds "(באנגלית)" after it. Results and Forming a government join once
 * polls close, as in English.
 */
type HeItem = { href: string; label: string; description: string; short?: string; hrefLang?: Lang; afterClose?: true };
export const HE_NAV_GROUPS: { id: string; label: string; items: HeItem[] }[] = [
  {
    id: "polls",
    label: "סקרים ותוצאות",
    items: [
      { href: "/he/polls", label: "סקרים", description: "כל סקרי המנדטים של מערכת הבחירות וממוצע הסקרים העדכני." },
      { href: "/news", label: "התדריך היומי", hrefLang: "en", description: "תדריך מתוארך בכל יום, עם קישורים לדיווחים המקוריים." },
      { href: "/he/results", label: "תוצאות", afterClose: true, description: "ספירת הקולות בליל הבחירות, עם המקור ושעת העדכון." },
      { href: "/government", label: "הרכבת הממשלה", hrefLang: "en", afterClose: true, description: "המגעים להרכבת הממשלה הבאה והממשלה היוצאת." },
    ],
  },
  {
    id: "tools",
    label: "קואליציה ועמדות",
    items: [
      { href: "/he/coalition-builder", label: "מרכיבים קואליציה", description: "בחרו מפלגות מכל סקר ובדקו אם מגיעים ל-61." },
      { href: "/he/compare", label: "השוואת עמדות", description: "עמדות המפלגות בסוגיות המרכזיות, זו לצד זו, עם מקורות." },
      { href: "/parties", label: "מפת המפלגות", hrefLang: "en", description: "כל הרשימות לפי ממוצע הסקרים, ולכל אחת פרופיל עם מקורות." },
      { href: "/ballot", label: "כל הרשימות שהוגשו", hrefLang: "en", description: "כל הרשימות שהגישו מועמדות, גם הקטנות, ומצב כל אחת." },
    ],
  },
  // The parties group: one link per party to its Hebrew profile, filled in by app/(he)/he/layout.tsx.
  { id: "parties", label: "המפלגות", items: [] },
  {
    id: "how",
    label: "מדריכים",
    items: [
      { href: "/how-it-works", label: "איך הבחירות עובדות", hrefLang: "en", description: "הפתק, זכות הבחירה, חלוקת המנדטים והרכבת הממשלה." },
      { href: "/vote-map", label: "מפת ההצבעה", hrefLang: "en", description: "איך הצביע כל יישוב בחמש מערכות הבחירות, 2019 עד 2022." },
      { href: "/party-history", label: "אילן היוחסין של המפלגות", hrefLang: "en", description: "מאיפה באה כל מפלגה: פילוגים, איחודים ובריתות." },
      { href: "/timeline", label: "ציר זמן", hrefLang: "en", description: "בחירות, ראשי ממשלה ואירועי מפתח מ-1977 עד 2026." },
      { href: "/glossary", label: "מילון מונחים", hrefLang: "en", description: "מונחי הבחירות, עם התעתיק וההגייה באנגלית." },
    ],
  },
];
/** The utilities: Home, Search and About sit in the bar; the rest at the foot of every open panel, the phone menu and the footer. */
export const HE_NAV_UTILITIES: HeItem[] = [
  { href: "/he", label: "ראשי", description: "" },
  { href: "/search", label: "חיפוש", hrefLang: "en", description: "" },
  { href: "/about", label: "אודות", hrefLang: "en", description: "" },
  { href: "/start", label: "מסלול היכרות", hrefLang: "en", description: "" },
  { href: "/corrections", label: "תיקונים ופניות", hrefLang: "en", description: "" },
];
export const HE_NAV_BAR = ["/he", "/search", "/about"];
