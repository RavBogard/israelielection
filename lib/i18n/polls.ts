/**
 * The polls desk's words in both editions (/polls and /he/polls): page head, tabs, the bloc race, house effects,
 * the lists and blocs charts, the trend charts, the poll browser, the sensitivity tool and the method tab.
 * The Hebrew is written fresh in Israeli data-desk Hebrew (docs/planning/2026-10-06-hebrew/STYLE.md), doing each
 * English element's job, not translating its sentences. Daniel reviews it here, in one place.
 * `he` is typed as `typeof en`, so both editions always carry the same keys and template signatures.
 * The generated findings that head each section are in lib/polls-desk.ts (English) and HE_FIND below (Hebrew).
 */
import { list, plural } from "./he-grammar";
import { heText } from "./he-text";

/** Isolates a left-to-right figure inside Hebrew text (a signed change, a range): LRI … PDI, the plain-text <bdi dir="ltr">. */
export const ltr = (s: string) => `⁦${s}⁩`;

const pollsHe = (n: number) => plural(n, { one: "סקר אחד", two: "שני סקרים", other: `${n} סקרים` });
const DAY_MONTH_HE = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", timeZone: "UTC" });
/** "6 בספטמבר": the prose date inside the campaign, year dropped (STYLE.md). */
export const dayMonthHe = (iso: string) => DAY_MONTH_HE.format(new Date(`${iso.slice(0, 10)}T12:00:00Z`));

