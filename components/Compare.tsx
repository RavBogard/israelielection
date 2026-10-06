"use client";

import Link from "next/link";
import { Fragment, Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { readIssue, readingText, stanceMap } from "@/lib/cohesion";
import { DECLINED, MIN_PICK, isUrl, parseSelection, toggle, type PositionRow } from "@/lib/compare";
import { mediumDate } from "@/lib/format";
import { hePath, type Lang } from "@/lib/i18n";
import compareText, { readingHe, type CompareText } from "@/lib/i18n/compare";
import { useLang } from "@/lib/i18n/lang";
import { partyColor } from "@/lib/party-colors";
import { blocRank, seatFigure } from "@/lib/polls";
import { evidenceLabel, isUnstated, stanceText } from "@/lib/positions";
import { builderHref } from "@/lib/scenarios";
import type { BlocId } from "@/lib/types";
import Loc, { plain, SourceHe, type Txt } from "./compare/Loc";
import { onShade, shade, type MatrixCell, type MatrixRow, type RowText } from "./compare/model";
import "./compare.css";

/*
 * Compare the parties as one matrix: the questions down the side, every list across the top grouped
 * by bloc, each cell shaded by the answer the list's own words or record support. The same shade in
 * a row is the same answer, so agreement reads across and a split reads as a change of shade. A row
 * opens to every list's words and source. The column set lives in `?p=`.
 * Both editions: the words come from lib/i18n/compare (UI) and, in Hebrew, from `text` (the data's Hebrew overlays).
 */

/** `name` and bloc labels are plain strings in English; the Hebrew page passes Localized values (components/compare/Loc). */
export type CompareParty = { id: string; name: Txt; bloc: BlocId; letters: string | null; seats: number | null; out?: boolean };
export type Preset = { label: string; ids: string[] };
/** `text`: the rows' words in the Hebrew edition (matrixText in ./compare/model); absent in English, which prints the rows' own strings. */
type Props = { parties: CompareParty[]; blocs: { id: BlocId; label: Txt }[]; rows: MatrixRow[]; presets: Preset[]; defaults: string[]; text?: Record<string, RowText> };

/** What one edition prints: its UI strings, where its links go, and (Hebrew) the rows' words. */
type Ed = { lang: Lang; T: CompareText; href: (en: string) => string; text?: Record<string, RowText> };
const edition = (lang: Lang, text?: Record<string, RowText>): Ed => ({ lang, T: compareText[lang], href: (en) => (lang === "he" ? hePath(en) ?? en : en), text });
const rowLabel = (ed: Ed, row: MatrixRow): Txt => ed.text?.[row.key]?.label ?? row.label;
const rowQuestion = (ed: Ed, row: MatrixRow): Txt | null => (ed.text ? ed.text[row.key]?.question ?? null : row.question);
const stanceLabel = (ed: Ed, row: MatrixRow, id: string): Txt => ed.text?.[row.key]?.stances[id] ?? row.stances.find((s) => s.id === id)!.label;

const fill = (bloc: BlocId) => ({ "--fill": `var(--b-${bloc})`, "--fill-ink": `var(--b-${bloc}-ink)` }) as React.CSSProperties;
const swatch = (id: string) => ({ "--sw": partyColor(id) }) as React.CSSProperties;
const seatsOf = (p: CompareParty) => (p.seats !== null && p.seats > 0 ? p.seats : 0);

function sourceLine(row: PositionRow): { text: string | null; url: string | null } {
  let source = row.source?.trim() || null;
  const date = row.date?.trim() || null;
  if (source && date && !source.includes(date)) source = `${source}, ${date}`;
  if (!source && date) source = date;
  return { text: source, url: isUrl(row.url) ? row.url.trim() : null };
}

function cellLabel(ed: Ed, p: CompareParty, row: MatrixRow, c: MatrixCell): string {
  const name = plain(p.name);
  if (c.kind === "declined") return ed.T.cell.declined(name);
  if (c.kind === "none") return ed.T.cell.none(name);
  if (c.kind === "unsorted") return ed.T.cell.unsorted(name);
  return ed.T.cell.stance(name, plain(stanceLabel(ed, row, c.stance)), c.record, c.unstated);
}

type CellProps = { ed: Ed; p: CompareParty; row: MatrixRow; c: MatrixCell; col: number; active: string | null; gap: boolean; isOpen: boolean; onOpen: () => void; onHover: (s: string | null) => void };

function Cell({ ed, p, row, c, col, active, gap, isOpen, onOpen, onHover }: CellProps) {
  const stance = c.kind === "stance" ? c.stance : null;
  const dim = active !== null && stance !== active;
  return (
    <td role="cell" className={`mx-c${gap ? " gap" : ""}`}>
      <button
        type="button"
        // One tab stop per row; the arrow keys move along it (see onRowKey).
        tabIndex={col === 0 ? 0 : -1}
        data-col={col}
        className={`mx-cell ${c.kind}${c.kind === "stance" ? ` on-${onShade(c.position)}${c.unstated ? " unst" : ""}` : ""}${dim ? " dim" : ""}${active !== null && !dim ? " match" : ""}`}
        style={c.kind === "stance" ? { background: shade(c.position, c.n) } : undefined}
        aria-label={cellLabel(ed, p, row, c)}
        aria-expanded={isOpen}
        aria-controls={`panel-${row.key}`}
        onClick={onOpen}
        onMouseEnter={() => onHover(stance)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(stance)}
        onBlur={() => onHover(null)}
      >
        {c.kind === "stance" && <span className="n" aria-hidden="true">{c.n}</span>}
        {c.kind === "stance" && c.record && <span className="rec" aria-hidden="true" />}
      </button>
    </td>
  );
}

/** Left, Right, Home and End move focus along a row's cells; right to left (the Hebrew edition), Left moves on. */
function onRowKey(e: React.KeyboardEvent<HTMLTableRowElement>) {
  const t = e.target as HTMLElement;
  if (!t.matches("button.mx-cell")) return;
  const cells = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("button.mx-cell")];
  const i = cells.indexOf(t as HTMLButtonElement);
  const step = getComputedStyle(e.currentTarget).direction === "rtl" ? -1 : 1;
  const j = e.key === "ArrowRight" ? i + step : e.key === "ArrowLeft" ? i - step : e.key === "Home" ? 0 : e.key === "End" ? cells.length - 1 : null;
  if (j === null) return;
  e.preventDefault();
  cells[Math.max(0, Math.min(cells.length - 1, j))].focus();
}

