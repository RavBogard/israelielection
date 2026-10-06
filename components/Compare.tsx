"use client";

import Link from "next/link";
import { Fragment, Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { readIssue, readingText, stanceMap } from "@/lib/cohesion";
import { DECLINED, MIN_PICK, isUrl, parseSelection, type PositionRow } from "@/lib/compare";
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
  const st = row.stances.find((s) => s.id === c.stance)!;
  return `${p.name}: ${st.label}${c.record ? ", on the record" : ""}`;
}

function Cell({ p, row, c, active, gap, onOpen, onHover }: { p: CompareParty; row: MatrixRow; c: MatrixCell; active: string | null; gap: boolean; onOpen: () => void; onHover: (s: string | null) => void }) {
  const stance = c.kind === "stance" ? c.stance : null;
  const dim = active !== null && stance !== active;
  return (
    <td role="cell" className={`mx-c${gap ? " gap" : ""}`}>
      <button
        type="button"
        className={`mx-cell ${c.kind}${c.kind === "stance" ? ` on-${onShade(c.position)}` : ""}${dim ? " dim" : ""}${active !== null && !dim ? " match" : ""}`}
        style={c.kind === "stance" ? { background: shade(c.position) } : undefined}
        aria-label={cellLabel(p, row, c)}
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

function Entry({ p, row }: { p: CompareParty; row: PositionRow | undefined }) {
  const text = row?.text?.trim() || null;
  const src = row ? sourceLine(row) : { text: null, url: null };
  return (
    <li id={`said-${p.id}`} style={fill(p.bloc)}>
      <p className="who">
        <span className="sw" aria-hidden="true" />
        <b>{p.name}</b>
      </p>
      {text && <p className="pos">{text}</p>}
      <p className="src">
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
  const quiet = shown.filter((p) => row.cells[p.id]?.kind !== "stance");
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
          {quiet.length > 0 && (
            <section className="grp quiet">
              <h3><span className="key none" aria-hidden="true" />Not established by these sources</h3>
              <ul className="said">
                {quiet.map((p) => {
                  const r = rowOf(p.id);
                  const declined = row.cells[p.id]?.kind === "declined";
                  return r?.text?.trim() ? (
                    <Entry key={p.id} p={p} row={r} />
                  ) : (
                    <li key={p.id} id={`said-${p.id}`} style={fill(p.bloc)}>
                      <p className="who">
                        <span className="sw" aria-hidden="true" />
                        <b>{p.name}</b> <span className="st">{declined ? DECLINED : "No position found"}{r?.checked ? `, checked ${r.checked}` : ""}</span>
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          {row.issue.file.note && <p className="note">{row.issue.file.note}</p>}
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
  const order = blocs.map((b) => b.id);
  const shown = parties
    .filter((p) => selected.includes(p.id))
    .sort((a, b) => order.indexOf(a.bloc) - order.indexOf(b.bloc) || Number(!!a.out) - Number(!!b.out) || (b.seats ?? -1) - (a.seats ?? -1));
  const groups = blocs.map((b) => ({ id: b.id, label: b.label, n: shown.filter((p) => p.bloc === b.id).length })).filter((g) => g.n > 0);
  const isPreset = (ids: string[]) => ids.length === selected.length && ids.every((id) => selected.includes(id));
  const custom = !presets.some((pr) => isPreset(pr.ids));
  const toggleRow = (key: string, party?: string) => {
    const next = open === key && !party ? null : key;
    setOpen(next);
    if (next && party) requestAnimationFrame(() => document.getElementById(`said-${party}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  };

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

      <div className="mx-key">
        <p className="ramp">
          <span className="bar" aria-hidden="true">{[0, 0.25, 0.5, 0.75, 1].map((x) => <i key={x} style={{ background: shade(x) }} />)}</span>
          {"Each issue’s answers in order, from one end of the debate to the other. The same shade and number in a row is the same answer."}
        </p>
        <p className="glyphs">
          <span><i className="g none" aria-hidden="true" />No position found</span>
          <span><i className="g declined" aria-hidden="true" />Declined to answer</span>
          <span><i className="g rec" aria-hidden="true" />On the record, not a questionnaire answer</span>
          <span><i className="g ink" aria-hidden="true" />Priorities that can coexist, so no order</span>
        </p>
        <p className="tap">{"Open any row for every list’s own words and source."}</p>
      </div>

      <div className="mx-wrap">
        <table role="table" className="mx" style={{ "--cols": shown.length } as React.CSSProperties}>
          <caption className="sr-only">{"Recorded answers by list. Rows are questions; columns are lists. Each cell opens its row with the list’s words and source."}</caption>
          <thead role="rowgroup">
            <tr role="row" className="mx-blocs">
              <td className="mx-corner" />
              {groups.map((g) => (
                <th key={g.id} scope="colgroup" colSpan={g.n} className="mx-bloc" style={fill(g.id)}>
                  <span>{g.label}</span>
                </th>
              ))}
            </tr>
            <tr role="row" className="mx-names">
              <td className="mx-corner" />
              {shown.map((p, i) => (
                <th key={p.id} scope="col" role="columnheader" className={`mx-party${i > 0 && shown[i - 1].bloc !== p.bloc ? " gap" : ""}`}>
                  <Link href={`/parties/${p.id}`}>{p.name}</Link>
                </th>
              ))}
            </tr>
            <tr role="row" className="mx-heads">
              <td className="mx-corner">
                <span className="seatlbl">Seats, polling average</span>
              </td>
              {shown.map((p, i) => (
                <td key={p.id} className={`mx-head${i > 0 && shown[i - 1].bloc !== p.bloc ? " gap" : ""}${p.out ? " out" : ""}`} style={fill(p.bloc)}>
                  {p.letters && <span className="letters" lang="he" dir="rtl" title={`Ballot letters: ${p.letters}`}>{p.letters}</span>}
                  <span className="seats">{p.seats !== null && p.seats > 0 ? Math.round(p.seats) : p.out ? "out" : "–"}</span>
                </td>
              ))}
            </tr>
          </thead>
          <tbody role="rowgroup">
            {rows.map((row, ri) => {
              const isOpen = open === row.key;
              const active = hover?.row === row.key ? hover.stance : null;
              const held = row.stances.filter((s) => shown.some((p) => {
                const c = row.cells[p.id];
                return c?.kind === "stance" && c.stance === s.id;
              }));
              return (
                <Fragment key={row.key}>
                  <tr role="row" id={row.depth === 0 ? `issue-${row.key}` : `q-${row.key}`} className={`mx-row d${row.depth}${isOpen ? " open" : ""}${rows[ri + 1]?.depth === 1 ? " has-sub" : ""}`}>
                    <th scope="row" role="rowheader" className="mx-q">
                      <button type="button" className="mx-toggle" aria-expanded={isOpen} aria-controls={`panel-${row.key}`} onClick={() => toggleRow(row.key)}>
                        <span className="lab">{row.label}</span>
                        {row.depth === 0 && row.question && <span className="qq">{row.question}</span>}
                      </button>
                      {held.length > 0 ? (
                        <ul className="legend">
                          {held.map((s) => (
                            <li key={s.id} className={active === s.id ? "hi" : undefined}>
                              <span className={`key on-${onShade(s.position)}`} style={{ background: shade(s.position) }} aria-hidden="true">{s.n}</span>
                              {s.label}
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
                        active={active}
                        onOpen={() => toggleRow(row.key, p.id)}
                        onHover={(s) => setHover(s ? { row: row.key, stance: s } : null)}
                        gap={i > 0 && shown[i - 1].bloc !== p.bloc}
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
        {"Each list is placed by the answer its own words or record support; the words are the party’s, quoted or summarised from the sources shown. Indented rows are narrower questions under the issue above them. A list’s broad answer is never carried down to them, so a blank there means these sources do not answer the narrow question. These classifications compare recorded answers; they are not a stability forecast, questions are not equally important, and differences may be negotiable."}
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
