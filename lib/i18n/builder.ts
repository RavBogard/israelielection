/**
 * The Coalition Builder's words in both editions (/coalition-builder and /he/coalition-builder): the poll picker,
 * the slips, the two-row meter and its verdict, pledge notes, the outside-support chips, Paths to 61, the
 * governing summary, the party drawer, the threshold what-if and the page's sources.
 * The Hebrew is written fresh in Israeli political-media Hebrew (docs/planning/2026-10-06-hebrew/STYLE.md), doing
 * each English element's job, for Daniel's review in this one file. `he` is typed as `typeof en`, so both editions
 * always carry the same keys and template signatures.
 * `**x**` marks bold inside a sentence (components/coalition/Rich.tsx renders it).
 */
import { list, plural } from "./he-grammar";

/** Party names joined as the English sentences join them: "A and B", "A, B or C". */
const orList = (names: string[]) => (names.length === 1 ? names[0] : names.length === 2 ? `${names[0]} or ${names[1]}` : `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`);
const COUNT = ["none", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const heCount = (n: number, one: string, two: string, other: string) => plural(n, { one, two, other });

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
  saidPath: (cabinet: string[], support: string[]) => `Loaded ${cabinet.join(", ")}${support.length ? ` with outside support from ${support.join(", ")}` : ""}.`,
  saidCleared: "Cleared.",

  // The panel
  crossed: "A combined poll group spans different roles and cannot be divided from the source. ",
  notReported: (names: string[]) => `${names.join(", ")} not reported separately. `,
  accounted: (n: string) => `Accounted for: ${n} of 120 seats.`,
  needed: (names: string[]) => `If any one of ${names.join(", ")} votes against rather than for, this first vote no longer passes.`,
  outsideHead: "Partners outside the cabinet",
  outsideNote: "Tap a list to switch it between against, outside support and abstaining.",
  listEmpty: "Tap a slip, or a path above, to add a party.",
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

  // Paths to 61
  pathsHead: (majority: number) => `Paths to ${majority}`,
  pathsWays: (n: number) => `${n} ways`,
  pathsLead: (majority: number, poll: string) => `Every smallest set of lists that reaches ${majority} in ${poll}. Tap one to load it.`,
  likudGroup: "Likud in the path",
  withLikud: "With Likud",
  withoutLikud: "Without Likud",
  nPaths: (n: number) => `${n} paths`,
  conflictGroup: "Pledge conflicts",
  everyPath: "Every path",
  noConflict: "No pledge conflict",
  noneClear: (likud: boolean) => `No path ${likud ? "with" : "without"} Likud here is clear of every recorded pledge.`,
  withConflict: (n: number) => `${n} with a recorded pledge conflict`,
  noPath: (likud: boolean, majority: number, clean: boolean) => `No path ${likud ? "with" : "without"} Likud reaches ${majority} here${clean ? " without a pledge conflict" : ""}.`,
  showMore: (n: number) => `Show ${n} more`,
  showing: (n: number, of: number) => `Showing ${n} of ${of}`,
  pathSeats: "seats",
  pathConflicts: (n: number, names: string[]) => `${n} pledge conflict${n > 1 ? "s" : ""}, naming ${names.join(", ")}`,
  pathClear: "No pledge conflict on record",
  keyMajority: (majority: number) => `${majority}, a majority`,
  keyNotch: "Notched corner: a list named in a recorded pledge conflict",
  pathsMethod: (majority: number) => `Drop any one list from a path and it falls short of ${majority}. Paths that break no recorded pledge come first; then fewest lists, then most seats. This is seat arithmetic checked against the pledges on record, not a forecast; Likud in a cabinet is read as led by Netanyahu.`,
  supportHead: "With outside support",
  supportHint: (n: number, likud: boolean) => `${n} ${likud ? "with" : "without"} Likud`,
  supportNote: "Paths above with a pledge conflict, rearranged: the fewest seats move from the cabinet to outside support so the arrangement clears every recorded pledge, and the first vote counts the same seats for. The pledges against keeping Netanyahu in office, and Bennett’s not to rely on Arab or Haredi parties, cover outside support as well as a cabinet seat, so they count here too. A pledge not to join a cabinet is not a promise of outside support; this is arithmetic, not a forecast.",
  supportNames: (cabinet: string[], support: string[]) => `${cabinet.join(", ")}; outside support: ${support.join(", ")}`,
  supportFor: "for",
  supportSplit: (cab: string, sup: string) => `Cabinet ${cab}, outside support ${sup}`,

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

const seatsHeN = (n: string) => (n === "1" ? "מנדט אחד" : `${n} מנדטים`);
const heLikud = (likud: boolean) => (likud ? "עם הליכוד" : "בלי הליכוד");

const he: typeof en = {
  title: "מרכיבים קואליציה",
  standfirst: (majority, knesset) => `לחצו על פתק כדי לצרף מפלגה לקואליציה. רוב בכנסת: **${majority}** מתוך ${knesset} מנדטים.`,
  pickLabel: "המנדטים לפי",
  pickAverage: (n) => `ממוצע הסקרים (${n} סקרים)`,
  pickCount: (stale) => (stale ? "ספירה שמורה, לא עדכנית" : "הספירה עד כה"),
  skip: "דילוג לתוצאה",
  countPhrase: (stale) => (stale ? "הספירה השמורה (לא עדכנית)" : "הספירה עד כה"),
  averagePhrase: (n) => `ממוצע הסקרים (${n} סקרים)`,
  averageSource: (n) => `ממוצע ${n} הסקרים`,
  pollWithDate: (label, date) => `${label}, ${date}`,

  seatNA: "אין נתון",
  seatBelow: "מתחת",
  seatSmall: { na: "לא דווחה בנפרד", below: "לאחוז החסימה", seats: "מנדטים" },
  profile: "פרופיל",
  profileLabel: (name) => `פרופיל: ${name}`,
  tipNA: (_pollster, name, src) => `${name}: לא דווחה בנפרד (${src})`,
  tipBelow: (src) => `מתחת לאחוז החסימה (${src})`,
  tipSeats: (seats, src) => `${seatsHeN(seats)} (${src})`,
  tipConflict: (tip) => `${tip}. נוגדת פסילה שהוצהרה בקואליציה הזו`,
  pledgeMark: "פסילה",
  roleFor: (name) => `התפקיד של ${name}`,
  roles: { cabinet: "בקואליציה", support: "תמיכה מבחוץ", opposition: "באופוזיציה", abstain: "נמנעת (השערה)" },
  outsideWord: { opposition: "נגד", support: "תמיכה מבחוץ", abstain: "נמנעת", cabinet: "בקואליציה" },
  close: "סגירה",

  warnCondition: "תנאי מוצהר",
  warnPledge: "נוגד פסילה",

  scenariosLabel: "תרחישים מוכנים",
  scenariosLead: "או בחרו תרחיש מוכן",
  startOver: "התחלה מחדש",
  thenNow: (label, names, seats, year, now, poll) => `${label} (${names}) נשענה ב-${year} על **${seats}** מנדטים; למפלגות שלה יש היום **${now}** לפי ${poll}.`,
  scenarioChecked: (date) => `. המחקר נבדק ב-${date}. המקור של כל פסילה מופיע לצידה.`,

  noParties: "עדיין לא נבחרו מפלגות",
  viewArrangement: "לתמונה המלאה",
  listsByBloc: "הרשימות לפי גושים",
  yourCoalition: "הקואליציה שהרכבתם",
  verdict: { majority: "יש רוב", passes: "עוברת", fails: "לא עוברת", none: "אין הכרעה" },
  cabinetRow: "הקואליציה",
  voteRow: "הצבעת האמון",
  cabMajority: (n, partial) => `${partial ? "לפחות " : ""}${n}: רוב גם בלי תמיכה מבחוץ`,
  cabShort: (n, partial, short, majority) => `${partial ? "לפחות " : ""}${n}: ${short === "1" ? `חסר מנדט אחד ל-${majority}` : `חסרים ${short} מנדטים ל-${majority}`}`,
  voteLine: (yes, no, abstain) => `בעד ${yes}, נגד ${no}${abstain ? `, נמנעים ${abstain}` : ""}`,
  cabLabel: (cab, majority, knesset) => `הקואליציה: ${cab || "עדיין אין מפלגות"}. רוב: ${majority} מתוך ${knesset}.`,
  voteWithSupport: (cab, support) => `${cab} + ${support} בתמיכה מבחוץ`,
  voteAbstaining: (n) => `נמנעים: ${n}`,
  voteCabinetOnly: "הקואליציה בלבד",
  voteLabelEmpty: "הצבעת האמון: עדיין אין מפלגות.",
  voteLabel: (line, verdict) => `הצבעת האמון: ${line}. ${verdict}.`,
  segAbstain: (n) => `נמנעים: ${n}`,
  segAgainst: (n) => `נגד: ${n}`,
  keyCabinet: "בקואליציה",
  keyHatched: "מקווקו: תמיכה מבחוץ, בלי לשבת בממשלה",
  keyAbstains: "נמנעות",
  keyAgainst: "נגד",

  statusEmpty: "עדיין לא נבחרו מפלגות.",
  statusCabinet: (n) => `בקואליציה ${n}.`,
  statusMajority: (yes) => `יש רוב, ${yes} בעד`,
  statusNoVerdict: "הצבעת האמון: אין הכרעה",
  statusVote: (verdict, yes) => `הצבעת האמון: ${he.verdict[verdict]}, ${yes} בעד`,
  statusConflicts: (n) => (n ? `${heCount(n, "פסילה אחת", "שתי פסילות", `${n} פסילות`)}.` : "אין פסילות."),
  saidRole: (name, role) => `${name}: ${he.outsideWord[role]}.`,
  saidToggle: (name, removed) => `${name} ${removed ? "הוסרה" : "נוספה"}.`,
  saidLoaded: (title) => `נטען: ${title}.`,
  saidPath: (cabinet, support) => `נטענו: ${list(cabinet)}${support.length ? `, בתמיכה מבחוץ של ${list(support)}` : ""}.`,
  saidCleared: "הבחירה נוקתה.",

  crossed: "הסקר דיווח על כמה מפלגות יחד, והן מחולקות כאן בין תפקידים שונים: לפי המקור אי אפשר לפצל ביניהן. ",
  notReported: (names) => `${list(names)}: לא דווחו בנפרד. `,
  accounted: (n) => `נספרו ${n} מתוך 120 מנדטים.`,
  needed: (names) => `די שאחת מאלה תצביע נגד במקום בעד, והממשלה לא עוברת בהצבעת האמון: ${list(names)}.`,
  outsideHead: "שותפות מחוץ לממשלה",
  outsideNote: "לחצו על רשימה כדי להעביר אותה בין נגד, תמיכה מבחוץ והימנעות.",
  listEmpty: "לחצו על פתק, או על אחת הדרכים למעלה, כדי להוסיף מפלגה.",
  confidenceSummary: "מה הצבעת האמון מראה, ומה לא",
  approximate: "ממוצע הסקרים אינו במספרים שלמים, ולכן הסכומים כאן ממחישים יחסי כוחות בלבד: במליאה כל ח\"כ מצביע בקול אחד. זו לא תחזית להצבעה.",
  confidenceNote: "תמיכה מבחוץ נוגעת כאן להצבעת האמון בלבד: היא לא מבטיחה תיקים ולא תמיכה בתקציב בהמשך. מפלגה שפסלה ישיבה בממשלה לא בהכרח תסרב לתמוך מבחוץ או להימנע. כדי להחליף ממשלה מכהנת בהצבעת אי-אמון קונסטרוקטיבית, צריך 61 ח\"כים שתומכים בממשלה חלופית.",
  lawLinks: [
    { href: "https://main.knesset.gov.il/EN/activity/Documents/BasicLawsPDF/BasicLawTheGovernment.pdf", text: "חוק-יסוד: הממשלה, סעיפים 13(ד) ו-28 (באנגלית)" },
    { href: "https://main.knesset.gov.il/EN/activity/documents/BasicLawsPDF/BasicLawTheKnesset.pdf", text: "חוק-יסוד: הכנסת, סעיף 25 (באנגלית)" },
    { href: "https://en.idi.org.il/articles/28888", text: "הסבר של המכון הישראלי לדמוקרטיה (באנגלית)" },
  ],
  copyLink: "העתקת קישור לקואליציה הזו",
  copied: "הקישור הועתק",
  pledgeCallout: "מפלגות הצהירו בפומבי עם מי ישבו ועם מי לא. כאן אפשר להרכיב כל צירוף: הערה צהובה מסמנת שהוא נוגד פסילה שהוצהרה, הערה אפורה מסמנת תנאי מוצהר, לא פסילה.",
  courtCallout: "ועדת הבחירות המרכזית החליטה ב-23 בספטמבר לפסול את הרשימה המשותפת ואת רע\"ם. בית המשפט העליון דן בערעורים ב-1 באוקטובר, ולמחרת ביטל את הפסילה של שתי הרשימות פה אחד, בהרכב של תשעה שופטים.",
  exportLink: "הדפסה או ייצוא של ההרכב (באנגלית)",

  groupSplit: (pollster, group, seats) => `סקר ${pollster} לא הפריד בין ${list(group)}. כששתיהן בקואליציה, נספרים ${seats} המנדטים המשותפים שלהן.`,
  groupPartial: (pollster, missing, group, seats) => `סקר ${pollster} לא דיווח בנפרד על ${list(missing)}, ולכן הסכום לא כולל את המנדטים שלה. הוסיפו את ${list(group)} כדי לספור את ${seats} המנדטים המשותפים שלהן.`,
  noteResults: (phrase) => `המנדטים לפי **${phrase}**. `,
  noteSnapshot: (captured, updated) => `צילום מצב: ${captured}. עדכון אחרון במקור: ${updated ?? "המקור לא ציין"}. `,
  noteAverage: (n, polls) => `המנדטים לפי **ממוצע הסקרים**: ${n} הסקרים האחרונים, אחד מכל מכון (${polls}), בהתאמה ל-120 מנדטים, ולכן לא במספרים שלמים. `,
  noteMethod: "איך חישבנו",
  notePoll: (label, date) => `המנדטים לפי **${label}, ${date}**. `,
  noteByBloc: "לפי גושים: ",
  noteLumped: (names) => ` ${list(names)} לא דווחו בנפרד.`,

  pathsHead: (majority) => `איך מגיעים ל-${majority}`,
  pathsWays: (n) => heCount(n, "דרך אחת", "שתי דרכים", `${n} דרכים`),
  pathsLead: (majority, poll) => `כל הצירופים הקטנים ביותר של רשימות שמגיעים ל-${majority}, לפי ${poll}. לחצו על צירוף כדי לטעון אותו.`,
  likudGroup: "עם הליכוד או בלעדיו",
  withLikud: "עם הליכוד",
  withoutLikud: "בלי הליכוד",
  nPaths: (n) => heCount(n, "דרך אחת", "שתי דרכים", `${n} דרכים`),
  conflictGroup: "פסילות",
  everyPath: "כל הדרכים",
  noConflict: "בלי פסילות",
  noneClear: (likud) => `אין כאן דרך ${heLikud(likud)} שלא נתקלת באף פסילה.`,
  withConflict: (n) => heCount(n, "דרך אחת נתקלת בפסילה", "שתי דרכים נתקלות בפסילה", `${n} דרכים נתקלות בפסילה`),
  noPath: (likud, majority, clean) => `אין כאן דרך ${heLikud(likud)} שמגיעה ל-${majority}${clean ? " בלי פסילות" : ""}.`,
  showMore: (n) => `עוד ${n}`,
  showing: (n, of) => `מוצגות ${n} מתוך ${of}`,
  pathSeats: "מנדטים",
  pathConflicts: (n, names) => `${heCount(n, "פסילה אחת", "שתי פסילות", `${n} פסילות`)}: ${list(names)}`,
  pathClear: "אין פסילה ידועה",
  keyMajority: (majority) => `${majority}: רוב`,
  keyNotch: "פינה חתוכה: רשימה שנוגעת בפסילה",
  pathsMethod: (majority) => `בלי כל אחת מהרשימות בצירוף, הוא כבר לא מגיע ל-${majority}. קודם מוצגות הדרכים שלא נתקלות באף פסילה, אחר כך אלה עם הכי מעט רשימות, ואז אלה עם הכי הרבה מנדטים. זה חשבון מנדטים מול הפסילות הידועות, לא תחזית. ליכוד בקואליציה נקרא כאן ליכוד בראשות נתניהו.`,
  supportHead: "בתמיכה מבחוץ",
  supportHint: (n, likud) => `${n} ${heLikud(likud)}`,
  supportNote: "הדרכים שלמעלה שנתקלות בפסילה, בסידור אחר: מעבירים מהקואליציה לתמיכה מבחוץ את המנדטים המעטים ככל האפשר, כך שההרכב לא נוגד אף פסילה, ובהצבעת האמון נספרים אותם מנדטים בעד. הפסילות שנועדו למנוע מנתניהו להמשיך בתפקיד, וההתחייבות של בנט לא להישען על מפלגות ערביות או חרדיות, חלות גם על תמיכה מבחוץ ולא רק על ישיבה בממשלה, ולכן הן נספרות גם כאן. מפלגה שפסלה ישיבה בממשלה לא הבטיחה לתמוך מבחוץ: זה חשבון, לא תחזית.",
  supportNames: (cabinet, support) => `${cabinet.join(", ")}; תמיכה מבחוץ: ${support.join(", ")}`,
  supportFor: "בעד",
  supportSplit: (cab, sup) => `בקואליציה ${cab}, בתמיכה מבחוץ ${sup}`,

  govHead: "האם יוכלו לשבת יחד?",
  govEmpty: "הוסיפו מפלגה שנייה כדי לראות על מה הן מסכימות ועל מה הן חלוקות.",
  govHint: "השאלות",
  govWithSupport: "השורות כוללות את מפלגות הקואליציה ואת התומכות מבחוץ (בהשערה). הנמנעות לא נחשבות כאן לשותפות למדיניות.",
  govUnstated: (name) => `עמדה משתמעת: ${name}`,
  govThin: (n, labels) => `אין מספיק תשובות (${n}): ${labels.join("; ")}.`,
  govUnsorted: (labels) => `סדרי עדיפויות שיכולים לדור יחד, ולכן לא הושוו: ${labels.join("; ")}.`,
  govNote: "שאלות מדיניות נבחרות, לא תחזית ליציבות הממשלה. לא כל השאלות שקולות, ועל חלק מהפערים אפשר להתפשר. ריבוע דהוי: עמדה משתמעת, שהמפלגה לא הצהירה עליה בפומבי.",
  govDep: (text) => `הרוב של 61: ${text}`,
  govCompare: "השוו את המפלגות האלה במילים שלהן",
  govSummaryNone: (total) => `על אף אחת מ-${total} השאלות אין תשובה מכל המפלגות האלה.`,
  govSummary: (comparable, total, agree, differ) => {
    const all = agree === comparable ? "מסכימות" : differ === comparable ? "חלוקות" : null;
    const n = (k: number) => heCount(k, "באחת", "בשתיים", `ב-${k}`);
    if (comparable === 1) return `על שאלה אחת מתוך ${total} יש תשובה מכל המפלגות, והן ${all === "מסכימות" ? "מסכימות עליה" : "חלוקות בה"}.`;
    const what = all ? `הן ${all} בכולן` : `הן מסכימות ${n(agree)} וחלוקות ${n(differ)}`;
    return `על ${comparable} מתוך ${total} השאלות יש תשובה מכל המפלגות: ${what}.`;
  },
  rowSame: (selected, label) => `${selected === 2 ? "שתיהן" : `כל ה-${selected}`} באותה תשובה: ${label}.`,
  rowDifferent: (n) => heCount(n, "תשובה אחת", "שתי תשובות שונות", `${n} תשובות שונות`) + ".",
  rowSome: (answered, selected, same, missing) => `ענו ${answered} מתוך ${selected}, ${same != null ? `כולן באותה תשובה: ${same}` : "בתשובות שונות"}. לא ענו: ${list(missing)}.`,
  depAll: (n, majority) => `רוב שתלוי ${n === 2 ? "בשתי המפלגות שבו" : `בכל ${n} המפלגות שבו`}: בלי כל אחת מהן הוא יורד מתחת ל-${majority}.`,
  depNone: (majority) => `נשאר עם ${majority} גם בלי כל אחת מהמפלגות האלה.`,
  depSome: (majority, spare) => `נשאר עם ${majority} גם בלי ${list(spare, "or")}, אבל זקוק לכל אחת מהאחרות.`,

  lettersTitle: (letters) => `אותיות הפתק: ${letters}`,
  openProfile: "לפרופיל המלא",
  leader: "בראשות",
  seatsAverage: "מנדטים, ממוצע הסקרים",
  noPollFigures: "אין נתוני סקרים",
  seatsAllBelow: (n) => `מתחת לאחוז החסימה בכל ${n} הסקרים שדיווחו עליה`,
  seatsNear: (k, n, passing) => `מתחת לאחוז החסימה: עוברת ב-${k} מתוך ${n} הסקרים, עם ${passing} מנדטים בממוצע כשהיא עוברת`,
  seatsPasses: (text, k, n) => `${text}, בהתאמה ל-120 מנדטים; עוברת את אחוז החסימה ב-${k} מתוך ${n} הסקרים`,
  whoTheyAre: "על המפלגה",
  coalitionPledges: "התחייבויות קואליציוניות",
  profileMore: (name) => `העמדות של ${name} בכל נושא, המנדטים שלה בכל סקר, המועמדים ברשימה, ביוגרפיות ומקורות.`,
  profileLead: "",
  fullProfile: "בפרופיל המלא:",

  whatIfLabel: "מה אם: אחוז החסימה",
  whatIfTry: "נסו בעצמכם.",
  whatIfCaption: (polls, threshold) => ` קבעו לכל רשימה שקרובה לאחוז החסימה אם היא עוברת או לא, וראו לאן הולכים המנדטים. חשבון לפי ${polls}, לא תחזית: החלק של כל רשימה הוא ממוצע המנדטים שלה חלקי 120, ורשימה שעוברת עומדת בדיוק על ${threshold}%.`,
  whatIfAverage: (seats) => `${seats} בממוצע`,
  whatIfBelowAll: "מתחת לאחוז החסימה בכל הסקרים",
  whatIfToggle: (name) => `${name}: עוברת את אחוז החסימה או לא`,
  passes: "עוברת",
  fails: "לא עוברת",
  whatIfGrid: (blocs) => `מנדטים לפי גושים: ${blocs}`,
  whatIfWasted: "קולות שלא מתורגמים למנדטים: ",
  whatIfWastedOf: " מהקולות הכשרים",
  whatIfCastFor: (names) => `, של ${list(names)}.`,

  axes: { draft: "גיוס חרדים", courts: "מערכת המשפט", war: "ועדת חקירה לטבח 7 באוקטובר", wb: "יהודה ושומרון / הגדה המערבית: ריבונות וסיפוח", relig: "דת ומדינה", econ: "יוקר המחיה והכלכלה", pstate: "מדינה פלסטינית" },

  sources: [
    { head: `כחול לבן`, text: ` מתחת לאחוז החסימה בכל הסקרים; גנץ יפרוש בשבוע האחרון אם הרשימה לא תעבור את אחוז החסימה: טיימס אוף ישראל, 20 בספטמבר 2026.` },
    { head: `פסילות.`, text: ` התחייבויות להרכיב ממשלה בלי המפלגות הערביות: הארץ, 1 באוקטובר 2026 (כותרת). ביחד "תישען רק על מפלגות ציוניות": טיימס אוף ישראל, 26 באפריל 2026; בלי מפלגות ערביות או חרדיות: טיימס אוף ישראל, 27 במאי 2026. הרשימה המשותפת לא תצטרף לנתניהו: טיימס אוף ישראל, 19 באוגוסט 2026. איזנקוט על רע"ם ("הוא לא יהיה חלק מהממשלה הבאה שלי"): טיימס אוף ישראל, 26 בספטמבר 2026. ליברמן, "לא עם המפלגות הערביות ולא עם המפלגות החרדיות": ג'רוזלם פוסט, 21 בספטמבר 2025, וחזר על כך ב-3 באוקטובר 2026. התנאי של יהדות התורה (יעקב אשר): מצב, 28 בספטמבר 2026.` },
    { head: `הסכמי עודפים.`, text: ` ישר! והדמוקרטים, וביחד וישראל ביתנו, חתמו ב-10 בספטמבר 2026 (טיימס אוף ישראל). הליכוד והציונות הדתית הסכימו ב-8 בספטמבר (ישראל היום), ולפי דיווח מ-15 בספטמבר טרם חתמו (ערוץ 14); הסטטוס הסופי לא נמצא. הרשימה המשותפת ורע"ם: ynet, 11 בספטמבר, וג'רוזלם פוסט, 13 בספטמבר 2026. ש"ס ויהדות התורה "צפויות לחתום": ג'רוזלם פוסט, 10 בספטמבר 2026; חתימה לא נמצאה. עוצמה יהודית, עמך ישראל והמילואימניקים: לא נמצא שותף (רישום של IPF של המילואימניקים עם ישראל ביתנו לא אומת, כי ישראל ביתנו חתמה עם ביחד).` },
    { head: `הרשימות.`, text: ` סדר יהדות התורה (אשר 1, גולדקנופף 2, פרוש 4): דבר וישראל היום, 8 בספטמבר 2026. מס' 2 ברע"ם, יואב סגלוביץ: ג'רוזלם פוסט וטיימס אוף ישראל, 31 באוגוסט 2026. ביחד (יש עתיד רצה בתוך הרשימה, לפיד מס' 2): טיימס אוף ישראל, 6 בספטמבר 2026; ההסכם נחתם ב-25–26 באפריל 2026 (ג'רוזלם פוסט).` },
    { head: `הפסילה בוועדת הבחירות ופסק הדין:`, text: ` ההצבעה בוועדת הבחירות המרכזית, 23 בספטמבר 2026 (טיימס אוף ישראל); פסק הדין של בית המשפט העליון, 2 באוקטובר 2026, אחרי דיון ב-1 באוקטובר (ג'רוזלם פוסט; אל-ג'זירה, 2 באוקטובר 2026).` },
    { head: `שיוך לגושים וראשי הרשימות:`, text: ` פרויקט 120 של Israel Policy Forum, עודכן ב-24 בספטמבר 2026; ג'רוזלם פוסט, 7 בספטמבר 2026; טיימס אוף ישראל, 19 באוגוסט ו-6 בספטמבר 2026. השיוך של המילואימניקים והכלכלית שנוי במחלוקת (IsraelEd: תצטרף לנתניהו; IPF: "גוש שלישי"; טיימס אוף ישראל: לא משויכת), ולכן היא מוצגת מחוץ לגושים.` },
    { head: `אותיות הפתק:`, text: ` {letters}` },
  ],
  sourcesAfter: [
    { head: `רוב של 61:`, text: ` המכון הישראלי לדמוקרטיה, 15 באפריל 2026.` },
    { head: `אחוז החסימה:`, text: ` {threshold}` },
  ],

  presetLabel: "הממשלה היוצאת",
  description: "מרכיבים קואליציה אחרי הבחירות לכנסת ה-26: מה ההבדל בין רוב של 61, ישיבה בממשלה, תמיכה מבחוץ והצבעת האמון.",
};

const builder = { en, he };
export default builder;
export type BuilderText = typeof en;
