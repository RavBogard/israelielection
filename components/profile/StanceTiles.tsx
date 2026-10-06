"use client";
import Link from "next/link";
import { useId, useState } from "react";
import { partyColor } from "@/lib/party-colors";
import type { Tile } from "./model";

/** Bar colour for a stance: where it sits on the issue's scale, the same for every list that holds it. */
function stanceColor(t: Tile): string | null {
  if (t.kind !== "stance") return null;
  if (t.position === null) return "var(--ink)";
  // Fixed endpoints, so the scale reads the same in light and dark: darkest navy at the coalition's end.
  return `color-mix(in oklab, #233f86 ${Math.round(100 - t.position * 80)}%, #dfe6f5)`;
}

/**
 * Seven tiles, one per comparison issue: the party's recorded stance, with a bar whose shade is
 * shared across all lists holding that stance. One opens at a time to the party's own words,
 * their source and the lists that recorded the same answer.
 */
export default function StanceTiles({ tiles, partyName }: { tiles: Tile[]; partyName: string }) {
  // The first recorded stance opens on load, so the panel's job is visible before anyone taps.
  const [open, setOpen] = useState<string | null>(() => tiles.find((t) => t.kind === "stance")?.key ?? null);
  const base = useId();
  const current = tiles.find((t) => t.key === open) ?? null;
  return (
    <div className="pp-stand">
      <p className="pp-tilehint">{"Seven questions the site puts to every list. Tap a tile for the party’s words and source."}</p>
      <div className="pp-tiles">
        {tiles.map((t) => {
          const bar = stanceColor(t);
          const isOpen = open === t.key;
          return (
            <button
              key={t.key}
              type="button"
              className={`pp-tile${t.kind === "stance" ? "" : " nf"}${isOpen ? " open" : ""}`}
              aria-expanded={isOpen}
              aria-controls={`${base}-panel`}
              onClick={() => setOpen(isOpen ? null : t.key)}
            >
              <span className="bar" style={bar ? { background: bar } : undefined} aria-hidden="true" />
              <span className="issue">{t.label}</span>
              <span className="stance">{t.kind === "stance" ? t.stance : t.kind === "declined" ? "Declined to answer" : "No 2026 position found"}</span>
              <span className="basis">{t.kind === "stance" ? (t.basis === "record" ? "On the record" : "From its answers") : t.text ? "What it said instead" : ""}</span>
            </button>
          );
        })}
      </div>
      <p className="pp-tilekey">{"Bar shade: where the stance sits on each issue’s scale, shared across all lists. Darker is nearer the governing coalition’s side; the economy’s options coexist, so its bar is ink."}</p>
      <div id={`${base}-panel`} className="pp-tilepanel" hidden={!current}>
        {current && (
          <>
            <p className="q"><b>{current.label}.</b> {current.question}</p>
            {current.text ? <p className="words">{current.text}</p> : <p className="words nf">{"No position recorded in the site’s sources."}</p>}
            <p className="src">
              {current.basis === "record" && "On the record, because the party did not answer the questionnaire. "}
              {current.url ? <a href={current.url} rel="noopener">{current.source}</a> : current.source}
              {current.date && !(current.source ?? "").includes(current.date) ? `, ${current.date}` : ""}
            </p>
            {current.sameStance.length > 0 && (
              <p className="same">
                Same recorded stance:{" "}
                {current.sameStance.map((p) => (
                  <Link key={p.id} href={`/parties/${p.id}`} className="chip">
                    <i style={{ background: partyColor(p.id) }} />
                    {p.name}
                  </Link>
                ))}
              </p>
            )}
            <p className="more"><Link href="/compare">Compare every list on {current.label.toLowerCase() === "economy" ? "the economy" : current.label.toLowerCase()}</Link></p>
          </>
        )}
      </div>
      <p className="sr-only">{`${partyName}: seven issues; choose a tile to read the party’s words and source.`}</p>
    </div>
  );
}