function Who({ p, children }: { p: CompareParty; children?: React.ReactNode }) {
  return (
    <p className="who">
      <span className="sw" style={swatch(p.id)} aria-hidden="true" />
      <b><Loc v={p.name} /></b>
      {children}
    </p>
  );
}

/** The party's words as the open row prints them; an unstated row leads with the edition's "not said publicly". */
function Said({ ed, row, said }: { ed: Ed; row: MatrixRow; said: PositionRow | undefined }) {
  if (!ed.text) return <>{stanceText(said)}</>;
  const words = ed.text[row.key]?.said[said?.party ?? ""];
  if (!words) return null;
  return <>{isUnstated(said) && ed.T.unstatedPrefix}<Loc v={words} /></>;
}

function Entry({ ed, p, row, said }: { ed: Ed; p: CompareParty; row: MatrixRow; said: PositionRow | undefined }) {
  const text = stanceText(said) || null;
  const src = said ? sourceLine(said) : { text: null, url: null };
  return (
    <li id={`said-${p.id}`}>
      <Who p={p} />
      {text && <p className="pos"><Said ed={ed} row={row} said={said} /></p>}
      <p className="fig-src">
        {ed.text ? <>{src.text && ed.T.sourcePrefix}{said && <SourceHe source={said.source} url={said.url} date={said.date} />}</> : src.url ? <a href={src.url} rel="noopener">{src.text ?? src.url}</a> : src.text}
        {said?.basis === "record" && <>{ed.T.recordNote}</>}
        {src.text || said?.basis === "record" ? ". " : ""}
        {evidenceLabel(said, ed.lang)}
      </p>
    </li>
  );
}

