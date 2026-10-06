"use client";

import Link from "next/link";
import { Fragment, Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { readIssue, readingText, stanceMap } from "@/lib/cohesion";
import { DECLINED, MIN_PICK, isUrl, parseSelection, toggle, type PositionRow } from "@/lib/compare";
import { partyColor } from "@/lib/party-colors";
import { blocRank, seatFigure } from "@/lib/polls";
import { evidenceLabel } from "@/lib/positions";
import { builderHref } from "@/lib/scenarios";
import type { BlocId } from "@/lib/types";
import { onShade, shade, type MatrixCell, type MatrixRow } from "./compare/model";
import "./compare.css";

/*
 * Compare the parties as one matrix: the questions down the side, every list across the top grouped
 * by bloc, each cell shaded by the answer the list's own words or record support. The same shade in
 * a row is the same answer, so agreement reads across and a split reads as a change of shade. A row
 * opens to every list's words and source. The column set lives in `?p=`.
 */

export type CompareParty = { id: string; name: string; bloc: BlocId; letters: string | null; seats: number | null; out?: boolean };
export type Preset = { label: string; ids: string[] };
type Props = { parties: CompareParty[]; blocs: { id: BlocId; label: string }[]; rows: MatrixRow[]; presets: Preset[]; defaults: string[] };

const fill = (bloc: BlocId) => ({ "--fill": `var(--b-${bloc})` }) as React.CSSProperties;
const swatch = (id: string) => ({ "--sw": partyColor(id) }) as React.CSSProperties;
const seatsOf = (p: CompareParty) => (p.seats !== null && p.seats > 0 ? p.seats : 0);

function sourceLine(row: PositionRow): { text: string | null; url: string | null } {
  let source = row.source?.trim() || null;
  const date = row.date?.trim() || null;
  if (source && date && !source.includes(date)) source = `${source}, ${date}`;
  if (!source && date) source = date;
  return { text: source, url: isUrl(row.url) ? row.url.trim() : null };
}

function cellLabel(p: CompareParty, row: MatrixRow, c: MatrixCell): string {
  if (c.kind === "declined") return `${p.name}: declined to answer`;
  if (c.kind === "none") return `${p.name}: no position found`;
  if (c.kind === "unsorted") return `${p.name}: recorded, not classified`;
  const st = row.stances.find((s) => s.id === c.stance)!;
  return `${p.name}: ${st.label}${c.record ? ", on the record" : ""}`;
}

type CellProps = { p: CompareParty; row: MatrixRow; c: MatrixCell; col: number; active: string | null; gap: boolean; isOpen: boolean; onOpen: () => void; onHover: (s: string | null) => void };

function Cell({ p, row, c, col, active, gap, isOpen, onOpen, onHover }: CellProps) {
  const stance = c.kind === "stance" ? c.stance : null;
  const dim = active !== null && stance !== active;
  return (
    <td role="cell" className={`mx-c${gap ? " gap" : ""}`}>
      <button
        type="button"
        // One tab stop per row; the arrow keys move along it (see onRowKey).
        tabIndex={col === 0 ? 0 : -1}
        data-col={col}
        className={`mx-cell ${c.kind}${c.kind === "stance" ? ` on-${onShade(c.position)}` : ""}${dim ? " dim" : ""}${active !== null && !dim ? " match" : ""}`}
        style={c.kind === "stance" ? { background: shade(c.position) } : undefined}
        aria-label={cellLabel(p, row, c)}
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

/** Left, Right, Home and End move focus along a row's cells. */
function onRowKey(e: React.KeyboardEvent<HTMLTableRowElement>) {
  const t = e.target as HTMLElement;
  if (!t.matches("button.mx-cell")) return;
  const cells = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("button.mx-cell")];
  const i = cells.indexOf(t as HTMLButtonElement);
  const j = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? cells.length - 1 : null;
  if (j === null) return;
  e.preventDefault();
  cells[Math.max(0, Math.min(cells.length - 1, j))].focus();
}

function Who({ p, children }: { p: CompareParty; children?: React.ReactNode }) {
  return (
    <p className="who">
      <span className="sw" style={swatch(p.id)} aria-hidden="true" />
      <b>{p.name}</b>
      {children}
    </p>
  );
}

function Entry({ p, row }: { p: CompareParty; row: PositionRow | undefined }) {
  const text = row?.text?.trim() || null;
  const src = row ? sourceLine(row) : { text: null, url: null };
  return (
    <li id={`said-${p.id}`}>
      <Who p={p} />
      {text && <p className="pos">{text}</p>}
      <p className="fig-src">
        {src.url ? <a href={src.url} rel="noopener">{src.text ?? src.url}</a> : src.text}
        {row?.basis === "record" && <> (on the record, because the party did not answer the questionnaire)</>}
        {src.text || row?.basis === "record" ? ". " : ""}
        {evidenceLabel(row)}
      </p>
    </li>
  );
}

function Panel({ row, shown, colSpan }: { row: MatrixRow; shown: CompareParty[]; colSpan: number }) {
  const ids = shown.map((p) => p.id);
  const reading = readIssue(row.key, stanceMap([row.issue], ids), ids);
  const nameOf = (id: string) => shown.find((p) => p.id === id)?.name ?? id;
  const rowOf = (id: string) => row.issue.file.rows.find((r) => r.party === id);
  const kindOf = (p: CompareParty) => row.cells[p.id]?.kind ?? "none";
  const unsorted = shown.filter((p) => kindOf(p) === "unsorted");
  const quiet = shown.filter((p) => kindOf(p) === "none" || kindOf(p) === "declined");
  return (
    <tr role="row" className="mx-panelrow">
      <td role="cell" colSpan={colSpan}>
        <div className="mx-panel" id={`panel-${row.key}`}>
          <header>
            {row.depth === 1 && row.question && <p className="q">{row.question}</p>}
            <p className="verdict">{readingText(reading, nameOf)}</p>
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
                  <span className={`key on-${onShade(s.position)}`} style={{ background: shade(s.position) }} aria-hidden="true">{s.n}</span>
                  {s.label}
                </h3>
                <ul className="said">{holders.map((p) => <Entry key={p.id} p={p} row={rowOf(p.id)} />)}</ul>
              </section>
            );
          })}
          {unsorted.length > 0 && (
            <section className="grp">
              <h3><span className="key unsorted" aria-hidden="true" />Recorded, not classified</h3>
              <ul className="said">{unsorted.map((p) => <Entry key={p.id} p={p} row={rowOf(p.id)} />)}</ul>
            </section>
          )}
          {quiet.length > 0 && (
            <section className="grp quiet">
              <h3><span className="key none" aria-hidden="true" />Not established by these sources</h3>
              <ul className="said">
                {quiet.map((p) => {
                  const r = rowOf(p.id);
                  if (r?.text?.trim()) return <Entry key={p.id} p={p} row={r} />;
                  return (
                    <li key={p.id} id={`said-${p.id}`}>
                      <Who p={p}>
                        {" "}<span className="st">{kindOf(p) === "declined" ? DECLINED : "No position found"}</span>
                      </Who>
                      <p className="fig-src">{evidenceLabel(r)}{r?.checked ? `. Checked ${r.checked}` : ""}</p>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          {row.issue.file.note && <p className="fig-note">{row.issue.file.note}</p>}
          <p className="links">
            {row.page && <Link href={row.page}>Read the issue page</Link>}
            <Link href={`/export/issue?${new URLSearchParams({ issue: row.key, p: ids.join(",") })}`}>Print or export this question</Link>
          </p>
        </div>
      </td>
    </tr>
  );
}

function CompareView({ parties, blocs, rows, presets, selected, onSelect }: Props & { selected: string[]; onSelect?: (ids: string[]) => void }) {
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
    if (next && party) requestAnimationFrame(() => document.getElementById(`said-${party}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  };
  const gapAt = (i: number) => i > 0 && shown[i - 1].bloc !== shown[i].bloc;

  return (
    <div className="cmp">
      <div className="mx-show" role="group" aria-label="Lists to show">
        <span className="lbl">Show</span>
        <div className="seg">
          {presets.map((pr) => (
            <button key={pr.label} type="button" aria-pressed={isPreset(pr.ids)} onClick={() => onSelect?.(pr.ids)}>
              {pr.label}
              <small>{pr.ids.length} lists</small>
            </button>
          ))}
          {custom && (
            <button type="button" aria-pressed="true">
              Your set
              <small>{selected.length} lists</small>
            </button>
          )}
        </div>
        <Link className="build" href={builderHref(selected)}>Build this set in the Coalition Builder</Link>
      </div>

      <details className="mx-pick">
        <summary>Choose lists one by one</summary>
        <div className="blocs">
          {ordered.map((b) => (
            <div key={b.id} className="bg">
              <p className="bl"><span className="sw" style={{ background: `var(--b-${b.id})` }} aria-hidden="true" />{b.label}</p>
              <div className="chips">
                {parties.filter((p) => p.bloc === b.id).map((p) => {
                  const on = selected.includes(p.id);
                  return (
                    <button key={p.id} type="button" className="chip" style={fill(p.bloc)} aria-pressed={on} disabled={on && atMin} onClick={() => onSelect?.(toggle(selected, p.id))}>
                      {p.letters && <span className="letters" lang="he" dir="rtl">{p.letters}</span>}
                      <span className="nm">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="hint" aria-live="polite">{atMin ? `${selected.length} chosen. Two is the fewest to compare.` : `${selected.length} chosen.`}</p>
      </details>

      <div className="fig-key mx-key">
        <p className="ramp">
          <span className="bar" aria-hidden="true">{[0, 0.25, 0.5, 0.75, 1].map((x) => <i key={x} style={{ background: shade(x) }} />)}</span>
          {"Each issue’s answers in order, from one end of the debate to the other. The same shade and number in a row is the same answer; the figure beside each answer is the seats its lists hold in the polling average."}
        </p>
        <p className="glyphs">
          <span><i className="g none" aria-hidden="true" />No position found</span>
          <span><i className="g declined" aria-hidden="true" />Declined to answer</span>
          <span><i className="g unsorted" aria-hidden="true" />Recorded, not classified</span>
          <span><i className="g rec" aria-hidden="true" />On the record, not a questionnaire answer</span>
          <span><i className="g ink" aria-hidden="true">1</i>Priorities that can coexist, so no order</span>
        </p>
        <p className="tap">{"Open any row for every list’s own words and source."}</p>
        <p className="seatnote">Under each list: its seats in the polling average.</p>
        <p className="blockey">
          Bars over the columns mark the blocs:
          {groups.map((g) => <span key={g.id}><i style={{ background: `var(--b-${g.id})` }} aria-hidden="true" />{g.label}</span>)}
        </p>
      </div>

      <div className="mx-wrap">
        <table role="table" className="mx" style={{ "--cols": shown.length } as React.CSSProperties}>
          <caption className="sr-only">{"Recorded answers by list. Rows are questions; columns are lists. Each cell opens its row with the list’s words and source."}</caption>
          <thead role="rowgroup">
            <tr role="row" className="mx-blocs">
              <td role="cell" className="mx-corner" />
              {groups.map((g, i) => (
                <th key={g.id} scope="colgroup" role="columnheader" colSpan={g.n} className={`mx-bloc${i > 0 ? " gap" : ""}`} style={{ ...fill(g.id), ["--n" as string]: g.n }}>
                  <span><span className="bt">{g.label}</span></span>
                </th>
              ))}
            </tr>
            <tr role="row" className="mx-names">
              <td role="cell" className="mx-corner" />
              {shown.map((p, i) => (
                <th key={p.id} scope="col" role="columnheader" className={`mx-party${gapAt(i) ? " gap" : ""}`}>
                  <Link href={`/parties/${p.id}`}>{p.name}</Link>
                </th>
              ))}
            </tr>
            <tr role="row" className="mx-heads">
              <td role="cell" className="mx-corner">
                <span className="seatlbl">Seats, polling average</span>
              </td>
              {shown.map((p, i) => (
                <td key={p.id} role="cell" className={`mx-head${gapAt(i) ? " gap" : ""}${p.out ? " out" : !seatsOf(p) ? " below" : ""}`} style={swatch(p.id)}>
                  {p.letters ? <span className="letters" lang="he" dir="rtl" title={`Ballot letters: ${p.letters}`}>{p.letters}</span> : <span className="letters" aria-hidden="true" />}
                  <span className="seats">{seatsOf(p) ? seatFigure(seatsOf(p)) : p.out ? "out" : p.seats === null ? "–" : "below"}</span>
                </td>
              ))}
            </tr>
          </thead>
          <tbody role="rowgroup">
            {rows.map((row, ri) => {
              const isOpen = open === row.key;
              const active = hover?.row === row.key ? hover.stance : null;
              const held = row.stances
                .map((s) => ({ s, holders: shown.filter((p) => { const c = row.cells[p.id]; return c?.kind === "stance" && c.stance === s.id; }) }))
                .filter((h) => h.holders.length);
              return (
                <Fragment key={row.key}>
                  <tr role="row" id={row.depth === 0 ? `issue-${row.key}` : `q-${row.key}`} className={`mx-row d${row.depth}${isOpen ? " open" : ""}${rows[ri + 1]?.depth === 1 ? " has-sub" : ""}`} onKeyDown={onRowKey}>
                    <th scope="row" role="rowheader" className="mx-q">
                      <button type="button" className="mx-toggle" aria-expanded={isOpen} aria-controls={`panel-${row.key}`} onClick={() => toggleRow(row.key)}>
                        <span className="lab">{row.label}</span>
                        {row.depth === 0 && row.question && <span className="qq">{row.question}</span>}
                      </button>
                      {held.length > 0 ? (
                        <ul className="legend">
                          {held.map(({ s, holders }) => (
                            <li key={s.id} className={active === s.id ? "hi" : undefined}>
                              <span className={`key on-${onShade(s.position)}`} style={{ background: shade(s.position) }} aria-hidden="true">{s.n}</span>
                              <span className="sl">{s.label}</span>
                              <span className="ss" title="Seats these lists hold in the polling average">{seatFigure(holders.reduce((a, p) => a + seatsOf(p), 0))}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="legend-none">No answer recorded for these lists</p>
                      )}
                    </th>
                    {shown.map((p, i) => (
                      <Cell
                        key={p.id}
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
                  {isOpen && <Panel row={row} shown={shown} colSpan={shown.length + 1} />}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="foot">
        {"Each list is placed by the answer its own words or record support; the words are the party’s, quoted or summarised from the sources shown. Nothing recorded is itself a finding, and the site says when it last checked. Indented rows are narrower questions under the issue above them. A list’s broad answer is never carried down to them, so a blank there means these sources do not answer the narrow question. These classifications compare recorded answers; they are not a stability forecast, questions are not equally important, and differences may be negotiable."}
      </p>
      <p className="foot"><Link href={`/export/issue?${new URLSearchParams({ p: selected.join(",") })}`}>Print or export the whole comparison for these lists</Link></p>
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
