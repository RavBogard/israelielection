"use client";
import HomeRace, { type RaceOption } from "./HomeRace";
import { useSeatContext } from "./seat-context/SeatContextProvider";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import type { Lang } from "@/lib/i18n";
import { headline } from "@/lib/results-phase";
import HOME from "@/lib/i18n/home";
import { DASHBOARD } from "@/lib/i18n/election-dashboard";
import { editionPath } from "@/lib/i18n";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import type { CadenceMetadata } from "@/lib/election-lifecycle/cadence";

/** Same interactive hero as the campaign edition; its default point follows stored evidence. */
export default function HomeHero({
  initial,
  options,
  days,
  lang,
  cadence,
  phase:serverPhase,
}: {
  initial: SharedSeatContext|null;
  options: RaceOption[];
  days: number;
  lang: Lang;
  cadence?: CadenceMetadata;
  phase?:"before"|"exit"|"early"|"count";
}) {
  const shared = useSeatContext(initial),
    context = shared.context ?? initial,
    t = DASHBOARD[lang],
    h = HOME[lang].hero;
  if(!context)return <section className="hero"><div className="text"><h1>{headline(serverPhase??"before",days,lang)}</h1><p role="status">{LIFECYCLE[lang].sourceUnavailable}</p></div></section>;
  const official = context.seatStatus === "official",
    currentCadence=shared.cadence??cadence,
    phase =
      context.evidenceStage === "campaign"
        ? currentCadence?.phase==="election_night"?"exit":currentCadence?.phase==="regular"?"count":serverPhase??"before"
        : context.evidenceStage === "exit"
          ? "exit"
          : "count";
  return (
    <section className="hero" aria-labelledby="hero-h">
      <div className="text">
        <h1 id="hero-h">
          {official ? t.officialHero : headline(phase, days, lang)}
        </h1>
        <p className="standfirst">
          {official
            ? t.officialIntro
            : phase === "before"
              ? h.standfirst
              : t.projectedIntro}
          {h.majority(61, 120)}
        </p>
      </div>
      <HomeRace
        options={options}
        currentContext={context}
        initialCadence={cadence}
      />
      <p className="race-context">
        <a
          href={editionPath("/coalition-builder", lang) ?? "/coalition-builder"}
        >
          {h.builder}
        </a>{" "}
        ·{" "}
        <a href={editionPath("/government", lang) ?? "/government"}>
          {LIFECYCLE[lang].negotiations}
        </a>
      </p>
    </section>
  );
}
