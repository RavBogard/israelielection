/**
 * Every word on the election-night page (/results, /he/results) and its parts: the phase strip, the exit-poll bars,
 * the board and the table, the threshold watch, the freshness and refresh lines.
 *
 * The Hebrew is written fresh in the voice of an Israeli election-night desk (STYLE.md, docs/planning/2026-10-06-hebrew):
 * מדגמי הערוצים at 22:00, תוצאות אמת, ספירת הקולות, המעטפות הכפולות. It does the English element's job; it does not mirror
 * its sentences. `he` is typed as `typeof en`, so both editions carry the same keys and template signatures.
 *
 * Templates return plain strings. A link is written [text](href) and drawn by components/results/rich.tsx; an internal
 * href is given in its English form and the page maps it to the Hebrew edition when there is one. Figures arrive already
 * formatted (dates, times, percentages, signed numbers), so Hebrew digits and order stay as the desk writes them.
 */
import { heText } from "./he-text";

/** Hebrew seats: "מנדט אחד", "שני מנדטים", "4 מנדטים", "4.2 מנדטים" (STYLE.md: never "1 מנדטים"). */
/** "About n seats" in Hebrew: "כ-4 מנדטים", "כמנדט אחד", "כשני מנדטים". */

const en = {
  meta: {
    title: "Results",
    description: "Election-night results for Israel's 2026 Knesset election from the Central Elections Committee's count, with seats by party and bloc.",
  },
  title: "Results",
  /** The phase strip (its step labels are lib/results-phase phases(lang)). */
  phases: {
    aria: "Election night",
    done: ", done",
  },
  refresh: "Check for an update",
  /** "Oct 27, 10:00 PM" + " Israel time". */
  israelTime: (t: string) => `${t} Israel time`,
  standfirst: {
    closed: (il: string, et: string) => `The count starts when polls close, ${il} Israel time (${et}).`,
    stale: "Saved count; the update is unavailable",
    early: "The committee’s early count",
    count: "The committee’s count so far",
    open: (lead: string, il: string, et: string) => `${lead}, captured ${il} Israel time (${et}); seats are this site's estimate.`,
    waiting: (t: string) => `Waiting for the committee's first figures. Last checked at ${t} Israel time; the page checks again every minute.`,
    unusable: (t: string) => `The committee's file had no usable figures when last checked, at ${t} Israel time; the page tries again every minute.`,
    unreachable: (t: string) => `The committee's count could not be reached on this refresh (${t} Israel time); the page tries again every minute.`,
  },
  letters: {
    h: "The ballot letters",
    note: (n: number) =>
      `Voters pick a paper slip printed with a list's letters. The committee's count reports votes by those letters. These are the letters of the ${n} lists this site tracks, out of 38 on the ballot.`,
    th: { letters: "Letters", list: "List", leader: "Leader" },
    source: "Source: ",
  },
  method: {
    h: "How votes become seats",
    threshold: (pct: string) => `Lists with fewer than ${pct}% of valid votes get no seats. Their votes are not transferred.`,
    share: (seats: number) => `The ${seats} seats are shared among the remaining lists in proportion to their votes, by the Bader-Ofer method.`,
    surplus: (pairs: string) =>
      `Two lists that signed a surplus-vote agreement compete for leftover seats as if they were one list, then split what they win. This can affect leftover-seat allocation. Provisional assumptions here (reported signed; official filing unverified): ${pairs}.`,
    majority: (m: number) =>
      `${m} seats is an absolute majority. Initial confidence requires more votes for than against, excluding abstentions; constructive no-confidence requires 61 MKs to support an alternative government. [IDI explanation](https://en.idi.org.il/articles/28888); [Basic Law: Government](https://main.knesset.gov.il/EN/activity/Documents/BasicLawsPDF/BasicLawTheGovernment.pdf).`,
    /** Two lists in an agreement: "Yashar and The Democrats". */
    pair: (a: string, b: string) => `${a} and ${b}`,
    pairSep: "; ",
    agreements: " Agreements: ",
  },
  watch: {
    h: "What to watch",
    closeDt: (il: string, et: string) => `${il} Israel time, ${et}`,
    closeDd:
      "This page shows the committee's count as it comes in, refreshed every minute, and the [Coalition Builder](/coalition-builder) adds it as a choice. Polls close, and Kan, Channel 12 and Channel 13 broadcast their exit polls at that moment ([Ynet, Nov 1, 2022](https://www.ynetnews.com/article/h1tyl0a4s)). Exit polls are estimates: in 2022 the early exit polls gave Meretz 5 seats ([Jerusalem Post, Nov 1, 2022](https://www.jpost.com/israel-elections/article-721230)), and the final count put it at 3.16%, below the threshold, with none ([Central Elections Committee](https://votes25.bechirot.gov.il/nationalresults)). [How election night turns into a count](/how-it-works/voting)",
    thresholdDt: (pct: string, seats: number) => `The threshold, ${pct}% of valid votes, about ${seats} seats`,
    thresholdDd: (closed: boolean) =>
      `A list that misses it gets no seats; its votes are not transferred. Seats are allocated among lists that passed. In the ${closed ? "final polling" : "current"} average these lists sit nearest the line:`,
    nearSeats: (n: number, figure: string) => `${figure} seats`,
    nearNone: "below the threshold in every poll",
    thresholdAfter: (seats: number) => `Each one that crosses or fails moves about ${seats} seats between the blocs.`,
    envelopesDt: "The count keeps moving after the night",
    envelopesDd:
      "Nearly one vote in ten is cast in a double envelope, away from the voter's own polling station, and those are counted after the regular ballots. The committee publishes the official allocation with the final results. [Why the count shifts](/how-it-works/voting)",
  },
  exitTable: {
    pending: "The three channels' exit polls will be added here when they air, and the Coalition Builder will offer them as a choice.",
    h: (beside: boolean) => `Exit polls by list${beside ? ", beside the count" : ""}`,
    list: "List",
    countSoFar: "Count so far",
    below: "below threshold",
    source: (il: string, polls: string) => `Exit polls as broadcast at ${il} Israel time: ${polls}. They are estimates; the count is the committee's.`,
    pollSep: "; ",
  },
  thresholdCount: {
    h: "The threshold",
    note: (pct: string, votes: string) =>
      `${pct}% of valid votes counted so far is ${votes} votes. A list below it gets no seats; its votes are not transferred. Seats are allocated among the lists that passed.`,
    row: (share: string, votes: string, passing: boolean, seats: number) =>
      `${share}, ${votes} votes ${passing ? "above" : "below"} the line; ${passing ? `holds ${seats} seats` : `would take about ${seats} seats if it crosses`}`,
    none: "No list is within half a point of the threshold in the votes counted so far.",
  },
  board: {
    otherLists: "Other lists",
    earlyFlag: (pc: string) => [`Early count.`, ` Localities holding ${pc} of the voter roll are in, so these seats will move. The hatching over the grid marks them as early.`] as readonly [string, string],
    aria: (early: boolean): string => (early ? "Seats by bloc, early count" : "Seats by bloc"),
    gridTitle: (early: boolean, majority: number) => `${early ? "Early count: seats" : "Seats"} by bloc; ${majority} is a majority`,
    gridAwait: (seats: number, majority: number) => `Awaiting the count: ${seats} seats; ${majority} is a majority`,
    awaiting: "Awaiting count",
    countedH: "Voter roll in the localities counted ",
    countedNone: "Share of the voter roll counted",
    countedAria: (pc: string) => `${pc} of eligible voters are in localities counted so far`,
    countedAriaNone: "Not available yet",
    awaitCount: "Awaiting the count.",
    tally: (valid: string, localities: string, turnout: string | null) =>
      `${valid} valid votes from ${localities} regular localities and any included double envelopes; turnout ${turnout ?? "not available"} among counted regular localities.`,
    prior: (roll: string, eligible: string) => ` The share is against ${roll} (${eligible} eligible) until the committee publishes its 2026 total.`,
    build: "Build a coalition from these results",
    byList: "By list",
    th: { list: "List", seats: "Seats", letters: "Letters", votes: "Votes", share: "Share", diff: "Difference" },
    below: "below threshold",
    others: (n: number | null) => `Other lists${n !== null ? ` (${n})` : ""}`,
    srcThreshold: (votes: string, pct: string) => `Threshold: ${votes} votes (${pct}% of valid votes counted so far). `,
    srcHatched: "Hatched cells await the count. ",
    srcAverage: (label: string, n: number, through: string) =>
      `${label}: this site's average of the latest ${n} polls, through ${through}; the difference is seats in the count minus that average. Source: `,
    srcUntracked: " A list this site does not track is currently over the threshold.",
  },
  exitBars: {
    h: "Exit polls",
    aria: "Exit polls",
    notYet: "not yet added",
    notYetTitle: "Not yet added",
    notYetLabel: (pollster: string) => `${pollster} exit poll: not yet added.`,
    time: (t: string) => `${t} Israel time`,
    notByBloc: "Not reported by bloc",
    label: (poll: string, blocs: string) => `${poll}: ${blocs}. A majority is 61.`,
    srcAny: "Exit polls as broadcast. They are estimates; the committee's count replaces them. Seats by bloc are each channel's own figures.",
    srcNone:
      "Kan, Channel 12 and Channel 13 broadcast exit polls as polls close ([Ynet, Nov 1, 2022](https://www.ynetnews.com/article/h1tyl0a4s)). They are added here once published; nothing is shown until then.",
  },
  pollThreshold: {
    caption: (closed: boolean): string => (closed ? "The lists near the threshold, in the last poll from each pollster" : "The lists near the threshold, in each current poll"),
    passesIn: "Passes in",
    seats: (n: number) => `${n} seats`,
    below: "below the threshold",
    of: (n: number) => ` of ${n}`,
    average: (avg: string) => `, average ${avg}`,
    src: (n: number) =>
      `Each dot is one of the latest ${n} polls; a dot at zero is a poll that had the list below the threshold. The shaded gap is the threshold itself: 3.25% of valid votes is about four seats, so a list that passes wins at least four and one that misses wins none. The right column counts the polls where the list passes. Each list that crosses or misses on the night moves about four seats between the blocs.`,
  },
  freshness: {
    aria: "Count freshness",
    fixture: "Local rehearsal fixture, not the 2026 count.",
    stale: "Saved count; the update is unavailable.",
    fresh: "Latest successful source fetch.",
    captured: (t: string) => ` Captured ${t}.`,
    sourceTime: (t: string | null) => (t ? ` Source file timestamp: ${t}.` : " The source file does not provide a verified update time."),
    attempt: (t: string) => ` Last update attempt: ${t}.`,
    partial: "Partial count; seats are this site’s estimate, not the committee’s official allocation. Double envelopes: ",
    envelopes: (valid: string | null, present: boolean | null) =>
      `${present === null ? "status not recorded" : present ? `${valid} valid votes included; may still be incomplete` : "not yet present in this file"}.`,
  },
  changes: {
    none: "No previous distinct saved count is available for comparison.",
    h: "Changes since the previous saved count",
    compared: "Compared with the count captured ",
    /** Around the signed change in valid votes. */
    after: [": ", " valid votes. A decrease can reflect a corrected count. These are changes between two saved counts, not an official change log."] as readonly [string, string],
    th: { list: "List", votes: "Vote change", seats: "Estimated seat change" },
  },
  /** The count as a pseudo-poll's note (lib/results resultsAsPoll), shown in the Coalition Builder. */
  asPollNote: (localities: number, thresholdVotes: string) =>
    `Votes counted so far in ${localities} localities; seats estimated by this site from them (threshold ${thresholdVotes} votes).`,
  /** Hebrew list names by ballot letters, used when the party overlay has none (Hebrew edition only). */
  lists: {} as Record<string, string>,
  /** Bloc names, used when the party overlay has none (Hebrew edition only). */
  blocs: {} as Record<string, string>,
  /** The exit-poll channels by their data/polls.json pollster names, when the pollster overlay has none (Hebrew only). */
  channels: {} as Record<string, string>,
};


const resultsText = {
  en,
  /** Loaded on Hebrew pages only (lib/i18n/he/register.ts). */
  get he(): ResultsText {
    return heText<ResultsText>("results");
  },
};
export default resultsText;
export type ResultsText = typeof en;
