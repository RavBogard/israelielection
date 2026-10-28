import type { Lang } from "./index";

/** The strip's freshness word when the count source is up to date (it used to read a bare "Current"). */
export const SOURCE_UP_TO_DATE: Record<Lang, string> = {
  en: "Count source up to date",
  he: "מקור הספירה מעודכן",
  ar: "مصدر الفرز محدَّث",
  fa: "منبع شمارش به‌روز است",
  de: "Zählquelle aktuell",
  fr: "Source du décompte à jour",
  zh: "计票来源已更新",
};
