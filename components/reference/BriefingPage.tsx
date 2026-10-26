import Link from "next/link";
import { notFound } from "next/navigation";
import briefingsJson from "@/data/briefings/_index.json";
import type { Briefing } from "@/lib/briefing";
import { editionPath, locale, type Lang } from "@/lib/i18n";
import { briefingCopy } from "@/lib/i18n/briefing";
import { subscriptionText } from "@/lib/i18n/subscriptions";
import BriefingEvidence from "./BriefingEvidence";
import "./reference.css";
const briefings = briefingsJson as Briefing[];
export default function BriefingPage({
  lang,
  date,
}: {
  lang: Lang;
  date?: string;
}) {
  const t = briefingCopy(lang),
    selected = date ? briefings.find((b) => b.date === date) : briefings[0];
  if (date && !selected) notFound();
  return (
    <div className="wrap article-page reference-page">
      <header className="page-head">
        <h1 className="ph-title">{t.title}</h1>
        <p className="standfirst">{t.intro}</p>
        <Link href={editionPath("/subscriptions", lang)!}>
          {subscriptionText(lang).title}
        </Link>
      </header>
      {selected ? (
        <>
          <h2>
            <time dateTime={selected.date}>
              {new Date(selected.date + "T12:00:00Z").toLocaleDateString(
                locale(lang),
                { dateStyle: "long", timeZone: "UTC" },
              )}
            </time>
          </h2>
          <BriefingEvidence briefing={selected} lang={lang} />
        </>
      ) : (
        <p>{t.empty}</p>
      )}
      <h2>{t.archive}</h2>
      <ul>
        {briefings
          .filter((b) => b.date !== selected?.date)
          .map((b) => (
            <li key={b.date}>
              <Link href={`${editionPath("/news", lang)}/${b.date}`}>
                {b.date}
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
}
