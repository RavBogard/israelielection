"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AXES, DECLINED, MAX_PICK, MIN_PICK, NO_POSITION, parseSelection, toggle, type Cell, type CompareParty } from "@/lib/compare";
import "./compare.css";

type Props = { parties: CompareParty[]; defaults: string[] };

const ruleVar = (p: CompareParty) => ({ "--fill": `var(--b-${p.bloc})` }) as React.CSSProperties;

function Name({ p }: { p: CompareParty }) {
  return (
    <>
      {p.letters && (
        <span className="letters" lang="he" dir="rtl">
          {p.letters}
        </span>
      )}
      <span className="nm">{p.name}</span>
    </>
  );
}

function Source({ cell }: { cell: Exclude<Cell, { kind: "none" }> }) {
  if (!cell.source && !cell.url) return null;
  return <p className="src">{cell.url ? <a href={cell.url}>{cell.source ?? cell.url}</a> : cell.source}</p>;
}

function CellBody({ cell }: { cell: Cell }) {
  if (cell.kind === "none") return <p className="empty">{NO_POSITION}</p>;
  if (cell.kind === "declined")
    return (
      <>
        <p className="empty">{DECLINED}</p>
        {cell.text && <p className="pos">{cell.text}</p>}
        <Source cell={cell} />
      </>
    );
  return (
    <>
      <p className="pos">{cell.text}</p>
      <Source cell={cell} />
    </>
  );
}

function CompareView({ parties, selected, onToggle }: { parties: CompareParty[]; selected: string[]; onToggle?: (id: string) => void }) {
  const byId = new Map(parties.map((p) => [p.id, p]));
  const chosen = selected.map((id) => byId.get(id)).filter((p): p is CompareParty => !!p);
  const full = selected.length >= MAX_PICK;
  const atMin = selected.length <= MIN_PICK;

  return (
    <div className="cmp">
      <fieldset className="picker">
        <legend>Choose two to four parties</legend>
        <div className="chips">
          {parties.map((p) => {
            const on = selected.includes(p.id);
            const locked = on ? atMin : full;
            return (
              <button
                key={p.id}
                type="button"
                className="chip"
                aria-pressed={on}
                disabled={locked}
                onClick={() => onToggle?.(p.id)}
              >
                <Name p={p} />
              </button>
            );
          })}
        </div>
        <p className="hint" aria-live="polite">
          {full ? "Four chosen. Remove one to add another." : atMin ? "Two is the fewest to compare." : `${selected.length} chosen.`}
        </p>
      </fieldset>

      <div className="tbl-wrap">
        <table className="tbl" style={{ "--cols": chosen.length } as React.CSSProperties}>
          <thead>
            <tr>
              <td className="corner" />
              {chosen.map((p) => (
                <th key={p.id} scope="col" className="ph" style={ruleVar(p)}>
                  <Name p={p} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AXES.map((a) => (
              <tr key={a.key}>
                <th scope="row" className="ax">
                  {a.label}
                </th>
                {chosen.map((p) => (
                  <td key={p.id}>
                    <CellBody cell={p.cells[a.key]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cards">
        {chosen.map((p) => (
          <section key={p.id} className="card" style={ruleVar(p)} aria-label={p.name}>
            <h2 className="ph">
              <Name p={p} />
            </h2>
            <dl>
              {AXES.map((a) => (
                <div key={a.key} className="row">
                  <dt className="ax">{a.label}</dt>
                  <dd>
                    <CellBody cell={p.cells[a.key]} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <p className="foot">
        Positions are quoted or summarised from the sources shown; an empty cell means the site found no stated position, which is itself a finding.
      </p>
    </div>
  );
}

function CompareLive({ parties, defaults }: Props) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const selected = parseSelection(
    params.get("p"),
    parties.map((p) => p.id),
    defaults
  );

  const onToggle = (id: string) => {
    const next = toggle(selected, id);
    if (next === selected) return;
    router.replace(`${pathname}?p=${next.join(",")}`, { scroll: false });
  };

  return <CompareView parties={parties} selected={selected} onToggle={onToggle} />;
}

/** The comparison table. The selection lives in `?p=`; until the URL is read, the default four are shown. */
export default function Compare(props: Props) {
  return (
    <Suspense fallback={<CompareView parties={props.parties} selected={props.defaults} />}>
      <CompareLive {...props} />
    </Suspense>
  );
}
