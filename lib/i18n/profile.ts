/**
 * The party profile's words in both editions (/parties/[id] and /he/parties/[id]): the head, the figures, the section
 * heads, the stance tiles and the generated lines under the figures. Hebrew is written fresh in Israeli political-media
 * Hebrew (docs/planning/2026-10-06-hebrew/STYLE.md), doing each English element's job; Daniel reviews it here.
 * `he` is typed as `typeof en`, so both editions carry the same keys and template signatures.
 * Data text (who, voters, bios, pledges, the quote, the parties' words) comes from lib/i18n/overlays.ts, not from here.
 */
import type { AxisKey } from "@/lib/compare";
import { heText } from "./he-text";

/** Hebrew ordinals for a list's size rank in its bloc. */
/** A seat figure as Hebrew counts it: "מנדט אחד", otherwise "3.4 מנדטים". */

const en = {
  meta: {
    description: (name: string, bloc: string, leader: string) => `${name} (${bloc}), led by ${leader}: its polls, its voters, where it stands on seven issues, and its people, every number dated and sourced.`,
  },
  head: {
    letters: (l: string) => `Ballot letters: ${l}`,
    ledBy: "Led by ",
    noPolls: "No polls found",
    notPolledSeparately: "Not polled separately",
    belowAverage: "Below the threshold in the polling average",
    seatsAverage: " seats, polling average",
  },
  glance: {
    title: "At a glance",
    notPolled: "Not polled",
    below: "below",
    seatsLabel: "Seats, polling average",
    noSeatFigures: "no seat figures",
    wherePasses: (x: string) => `${x} where it passes`,
    belowEvery: "the threshold in every poll",
    range: (low: number, high: number, n: number) => `scaled to 120; ${low} to ${high} in ${n} polls`,
    scaled: "scaled to 120",
    newList: "New",
    seats2022: "Seats in 2022",
    share2022: (pct: string) => `${pct}% of the vote`,
    asList: ", as ",
    didNotRun: "did not run in 2022",
    pollsPasses: "Polls it passes",
    of: " of ",
    notReported: "no poll has reported it separately",
    near: "near the threshold",
    never: "never near the threshold",
    belowAll: "below the threshold in all",
    most: "passes in most",
    blocUnit: " seats",
    blocBar: (x: string) => `${x} of 120 seats; a majority is 61.`,
    avgSource: (n: number, from: string, to: string) => `Average over the latest poll from each of ${n} pollsters, ${from} to ${to}, weighted by sample size and scaled to 120 seats.`,
    variantPre: " Without ",
    and: " and ",
    variantPost: (x: string) => `, the two the site’s alternative average leaves out: ${x}.`,
    cec2022: (votes: string) => ` 2022: Central Elections Committee, ${votes} votes.`,
  },
  /** The line under the bloc figure (blocNote in components/profile/model). */
  bloc: {
    majority: "a majority",
    short: (x: string) => `${x} short of 61`,
    rank: (r: number) => ["the largest", "second", "third", "fourth", "fifth", "sixth"][r - 1] ?? `${r}th`,
    notCounted: "this list is not counted in the bloc total",
    inBloc: (rank: string, size: number) => `this list is ${rank} of ${size} in the bloc`,
    partner: "a possible partner, not a governing bloc on its own",
    ofSize: (rank: string, size: number) => `this list is ${rank} of ${size}`,
  },
  spark: {
    title: "Seats in every poll since the Knesset dissolved",
    noPolls: "No polls found",
    onePoll: "One poll so far, too few to draw",
    noneReported: (n: number, since: string) => `None of the ${n} polls since ${since} reported this list separately.`,
    reported: (k: number, pubs: number, from: string, to: string) =>
      `${k} ${k === 1 ? "poll" : "polls"} from ${pubs} ${pubs === 1 ? "publisher" : "publishers"}, ${from} to ${to}. A dot on the floor is a poll that had the list below the threshold; a gap is a poll that did not report it separately.`,
    aria: (name: string, k: number, from: string, to: string, latest: string, avg: string | null) =>
      `${name}: seats in each of ${k} polls from ${from} to ${to}, latest ${latest}${avg !== null ? `; ${avg} seats in the polling average` : ""}. The readings follow as a table.`,
    below: "below the threshold",
    undated: "date not given in our register",
    seats: (n: number) => `${n} seats`,
    point: (pollster: string, date: string, value: string) => `${pollster}, ${date}: ${value}`,
    othersJoined: (n: number) => `The other ${n} publishers, joined`,
    joined: (n: number) => `${n} publishers, joined`,
    hollowNote: ", which the site’s alternative average leaves out",
    result2022: "2022 result",
    caption: (name: string) => `${name}: seats in each poll since the Knesset dissolved`,
    published: "Published",
    pollster: "Pollster",
    seatsHead: "Seats",
    notSeparately: "not reported separately",
  },
  voters: {
    caption: (name: string, possessive: boolean) => `${possessive ? `${name}’s` : name} 2022 voters, by religious self-description`,
    aria: (name: string, groups: { pct: number; label: string }[]) => `${name} voters in 2022: ${groups.map((g) => `${g.pct}% ${g.label}`).join(", ")}.`,
    won: (pct: number, label: string) => `Won ${pct}% of ${label}`,
  },
  map: {
    caption: (name: string) => `${name}’s share of the valid vote, 2022, by locality`,
    source: (pct: string) =>
      `Central Elections Committee, 25th Knesset results by locality. Nationally ${pct}%. The five strongest localities with at least 15,000 valid votes; below the national line, the three biggest cities and the weakest place with 50,000 or more valid votes, for comparison.`,
    aria: (name: string, strongest: string) => `${name}'s share of the valid vote in 2022, by locality. Strongest: ${strongest}. The table under the map carries the numbers.`,
    national: "Nationally",
  },
  text: {
    stand: "Where they stand",
    who: "Who they are",
    voters: "Who votes for them",
    names: "Names on the list",
    slot: (s: string) => `No. ${s}`,
    pledges: "Coalition pledges",
    words: "In their words",
    quoteOpen: "“",
    quoteClose: "”",
    people: "The people",
    leader: "The leader",
    bioSource: (s: string) => `Bio source: ${s}`,
    noBio: (leader: string) => `We have not yet found a sourced biography of ${leader}.`,
    surplus: "Surplus-vote partner: ",
    sourcePrefix: "",
  },
  links: {
    map: "Party Map",
    tree: "Party family tree",
    ballot: "Official ballot entry",
    builder: "Coalition Builder",
  },
  tiles: {
    labels: { draft: "Haredi draft", courts: "Courts", war: "October 7 inquiry", wb: "West Bank", pstate: "Palestinian state", relig: "Religion and state", econ: "Economy" } as Record<AxisKey, string>,
    hint: "Seven questions the site puts to every list. Tap a tile for the party’s words and source.",
    declined: "Declined to answer",
    none: "No 2026 position found",
    record: "On the record",
    unstated: "Not said publicly",
    stated: "From its answers",
    instead: "What it said instead",
    key: "Bar shade: the stance’s place in the issue’s range of answers, from one end of the debate to the other, shared across all lists. The economy’s options coexist, so its bar is dotted paper with an ink outline, not a shade. Squares: one slot per answer, in the same order, with the party’s square in its own; a square in the last slot means no answer. ",
    keyUnstated: "Dotted inner border: not said publicly, from the record; open the tile to see why.",
    noWords: "No position recorded in the site’s sources.",
    recordNote: "On the record, because the party did not answer the questionnaire. ",
    unstatedNote: "Not said publicly: read from the party’s record, which the words above name. ",
    /** Before the party's words when it has not said it publicly (lib/positions QUALIFIER.unstated). */
    unstatedPrefix: "Not said publicly: ",
    sourcePrefix: "",
    same: "Same recorded stance:",
    more: "Compare every list on this question",
    sr: (name: string) => `${name}: seven issues; choose a tile to read the party’s words and source.`,
  },
  sources: {
    title: "Sources",
    polls: "Polls",
    pollsLine: "",
    profiles: "",
    bios: "",
  },
};


const profileText = {
  en,
  /** Loaded on Hebrew pages only (lib/i18n/he/register.ts). */
  get he(): ProfileText {
    return heText<ProfileText>("profile");
  },
};
export default profileText;
export type ProfileText = typeof en;
