import { locale, type Lang } from "@/lib/i18n";
/** Display Jerusalem time while preserving the exact instant in <time dateTime>. */
export function recordDate(value: string, lang: Lang) {
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? value + "T12:00:00Z" : value,
  );
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale(lang), {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(value.includes("T")
      ? {
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23" as const,
          timeZoneName: "shortOffset" as const,
        }
      : {}),
  }).format(date);
}
