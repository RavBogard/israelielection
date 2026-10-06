import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import chrome from "@/lib/i18n/chrome";

export const ELECTION_DAY = "2026-10-27";

export function daysUntil(iso: string) {
  return Math.ceil((Date.parse(`${iso}T00:00:00+02:00`) - Date.now()) / 86_400_000);
}

/** One line in the masthead: how far away Election Day is. Words from lib/i18n/chrome.ts. */
export default function Countdown({ className, lang = "en" }: { className?: string; lang?: Lang }) {
  const d = daysUntil(ELECTION_DAY), t = chrome[lang].countdown;
  const text =
    d > 1 ? (
      <>
        <b>{t.days(d)}</b>{t.daysAfter}
      </>
    ) : d === 1 ? (
      <>
        <b>{t.tomorrow}</b>{t.tomorrowAfter}
      </>
    ) : d === 0 ? (
      <>
        <b>{t.today}</b>{t.todayAfter}
      </>
    ) : (
      <>
        {t.after}<Link href="/government" hrefLang={lang === "he" ? "en" : undefined}>{t.formation}</Link>
      </>
    );
  return <p className={`countdown${className ? ` ${className}` : ""}`}>{text}</p>;
}
