/**
 * The site chrome's words in both editions: masthead, menu, footer, language switch.
 * The site name פתק 2026 is Daniel's choice (STYLE.md, 2026-10-06). The rest of the Hebrew here is PLACEHOLDER: native writers will replace it with Israeli political-media Hebrew written
 * fresh for each element (Daniel, 2026-10-06). Keep every Hebrew chrome string in this file so that is one edit.
 * `he` is typed as `typeof en`, so both editions always carry the same keys.
 */

const en = {
  siteName: "Israel Votes 2026",
  homeLabel: "Israel Votes 2026, home",
  skip: "Skip to content",
  menuLabel: "Main menu",
  nav: {
    home: "Home",
    polls: "Polls",
    builder: "Coalition Builder",
    compare: "Compare the parties",
    results: "Results",
  },
  /** The language switch: the label for a link to the other edition. */
  switchTo: { en: "English", he: "עברית" },
  switchLabel: "This page in the other language",
  englishSite: "The full site in English",
  footNote: "The Hebrew edition covers the polls, the Coalition Builder, the party comparison, the party profiles and the results. Guides and reference pages are in English.",
  byline: "A project of Rabbi Daniel Bogard.",
  bylineName: "Rabbi Daniel Bogard",
  siteMapLabel: "Site map",
  homeTitle: "Israel Votes 2026",
  homeStandfirst: "The Hebrew edition is being written.",
};

const he: typeof en = {
  siteName: "פתק 2026",
  homeLabel: "פתק 2026, לעמוד הראשי",
  skip: "דילוג לתוכן",
  menuLabel: "תפריט ראשי",
  nav: {
    home: "ראשי",
    polls: "סקרים",
    builder: "בונה הקואליציות",
    compare: "השוואת מפלגות",
    results: "תוצאות",
  },
  switchTo: { en: "English", he: "עברית" },
  switchLabel: "העמוד הזה בשפה האחרת",
  englishSite: "האתר המלא באנגלית",
  footNote: "המהדורה העברית כוללת את הסקרים, בונה הקואליציות, השוואת המפלגות, דפי המפלגות והתוצאות. המדריכים ודפי הרקע באנגלית.",
  byline: "פרויקט של הרב דניאל בוגרד.",
  bylineName: "הרב דניאל בוגרד",
  siteMapLabel: "מפת האתר",
  homeTitle: "פתק 2026",
  homeStandfirst: "המהדורה העברית בכתיבה.",
};

const chrome = { en, he };
export default chrome;

/** The Hebrew edition's menu, in order. Party profiles (/he/parties/[id]) are reached from the pages, not the menu. */
export const HE_NAV: { href: string; key: keyof typeof en.nav }[] = [
  { href: "/he", key: "home" },
  { href: "/he/polls", key: "polls" },
  { href: "/he/coalition-builder", key: "builder" },
  { href: "/he/compare", key: "compare" },
  { href: "/he/results", key: "results" },
];
