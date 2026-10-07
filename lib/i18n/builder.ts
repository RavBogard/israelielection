/**
 * The Coalition Builder's words in both editions (/coalition-builder and /he/coalition-builder): the poll picker,
 * the slips, the two-row meter and its verdict, pledge notes, the outside-support chips, the
 * governing summary, the party drawer, the threshold what-if and the page's sources.
 * The Hebrew is written fresh in Israeli political-media Hebrew (docs/planning/2026-10-06-hebrew/STYLE.md), doing
 * each English element's job, for Daniel's review in this one file. `he` is typed as `typeof en`, so both editions
 * always carry the same keys and template signatures.
 * `**x**` marks bold inside a sentence (components/coalition/Rich.tsx renders it).
 */
import { heText } from "./he-text";

/** Party names joined as the English sentences join them: "A and B", "A, B or C". */
const orList = (names: string[]) => (names.length === 1 ? names[0] : names.length === 2 ? `${names[0]} or ${names[1]}` : `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`);
const COUNT = ["none", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

export type VerdictKey = "majority" | "passes" | "fails" | "none";
export type RoleKey = "cabinet" | "support" | "opposition" | "abstain";

const en = {
  title: "Build a coalition",
  /** The standfirst: bold majority, then the Knesset size. */
  standfirst: (majority: number, knesset: number) => `Tap a ballot slip to add a cabinet partner; **${majority}** of ${knesset} seats is a majority.`,
  pickLabel: "Seats from",
  pickAverage: (n: number) => `Polling average (${n} polls)`,
  pickCount: (stale: boolean): string => (stale ? "saved count (stale)" : "count so far"),
  skip: "Skip to result",
  countPhrase: (stale: boolean): string => (stale ? "the saved count (stale)" : "the count so far"),
  /** How the current poll is named inside a sentence. */
  averagePhrase: (n: number) => `the polling average (${n} polls)`,
  /** The slip tooltip's source. */
  averageSource: (n: number) => `the polling average of ${n} polls`,
  pollWithDate: (label: string, date: string) => `${label}, ${date}`,

  // Slips
  seatNA: "n/a",
  seatBelow: "below",
  seatSmall: { na: "not reported", below: "the threshold", seats: "seats" },
  profile: "Profile",
  profileLabel: (name: string) => `Profile: ${name}`,
  tipNA: (pollster: string, name: string, src: string) => `${pollster} did not report ${name} separately (${src})`,
  tipBelow: (src: string) => `Below threshold in ${src}`,
  tipSeats: (seats: string, src: string) => `${seats} seats in ${src}`,
  tipConflict: (tip: string) => `${tip}. In a pledge conflict with this coalition`,
  pledgeMark: "Pledge conflict",
  roleFor: (name: string) => `Role for ${name}`,
  roles: { cabinet: "Cabinet coalition", support: "Outside support", opposition: "Opposition", abstain: "Hypothetical abstention" } as Record<RoleKey, string>,
  outsideWord: { opposition: "Against", support: "Outside support", abstain: "Abstains", cabinet: "Cabinet" } as Record<RoleKey, string>,
  close: "Close",

  // Pledge notes
  warnCondition: "A stated condition",
  warnPledge: "Goes against a pledge",

  // Named arrangements
  scenariosLabel: "Load a named arrangement",
  scenariosLead: "Or load a named arrangement",
  startOver: "Start over",
  /** The outgoing government's then-and-now line: label (names) held seats in year; its parties have n in poll. */
  thenNow: (label: string, names: string, seats: number, year: number, now: string, poll: string) => `${label} (${names}) held **${seats}** seats in ${year}; its parties have **${now}** in ${poll}.`,
  scenarioChecked: (date: string) => `, Research checked ${date}. Pledge sources appear with each warning.`,

  // The meter
  noParties: "No parties yet",
  viewArrangement: "View the arrangement",
  listsByBloc: "The lists, by bloc",
  yourCoalition: "Your coalition",
  verdict: { majority: "Majority", passes: "Passes", fails: "Fails", none: "No verdict" } as Record<VerdictKey, string>,
  cabinetRow: "Cabinet",
  voteRow: "First confidence vote",
  cabMajority: (n: string, partial: boolean) => `${n}${partial ? "+" : ""}, a majority on its own`,
  cabShort: (n: string, partial: boolean, short: string, majority: number) => `${n}${partial ? "+" : ""}, ${short} short of ${majority}`,
  voteLine: (yes: string, no: string, abstain: string | null) => `For ${yes}, against ${no}${abstain ? `, abstaining ${abstain}` : ""}`,
  cabLabel: (cab: string, majority: number, knesset: number) => `Cabinet: ${cab || "no parties yet"}. ${majority} of ${knesset} is a majority.`,
  voteWithSupport: (cab: string, support: string) => `${cab} + ${support} outside support`,
  voteAbstaining: (n: string) => `Abstaining ${n}`,
  voteCabinetOnly: "Cabinet only",
  voteLabelEmpty: "First confidence vote: no parties yet.",
  voteLabel: (line: string, verdict: string) => `First confidence vote: ${line}. ${verdict}.`,
  segAbstain: (n: string) => `Abstain: ${n}`,
  segAgainst: (n: string) => `Against: ${n}`,
  keyCabinet: "Cabinet",
  keyHatched: "Hatched: outside support, not in the cabinet",
  keyAbstains: "Abstains",
  keyAgainst: "Against",

  // Status line (screen readers)
  statusEmpty: "No parties yet.",
  statusCabinet: (n: string) => `Cabinet ${n}.`,
  statusMajority: (yes: string) => `A majority, ${yes} for`,
  statusNoVerdict: "First vote: no verdict",
  statusVote: (verdict: VerdictKey, yes: string) => `First vote ${en.verdict[verdict].toLowerCase()}, ${yes} for`,
  statusConflicts: (n: number) => (n ? `${n} pledge conflict${n > 1 ? "s" : ""}.` : "No pledge conflict."),
  saidRole: (name: string, role: RoleKey) => `${name}: ${en.outsideWord[role].toLowerCase()}.`,
  saidToggle: (name: string, removed: boolean) => `${name} ${removed ? "removed" : "added"}.`,
  saidLoaded: (title: string) => `${title} loaded.`,
  saidCleared: "Cleared.",

  // The panel
  crossed: "A combined poll group spans different roles and cannot be divided from the source. ",
  notReported: (names: string[]) => `${names.join(", ")} not reported separately. `,
  accounted: (n: string) => `Accounted for: ${n} of 120 seats.`,
  needed: (names: string[]) => `If any one of ${names.join(", ")} votes against rather than for, this first vote no longer passes.`,
  outsideHead: "Partners outside the cabinet",
  outsideNote: "Tap a list to switch it between against, outside support and abstaining.",
  listEmpty: "Tap a slip, or load a named arrangement above, to add a party.",
  confidenceSummary: "What the first vote does and does not show",
  approximate: "Poll averages can be fractional. These totals illustrate relative support; real MKs cast whole votes. This is not a forecast of their vote.",
  confidenceNote: "Outside support here concerns the initial vote; it promises no ministers or future budget support. Cabinet refusals do not prove a party will refuse outside support or abstention. Replacing an existing government through constructive no-confidence requires 61 MKs to support an alternative government.",
  lawLinks: [
    { href: "https://main.knesset.gov.il/EN/activity/Documents/BasicLawsPDF/BasicLawTheGovernment.pdf", text: "Basic Law: Government §§13(d), 28" },
    { href: "https://main.knesset.gov.il/EN/activity/documents/BasicLawsPDF/BasicLawTheKnesset.pdf", text: "Knesset §25" },
    { href: "https://en.idi.org.il/articles/28888", text: "IDI explanation" },
  ],
  copyLink: "Copy a link to this coalition",
  copied: "Copied",
  pledgeCallout: "Parties have made public pledges about partners. You can build any combination here; a yellow note means it goes against a recorded pledge, a grey one is a stated condition, not a refusal.",
  courtCallout: "The Central Elections Committee voted Sept 23 to bar the Joint List and Ra'am. The Supreme Court heard the appeals Oct 1 and reinstated both lists 9–0 on Oct 2.",
  exportLink: "Print or export this arrangement",

  /** A poll that reported some lists only together (lib/coalition tally). */
  groupSplit: (pollster: string, group: string[], seats: number, note: string) => `${pollster} did not split ${group.join(" and ")}. With both in, the total counts their combined ${seats} seats (${note}).`,
  groupPartial: (pollster: string, missing: string[], group: string[], seats: number) => `${pollster} did not report ${missing.join(" and ")} separately, so this total leaves out ${missing.join(" and ")}'s seats. Add both ${group.join(" and ")} to count their combined ${seats}.`,

  // The note under the builder
  noteResults: (phrase: string) => `Seats are **${phrase}**. `,
  noteSnapshot: (captured: string, updated: string | null) => `Snapshot captured ${captured}. Source update time: ${updated ?? "not supplied by source"}. `,
  noteAverage: (n: number, polls: string) => `Seats are the **polling average** of the latest ${n} polls, one per pollster (${polls}), scaled to 120, so they can be fractional. `,
  noteMethod: "Average method",
  notePoll: (label: string, date: string) => `Seats are from **${label}, published ${date}**. `,
  noteByBloc: "By bloc: ",
  noteLumped: (names: string[]) => ` ${names.join(" and ")} were not reported separately.`,


  // Can they govern together?
  govHead: "Can they govern together?",
  govEmpty: "Add a second party to see where they agree and where they split.",
  govHint: "Questions",
  govWithSupport: "These rows include cabinet parties and hypothetical outside supporters. Abstainers are not treated as policy partners.",
  govUnstated: (name: string) => `Not said publicly: ${name}`,
  govThin: (n: number, labels: string[]) => `Not enough answers (${n}): ${labels.join("; ")}.`,
  govUnsorted: (labels: string[]) => `Priorities that can coexist, not compared: ${labels.join("; ")}.`,
  govNote: "Selected policy questions, not a stability forecast. Questions are not equally important and differences may be negotiable. A faded square is a position the party holds but has not said publicly.",
  govDep: (text: string) => `61-seat backing: ${text}`,
  govCompare: "Compare these parties in their own words",
  /** The governing summary (lib/coalition-governing governingSummary). */
  govSummaryNone: (total: number) => `None of the ${total} questions has an answer from every one of these parties.`,
  govSummary: (comparable: number, total: number, agree: number, differ: number) => {
    const what = !differ ? `agree on ${agree === comparable && comparable > 1 ? "all " : ""}${agree}` : !agree ? `differ on ${differ === comparable && comparable > 1 ? "all " : ""}${differ}` : `agree on ${agree} and differ on ${differ}`;
    return `On the ${comparable} of ${total} questions with answers from every party, they ${what}.`;
  },
  /** One row's reading (lib/coalition-governing rowText). `label` is the stance as written in the data. */
  rowSame: (selected: number, label: string) => `Same answer from all ${selected}: ${lowerFirst(label)}.`,
  rowDifferent: (n: number) => `${n} different answers.`,
  rowSome: (answered: number, selected: number, same: string | null, missing: string[]) => `${answered} of ${selected} answered, ${same != null ? `the same way: ${lowerFirst(same)}` : "differently"}. No answer: ${missing.join(", ")}.`,
  /** How much a majority depends on each partner (lib/cohesion dependenceText). */
  depAll: (n: number, majority: number) => `A majority that needs every one of its ${COUNT[n] ?? n} parties: lose any one and it falls under ${majority}.`,
  depNone: (majority: number) => `Holds ${majority} without any one of these parties.`,
  depSome: (majority: number, spare: string[]) => `Holds ${majority} without ${orList(spare)}; needs each of the others.`,

  // The party drawer
  lettersTitle: (letters: string) => `Ballot letters: ${letters}`,
  openProfile: "Open the full profile",
  leader: "Leader",
  seatsAverage: "Seats, polling average",
  noPollFigures: "No poll figures",
  seatsAllBelow: (n: number) => `Below the threshold in all ${n} polls that reported it`,
  seatsNear: (k: number, n: number, passing: string) => `Below: passes in ${k} of ${n} polls, ${passing} seats where it passes`,
  seatsPasses: (text: string, k: number, n: number) => `${text}, scaled to 120 seats; passes in ${k} of ${n} polls`,
  whoTheyAre: "Who they are",
  coalitionPledges: "Coalition pledges",
  profileMore: (name: string) => `has where ${name} stands on each issue, its seats in every poll, the names on its list, bios and sources.`,
  profileLead: "The ",
  fullProfile: "full profile",

  // The threshold what-if
  whatIfLabel: "Threshold what-if",
  whatIfTry: "Try it.",
  whatIfCaption: (polls: string, threshold: number) => ` Set each list near the threshold to pass or fail and watch where the seats go. Arithmetic from ${polls}, not a prediction: each list's share is its average seats over 120, and a list set to pass sits exactly at ${threshold}%.`,
  whatIfAverage: (seats: number) => `${seats} in the average`,
  whatIfBelowAll: "below in every poll",
  whatIfToggle: (name: string) => `${name}: passes or fails the threshold`,
  passes: "Passes",
  fails: "Fails",
  whatIfGrid: (blocs: string) => `Seats by bloc: ${blocs}`,
  whatIfWasted: "Votes that elect no one: ",
  whatIfWastedOf: " of the valid vote",
  whatIfCastFor: (names: string[]) => `, cast for ${names.join(", ")}.`,

  /** The seven comparison rows' own labels (lib/compare AXES), for issues the questions file does not label. */
  axes: { draft: "Haredi draft", courts: "Courts and the judicial overhaul", war: "The October 7 inquiry", wb: "West Bank and annexation", relig: "Religion and state", econ: "Cost of living and the economy", pstate: "A Palestinian state" } as Record<string, string>,

  /**
   * The page's sources, after the poll list (components/Sources) and before the profile lines. `head` is bold; `text`
   * follows it. `{letters}` and `{threshold}` take the results config's source lines.
   */
  sources: [
    { head: "Blue and White", text: " below threshold in all polls; Gantz will drop out in the last week if not crossing: Times of Israel, Sep 20, 2026." },
    { head: "Pledges.", text: " Recorded pledges to govern without Arab parties: Haaretz, Oct 1, 2026 (headline). B'Yachad “only rely on Zionist parties”: Times of Israel, Apr 26, 2026; no Arab or Haredi parties: Times of Israel, May 27, 2026. Joint List won't join Netanyahu: Times of Israel, Aug 19, 2026. Eisenkot on Ra'am (“he won't be part of my next government”): Times of Israel, Sep 26, 2026. Liberman, “not for the Arab parties and not for the haredi parties”: Jerusalem Post, Sep 21, 2025, repeated Oct 3, 2026. UTJ condition (Yaakov Asher): Matzav, Sep 28, 2026." },
    { head: "Surplus-vote agreements.", text: " Yashar–Democrats and B'Yachad–Yisrael Beiteinu signed Sep 10, 2026 (Times of Israel). Likud–Religious Zionism agreed Sep 8 (Israel Hayom), reported unsigned Sep 15 (Channel 14); final status not found. Joint List–Ra'am: Ynet, Sep 11, and Jerusalem Post, Sep 13, 2026. Shas–UTJ “expected”: Jerusalem Post, Sep 10, 2026; signing not found. Otzma, People of Israel and Reservists: no partner found (an IPF listing of Reservists with Yisrael Beiteinu is unconfirmed, since Yisrael Beiteinu signed with B'Yachad)." },
    { head: "Lists.", text: " UTJ order (Asher 1, Goldknopf 2, Porush 4): Davar and Israel Hayom, Sep 8, 2026. Ra'am no. 2 Yoav Segalovitz: Jerusalem Post and Times of Israel, Aug 31, 2026. B'Yachad (Yesh Atid runs inside the list, Lapid no. 2): Times of Israel, Sep 6, 2026; deal signed Apr 25–26, 2026 (Jerusalem Post)." },
    { head: "Disqualification and court ruling:", text: " Central Elections Committee vote Sep 23, 2026 (Times of Israel); Supreme Court ruling Oct 2, 2026, hearing Oct 1 (Jerusalem Post; Al Jazeera, Oct 2, 2026)." },
    { head: "Bloc labels and leaders:", text: " Israel Policy Forum 120 Project, updated Sep 24, 2026; Jerusalem Post Sep 7, 2026; Times of Israel Aug 19 and Sep 6, 2026. Reservists–Economic's bloc is disputed (IsraelEd: would join Netanyahu; IPF: “third bloc”; ToI: non-aligned), so it is shown between the blocs." },
    { head: "Ballot letters:", text: " {letters}" },
  ],
  sourcesAfter: [
    { head: "61-seat majority:", text: " Israel Democracy Institute, Apr 15, 2026." },
    { head: "Electoral threshold:", text: " {threshold}" },
  ],

  // The page
  presetLabel: "the outgoing government",
  description: "Build a hypothetical governing arrangement: distinguish a 61-seat majority from cabinet membership, outside support and the initial confidence vote.",
};

/** Lowercases a stance label's first letter for the middle of a sentence, unless it starts an acronym. */
function lowerFirst(s: string): string {
  return s.length > 1 && s[1] === s[1].toLowerCase() ? s[0].toLowerCase() + s.slice(1) : s;
}



const builder = {
  en,
  /** Loaded on Hebrew pages only (lib/i18n/he/register.ts). */
  get he(): BuilderText {
    return heText<BuilderText>("builder");
  },
};
export default builder;
export type BuilderText = typeof en;
