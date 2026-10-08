"use client";

import type { CSSProperties } from "react";
import { UNORDERED_EDGE } from "@/components/compare/model";
import type { Answer, Importance } from "@/lib/match";
import type { MatchParty, MatchQuestion } from "./types";

const IMPORTANCE: { v: Importance; label: string }[] = [
  { v: 0, label: "A little" },
  { v: 1, label: "Matters" },
  { v: 2, label: "Deal-breaker" },
];

/**
 * One question: the answers run down the page in the order of the debate, each marked with its shade on
 * Compare's scale. Once the reader picks, the lists holding each answer appear under it, so the reader sees
 * who already stands where they stand, and who does not, before the next question.
 */
export default function QuestionStep({ q, n, of, parties, answer, onPick, onImportance }: {
  q: MatchQuestion;
  n: number;
  of: number;
  parties: MatchParty[];
  answer: Answer | null;
  onPick: (stance: string) => void;
  onImportance: (v: Importance) => void;
}) {
  const holders = (id: string) => parties.filter((p) => { const c = q.cells[p.id]; return c?.kind === "stance" && c.stance === id; });
  const offered = q.stances.filter((s) => q.offered.includes(s.id));
  const unoffered = q.stances.filter((s) => !q.offered.includes(s.id) && holders(s.id).length);
  const silent = parties.filter((p) => q.cells[p.id]?.kind !== "stance");
  const revealed = !!answer;

  return (
    <div className="mq-step">
      <p className="mq-count">Question {n} of {of}<span className="mq-issue">{q.label}</span></p>
      <h2 className="mq-prompt" id={`mq-${q.key}`}>{q.prompt}</h2>
      <p className="mq-context">{q.context}</p>

      <div className={`mq-options${q.scale ? "" : " unordered"}${revealed ? " revealed" : ""}`} role="radiogroup" aria-labelledby={`mq-${q.key}`}>
        {offered.map((s, i) => {
          const on = answer?.stance === s.id;
          const who = holders(s.id);
          return (
            <div key={s.id} className={`mq-opt${on ? " on" : ""}`}>
              <button type="button" role="radio" aria-checked={on} onClick={() => onPick(s.id)}>
                <span className="mq-swatch" style={{ background: s.color, boxShadow: s.position === null ? UNORDERED_EDGE : undefined }} aria-hidden="true" />
                <span className="mq-label">{s.label}</span>
              </button>
              {revealed && (
                <ul className="mq-holders" aria-label={`Lists on record with this answer: ${who.length}`} style={{ "--i": i } as CSSProperties}>
                  {who.length ? who.map((p) => <Chip key={p.id} p={p} q={q} />) : <li className="mq-none">No list on record</li>}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {revealed && (unoffered.length > 0 || silent.length > 0) && (
        <div className="mq-rest fig-note">
          {unoffered.map((s) => (
            <p key={s.id}><b>{q.stanceLabels[s.id]}:</b> {holders(s.id).map((p) => p.short).join(", ")}</p>
          ))}
          {silent.length > 0 && <p><b>No position on record:</b> {silent.map((p) => p.short).join(", ")}</p>}
        </div>
      )}

      <div className="mq-weight">
        <span className="mq-weight-label" id={`mqw-${q.key}`}>How much does this matter to you?</span>
        <div className="seg" role="group" aria-labelledby={`mqw-${q.key}`}>
          {IMPORTANCE.map((o) => (
            <button key={o.v} type="button" aria-pressed={(answer?.importance ?? 1) === o.v} disabled={!answer} onClick={() => onImportance(o.v)}>{o.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Chip({ p, q }: { p: MatchParty; q: MatchQuestion }) {
  const c = q.cells[p.id];
  const quiet = c?.kind === "stance" && (c.unstated || c.record);
  return (
    <li className={`mq-chip${quiet ? " inferred" : ""}`} style={{ "--fill": p.color } as CSSProperties} title={quiet ? `${p.name}: ${c?.kind === "stance" && c.unstated ? "not said publicly; read from the record" : "from the record, not a questionnaire answer"}` : p.name}>
      {p.short}
    </li>
  );
}
