import { editionPath, locale, type Lang } from "@/lib/i18n";
import { EMBEDS } from "@/lib/i18n/embeds";
import { EXIT_LINE } from "@/lib/i18n/exit-line";

/** The credit line every embed ends with: the as-of time, a link to the live page, the site and the licence. */
export default function EmbedFooter({
  dateLine,
  asOf,
  path = "/",
  lang = "en",
}: {
  dateLine: string;
  /** The instant (or date) the figures are as of; shown in Israel time. */
  asOf: string | null;
  /** The page on the site this widget comes from; the footer links to it. */
  path?: string;
  lang?: Lang;
}) {
  const loc = locale(lang),
    at = !asOf
      ? null
      : asOf.includes("T")
        ? `${new Intl.DateTimeFormat(loc, { timeZone: "Asia/Jerusalem", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(asOf))} ${EXIT_LINE[lang].israelTime}`
        : new Intl.DateTimeFormat(loc, { timeZone: "Asia/Jerusalem", year: "numeric", month: "short", day: "numeric" }).format(new Date(`${asOf}T12:00:00Z`));
  return (
    <p className="embed-foot">
      {at && (
        <>
          {EMBEDS[lang].asOf} <time dateTime={asOf!}>{at}</time>.{" "}
        </>
      )}
      Israel Votes,{" "}
      <a
        href={`https://www.israelvotes.org${editionPath(path, lang) ?? path}?utm_source=embed`}
        target="_blank"
        rel="noopener"
      >
        israelvotes.org
      </a>
      . {dateLine}. CC BY-NC 4.0.
    </p>
  );
}
