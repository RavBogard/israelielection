"use client";
import Link from "next/link";
import { useSeatContext } from "./seat-context/SeatContextProvider";
import { useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { longDate } from "@/lib/format";
import { journeys, journeyState, type JourneyStep } from "@/lib/journeys";
import { editionPath, type Lang } from "@/lib/i18n";
import { journeyText } from "@/lib/i18n/journeys";
import { referenceText } from "@/lib/i18n/reference";
import { readiness } from "@/lib/i18n/election-readiness";
import { readinessPhase } from "./election-readiness/model";
import "./journey.css";

function Check({
  step,
  lang,
  contentLang,
}: {
  step: JourneyStep;
  lang: Lang;
  contentLang: Lang;
}) {
  const [choice, setChoice] = useState<number | null>(null),
    [revealed, setRevealed] = useState(false),
    t = journeyText(lang);
  return (
    <details className="journey-check">
      <summary>
        {t.check}:{" "}
        <span lang={contentLang} dir="auto">
          {step.question}
        </span>
      </summary>
      <fieldset lang={contentLang} dir="auto">
        <legend>{step.question}</legend>
        {step.options.map((option, i) => (
          <label key={i}>
            <input
              type="radio"
              name="check"
              checked={choice === i}
              onChange={() => {
                setChoice(i);
                setRevealed(false);
              }}
            />
            {option}
          </label>
        ))}
      </fieldset>
      <button type="button" onClick={() => setRevealed(true)}>
        {t.explain}
      </button>
      {revealed && (
        <div role="status">
          <p>
            <b>
              {choice === null
                ? t.answer
                : choice === step.answer
                  ? t.right
                  : t.reconsider}
            </b>{" "}
            <span lang={contentLang} dir="auto">
              {step.options[step.answer]}
            </span>
            .
          </p>
          <p lang={contentLang} dir="auto">
            {step.explanation}
          </p>
        </div>
      )}
    </details>
  );
}
export default function GuidedJourney({
  figures = {},
  lang = "en",
  copy = journeys,
  contentLang = "en",
  copyState = "original",
}: {
  figures?: Record<string, ReactNode>;
  lang?: Lang;
  copy?: typeof journeys;
  contentLang?: Lang;
  copyState?: string;
}) {
  const { context, cadence } = useSeatContext();
  const phase = readinessPhase(
      context,
      !!cadence && cadence.phase !== "before_close",
    ),
    words = readiness(lang),
    t = journeyText(lang),
    ref = referenceText(lang);
  const next =
    phase === "campaign"
      ? null
      : phase === "official"
        ? { href: "/government", label: words.governmentNext }
        : { href: "/results", label: words.resultsNext };
  const params = useSearchParams(),
    router = useRouter();
  const selected = journeyState(params.get("route"), params.get("step")),
    index = selected.index;
  const route =
    copy.routes.find((r) => r.id === selected.route.id) ?? copy.routes[0];
  const key = route.steps[index] as keyof typeof copy.steps,
    step = copy.steps[key];
  const local = (href: string) => editionPath(href, lang) ?? href;
  const href = (id: string, n: number) =>
    local(`/start?route=${id}&step=${n}#journey-step`);
  const go = (id: string, n: number) =>
    router.push(href(id, n), { scroll: true });
  return (
    <div className="journey">
      {lang !== "en" && copyState !== "ready" && (
        <p className="note">
          <b>{copyState === "withdrawn" ? ref.withdrawn : ref.pending}.</b>{" "}
          {ref.pendingNote}{" "}
          <Link href={`/start?route=${route.id}&step=${index}&original=en`}>
            {ref.original}
          </Link>
        </p>
      )}
      <nav aria-label={t.routes} className="journey-routes">
        {copy.routes.map((r) => (
          <button
            type="button"
            key={r.id}
            lang={contentLang}
            dir="auto"
            aria-pressed={r.id === route.id}
            onClick={() => go(r.id, 0)}
          >
            {r.title}
          </button>
        ))}
      </nav>
      <section id="journey-step" aria-labelledby="journey-title" tabIndex={-1}>
        <figure className="journey-fig">
          <figcaption>
            <p className="journey-step-n">
              {t.step} {index + 1} {t.of} {route.steps.length}. {step.minutes}{" "}
              {t.minutes}
            </p>
            <h2 id="journey-title" lang={contentLang} dir="auto">
              {step.title}
            </h2>
          </figcaption>
          {figures[key]}
        </figure>
        {next && (
          <p className="fig-note">
            {words.matchNote}{" "}
            <Link href={local("/government")}>{t.formation}</Link>.{" "}
            <Link href={local("/results")}>{words.resultsNext}</Link>.
          </p>
        )}
        <p lang={contentLang} dir="auto">
          {step.text}
        </p>
        <p>
          <Link lang={contentLang} dir="auto" href={local(step.href)}>
            {step.link}
          </Link>
          {key === "govern" && (
            <>
              .{" "}
              <Link href={local("/how-it-works/forming-a-government")}>
                {t.process}
              </Link>
            </>
          )}
        </p>
        <Check
          key={`${route.id}-${key}`}
          step={step}
          lang={lang}
          contentLang={contentLang}
        />
        <div className="journey-move">
          {index > 0 && (
            <button type="button" onClick={() => go(route.id, index - 1)}>
              {t.previous}
            </button>
          )}
          {index < route.steps.length - 1 ? (
            <button type="button" onClick={() => go(route.id, index + 1)}>
              {t.next}
            </button>
          ) : (
            <p>
              <b>{t.end}</b>{" "}
              <Link
                href={local(next?.href ?? route.next)}
                lang={next ? lang : contentLang}
              >
                {next?.label ?? route.nextLabel}
              </Link>
              .
            </p>
          )}
        </div>
      </section>
      <div className="journey-nav">
        <p>
          <span lang={contentLang} dir="auto">
            {route.description}
          </span>{" "}
          {t.skip}
        </p>
        <nav aria-label={t.steps}>
          <ol className="journey-steps">
            {route.steps.map((id, i) => (
              <li key={id}>
                <Link
                  lang={contentLang}
                  dir="auto"
                  href={href(route.id, i)}
                  aria-current={i === index ? "step" : undefined}
                >
                  {copy.steps[id as keyof typeof copy.steps].title}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      </div>
      <p className="fig-src">
        {t.checked}{" "}
        <time dateTime={copy.checked}>{longDate(copy.checked, lang)}</time>.{" "}
        {t.sources} <Link href={local("/")}>{t.home}</Link>.
      </p>
    </div>
  );
}
