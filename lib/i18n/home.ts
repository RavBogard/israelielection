/**
 * The home page's words in both editions (components/pages/HomePage.tsx, components/HomeRace.tsx).
 * English values are the English home's own words; where the English interleaves figures, an entry returns the
 * pieces as an array so React renders them exactly as before. Hebrew is written fresh in Israeli political-media
 * Hebrew (STYLE.md: data-desk register, no "המרוץ", blocs masculine, plural imperatives), doing each English
 * element's job. Daniel reviews it here. Generated sentences (the finding, the citation) are in lib/home-since.ts,
 * the headline in lib/results-phase.ts.
 */
import { heText } from "./he-text";

type Bits = (string | number)[];

const en = {
  title: "Israel Votes 2026",
  hero: {
    standfirstLive: "The count so far, translated into estimated Knesset seats.",
    standfirst: "Where the race stands, translated into modeled Knesset seats.",
    majority: (m: number, k: number): Bits => [" ", m, " of ", k, " seats is an absolute majority."],
    basisStale: "Saved count, stale",
    basisLive: "Count so far",
    basis: (n: number) => `Normalized coalition average, ${n} current polls`,
    newest: "Newest poll: ",
    stale: "Saved count (stale). ",
    liveSource: (captured: string, updated: string): Bits => ["Central Elections Committee; seats are this site’s estimate from votes counted so far. Captured ", captured, ". Source updated ", updated, ". "],
    unrecorded: "at an unrecorded time",
    fullResults: "Full results and count method",
    avgSource: (pollsters: string, through: string): Bits => ["One latest eligible poll per publisher (", pollsters, "), through ", through, ". Square-root sample-size weighting, normalized coalition values; seats can be fractional."],
    change: (since: string): Bits => [" Change is against the average as it stood on ", since, ", the last poll date at least a week before the newest."],
    method: "Average method",
    contextBefore: "Explore the ",
    partyMap: "Party Map",
    contextMiddle: " or try an arrangement in the ",
    builder: "Coalition Builder",
  },
  exit: {
    standfirst: (m: number, k: number): Bits => ["The channels' exit polls in Knesset seats by bloc. They are estimates; the committee's count replaces them. ", m, " of ", k, " seats is an absolute majority."],
    basis: "Exit polls",
    early: (pct: string): Bits => ["Early count: localities holding ", pct, "% of the voter roll are in. "],
    follow: "Follow the count",
    context: "Results, exit polls by list and the count method",
  },
  race: {
    instruction: "Choose a bloc to see its parties.",
    seats: "seats",
    knownSeats: "known seats",
    noChange: "No change",
    since: " since ",
    short: (x: string) => `${x} seats short of 61`,
    at: "At the 61-seat absolute majority",
    above: (x: string) => `${x} seats above 61`,
    known: " in the known subtotal",
    show: "Show parties",
    hide: "Hide parties",
    mosaic: (selected: string | null) => `120-seat mosaic. ${selected ? `${selected} parties revealed; other blocs remain solid.` : "Four bloc colors; activate a bloc to reveal its parties."}`,
    open: (label: string, seats: string) => `Open ${label} profile: ${seats} seats`,
    group: (label: string, seats: string) => `${label}: ${seats} seats`,
    reveal: (label: string, seats: string) => `Show ${label} parties: ${seats} seats`,
    cell: (label: string, i: number) => `${label}; cell ${i}`,
    unassigned: "No modeled seat assigned",
    note: "Blocs are groupings, not coalition agreements. Cells round; labels keep one decimal.",
    empty: (n: number): Bits => [" ", n, " neutral cells have no estimate."],
    panel: (label: string) => `${label}: parties`,
    back: "Back to blocs",
    status: (label: string): Bits => ["Only ", label, " is shown in party colors. The other blocs keep their colors and every cell stays in place."],
    notSeparated: "Not separated",
    notReported: "Not separately reported",
    below: "below",
    belowAvg: "the threshold, or passes in under half the polls",
    belowCount: "the threshold so far",
    combined: (names: string, seats: string): Bits => [names, ": ", seats, " seats reported together"],
    within: "; counted once in this bloc.",
    across: "; crosses blocs and is not allocated to one bloc here.",
    noSplit: " No individual split is reported.",
    followsAvg: "The mosaic follows the normalized coalition average.",
    followsCount: "The mosaic follows this site’s seat estimate from the count so far.",
    noInvented: " Unreported parties are not assigned invented seats.",
    /** lib/home-race.ts labels. */
    unallocated: "Not separately allocated",
    combinedLabel: (names: string) => `${names} (combined; not separated)`,
  },
  since: {
    heading: "Since yesterday",
    newest: ". The newest:",
    allPolls: "Every poll and the average",
    today: "Today’s briefing",
    briefing: (date: string) => `Briefing, ${date}`,
    /** Hebrew only: the label on the machine-translated briefing (Daniel, 2026-10-06), and on the English fallback. */
    machine: "",
    english: "",
    full: "Full briefing",
    and: " and ",
    atMajority: (names: string, m: number): Bits => [names, " at ", m, " or more"],
    source: "Source",
  },
  start: {
    lead: "New here? ",
    route: "Take a short guided route",
    middle: ", or go straight to ",
    how: "how it works",
    parties: "the parties",
    and: " and ",
    who: "who votes",
  },
  tools: {
    heading: "Try it",
    builder: "Coalition Builder",
    builderLive: "Build a coalition from the real results. Can you get to 61?",
    builderText: "Pick parties from any poll. Can you get to 61?",
    partyMap: "Party Map",
    partyMapText: "Every list sized by its poll average, with a sourced profile of each.",
    polls: "Polls",
    pollsText: "Every seat poll of the campaign, the current average, and how each party has moved.",
    voteMap: "Vote map",
    voteMapText: "How every town voted in the five elections from 2019 to 2022, list by list.",
  },
};


const home = {
  en,
  /** Loaded on Hebrew pages only (lib/i18n/he/register.ts). */
  get he(): HomeText {
    return heText<HomeText>("home");
  },
};
export default home;
export type HomeText = typeof en;
