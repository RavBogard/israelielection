import { PHASES, type Phase } from "@/lib/results-phase";

/** The night in three steps: past ones ticked, the current one marked, later ones plain. Before close none is marked. */
export default function PhaseStrip({ phase }: { phase: Phase }) {
  const at = PHASES.findIndex((p) => p.id === phase);
  return (
    <ol className="rs-phases" aria-label="Election night">
      {PHASES.map((p, i) => {
        const state = at < 0 || i > at ? "next" : i < at ? "done" : "now";
        return (
          <li key={p.id} className={state} aria-current={state === "now" ? "step" : undefined}>
            {state === "done" && <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M2 6.5 5 9.5 10 3" /></svg>}
            {p.label}
            {state === "done" && <span className="sr-only">, done</span>}
          </li>
        );
      })}
    </ol>
  );
}
