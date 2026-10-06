import type { Lang } from "./i18n";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * Hebrew dates through Intl (he-IL), read at noon UTC so the day never shifts with the reader's time zone.
 * Per docs/planning/2026-10-06-hebrew/STYLE.md: compact dates are day first ("2.10", "2.10.26"), prose dates take
 * the long month ("2 באוקטובר 2026"), never the abbreviated "אוק׳".
 */
const HE = {
  short: new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "numeric", timeZone: "UTC" }),
  medium: new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "numeric", year: "2-digit", timeZone: "UTC" }),
  long: new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }),
};
const heDate = (iso: string, style: keyof typeof HE) => HE[style].format(new Date(`${iso.slice(0, 10)}T12:00:00Z`));

/** "2026-10-02" → "Oct 2"; Hebrew "2.10" */
export function shortDate(iso: string, lang: Lang = "en"): string {
  if (lang === "he") return heDate(iso, "short");
  const [, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

/** "2026-10-02" → "Oct 2, 2026"; Hebrew "2.10.26" */
export function mediumDate(iso: string, lang: Lang = "en"): string {
  if (lang === "he") return heDate(iso, "medium");
  return `${shortDate(iso)}, ${iso.slice(0, 4)}`;
}

/** "2026-10-02" → "October 2, 2026"; Hebrew "2 באוקטובר 2026" */
export function longDate(iso: string, lang: Lang = "en"): string {
  if (lang === "he") return heDate(iso, "long");
  const [y, m, d] = iso.split("-").map(Number);
  return `${LONG[m - 1]} ${d}, ${y}`;
}

/** Rounds to at most two decimals, dropping trailing zeros. */
export function fmt(x: number): string {
  return (Math.round(x * 100) / 100).toString();
}

/** The URL if it is http(s), else null. Poll links come from editable sources. */
export function httpUrl(u: string | null): string | null {
  return u && /^https?:\/\//i.test(u) ? u : null;
}
