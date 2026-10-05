"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { journeys, journeyState, type JourneyStep } from "@/lib/journeys";
import "./journey.css";

function Check({ step }: { step: JourneyStep }) {
  const [choice, setChoice] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  return <details className="journey-check"><summary>Optional check: {step.question}</summary>
    <fieldset><legend>{step.question}</legend>{step.options.map((option, i) => <label key={option}><input type="radio" name="check" checked={choice === i} onChange={() => { setChoice(i); setRevealed(false); }} />{option}</label>)}</fieldset>
    <button type="button" onClick={() => setRevealed(true)}>Show the explanation</button>
    {revealed && <div role="status"><p><b>{choice === null ? "The answer:" : choice === step.answer ? "That's right." : "Reconsider this distinction."}</b> {step.options[step.answer]}.</p><p>{step.explanation}</p></div>}
  </details>;
}
export default function GuidedJourney() {
  const params = useSearchParams();
  const router = useRouter();
  const { route, index } = journeyState(params.get("route"), params.get("step"));
  const key = route.steps[index] as keyof typeof journeys.steps;
  const step = journeys.steps[key];
  const go = (id: string, next: number) => router.push(`/start?route=${id}&step=${next}#journey-step`, { scroll: true });
  return <div className="journey">
    <nav aria-label="Choose a learning route" className="journey-routes">{journeys.routes.map((r) => <button type="button" key={r.id} aria-pressed={r.id === route.id} onClick={() => go(r.id, 0)}>{r.title}</button>)}</nav>
    <p>{route.description} Leave or skip a step whenever you like.</p>
    <nav aria-label="Learning steps"><ol className="journey-steps">{route.steps.map((id, i) => <li key={id}><a href={`/start?route=${route.id}&step=${i}#journey-step`} aria-current={i === index ? "step" : undefined}>{journeys.steps[id as keyof typeof journeys.steps].title}</a></li>)}</ol></nav>
    <section id="journey-step" aria-labelledby="journey-title" tabIndex={-1}>
      <p className="note">Step {index + 1} of {route.steps.length} · about {step.minutes} {step.minutes === 1 ? "minute" : "minutes"}</p>
      <h2 id="journey-title">{step.title}</h2><p>{step.text}</p>
      <p><Link href={step.href}>{step.link}</Link>{key === "govern" && <> · <Link href="/how-it-works/forming-a-government">Read the formation process</Link></>}</p>
      <Check key={`${route.id}-${key}`} step={step} />
      <div className="journey-move">{index > 0 && <button type="button" onClick={() => go(route.id, index - 1)}>Previous step</button>}{index < route.steps.length - 1 ? <button type="button" onClick={() => go(route.id, index + 1)}>Next step / skip</button> : <p><b>You’ve reached the end of this route.</b> <Link href={route.next}>{route.nextLabel}</Link>.</p>}</div>
    </section>
    <p className="src">Route facts as of {journeys.checked}. The linked guides carry the original evidence and dates. <Link href="/">Return to the homepage</Link>.</p>
  </div>;
}
