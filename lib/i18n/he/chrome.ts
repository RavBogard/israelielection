// The Hebrew words for lib/i18n/chrome.ts, kept apart so English pages never download them: lib/i18n/he/register.ts
// loads this file on Hebrew pages (the Hebrew layout's client provider and the server-side overlay loader).
import { seatsHe } from "../he-grammar";
import type { Chrome } from "../chrome";

const he: Chrome = {
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
  langGroup: "שפה",
  noHebrew: "",
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

export default he;
