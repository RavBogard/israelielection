"use client";
import type { CSSProperties, KeyboardEvent } from "react";
import { UNORDERED_EDGE } from "@/components/compare/model";
import type { Answer, Importance } from "@/lib/match";
import type { MatchParty, MatchQuestion } from "./types";
import type { Lang } from "@/lib/i18n";
import { matchText } from "@/lib/i18n/match";
import compareText from "@/lib/i18n/compare";

export default function QuestionStep({
  q,
  n,
  of,
  parties,
  answer,
  onPick,
  onImportance,
  lang = "en",
}: {
  q: MatchQuestion;
  n: number;
  of: number;
  parties: MatchParty[];
  answer: Answer | null;
  onPick: (stance: string) => void;
  onImportance: (v: Importance) => void;
  lang?: Lang;
}) {
  const t = matchText(lang),
    c = compareText[lang],
    holders = (id: string) =>
      parties.filter((p) => {
        const cell = q.cells[p.id];
        return cell?.kind === "stance" && cell.stance === id;
      }),
    offered = q.stances.filter((s) => q.offered.includes(s.id)),
    unoffered = q.stances.filter(
      (s) => !q.offered.includes(s.id) && holders(s.id).length,
    ),
    silent = parties.filter((p) => q.cells[p.id]?.kind !== "stance"),
    revealed = !!answer;
  const key = (event: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const move =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? -1
          : 0;
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? offered.length - 1
          : move
            ? (i + move + offered.length) % offered.length
            : -1;
    if (next < 0) return;
    event.preventDefault();
    onPick(offered[next].id);
    event.currentTarget
      .closest('[role="radiogroup"]')
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      [next]?.focus();
  };
  return (
    <div className="mq-step">
      <p className="mq-count">
        {t.question}{" "}
        <bdi dir="ltr">
          {n} / {of}
        </bdi>
        <span className="mq-issue" lang={q.labelLang}>
          {q.label}
        </span>
      </p>
      <h2 className="mq-prompt" id={`mq-${q.key}`} lang={q.textLang} dir="auto">
        {q.prompt}
      </h2>
      <p className="mq-context" lang={q.textLang} dir="auto">
        {q.context}
      </p>
      <div
        className={`mq-options${q.scale ? "" : " unordered"}${revealed ? " revealed" : ""}`}
        role="radiogroup"
        aria-labelledby={`mq-${q.key}`}
      >
        {offered.map((s, i) => {
          const on = answer?.stance === s.id,
            who = holders(s.id);
          return (
            <div key={s.id} className={`mq-opt${on ? " on" : ""}`}>
              <button
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={on || (!answer && i === 0) ? 0 : -1}
                onKeyDown={(event) => key(event, i)}
                onClick={() => onPick(s.id)}
              >
                <span
                  className="mq-swatch"
                  style={{
                    background: s.color,
                    boxShadow: s.position === null ? UNORDERED_EDGE : undefined,
                  }}
                  aria-hidden="true"
                />
                <span className="mq-label" lang={q.textLang} dir="auto">
                  {s.label}
                </span>
              </button>
              {revealed && (
                <ul
                  className="mq-holders"
                  aria-label={`${t.holders}: ${who.length}`}
                  style={{ "--i": i } as CSSProperties}
                >
                  {who.length ? (
                    who.map((p) => {
                      const cell = q.cells[p.id],
                        quiet =
                          cell?.kind === "stance" &&
                          (cell.unstated || cell.record);
                      return (
                        <li
                          key={p.id}
                          className={`mq-chip${quiet ? " inferred" : ""}`}
                          style={{ "--fill": p.color } as CSSProperties}
                          title={
                            quiet
                              ? `${p.name}: ${cell?.kind === "stance" && cell.unstated ? c.glyphs.unst : c.glyphs.rec}`
                              : p.name
                          }
                          lang={p.nameLang}
                        >
                          {p.short}
                        </li>
                      );
                    })
                  ) : (
                    <li className="mq-none">{t.none}</li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      {revealed && (unoffered.length > 0 || silent.length > 0) && (
        <div className="mq-rest fig-note">
          {unoffered.map((s) => (
            <p key={s.id}>
              <b lang={q.stanceLang?.[s.id]}>{q.stanceLabels[s.id]}:</b>{" "}
              {holders(s.id)
                .map((p) => p.short)
                .join(", ")}
            </p>
          ))}
          {silent.length > 0 && (
            <p>
              <b>{t.noPosition}:</b> {silent.map((p) => p.short).join(", ")}
            </p>
          )}
        </div>
      )}
      <div className="mq-weight">
        <span className="mq-weight-label" id={`mqw-${q.key}`}>
          {t.importance}
        </span>
        <div className="seg" role="group" aria-labelledby={`mqw-${q.key}`}>
          {[t.little, t.matters, t.deal].map((label, i) => (
            <button
              key={i}
              type="button"
              aria-pressed={(answer?.importance ?? 1) === i}
              disabled={!answer}
              onClick={() => onImportance(i as Importance)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
