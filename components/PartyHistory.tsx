"use client";
import { useState } from "react";
import Link from "next/link";
import {
  filterHistories,
  histories,
  historyFamilies,
  historySources,
  type PartyHistory as HistoryRow,
} from "@/lib/party-history";
import "./PartyHistory.css";
import { useHistoryMarker } from "./history/HistoryResults";
import {
  historyText,
  historyKind,
  historyFamily,
  historicalDate,
} from "@/lib/i18n/history";
import { editionPath, type Lang } from "@/lib/i18n";

/** Hebrew runs inside an English name, marked so screen readers switch voice and the text runs right to left. */
const HEB = /([֐-׿][֐-׿\s"'׳״-]*[֐-׿])/;
function withHebrew(text: string) {
  return text.split(HEB).map((part, i) =>
    i % 2 ? (
      <span key={i} lang="he" dir="rtl">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export default function PartyHistory({
  lang = "en",
  contentLang = "en",
  data = histories,
  labels = {},
}: {
  lang?: Lang;
  contentLang?: Lang;
  data?: HistoryRow[];
  labels?: Record<string, { name: string; aliases: string[] }>;
}) {
  const marker = useHistoryMarker(lang);
  const t = historyText(lang),
    name = (id: string, fallback: string) => labels[id]?.name ?? fallback;

  const [family, setFamily] = useState("all");
  const [query, setQuery] = useState("");
  const shown = filterHistories(
    family,
    query,
    data,
    Object.fromEntries(
      Object.entries(labels).map(([id, label]) => [id, label.aliases]),
    ),
  );
  return (
    <div className="party-history">
      <div className="history-controls">
        <label>
          {t.branch}
          <select value={family} onChange={(e) => setFamily(e.target.value)}>
            <option value="all">{t.allBranches}</option>
            {historyFamilies.map((f) => (
              <option key={f} value={f}>
                {historyFamily(f, lang)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.find}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.placeholder}
          />
        </label>
      </div>
      <p aria-live="polite">
        {t.showing}: {shown.length} / {data.length}
      </p>
      <nav aria-label={t.jump} className="history-jumps">
        {shown.map((h) => (
          <a key={h.id} href={`#${h.id}`}>
            {name(h.id, h.name)}
          </a>
        ))}
      </nav>
      {shown.map((h) => (
        <section key={h.id} id={h.id} className="history-branch">
          <header>
            <h2>{name(h.id, h.name)}</h2>
            {marker(h.id) && <p className="history-result" data-testid="history-result"><b>{marker(h.id)}</b></p>}
            <p>
              {historyFamily(
                histories.find((original) => original.id === h.id)?.family ??
                  h.family,
                lang,
              )}
              .{" "}
              <Link href={editionPath(`/parties/${h.id}`, lang)!}>
                {t.profile}
              </Link>
              ,{" "}
              <Link href={editionPath(`/ballot#${h.id}`, lang)!}>
                {t.ballot}
              </Link>
              .
            </p>
          </header>
          <ol className="history-flow">
            {h.events.map((e, i) => (
              <li key={`${e.date}-${i}`}>
                <div className="history-date">
                  {e.date}
                  <span>{historyKind(e.kind, lang)}</span>
                </div>
                <div className={`history-relation history-${e.kind}`}>
                  {e.inputs.length > 0 && (
                    <div className="history-parents">
                      {e.inputs.map((input) => (
                        <span key={input} lang={contentLang} dir="auto">
                          {withHebrew(input)}
                        </span>
                      ))}
                    </div>
                  )}
                  <strong
                    className="history-output"
                    lang={contentLang}
                    dir="auto"
                  >
                    {withHebrew(e.output)}
                    {e.letters && (
                      <span className="history-letters">
                        <span className="history-vh">, {t.letters} </span>
                        <span lang="he" dir="rtl">
                          {e.letters}
                        </span>
                      </span>
                    )}
                  </strong>
                  <p lang={contentLang} dir="auto">
                    {e.text}
                  </p>
                  <p className="fig-src history-source">
                    {e.sources.map((id, i) => (
                      <span key={id}>
                        {i > 0 && "; "}
                        <a href={historySources[id].url}>
                          {historySources[id].name}
                        </a>
                        {historySources[id].date
                          ? `, ${historicalDate(historySources[id].date!, lang)}`
                          : ` (${t.unknownDate})`}
                      </span>
                    ))}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          {h.related.length > 0 && (
            <p className="history-related">
              {t.related}:{" "}
              {h.related.map((id, i) => (
                <span key={id}>
                  {i > 0 && ", "}
                  <a
                    href={`#${id}`}
                    onClick={() => {
                      setFamily("all");
                      setQuery("");
                    }}
                  >
                    {name(id, histories.find((h) => h.id === id)?.name ?? id)}
                  </a>
                </span>
              ))}
            </p>
          )}
        </section>
      ))}
      {shown.length === 0 && <p>{t.noMatch}</p>}
    </div>
  );
}
