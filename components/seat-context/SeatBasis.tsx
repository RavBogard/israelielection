"use client";

import { useSeatContext } from "./SeatContextProvider";
import { useState } from "react";
import { israelAndLocal, useReaderZone } from "@/lib/local-time";
import { editionPath, locale, type Lang } from "@/lib/i18n";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import { pinnedSeatHref } from "@/lib/seat-context";
import "./seat-context.css";

export default function SeatBasis({
  context,
  lang,
  pinned = false,
  share = false,
}: {
  context: SharedSeatContext | null;
  lang: Lang;
  pinned?: boolean;
  share?: boolean;
}) {
  const t = LIFECYCLE[lang];
  const { refreshFailed } = useSeatContext(context, pinned);
  const [copied, setCopied] = useState(false);
  const zone = useReaderZone();
  if (!context)
    return (
      <p className="seat-basis seat-unavailable" role="status">
        {pinned ? t.unavailable : t.sourceUnavailable}{" "}
        <a href={editionPath("/results", lang) ?? "/results"}>{t.useCurrent}</a>{" "}
        ·{" "}
        <a href={editionPath("/forecast", lang) ?? "/forecast"}>{t.archive}</a>
      </p>
    );
  // A time is shown in Israel time and, in the browser, the reader's own.
  const date = (value: string | null) =>
    value
      ? value.includes("T")
        ? `${new Intl.DateTimeFormat(locale(lang), { timeZone: "Asia/Jerusalem", month: "short", day: "numeric" }).format(new Date(value))}, ${israelAndLocal(value, lang, zone)}`
        : new Intl.DateTimeFormat(locale(lang), { timeZone: "Asia/Jerusalem", month: "short", day: "numeric" }).format(new Date(value))
      : t.noTime;
  const copy = async () => {
    try {
      const path = pinnedSeatHref(window.location.href, context);
      await navigator.clipboard.writeText(
        new URL(path, window.location.origin).href,
      );
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div
      className="seat-basis"
      data-seat-revision={context.revision}
      data-seat-basis={context.basis}
    >
      <p>
        <strong>{t[context.basis]}</strong> · {t[context.seatStatus]} ·{" "}
        {pinned
          ? t.pinned
          : refreshFailed
            ? t.stale
            : t[context.freshness.status]}
        {context.correctionOf && <> · {t.corrected}</>}
      </p>
      <p className="seat-times">
        {t.published}: {date(context.publishedAt)} · {t.checked}:{" "}
        {date(context.freshness.checkedAt)}
      </p>
      {share && (
        <button type="button" onClick={copy}>
          {copied ? t.copied : t.share}
        </button>
      )}
      <details>
        <summary>{t.source}</summary>
        <p>{t.point}</p>
        <ul>
          {context.sourceRefs.map((source) => (
            <li key={source.id}>
              <a href={source.url}>
                {source.publisher}: {source.title}
              </a>
            </li>
          ))}
        </ul>
        {context.reasonCodes.some((reason) =>
          ["source_unavailable", "source_conflict", "source_invalid"].includes(
            reason,
          ),
        ) && (
          <p>
            {t.notice}: {t.stale}
          </p>
        )}
      </details>
    </div>
  );
}