function Panel({ ed, row, shown, colSpan }: { ed: Ed; row: MatrixRow; shown: CompareParty[]; colSpan: number }) {
  const { T } = ed;
  const ids = shown.map((p) => p.id);
  const reading = readIssue(row.key, stanceMap([row.issue], ids), ids);
  const nameOf = (id: string) => {
    const p = shown.find((x) => x.id === id);
    return p ? plain(p.name) : id;
  };
  const question = rowQuestion(ed, row);
  const notes: Txt[] = ed.text ? ed.text[row.key]?.note ?? [] : row.issue.file.note ? [row.issue.file.note] : [];
  const rowOf = (id: string) => row.issue.file.rows.find((r) => r.party === id);
  const kindOf = (p: CompareParty) => row.cells[p.id]?.kind ?? "none";
  const unsorted = shown.filter((p) => kindOf(p) === "unsorted");
  const quiet = shown.filter((p) => kindOf(p) === "none" || kindOf(p) === "declined");
  return (
    <tr role="row" className="mx-panelrow">
      <td role="cell" colSpan={colSpan}>
        <div className="mx-panel" id={`panel-${row.key}`}>
          <header>
            {row.depth === 1 && question && <p className="q"><Loc v={question} /></p>}
            <p className="verdict">{ed.lang === "he" ? readingHe(reading, nameOf, (id) => plain(stanceLabel(ed, row, id))) : readingText(reading, nameOf)}</p>
          </header>
          {row.stances.map((s) => {
            const holders = shown.filter((p) => {
              const c = row.cells[p.id];
              return c?.kind === "stance" && c.stance === s.id;
            });
            if (!holders.length) return null;
            return (
              <section key={s.id} className="grp">
                <h3>
                  <span className={`key on-${onShade(s.position)}`} style={{ background: shade(s.position, s.n) }} aria-hidden="true">{s.n}</span>
                  <Loc v={stanceLabel(ed, row, s.id)} />
                </h3>
                <ul className="said">{holders.map((p) => <Entry key={p.id} ed={ed} p={p} row={row} said={rowOf(p.id)} />)}</ul>
              </section>
            );
          })}
          {unsorted.length > 0 && (
            <section className="grp">
              <h3><span className="key unsorted" aria-hidden="true" />{T.unsortedHead}</h3>
              <ul className="said">{unsorted.map((p) => <Entry key={p.id} ed={ed} p={p} row={row} said={rowOf(p.id)} />)}</ul>
            </section>
          )}
          {quiet.length > 0 && (
            <section className="grp quiet">
              <h3><span className="key none" aria-hidden="true" />{T.quietHead}</h3>
              <ul className="said">
                {quiet.map((p) => {
                  const r = rowOf(p.id);
                  if (stanceText(r)) return <Entry key={p.id} ed={ed} p={p} row={row} said={r} />;
                  return (
                    <li key={p.id} id={`said-${p.id}`}>
                      <Who p={p}>
                        {" "}<span className="st">{kindOf(p) === "declined" ? (ed.lang === "en" ? DECLINED : T.declined) : T.noPosition}</span>
                      </Who>
                      <p className="fig-src">{evidenceLabel(r, ed.lang)}{r?.checked ? T.checked(ed.lang === "en" ? r.checked : mediumDate(r.checked, "he")) : ""}</p>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          {notes.length > 0 && <p className="fig-note">{notes.map((n, i) => <Fragment key={i}>{i > 0 && " "}<Loc v={n} /></Fragment>)}</p>}
          <p className="links">
            {row.page && <Link href={row.page}>{T.issuePage}</Link>}
            <Link href={`/export/issue?${new URLSearchParams({ issue: row.key, p: ids.join(",") })}`}>{T.exportQuestion}</Link>
          </p>
        </div>
      </td>
    </tr>
  );
}

function CompareView({ parties, blocs, rows, presets, selected, onSelect, text }: Props & { selected: string[]; onSelect?: (ids: string[]) => void }) {
  const ed = edition(useLang(), text);
  const { T } = ed;
  const [open, setOpen] = useState<string | null>(null);
  const [hover, setHover] = useState<{ row: string; stance: string } | null>(null);
  // A link to /compare#issue-<key> (from the Builder or a profile tile) opens that row.
  useEffect(() => {
    const read = () => {
      const key = window.location.hash.replace(/^#(issue|q)-/, "");
      if (key && rows.some((r) => r.key === key)) setOpen(key);
    };
    const frame = requestAnimationFrame(read);
    window.addEventListener("hashchange", read);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", read);
    };
  }, [rows]);
  const ordered = [...blocs].sort((a, b) => blocRank(a.id) - blocRank(b.id));
  const shown = parties
    .filter((p) => selected.includes(p.id))
    .sort((a, b) => blocRank(a.bloc) - blocRank(b.bloc) || Number(!!a.out) - Number(!!b.out) || (b.seats ?? -1) - (a.seats ?? -1));
  const groups = ordered.map((b) => ({ id: b.id, label: b.label, n: shown.filter((p) => p.bloc === b.id).length })).filter((g) => g.n > 0);
  const isPreset = (ids: string[]) => ids.length === selected.length && ids.every((id) => selected.includes(id));
  const custom = !presets.some((pr) => isPreset(pr.ids));
  const atMin = selected.length <= MIN_PICK;
  const toggleRow = (key: string, party?: string) => {
    const next = open === key && !party ? null : key;
    setOpen(next);
    if (next && party) requestAnimationFrame(() => document.getElementById(`said-${party}`)?.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
  };
  const gapAt = (i: number) => i > 0 && shown[i - 1].bloc !== shown[i].bloc;

  return (
    <div className="cmp">
      <div className="mx-show" role="group" aria-label={T.showGroup}>
        <label className="lbl" htmlFor="mx-showsel">{T.show}</label>
        {/* Phones get one select in place of the segmented control, which would wrap into uneven rows. */}
        <select id="mx-showsel" className="mx-showsel" value={custom ? "" : presets.find((pr) => isPreset(pr.ids))?.label} onChange={(e) => { const pr = presets.find((x) => x.label === e.target.value); if (pr) onSelect?.(pr.ids); }}>
          {presets.map((pr) => <option key={pr.label} value={pr.label}>{T.presetOption(pr.label, pr.ids.length)}</option>)}
          {custom && <option value="">{T.yourSetOption(selected.length)}</option>}
        </select>
        <div className="seg">
          {presets.map((pr) => (
            <button key={pr.label} type="button" aria-pressed={isPreset(pr.ids)} onClick={() => onSelect?.(pr.ids)}>
              {pr.label}
              <small>{T.nLists(pr.ids.length)}</small>
            </button>
          ))}
          {custom && (
            <button type="button" aria-pressed="true">
              {T.yourSet}
              <small>{T.nLists(selected.length)}</small>
            </button>
          )}
        </div>
        <Link className="build" href={ed.href(builderHref(selected))}>{T.build}</Link>
      </div>

      <details className="mx-pick">
        <summary>{T.pickOne}</summary>
        <div className="blocs">
          {ordered.map((b) => (
            <div key={b.id} className="bg">
              <p className="bl"><span className="sw" style={{ background: `var(--b-${b.id})` }} aria-hidden="true" /><Loc v={b.label} /></p>
              <div className="chips">
                {parties.filter((p) => p.bloc === b.id).map((p) => {
                  const on = selected.includes(p.id);
                  return (
                    <button key={p.id} type="button" className="chip" style={fill(p.bloc)} aria-pressed={on} disabled={on && atMin} onClick={() => onSelect?.(toggle(selected, p.id))}>
                      {p.letters && <span className="letters" lang="he" dir="rtl">{p.letters}</span>}
                      <span className="nm"><Loc v={p.name} /></span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="hint" aria-live="polite">{T.chosen(selected.length, atMin)}</p>
      </details>

      <div className="fig-key mx-key">
        <p className="ramp">
          <span className="bar" aria-hidden="true">{[0, 0.25, 0.5, 0.75, 1].map((x) => <i key={x} style={{ background: shade(x) }} />)}</span>
          {T.ramp}
        </p>
        <p className="glyphs">
          <span><i className="g none" aria-hidden="true" />{T.glyphs.none}</span>
          <span><i className="g declined" aria-hidden="true" />{T.glyphs.declined}</span>
          <span><i className="g unsorted" aria-hidden="true" />{T.glyphs.unsorted}</span>
          <span><i className="g rec" aria-hidden="true" />{T.glyphs.rec}</span>
          <span><i className="g unst" aria-hidden="true" />{T.glyphs.unst}</span>
          <span><i className="g ink" aria-hidden="true">1</i>{T.glyphs.ink}</span>
        </p>
        <p className="tap">{T.tap}</p>
        <p className="seatnote">{T.seatnote}</p>
        <p className="blockey">
          {T.blockey}
          {groups.map((g) => <span key={g.id}><i style={{ background: `var(--b-${g.id})` }} aria-hidden="true" /><Loc v={g.label} /></span>)}
        </p>
      </div>

      <div className="mx-wrap">
        <table role="table" className="mx" style={{ "--cols": shown.length } as React.CSSProperties}>
          <caption className="sr-only">{T.caption}</caption>
          <thead role="rowgroup">
            <tr role="row" className="mx-blocs">
              <td role="cell" className="mx-corner" />
              {groups.map((g, i) => (
                <th key={g.id} scope="colgroup" role="columnheader" colSpan={g.n} className={`mx-bloc${i > 0 ? " gap" : ""}`} style={{ ...fill(g.id), ["--n" as string]: g.n }}>
                  <span><span className="bt"><Loc v={g.label} /></span></span>
                </th>
              ))}
            </tr>
            <tr role="row" className="mx-names">
              <td role="cell" className="mx-corner" />
              {shown.map((p, i) => (
                <th key={p.id} scope="col" role="columnheader" className={`mx-party${gapAt(i) ? " gap" : ""}`}>
                  <Link href={ed.href(`/parties/${p.id}`)}><Loc v={p.name} /></Link>
                </th>
              ))}
            </tr>
            <tr role="row" className="mx-heads">
              <td role="cell" className="mx-corner">
                <span className="seatlbl">{T.seatsLabel}</span>
              </td>
              {shown.map((p, i) => (
                <td key={p.id} role="cell" className={`mx-head${gapAt(i) ? " gap" : ""}${p.out ? " out" : !seatsOf(p) ? " below" : ""}`} style={swatch(p.id)}>
                  {p.letters ? <span className="letters" lang="he" dir="rtl" title={T.letters(p.letters)}>{p.letters}</span> : <span className="letters" aria-hidden="true" />}
                  <span className="seats">{seatsOf(p) ? seatFigure(seatsOf(p)) : p.out ? T.below : p.seats === null ? "–" : T.below}</span>
                </td>
              ))}
            </tr>
          </thead>
          <tbody role="rowgroup">
            {rows.map((row, ri) => {
              const isOpen = open === row.key;
              const active = hover?.row === row.key ? hover.stance : null;
              const question = rowQuestion(ed, row);
              const held = row.stances
                .map((s) => ({ s, holders: shown.filter((p) => { const c = row.cells[p.id]; return c?.kind === "stance" && c.stance === s.id; }) }))
                .filter((h) => h.holders.length);
              return (
                <Fragment key={row.key}>
                  <tr role="row" id={row.depth === 0 ? `issue-${row.key}` : `q-${row.key}`} className={`mx-row d${row.depth}${isOpen ? " open" : ""}${rows[ri + 1]?.depth === 1 ? " has-sub" : ""}`} onKeyDown={onRowKey}>
                    <th scope="row" role="rowheader" className="mx-q">
                      <button type="button" className="mx-toggle" aria-expanded={isOpen} aria-controls={`panel-${row.key}`} onClick={() => toggleRow(row.key)}>
                        <span className="lab"><Loc v={rowLabel(ed, row)} /></span>
                        {row.depth === 0 && question && <span className="qq"><Loc v={question} /></span>}
                      </button>
                      {held.length > 0 ? (
                        <ul className="legend">
                          {held.map(({ s, holders }) => (
                            <li key={s.id} className={active === s.id ? "hi" : undefined}>
                              <span className={`key on-${onShade(s.position)}`} style={{ background: shade(s.position, s.n) }} aria-hidden="true">{s.n}</span>
                              <span className="sl"><Loc v={stanceLabel(ed, row, s.id)} /></span>
                              <span className="ss" title={T.heldTitle}>{seatFigure(holders.reduce((a, p) => a + seatsOf(p), 0))}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="legend-none">{T.legendNone}</p>
                      )}
                    </th>
                    {shown.map((p, i) => (
                      <Cell
                        key={p.id}
                        ed={ed}
                        p={p}
                        row={row}
                        c={row.cells[p.id] ?? { kind: "none" }}
                        col={i}
                        active={active}
                        gap={gapAt(i)}
                        isOpen={isOpen}
                        onOpen={() => toggleRow(row.key, p.id)}
                        onHover={(s) => setHover(s ? { row: row.key, stance: s } : null)}
                      />
                    ))}
                  </tr>
                  {isOpen && <Panel ed={ed} row={row} shown={shown} colSpan={shown.length + 1} />}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="foot">
        {T.foot}
      </p>
      <p className="foot"><Link href={`/export/issue?${new URLSearchParams({ p: selected.join(",") })}`}>{T.exportAll}</Link></p>
    </div>
  );
}

function CompareLive(props: Props) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const ids = props.parties.map((p) => p.id);
  const selected = parseSelection(params.get("p"), ids, props.defaults);
  const onSelect = (next: string[]) => {
    if (next.length < MIN_PICK || (next.length === selected.length && next.every((id) => selected.includes(id)))) return;
    const q = new URLSearchParams(params.toString());
    q.set("p", next.join(","));
    router.replace(`${pathname}?${q.toString().replace(/%2C/g, ",")}${window.location.hash}`, { scroll: false });
  };
  return <CompareView {...props} selected={selected} onSelect={onSelect} />;
}

/** The comparison. The column set lives in `?p=`; until the URL is read, every list is shown. */
export default function Compare(props: Props) {
  return (
    <Suspense fallback={<CompareView {...props} selected={props.defaults} />}>
      <CompareLive {...props} />
    </Suspense>
  );
}
