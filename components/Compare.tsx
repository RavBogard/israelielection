"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { readIssue, readingText, stanceMap, type Issue, type IssueReading } from "@/lib/cohesion";
import { AXES, DECLINED, MIN_PICK, NO_POSITION, isUrl, parseSelection, toggle, type AxisKey, type PositionRow } from "@/lib/compare";
import { builderHref } from "@/lib/scenarios";
import type { BlocId } from "@/lib/types";
import "./compare.css";

/*
 * Compare the parties: seven issue strips. Each strip is the issue's comparable stances as columns,
 * and the chosen parties sit under their stance as small ballot slips, so agreement reads as a pile
 * and a split as distance. Parties with nothing recorded sit at the end. Under each strip, what each
 * party actually said, with its source. The selection lives in `?p=` and can be any two or more lists.
 */

export type CompareParty = { id: string; name: string; bloc: BlocId; letters: string | null; seats: number | null };
export type Preset = { label: string; ids: string[] };
type Props = { parties: CompareParty[]; blocs: { id: BlocId; label: string }[]; issues: Issue[]; presets: Preset[]; defaults: string[] };

const fill = (bloc: BlocId) => ({ "--fill": `var(--b-${bloc})` }) as React.CSSProperties;

function Letters({ p }: { p: CompareParty }) {
  return p.letters ? (
    <span className="letters" lang="he" dir="rtl">
      {p.letters}
    </span>
  ) : null;
}

/** A party as a small ballot slip: bloc bar, ballot letters, name. */
function MiniSlip({ p }: { p: CompareParty }) {
  return (
    <li className="ms" style={fill(p.bloc)}>
      <Letters p={p} />
      <span className="nm">{p.name}</span>
    </li>
  );
}

function sourceLine(row: PositionRow): { text: string | null; url: string | null } {
  let source = row.source?.trim() || null;
  const date = row.date?.trim() || null;
  if (source && date && !source.includes(date)) source = `${source}, ${date}`;
  if (!source && date) source = date;
  return { text: source, url: isUrl(row.url) ? row.url.trim() : null };
}

function Quote({ p, row, stanceLabel }: { p: CompareParty; row: PositionRow | undefined; stanceLabel: string | null }) {
  const text = row?.text?.trim() || null;
  const declined = !!row && (row.declined || row.status === "declined");
  const none = !row || row.status === "none" || (!text && !declined);
  const src = row ? sourceLine(row) : { text: null, url: null };
  return (
    <li style={fill(p.bloc)}>
      <p className="who">
        <span className="sw" aria-hidden="true" />
        <b>{p.name}</b>
        {stanceLabel && <span className="st">{stanceLabel}</span>}
        {!stanceLabel && (declined ? <span className="st quiet">{DECLINED}</span> : none ? <span className="st quiet">{NO_POSITION}</span> : null)}
      </p>
      {text && <p className="pos">{text}</p>}
      {(src.text || row?.basis === "record" || (none && row?.checked)) && (
        <p className="src">
          {src.url ? <a href={src.url}>{src.text ?? src.url}</a> : src.text}
          {row?.basis === "record" && <> (on the record, not the questionnaire)</>}
          {none && !src.text && row?.checked && <>Checked {row.checked}</>}
        </p>
      )}
    </li>
  );
}