const en = {
  meta: {
    title: "Polls",
    description: "Every Knesset seat poll of the 2026 campaign we track, the current average, and how each party has moved.",
  },
  title: "The Polls",
  tablist: "Polls desk",
  tabs: { parties: "Parties", pollsters: "Pollsters", "every-poll": "Every poll", method: "Method" },
  facts: { newest: "Newest poll: ", cite: "Cite this average", copied: "Copied", failed: "Copy failed." },
  browserTitle: (polls: number, pollsters: number, from: string) => `${polls} polls from ${pollsters} pollsters since ${from}`,
  loadingBrowser: "Loading the poll browser…",
  loadingSensitivity: "Loading the sensitivity tool…",
  fold: "Every list on its own chart",
  refLabel: (names: string[]) => `${names.join(" and ")} (averaged; left out only of the alternative average)`,
  foldNote: (yMax: number) =>
    `Dots are single polls; lines are the list's seats in the site's polling average on each publication date, scaled to 120 as above. Per-party zoom shows small changes, with a minimum four-seat span and enough range for every dot. The bounds are labeled: heights across zoomed panels do not compare party size. Switch to the shared 0–${yMax} scale to compare size. A reported threshold failure stays at zero; zero is not the 3.25% vote threshold. Gaps mean no separate average. Point, tap or use left/right arrow keys for dated values.`,

  /** Words shared by several charts. */
  common: {
    onePoll: "One poll",
    howToRead: "How to read this",
    or: (names: string[]) => names.join(" or "),
    and: (names: string[]) => names.join(" and "),
    below: "below",
    seats: " seats",
    of: (k: number, n: number) => `${k} of ${n}`,
    majorityIs61: "A majority is 61.",
    scrollable: (what: string) => `${what}, horizontally scrollable`,
  },

  race: {
    end: { net: "Netanyahu", opp: "Anti-Netanyahu" },
    reading: (label: string, avg: string, lo: number, hi: number) => `${label} ${avg} (current polls ${lo} to ${hi})`,
    readingTail: (n: number) => `${n} current ${n === 1 ? "poll" : "polls"}.`,
    aria: (net: string, opp: string, from: string, to: string, until: string, netV: string, oppV: string) =>
      `${net} and ${opp} in the site average from ${from} to ${to}, against the 61-seat majority, on an axis running to election day, ${until}. Latest: ${net} ${netV}, ${opp} ${oppV}. Left and right arrows step through dates.`,
    electionDay: "Election day",
    majority: "61, a majority",
    band: "Range of current polls",
    dot: (pollster: string, date: string, label: string, n: number) => `${pollster}, ${date}: ${label} ${n}`,
    keyLine: (label: string) => `${label}, site average`,
    keyRange: "Range of current polls, lowest to highest",
    note: "Lines are the site average, thin edges the range of the current polls, dots single polls.",
    how: (days: number, until: string) =>
      `On each date the line is the bloc's total in the site average then: each pollster's latest poll from the ${days} days up to then, each list averaged and scaled to 120 seats, the same figures the Coalition Builder starts from. The two thin edges run from the lowest to the highest bloc total among those polls. It is the spread of the polls, not a confidence interval or a forecast. Dots are each poll's own published totals. The axis runs in weeks to election day, ${until}; nothing is drawn for the weeks still to come.`,
    numbers: "The numbers",
    tableAria: "Bloc race data, horizontally scrollable",
    caption: "Bloc totals in the site average on each poll date, with the lowest and highest current poll",
    date: "Date",
    currentPolls: "Current polls",
    range: (label: string) => `${label} range`,
  },

  house: {
    caption: "Each pollster's average gap from the site average, in seats, for the two blocs",
    pollster: "Pollster",
    polls: "Polls",
    note: "Seats above or below the site average, averaged over each pollster's campaign polls.",
    how: (hollow: string[]) =>
      `For each poll: its own bloc total minus the site's bloc average on its publication date, an average that includes that poll; then the mean over the pollster's polls. Hollow bars are ${hollow.join(" and ")}. A pollster with one or two polls says little. A lean is a difference from the other pollsters, not proof of error: the site average is not the true figure.`,
    numbers: "The numbers: every poll's gap",
    tableAria: "Gap of every poll from the site average, horizontally scrollable",
    published: "Published",
  },

  now: {
    listsCaption: "Every list in every current poll",
    list: "List",
    seatsInEach: "Seats in each poll",
    seatsLabel: "Seats, polling average",
    range: "Range",
    passes: "Passes",
    passesIn: "Passes in",
    altLabel: "Alternative average",
    near: (avg: string) => `Near the threshold: ${avg} seats in the polls where it passes`,
    passesWithout: (k: number, n: number, who: string[]) => `Passes in ${k} of ${n} polls without ${who.join(" and ")}`,
    na: "n/a",
    belowThreshold: "below the threshold",
    dot: (pollster: string, date: string, below: boolean, seats: number) => `${pollster}, ${date}: ${below ? "below the threshold" : `${seats} seats`}`,
    srDot: (pollster: string, below: boolean, seats: number) => `${pollster} ${below ? "below the threshold" : seats}`,
    keyBar: "Seats, polling average, scaled to 120",
    keyThr: "Threshold: a list that passes wins at least 4 seats",
    listsSrc: (n: number) => `The latest poll from each of ${n} pollsters; averages scaled to 120 seats.`,
    listsHow: (rawSum: number) =>
      `Each list's average weights each poll by the square root of its sample size, over the polls where the list passed. Those averages add to ${rawSum}, so every one is scaled down in proportion to 120 seats, the figure every page of the site prints; the alternative average is scaled the same way. “Below” is a list that passes in fewer than half the polls, which counts 0. A point at zero is a poll that had the list below the threshold.`,
    blocsCaption: "The blocs in the average, out of 120 seats",
    stripRead: (at: number, n: number, lo: number, hi: number) => `${at === 0 ? `under 61 in all ${n} polls` : `61 or more in ${at} of ${n} polls`}, from ${lo} to ${hi}`,
    stripAria: (label: string, polls: string) => `${label} seats in each current poll: ${polls}. A majority is 61.`,
    stripDot: (pollster: string, date: string, seats: number) => `${pollster}, ${date}: ${seats}`,
    blocsSrc: (n: number, from: string, to: string, hollow: string[]) => `The latest poll from each of ${n} pollsters, ${from} to ${to}; hollow points are ${hollow.join(" and ")}. `,
    buildLink: "Build a coalition from these numbers",
    blocsHow:
      "Hollow points are the two pollsters the site's alternative average leaves out. Bloc totals in the average are the lists' averages scaled to 120 seats, the values the Coalition Builder starts from; each poll's totals are its own published figures. Lists that pass in fewer than half the polls count zero. ",
    methodLink: "How the average is made",
    siteAverage: "Site average",
    altCaption: (n: number) => `${n} polls; `,
  },

  comp: {
    pick: "Pick up to three lists",
    removed: (name: string) => `${name} removed.`,
    picked: (name: string, dropped?: string) => `${name} picked${dropped ? `; ${dropped} removed, three at most` : ""}.`,
    aria: (picked: string[], yMax: number) => `Polling average seats for every list in grey, with ${picked.length ? picked.join(", ") : "no list"} picked. Shared seat scale from 0 to ${yMax}. Left and right arrows step through dates.`,
    noAverage: "no separate average",
    noneReading: "no party picked",
    dot: (name: string, pollster: string, date: string, seats: number) => `${name}, ${pollster}, ${date}: ${seats} seats`,
    keyPicked: "Picked list, polling average",
    keyOther: "Every other list",
    note: (n: number, yMax: number) => `All ${n} separately tracked lists on the same 0–${yMax} seat scale; dots are single polls.`,
    how: "Each line is a list's seats in the site's polling average as it stood on each publication date, scaled to 120 as everywhere else on the site; below means it was below or near the threshold that day and counts 0. Dots are single polls. A gap means no poll reported the list separately. No smoothing or uncertainty band is added. Point at or tap the chart, or use the left and right arrow keys, to read a date; the picker shows each list's value on that date, and – means no separate average.",
    colorNote:
      "Related shades group the site's current political families; each list has its own color. These editorial groups do not establish a coalition agreement or a party's willingness to govern with another list.",
    numbers: "The numbers: every chart date and list",
    tableAria: "All-party running average data, horizontally scrollable",
    caption: "Seats, polling average, scaled to 120; below counts 0; – means no separate average.",
    date: "Date",
  },

  trends: {
    context: { start: "Start ", to: ") to latest ", change: "; change ", seats: " seats" },
    noAverage: "No separate polling average.",
    zoomed: (low: number, high: number) => `Zoomed for this party: ${low}–${high} seats${low > 0 ? ", axis does not start at zero" : ""}`,
    shared: (yMax: number) => `Shared scale: 0–${yMax} seats`,
    dateNote: "Some individual figures have an unrecorded date and are plotted at the register entry’s publication date. Their dated tooltips identify that limit; this is not a confirmed fieldwork date.",
    aria: (name: string, zoomed: boolean, low: number, high: number) => `${name}. ${zoomed ? "Zoomed" : "Shared"} scale ${low} to ${high} seats. Use left and right arrows for dated averages.`,
    dot: (pollster: string, date: string, uncertain: boolean, seats: number, ref: boolean) =>
      `${pollster}, ${uncertain ? `figure date not recorded (plotted at entry publication ${date})` : date}: ${seats} seats${seats === 0 ? " (below threshold; not 3.25% of seats)" : ""}${ref ? "; eligible for the default method, excluded only from the named alternative" : ""}`,
    noReading: "no separate average available",
    readingTail: (n: number) => `, ${n} separately reporting polls`,
    noReadings: "No readings",
    legend: "Individual chart scales",
    zoom: " Per-party zoom (different axes; compare change)",
    sharedRadio: (yMax: number) => ` Shared 0–${yMax} seats (compare size)`,
    keyPoll: " Individual poll",
    keyLine: " Seats, polling average",
  },

  browser: {
    from: "Published from",
    through: "Published through",
    publisher: "Publisher / pollster",
    all: "All publishers",
    apply: "Apply to link",
    clear: "Clear filters",
    require: (n: number) => `Require coverage of selected lists (${n})`,
    requireNote: "A combined group report counts as coverage here; it does not establish a separate total for one constituent.",
    status: (k: number, n: number) => `${k} of ${n} polls, newest first.`,
    badRange: " The start date is after the end date.",
    shown: (k: number, n: number) => `Lists shown (${k} of ${n})`,
    tableAria: "Poll results, horizontally scrollable",
    poll: "Poll",
    sample: "Sample",
    source: "Source",
    idAria: (pollster: string, exit: boolean, date: string) => `${pollster}${exit ? " exit poll" : ""}, ${date}: method and source`,
    exit: " exit",
    belowCell: "Below",
    undatedSup: "figure date not recorded",
    combined: (names: string) => `Combined with ${names}`,
    combinedSup: (names: string) => `combined with ${names}`,
    original: "Original report",
    none: "No polls match these filters. Clear them or widen the date range.",
    notReported: "not reported",
    notes: {
      a: "Select a poll for its method and source. Below means the list missed the 3.25% threshold in that poll; ",
      dash: "a dash",
      b: " means not reported. * marks seats a poll gave for several lists together, shown beside each of them and to be counted once.",
      undated: " † marks a list figure with no recorded date of its own: the row date is the entry’s publication date, not a verified date for that figure, and the date flag does not change the site’s inclusion rules.",
      grey: (names: string[]) => ` Grey rows are ${names.join(" and ")}, which only the alternative average leaves out.`,
    },
    src: { a: "Imported from ", link: "Wikipedia’s polling tables", b: ", retaining cited source reports. " },
    card: {
      published: "Published",
      fieldwork: "Fieldwork",
      listDates: "List-figure dates",
      undated: (names: string) => `Date not recorded for ${names}. The row’s publication date does not establish those figures’ dates.`,
      noUndated: "No list-specific date uncertainty is flagged in this entry.",
      firm: "Research firm",
      n: "Sample size",
      population: "Population sampled",
      mode: "Interview / sample mode",
      margin: "Reported margin",
      marginTail: "; not a seat-confidence interval",
      inclusion: "Average inclusion",
      exit: "Exit poll; never included in campaign averages",
      current: "In the current default average",
      older: "Older than its publisher's latest eligible poll, or outside the current window",
      variantOnly: "; excluded by the named-publisher alternative only",
      notRecorded: "Not recorded",
      noNote: "No additional method note is recorded.",
      unknown: "Unknown metadata is not inferred from a firm’s reputation. Missing sample size receives the median known sample size of the chosen pool for the site’s square-root weighting, or equal weight if none are known.",
      open: "Open the cited report",
      close: "Close method card",
    },
  },

  sens: {
    title: "What survives a different polling assumption?",
    intro: "Choose lists, compare their total in each current poll, then vary the inclusion and weighting rules. This describes the available polls; it does not estimate a chance of winning or a confidence interval.",
    preset: (bloc: string) => `${bloc} (reported lists)`,
    clearLists: "Clear lists",
    selected: (n: number) => `Selected lists (${n})`,
    window: "Window ending at the newest campaign poll",
    days: (d: number) => `${d} days`,
    weights: "Average weights",
    sqrt: "Square root of sample size (site default)",
    equal: "Equal poll weights (alternative)",
    restore: "Restore site method",
    copy: "Copy this view",
    copied: "View link copied, including the selected lists, polling assumptions and fictional threshold setting.",
    copyFailed: "Select and copy the view link below.",
    inclusion: (n: number) => `Publisher inclusion (${n} excluded)`,
    inclusionNote: "Include or exclude by a stated methodological choice, not because you dislike the result. One latest eligible campaign poll per publisher is used. Exits are excluded.",
    useAlt: (names: string[]) => `Use the alternative excluding ${names.join(" and ")}`,
    anchor: (date: string | null, n: number, days: number) =>
      `Publication window anchor: ${date ?? "no campaign poll available"}. ${n} included polls from ${days} days ending at that date. These are not necessarily separate research firms or independent samples.`,
    selectOne: "Select at least one list.",
    noPolls: "No current polls remain under these choices. Restore the site method or include a publisher.",
    majority: (k: number, n: number) => `${k} of ${n} complete polls`,
    // The English needs no count here; the Hebrew negates for zero.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    majorityTail: (_k: number): string => " show these lists reaching the 61-seat absolute-majority target.",
    observed: (lo: string, hi: string) => ` Their observed range is ${lo}–${hi} seats.`,
    incomplete: (n: number) => `${n} incomplete polls are excluded from this denominator.`,
    avgLead: (partial: boolean): string => (partial ? "The known subtotal of the" : "The"),
    avgMid: " normalized coalition average is ",
    avgSeats: (v: string) => `${v} seats`,
    noSeparate: (names: string) => ` No separate average for ${names}.`,
    method: "Method",
    tableAria: "Selected-list totals in current polls",
    thPoll: "Published / publisher",
    thSeats: "Selected-list seats",
    thCoverage: "Coverage and source",
    subtotal: (v: string) => `${v} known subtotal`,
    missing: (names: string) => `Not separately known: ${names}. `,
    complete: "Complete. ",
    combinedOnce: (groups: string) => `Combined once: ${groups}. `,
    cited: "Cited report",
    depsH: "Threshold and partner dependencies",
    depsNote: "Passing counts describe polls reporting the list separately. “Without” below simply removes this list’s modeled seats while holding the others fixed; it does not redistribute seats or simulate what other voters would do.",
    thList: "Selected list",
    thPasses: "Passes / reported",
    thMean: "Passing-poll mean",
    thNorm: "Normalized seats",
    thWithout: "Known subtotal without this list",
    passes: (k: number, n: number, near: boolean) => `${k} / ${n}${near ? ", fewer than half pass" : ""}`,
    notReported: "Not separately reported",
    unknown: "Unknown",
    loses: ", loses 61 target",
    inputs: "Every average input and its effective weight",
    inputsNote: (sum: string, scale: number) =>
      `Counted per-list means sum to ${sum} before normalization. ${scale < 1 ? `Scale factor ${scale.toFixed(4)} reduces that sum to 120 before rounding.` : "No scaling is applied because that sum is at most 120."} Tenths may not sum to exactly 120 after rounding. An average is computed only where a list passes; a list passing in fewer than half its separate reports counts zero in the coalition average.`,
    weightRow: (date: string, pollster: string, n: number | null, weight: string) => `${date}, ${pollster}: n ${n ?? "not recorded"}; effective weight ${weight}`,
    wEqual: " (equal)",
    wNone: " (no known sample sizes; equal fallback)",
    wMedian: (n: number) => ` (median n ${n} imputed)`,
    wSqrt: (n: number) => ` (√${n})`,
    source: "source",
    fiction: "A fictional threshold example: watch an arithmetic majority change",
    fictionIntro:
      "These are five invented lists and 100,000 hypothetical valid votes. A has 31%, B 19%, C 15%, E the share you choose, and D the remainder (35% minus E). The selected group is A+B. No surplus agreements are assumed. Nothing here is inferred from an Israeli seat poll or predicts voters.",
    fictionLabel: (v: string) => `Fictional list E: ${v}%`,
    fictionRead: (passed: boolean, seats: number) => `E ${passed ? "passes" : "fails"} 3.25%. A+B receives ${seats} of 120 seats, ${seats >= 61 ? "reaching" : "below"} the absolute-majority target.`,
    allocated: (s: string) => `Allocated seats: ${s}. A failed list gets no seats; its votes are not transferred. `,
    allocLink: "Read the allocation method",
    viewLink: "View link",
  },

  method: {
    h: "How the average is made",
  },
};


