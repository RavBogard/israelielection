"use client";
import { useSeatContext } from "./seat-context/SeatContextProvider";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import { editionPath } from "@/lib/i18n";
import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import chrome from "@/lib/i18n/chrome";

import { ELECTION_DAY,daysUntil } from "@/lib/election-date";
export {ELECTION_DAY,daysUntil} from "@/lib/election-date";

/** One line in the masthead: how far away Election Day is. Words from lib/i18n/chrome.ts. */
export default function Countdown({ className, lang = "en" }: { className?: string; lang?: Lang }) {
  const {context}=useSeatContext();
  if(context&&context.evidenceStage!=="campaign")return <p className={`countdown${className?` ${className}`:""}`}><b>{LIFECYCLE[lang][context.basis]}</b> · <Link href={editionPath("/government",lang)??"/government"}>{LIFECYCLE[lang].negotiations}</Link></p>;
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
        {t.after}<Link href={editionPath("/government",lang)??"/government"}>{LIFECYCLE[lang].negotiations}</Link>
      </>
    );
  return <p className={`countdown${className ? ` ${className}` : ""}`}>{text}</p>;
}
