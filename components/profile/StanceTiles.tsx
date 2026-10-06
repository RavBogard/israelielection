"use client";
import Link from "next/link";
import { useId, useState } from "react";
import { partyColor } from "@/lib/party-colors";
import { onShade, shade } from "../compare/model";
import type { Tile } from "./model";
import StanceSlots, { type SlotColumn } from "../StanceSlots";

/** Bar colour for a stance: where it sits on the issue's scale, the same for every list that holds it (the Compare matrix's shade). */
function stanceColor(t: Tile): string | null {
  return t.kind === "stance" ? shade(t.position) : null;
}

/** The shared slot glyph for one list: a slot per answer the issue offers, this party's square in its slot; no answer sits in the quiet slot at the end. */
function Slots({ t }: { t: Tile }) {
  if (!t.options) return null;
  const quiet = t.slot === null;
  const cols: SlotColumn[] = Array.from({ length: t.options }, (_, i) => ({ marks: i === t.slot ? [{ key: "mine", color: "var(--pc)" }] : [] }));
  if (quiet) cols.push({ quiet: true, marks: [{ key: "mine", color: "" }] });
  return <StanceSlots cols={cols} />;
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
              <span className={`bar${t.kind === "stance" ? (t.position === null ? " unordered" : onShade(t.position) === "light" ? " deep" : "") : ""}`} style={bar ? { background: bar } : undefined} aria-hidden="true" />
              <span className="issue">{t.label}</span>
              <span className="stance">{t.kind === "stance" ? t.stance : t.kind === "declined" ? "Declined to answer" : "No 2026 position found"}</span>
              <Slots t={t} />
              <span className="basis">{t.kind === "stance" ? (t.basis === "record" ? "On the record" : "From its answers") : t.text ? "What it said instead" : ""}</span>
            </button>
          );
        })}
      </div>
      <p className="pp-tilekey">{"Bar shade: the stance’s place in the issue’s range of answers, from one end of the debate to the other, shared across all lists. The economy’s options coexist, so its bar is dotted paper with an ink outline, not a shade. Squares: one slot per answer, in the same order, with the party’s square in its own; a square in the last slot means no answer."}</p>
      <div id={`${base}-panel`} className="pp-tilepanel" hidden={!current}>
        {current && (
          <>
            <p className="q"><b>{current.label}.</b> {current.question}</p>
            {current.text ? <p className="words">{current.text}</p> : <p className="words nf">{"No position recorded in the site’s sources."}</p>}
            <p className="fig-src">
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
            <p className="more"><Link href={`/compare#issue-${current.key}`}>Compare every list on this question</Link></p>
          </>
        )}
      </div>
      <p className="sr-only">{`${partyName}: seven issues; choose a tile to read the party’s words and source.`}</p>
    </div>
  );
}