const polls = {
  en,
  /** Loaded on Hebrew pages only (lib/i18n/he/register.ts). */
  get he(): PollsText {
    return heText<PollsText>("polls");
  },
};
export default polls;
export type PollsText = typeof en;

/**
 * The method tab in Hebrew: written as an Israeli explainer of a poll average, in the first person plural
 * (STYLE.md: "אנחנו" only here). The English method tab stays as written in components/pages/PollsPage.tsx.
 */
export const HE_METHOD = {
  intake: (maxMove: number) =>
    `הסקרים נאספים פעמיים ביום מטבלאות הסקרים של ויקיפדיה, ונבדקים אוטומטית לפני שהם עולים לאתר: סך המנדטים חייב להיות 120, הגוף שפרסם את הסקר חייב להיות מוכר לנו, ואף מפלגה לא יכולה לזוז ביותר מ-${maxMove} מנדטים לעומת הסקר הקודם של אותו גוף.`,
  window: (days: number, to: string, n: number, polls: string) => `בממוצע נכנס הסקר האחרון של כל גוף מ-${days} הימים שעד ${to} (${pollsHe(n)}: ${polls}). `,
  sameIn: { a: "", builder: "מרכיבים קואליציה", mid: " ו", map: "מפת המפלגות (באנגלית)", b: " נשענים על אותם סקרים. " },
  inclusionRule: "כל גוף שמפרסם את גודל המדגם ואת שיטת הסקר נכנס לממוצע, כולל חדשות 14. גוף נכנס או נשאר בחוץ לפי מכון הסקרים והשיטה שלו, ולעולם לא לפי התוצאות.",
  average:
    "לכל רשימה אנחנו מחשבים ממוצע רק על הסקרים שבהם היא עברה את אחוז החסימה (3.25%), כך שרשימה שעוברת לא יורדת בממוצע מתחת ל-4 מנדטים. \"עוברת ב-3 מתוך 9\" פירושו: מתוך 9 הסקרים שמדדו את הרשימה, ב-3 היא עברה. רשימה שעוברת בפחות ממחצית הסקרים מסומנת כרשימה על סף אחוז החסימה, ולא נספרת בברירת המחדל של מרכיבים קואליציה. כל סקר מקבל משקל לפי השורש הריבועי של גודל המדגם, כך שסקר של 1,000 משיבים שוקל פי 1.4 בערך מסקר של 500; סקר שלא פרסם גודל מדגם מקבל את החציון של הסקרים שכן פרסמו.",
  scaling:
    "מכיוון שרשימות קטנות לפעמים עוברות ולפעמים לא, סכום הממוצעים יכול לעלות על 120. במקרה כזה אנחנו מקטינים את כל הרשימות באופן יחסי עד 120 מנדטים, כמו במרכיבים קואליציה, במפת המפלגות ובעמוד הראשי. כל מספר מנדטים בעמוד הזה, גם בקווי המגמה, הוא הממוצע המשוקלל והמותאם הזה, ולכן הוא לא מספר שלם. ",
  variantNote: "הממוצע החלופי הוא אותו ממוצע בלי הסקרים של החברות של שלמה פילבר: חדשות 14 (NEXT DATA) ו-i24NEWS (דיירקט פולס).",
  variantLabel: (names: string[]) => `בלי ${list(names)}`,
  undated: (names: string) =>
    `תאריכים לא ודאיים: במאגר יש נתונים של ${names} שלא נרשם להם תאריך משלהם. בגרפים ובחישובים הם מופיעים בתאריך הפרסום של הרשומה, שאינו תאריך מאומת לכל נתון. בכל הסקרים הם מסומנים ב-†, וכרטיס השיטה של כל סקר מסביר את ההבדל.`,
  sources: { a: "מקורות: ", wiki: "טבלאות הסקרים בוויקיפדיה האנגלית", b: " והדיווחים שכל סקר מפנה אליהם, בקישור מכל שורה ב", every: "כל הסקרים", c: "." },
};

