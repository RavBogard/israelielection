import { locale, type Lang } from "./index";

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

const UPDATED: Record<Lang, (at: string) => string> = {
  en: (a) => `Updated ${a}`,
  he: (a) => `עודכן ב-${a}`,
  ar: (a) => `حُدِّث في ${a}`,
  fa: (a) => `به‌روزرسانی ${a}`,
  de: (a) => `Aktualisiert um ${a}`,
  fr: (a) => `Mis à jour à ${a}`,
  zh: (a) => `${a} 更新`,
};
const UPDATED_FROM: Record<Lang, (at: string, file: string) => string> = {
  en: (a, f) => `Updated ${a} from the count file of ${f}`,
  he: (a, f) => `עודכן ב-${a} מקובץ הספירה של ${f}`,
  ar: (a, f) => `حُدِّث في ${a} من ملف الفرز الصادر في ${f}`,
  fa: (a, f) => `به‌روزرسانی ${a} از فایل شمارش ${f}`,
  de: (a, f) => `Aktualisiert um ${a} aus der Zähldatei von ${f}`,
  fr: (a, f) => `Mis à jour à ${a} depuis le fichier de décompte de ${f}`,
  zh: (a, f) => `${a} 更新，来自 ${f} 的计票文件`,
};

/** HH:MM in Israel time. */
export function israelClock(value: string, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value));
}

/**
 * "Updated HH:MM from the count file of HH:MM" (Israel time). `updatedAt` is when the seat context was last
 * rebuilt (not when its first projection was published); `sourceUpdatedAt` is the count file's own time, when known.
 */
export function updatedFromCount(lang: Lang, updatedAt: string, sourceUpdatedAt?: string | null): string {
  if (!Number.isFinite(Date.parse(updatedAt))) return SOURCE_UP_TO_DATE[lang];
  const file = sourceUpdatedAt && Number.isFinite(Date.parse(sourceUpdatedAt)) ? sourceUpdatedAt : null;
  return file ? UPDATED_FROM[lang](israelClock(updatedAt, lang), israelClock(file, lang)) : UPDATED[lang](israelClock(updatedAt, lang));
}