function Strip({ issue, reading, byId }: { issue: Issue; reading: IssueReading; byId: Map<string, CompareParty> }) {
  const quiet = [...reading.declined, ...reading.none];
  const get = (id: string) => byId.get(id)!;
  // Rows without a stances header yet: one column of everyone with a recorded position.
  const columns = reading.verdict === "unsorted" || !issue.file.stances?.length
    ? [{ id: "recorded", label: "Position recorded", parties: reading.unsorted }]
    : issue.file.stances.map((s) => ({ id: s.id, label: s.label, parties: reading.groups.find((g) => g.stance.id === s.id)?.parties ?? [] }));
  const n = columns.length + (quiet.length ? 1 : 0);
  return (
    <div className="strip" style={{ "--n": n } as React.CSSProperties}>
      {columns.map((c) => (
        <div key={c.id} className={`col${c.parties.length ? "" : " empty"}`}>
          <p className="st">{c.label}</p>
          {c.parties.length > 0 && (
            <ul className="slips">
              {c.parties.map((id) => (
                <MiniSlip key={id} p={get(id)} />
              ))}
            </ul>
          )}
        </div>
      ))}
      {quiet.length > 0 && (
        <div className="col quiet">
          <p className="st">Nothing recorded</p>
          <ul className="slips">
            {quiet.map((id) => (
              <MiniSlip key={id} p={get(id)} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function IssueBlock({ issue, reading, chosen, byId }: { issue: Issue; reading: IssueReading; chosen: CompareParty[]; byId: Map<string, CompareParty> }) {
  const nameOf = (id: string) => byId.get(id)?.name ?? id;
  const stanceLabelOf = (id: string) => reading.groups.find((g) => g.parties.includes(id))?.stance.label ?? null;
  // Quotes read in strip order: stance by stance, then the quiet.
  const order = [...reading.groups.flatMap((g) => g.parties), ...reading.unsorted, ...reading.declined, ...reading.none];
  const ordered = order.map((id) => byId.get(id)).filter((p): p is CompareParty => !!p && chosen.includes(p));
  return (
    <li className="issue" id={`issue-${issue.key}`}>
      <header>
        <h2>{issue.label}</h2>
        {issue.file.question && <p className="q">{issue.file.question}</p>}
        <p className="verdict">{readingText(reading, nameOf)}</p>
      </header>
      <Strip issue={issue} reading={reading} byId={byId} />
      <details className="said">
        <summary>What each party said</summary>
        <ul className="quotes">
          {ordered.map((p) => (
            <Quote key={p.id} p={p} row={issue.file.rows.find((r) => r.party === p.id)} stanceLabel={stanceLabelOf(p.id)} />
          ))}
        </ul>
        {issue.file.note && <p className="note">{issue.file.note}</p>}
      </details>
    </li>
  );
}

function CompareView({ parties, blocs, issues, presets, selected, onSelect }: Props & { selected: string[]; onSelect?: (ids: string[]) => void }) {
  const byId = new Map(parties.map((p) => [p.id, p]));
  const chosen = selected.map((id) => byId.get(id)).filter((p): p is CompareParty => !!p);
  const atMin = selected.length <= MIN_PICK;
  const map = stanceMap(issues, parties.map((p) => p.id));
  const readings = Object.fromEntries(AXES.map((a) => [a.key, readIssue(a.key, map, selected)])) as Record<AxisKey, IssueReading>;
  const isPreset = (ids: string[]) => ids.length === selected.length && ids.every((id) => selected.includes(id));

  return (
    <div className="cmp">
      <fieldset className="picker">
        <legend>Choose the parties</legend>
        <p className="presets">
          Start from{" "}
          {presets.map((pr, i) => (
            <span key={pr.label}>
              {i > 0 && (i === presets.length - 1 ? " or " : ", ")}
              <button type="button" className="linkish" aria-pressed={isPreset(pr.ids)} onClick={() => onSelect?.(pr.ids)}>
                {pr.label}
              </button>
            </span>
          ))}
          , or pick your own.
        </p>
        <div className="blocs">
          {blocs.map((b) => (
            <div key={b.id} className="bg">
              <p className="bl">
                <span className="sw" style={{ background: `var(--b-${b.id})` }} aria-hidden="true" />
                {b.label}
              </p>
              <div className="chips">
                {parties.filter((p) => p.bloc === b.id).map((p) => {
                  const on = selected.includes(p.id);
                  return (
                    <button key={p.id} type="button" className="chip" style={fill(p.bloc)} aria-pressed={on} disabled={on && atMin} onClick={() => onSelect?.(toggle(selected, p.id))}>
                      <Letters p={p} />
                      <span className="nm">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="hint" aria-live="polite">
          {atMin ? `${selected.length} chosen. Two is the fewest to compare.` : `${selected.length} chosen.`}{" "}
          <Link href={builderHref(selected)}>Build this set in the Coalition Builder</Link>.
        </p>
      </fieldset>

      <ol className="issues">
        {issues.map((issue) => (
          <IssueBlock key={issue.key} issue={issue} reading={readings[issue.key]} chosen={chosen} byId={byId} />
        ))}
      </ol>

      <p className="foot">
        Each party is placed by the stance its own answer or record supports; the words are the party&apos;s, quoted or summarised from the sources
        shown. Nothing recorded is itself a finding, and the site says when it last checked.
      </p>
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
    router.replace(`${pathname}?p=${next.join(",")}`, { scroll: false });
  };
  return <CompareView {...props} selected={selected} onSelect={onSelect} />;
}

/** The comparison. The selection lives in `?p=`; until the URL is read, the default set is shown. */
export default function Compare(props: Props) {
  return (
    <Suspense fallback={<CompareView {...props} selected={props.defaults} />}>
      <CompareLive {...props} />
    </Suspense>
  );
}