/** "Netanyahu bloc" and the rest as Israeli media name them (STYLE.md, confirmed by Daniel 2026-10-06). Used when data/he has no bloc label. */
export const HE_BLOC = { net: "גוש נתניהו", opp: "גוש האופוזיציה", mid: "מחוץ לגושים", arab: "המפלגות הערביות" } as const;

/** The findings that head the Hebrew desk, filled by lib/polls-desk.ts from the same computations as the English. */
export const HE_FIND = {
  averageNone: "אף גוש אינו מגיע ל-61 בממוצע הסקרים.",
  averageBoth: "שני הגושים מגיעים ל-61 בממוצע, יותר ממה ש-120 המנדטים מאפשרים.",
  averageOne: (bloc: string) => `${bloc} מגיע ל-61 בממוצע הסקרים.`,
  /** "בכל 9 הסקרים", "ב-3 מתוך 9 הסקרים", "בסקר היחיד", "באף סקר". */
  inPolls: (k: number, n: number) => (k === 0 ? "באף סקר" : n === 1 ? "בסקר היחיד" : k === n ? `בכל ${n} הסקרים` : `ב-${k} מתוך ${n} הסקרים`),
  counter: (net: string, opp: string, netIn: string, oppIn: string) => `61 מנדטים ומעלה: ${net} ${netIn}, ${opp} ${oppIn}`,
  raceNone: "תמונת הגושים",
  raceLevel: (since: string) => `שוויון בין הגושים מאז ${since}`,
  raceLed: (bloc: string, since: string) => `${bloc} מוביל בממוצע ברציפות מאז ${since}`,
  raceChanges: (k: number, since: string) => `ההובלה בממוצע התחלפה ${plural(k, { one: "פעם אחת", two: "פעמיים", other: `${k} פעמים` })} מאז ${since}`,
  leaderNone: "כל רשימה בכל סקר עדכני",
  leaderAll: (name: string, n: number) => `${name} מובילה ${n === 1 ? "בסקר העדכני היחיד" : n === 2 ? "בשני הסקרים העדכניים" : `בכל ${n} הסקרים העדכניים`}`,
  leaderSome: (name: string, k: number, n: number) =>
    `${name} היא המפלגה הגדולה בממוצע, ${k === 0 ? "אך אינה מובילה לבדה באף סקר עדכני" : `ומובילה לבדה ${k === 1 ? `בסקר אחד מתוך ${n}` : `ב-${k} מתוך ${n} הסקרים העדכניים`}`}`,
  moverNone: (since: string) => `אף רשימה לא זזה במנדט שלם בממוצע מאז ${since}`,
  mover: (name: string, up: boolean, seats: string, since: string) => `התזוזה הגדולה בממוצע: ${name}, ${up ? "עלייה" : "ירידה"} של ${seats} מנדטים מאז ${since}`,
  leanNone: "הטיית הסוקרים",
  lean: (outlet: string, bloc: string, seats: string, above: boolean) => `בסקרי ${outlet} ${bloc} ${above ? "גבוה" : "נמוך"} ב-${seats} מנדטים מהממוצע`,
  spreadNone: "כל גוש בכל סקר עדכני",
  spread: (n: number, net: string, netSpan: string, opp: string, oppSpan: string) => `${n === 1 ? "בסקר העדכני היחיד" : `ב-${n} הסקרים העדכניים`}: ${net} ${netSpan}, ${opp} ${oppSpan}`,
  span: (lo: number, hi: number) => (lo === hi ? `${lo}` : `בין ${lo} ל-${hi}`),
  variantNone: (who: string, bloc: string) => `בלי סקרי ${who} ${bloc} נשאר ללא שינוי`,
  variant: (who: string, bloc: string, v: string, d: string, down: boolean) => `בלי סקרי ${who} ${bloc} ${down ? "יורד" : "עולה"} ל-${v}, ${down ? "ירידה" : "עלייה"} של ${d} מנדטים`,
  cite: (n: number, date: string, net: string, netV: string, opp: string, oppV: string, url: string) =>
    `פתק 2026, ממוצע ${n === 1 ? "הסקר העדכני היחיד" : `${n} הסקרים העדכניים`}, נכון ל-${date}: ${net} ${netV}, ${opp} ${oppV} מתוך 120 מנדטים. ${url}`,
};
