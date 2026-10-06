"use client";
import Link from "next/link";
import { useId, useState } from "react";
import { hePath } from "@/lib/i18n";
import { useLang } from "@/lib/i18n/lang";
import profileText from "@/lib/i18n/profile";
import { partyColor } from "@/lib/party-colors";
import Loc, { SourceHe } from "../compare/Loc";
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
 * their source and the lists that recorded the same answer. The words are lib/i18n/profile's; in Hebrew the
 * data text comes on each tile's `loc`.
 */
export default function StanceTiles({ tiles, partyName }: { tiles: Tile[]; partyName: string }) {
  const lang = useLang();
  const T = profileText[lang].tiles;
  const href = (en: string) => (lang === "he" ? hePath(en) ?? en : en);
  // The first recorded stance opens on load, so the panel's job is visible before anyone taps.
  const [open, setOpen] = useState<string | null>(() => tiles.find((t) => t.kind === "stance")?.key ?? null);
  const base = useId();
  const current = tiles.find((t) => t.key === open) ?? null;
  return (
    <div className="pp-stand">
      <p className="pp-tilehint">{T.hint}</p>
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
              <span className={`bar${t.kind === "stance" ? (t.position === null ? " unordered" : onShade(t.position) === "light" ? " deep" : "") + (t.basis === "unstated" ? " unst" : "") : ""}`} style={bar ? { background: bar } : undefined} aria-hidden="true" />
              <span className="issue">{t.label}</span>
              <span className="stance">{t.kind === "stance" ? (t.loc?.stance ? <Loc v={t.loc.stance} /> : t.stance) : t.kind === "declined" ? T.declined : T.none}</span>
              <Slots t={t} />
              <span className="basis">{t.kind === "stance" ? (t.basis === "record" ? T.record : t.basis === "unstated" ? T.unstated : T.stated) : t.text ? T.instead : ""}</span>
            </button>
          );
        })}
      </div>
      <p className="pp-tilekey">{T.key}<span className="unst-key" aria-hidden="true" />{T.keyUnstated}</p>
      <div id={`${base}-panel`} className="pp-tilepanel" hidden={!current}>
        {current && (
          <>
            <p className="q"><b>{current.label}.</b> {current.loc ? current.loc.question && <Loc v={current.loc.question} /> : current.question}</p>
            {current.text ? (
              <p className="words">{current.loc?.text ? <>{current.basis === "unstated" && T.unstatedPrefix}<Loc v={current.loc.text} /></> : current.text}</p>
            ) : (
              <p className="words nf">{T.noWords}</p>
            )}
            <p className="fig-src">
              {current.basis === "record" && T.recordNote}
              {current.basis === "unstated" && T.unstatedNote}
              {current.loc ? (
                <>{(current.source || current.date) && T.sourcePrefix}<SourceHe source={current.source} url={current.url} date={current.date} /></>
              ) : (
                <>
                  {current.url ? <a href={current.url} rel="noopener">{current.source}</a> : current.source}
                  {current.date && !(current.source ?? "").includes(current.date) ? `, ${current.date}` : ""}
                </>
              )}
            </p>
            {current.sameStance.length > 0 && (
              <p className="same">
                {T.same}{" "}
                {current.sameStance.map((p) => (
                  <Link key={p.id} href={href(`/parties/${p.id}`)} className="chip">
                    <i style={{ background: partyColor(p.id) }} />
                    <Loc v={p.name} />
                  </Link>
                ))}
              </p>
            )}
            <p className="more"><Link href={href(`/compare#issue-${current.key}`)}>{T.more}</Link></p>
          </>
        )}
      </div>
      <p className="sr-only">{T.sr(partyName)}</p>
    </div>
  );
}
