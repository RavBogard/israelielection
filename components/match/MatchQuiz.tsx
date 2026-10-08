"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeAnswers, encodeAnswers, MIN_ANSWERS, type Answers, type Importance } from "@/lib/match";
import QuestionStep from "./QuestionStep";
import Results from "./Results";
import type { MatchData } from "./types";
import "./match.css";

/**
 * The Party match client: one question at a time, then the results. Answers live in the URL (?a=),
 * so a result can be shared as a link; nothing is stored or sent anywhere.
 */
export default function MatchQuiz({ data }: { data: MatchData }) {
  const order = useMemo(() => data.questions.map((q) => ({ key: q.key, options: q.offered })), [data]);
  const core = data.questions.filter((q) => q.round === "core");
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(0);
  const [deeper, setDeeper] = useState(false);
  const [view, setView] = useState<"quiz" | "results">("quiz");

  // A shared link opens straight on its results (read once on arrival, as the Coalition Builder restores its URL).
  useEffect(() => {
    const restore = () => {
      const a = decodeAnswers(order, new URLSearchParams(window.location.search).get("a"));
      if (core.filter((q) => a[q.key]).length < MIN_ANSWERS) return;
      setAnswers(a);
      setDeeper(data.questions.some((q) => q.round === "deeper" && a[q.key]));
      setView("results");
    };
    restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = deeper ? data.questions : core;
  const answeredCore = core.filter((q) => answers[q.key]).length;
  const canSee = answeredCore >= MIN_ANSWERS;

  const writeUrl = (a: Answers, results: boolean) => {
    const url = new URL(window.location.href);
    const code = encodeAnswers(order, a);
    if (results && code) url.searchParams.set("a", code);
    else url.searchParams.delete("a");
    window.history.replaceState(null, "", url);
  };

  const showResults = () => {
    writeUrl(answers, true);
    setView("results");
    window.scrollTo({ top: 0 });
  };
  const goTo = (i: number) => {
    setStep(i);
    setView("quiz");
    writeUrl(answers, false);
  };

  const q = shown[Math.min(step, shown.length - 1)];
  const answer = answers[q.key] ?? null;

  if (view === "results")
    return (
      <Results
        data={data}
        answers={answers}
        deeperDone={deeper}
        onEdit={() => goTo(0)}
        onDeeper={() => { setDeeper(true); goTo(core.length); }}
        onRestart={() => { setAnswers({}); setDeeper(false); goTo(0); }}
      />
    );

  const last = step === shown.length - 1;
  return (
    <section className="mq" aria-label="Questionnaire">
      <ol className="mq-progress" aria-label="Questions">
        {shown.map((x, i) => {
          const a = answers[x.key];
          const state = i === step ? "now" : a ? "done" : x.key in answers ? "skipped" : "todo";
          return (
            <li key={x.key} className={`mq-mark ${state}${x.round === "deeper" ? " deep" : ""}`}>
              <button type="button" onClick={() => setStep(i)} aria-current={i === step ? "step" : undefined} aria-label={`Question ${i + 1}: ${x.label}${a ? ", answered" : x.key in answers ? ", skipped" : ""}`} />
            </li>
          );
        })}
      </ol>

      <QuestionStep
        key={q.key}
        q={q}
        n={step + 1}
        of={shown.length}
        parties={data.parties}
        answer={answer}
        onPick={(stance) => setAnswers((a) => ({ ...a, [q.key]: { stance, importance: a[q.key]?.importance ?? 1 } }))}
        onImportance={(importance: Importance) => setAnswers((a) => (a[q.key] ? { ...a, [q.key]: { ...a[q.key]!, importance } } : a))}
      />

      <div className="mq-nav">
        <button type="button" className="btn" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Back</button>
        {!answer && <button type="button" className="btn mq-skip" onClick={() => { setAnswers((a) => ({ ...a, [q.key]: null })); if (!last) setStep(step + 1); }}>Skip this one</button>}
        <span className="mq-gap" />
        {!last ? (
          <button type="button" className="btn primary" onClick={() => setStep(step + 1)} disabled={!answer}>Next question</button>
        ) : (
          <>
            {!deeper && <button type="button" className="btn" onClick={() => { setDeeper(true); setStep(step + 1); }}>Answer 8 more questions</button>}
            <button type="button" className="btn primary" onClick={showResults} disabled={!canSee}>See your matches</button>
          </>
        )}
      </div>
      {last && !canSee && <p className="fig-note mq-need">Answer at least {MIN_ANSWERS} of the first seven questions to see your matches; you have answered {answeredCore}.</p>}
    </section>
  );
}
