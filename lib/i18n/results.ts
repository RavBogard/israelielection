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
import { plural } from "./he-grammar";

/** Hebrew seats: "מנדט אחד", "שני מנדטים", "4 מנדטים", "4.2 מנדטים" (STYLE.md: never "1 מנדטים"). */
const mandates = (n: number, figure: string = String(n)) => plural(n, { one: "מנדט אחד", two: "שני מנדטים", other: `${figure} מנדטים` });
/** "About n seats" in Hebrew: "כ-4 מנדטים", "כמנדט אחד", "כשני מנדטים". */
const aboutMandates = (n: number) => plural(n, { one: "כמנדט אחד", two: "כשני מנדטים", other: `כ-${n} מנדטים` });

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

const he: typeof en = {
  meta: {
    title: "תוצאות הבחירות",
    description: "תוצאות הבחירות לכנסת ה-26 בליל הבחירות: ספירת הקולות של ועדת הבחירות המרכזית, מדגמי הערוצים, והמנדטים לפי רשימה ולפי גוש.",
  },
  title: "תוצאות הבחירות",
  phases: {
    aria: "ליל הבחירות",
    done: ", הסתיים",
  },
  refresh: "בדקו אם יש עדכון",
  israelTime: (t) => t,
  standfirst: {
    closed: (il) => `ספירת הקולות מתחילה עם סגירת הקלפיות, ב${il}.`,
    stale: "ספירה שמורה; העדכון מוועדת הבחירות אינו זמין כרגע",
    early: "תוצאות אמת ראשונות של ועדת הבחירות המרכזית",
    count: "ספירת הקולות של ועדת הבחירות המרכזית",
    open: (lead, il) => `${lead}, נכון ל-${il}. חלוקת המנדטים היא הערכה של האתר, לא החלוקה הרשמית.`,
    waiting: (t) => `ממתינים לנתונים הראשונים של ועדת הבחירות המרכזית. בדיקה אחרונה ב-${t}; העמוד בודק שוב מדי דקה.`,
    unusable: (t) => `בבדיקה האחרונה, ב-${t}, הקובץ של ועדת הבחירות עדיין לא כלל נתונים שאפשר להציג. העמוד בודק שוב מדי דקה.`,
    unreachable: (t) => `אתר ועדת הבחירות לא הגיב בריענון האחרון (${t}). העמוד מנסה שוב מדי דקה.`,
  },
  letters: {
    h: "האותיות על הפתק",
    note: (n) =>
      `על כל פתק מודפסות אותיות הרשימה, וועדת הבחירות מדווחת על הקולות לפי האותיות. אלה האותיות של ${n} הרשימות שבאתר, מתוך 38 הרשימות שמתמודדות.`,
    th: { letters: "אותיות", list: "רשימה", leader: "בראשות" },
    source: "מקור: ",
  },
  method: {
    h: "מקולות למנדטים",
    threshold: (pct) => `רשימה שקיבלה פחות מ-${pct}% מהקולות הכשרים לא נכנסת לכנסת, והקולות שלה אינם עוברים לאף רשימה אחרת.`,
    share: (seats) => `${seats} המנדטים מתחלקים בין הרשימות שעברו את אחוז החסימה לפי מספר הקולות, בשיטת בדר-עופר.`,
    surplus: (pairs) =>
      `שתי רשימות שחתמו על הסכם עודפים נספרות כרשימה אחת בחלוקת המנדטים העודפים, ואחר כך מתחלקות במה שקיבלו. ההסכם יכול להכריע לאן ילך מנדט אחרון. ההערכה כאן מביאה בחשבון את ההסכמים שדווח שנחתמו (הרישום הרשמי בוועדה טרם אומת): ${pairs}.`,
    majority: (m) =>
      `${m} מנדטים הם רוב בכנסת. ממשלה חדשה צריכה בהצבעת האמון יותר תומכים ממתנגדים, והנמנעים אינם נספרים; כדי להחליף ממשלה בהצבעת אי-אמון צריך 61 חברי כנסת שתומכים בממשלה חלופית. [הסבר של המכון הישראלי לדמוקרטיה (באנגלית)](https://en.idi.org.il/articles/28888); [חוק-יסוד: הממשלה (באנגלית)](https://main.knesset.gov.il/EN/activity/Documents/BasicLawsPDF/BasicLawTheGovernment.pdf).`,
    pair: (a, b) => `${a} ו${b}`,
    pairSep: "; ",
    agreements: " הסכמי עודפים: ",
  },
  watch: {
    h: "על מה להסתכל",
    closeDt: (il) => `סגירת הקלפיות: ${il}`,
    closeDd:
      "מרגע שהקלפיות נסגרות העמוד מציג את ספירת הקולות של ועדת הבחירות המרכזית ומתעדכן מדי דקה, והתוצאות נכנסות גם ל[מרכיבים קואליציה](/coalition-builder). באותו רגע כאן 11, חדשות 12 וחדשות 13 משדרים את המדגמים ([ynet, 1.11.22, באנגלית](https://www.ynetnews.com/article/h1tyl0a4s)). מדגם הוא הערכה: ב-2022 נתנו המדגמים הראשונים למרצ 5 מנדטים ([ג'רוזלם פוסט, באנגלית](https://www.jpost.com/israel-elections/article-721230)), ובספירה הסופית קיבלה מרצ 3.16% ונשארה מתחת לאחוז החסימה ([ועדת הבחירות המרכזית](https://votes25.bechirot.gov.il/nationalresults)). [מהקלפי לתוצאות: ליל הבחירות (באנגלית)](/how-it-works/voting)",
    thresholdDt: (pct, seats) => `אחוז החסימה: ${pct}% מהקולות הכשרים, ${aboutMandates(seats)}`,
    thresholdDd: (closed) =>
      `רשימה שלא עוברת אותו לא נכנסת לכנסת, והקולות שלה אינם עוברים לרשימות אחרות. המנדטים מתחלקים רק בין הרשימות שעברו. לפי ממוצע הסקרים ${closed ? "האחרון לפני הבחירות" : "העדכני"}, אלה הרשימות הקרובות ביותר לקו:`,
    nearSeats: (n, figure) => mandates(n, figure),
    nearNone: "מתחת לאחוז החסימה בכל הסקרים",
    thresholdAfter: (seats) => `כל רשימה שעוברת או נופלת מזיזה ${aboutMandates(seats)} בין הגושים.`,
    envelopesDt: "הספירה נמשכת גם אחרי הלילה",
    envelopesDd:
      "כמעט אחד מכל עשרה קולות מוטל במעטפה כפולה, מחוץ לקלפי של הבוחר (חיילים, למשל), והמעטפות הכפולות נספרות אחרי הקלפיות הרגילות. חלוקת המנדטים הרשמית מתפרסמת עם התוצאות הרשמיות. [למה התוצאות זזות (באנגלית)](/how-it-works/voting)",
  },
  exitTable: {
    pending: "מדגמי שלושת הערוצים יתווספו כאן מיד עם שידורם, וגם יופיעו כאפשרות במרכיבים קואליציה.",
    h: (beside) => `המדגמים לפי רשימה${beside ? ", לצד ספירת הקולות" : ""}`,
    list: "רשימה",
    countSoFar: "הספירה עד כה",
    below: "מתחת לחסימה",
    source: (il, polls) => `המדגמים כפי ששודרו ב-${il}: ${polls}. מדגם הוא הערכה; התוצאות הן של ועדת הבחירות המרכזית.`,
    pollSep: "; ",
  },
  thresholdCount: {
    h: "על סף אחוז החסימה",
    note: (pct, votes) =>
      `לפי הקולות שנספרו עד כה, אחוז החסימה (${pct}%) עומד על ${votes} קולות. רשימה שמתחתיו לא נכנסת לכנסת, והקולות שלה אינם עוברים לרשימות אחרות.`,
    row: (share, votes, passing, seats) =>
      passing ? `${share}, ${votes} קולות מעל הקו; כרגע ${mandates(seats)}` : `${share}, ${votes} קולות מתחת לקו; אם תעבור, ${aboutMandates(seats)}`,
    none: "בקולות שנספרו עד כה אין רשימה בטווח של חצי אחוז מאחוז החסימה.",
  },
  board: {
    otherLists: "רשימות אחרות",
    earlyFlag: (pc) => [`תוצאות אמת ראשונות.`, ` נספרו עד כה יישובים שבהם ${pc} מבעלי זכות הבחירה, ולכן המנדטים עוד יזוזו. ההצללה על לוח המנדטים מסמנת שזו ספירה מוקדמת.`],
    aria: (early) => (early ? "המנדטים לפי גוש, תוצאות ראשונות" : "המנדטים לפי גוש"),
    gridTitle: (early, majority) => `${early ? "תוצאות ראשונות: המנדטים" : "המנדטים"} לפי גוש; ${majority} מנדטים הם רוב`,
    gridAwait: (seats, majority) => `ממתינים לספירה: ${seats} מנדטים; ${majority} הם רוב`,
    awaiting: "ממתינים לספירה",
    countedH: "בעלי זכות בחירה ביישובים שנספרו ",
    countedNone: "שיעור בעלי זכות הבחירה שנספרו",
    countedAria: (pc) => `${pc} מבעלי זכות הבחירה נמצאים ביישובים שנספרו עד כה`,
    countedAriaNone: "עדיין אין נתון",
    awaitCount: "ממתינים לספירה.",
    tally: (valid, localities, turnout) =>
      `${valid} קולות כשרים מ-${localities} יישובים, כולל מעטפות כפולות שכבר נספרו; אחוז ההצבעה ביישובים שנספרו: ${turnout ?? "לא ידוע"}.`,
    prior: (roll, eligible) => ` השיעור מחושב מול ${roll} (${eligible} בעלי זכות בחירה), עד שהוועדה תפרסם את המספר של 2026.`,
    build: "הרכיבו קואליציה מהתוצאות",
    byList: "לפי רשימה",
    th: { list: "רשימה", seats: "מנדטים", letters: "אותיות", votes: "קולות", share: "אחוז", diff: "הפרש" },
    below: "מתחת לחסימה",
    others: (n) => `רשימות אחרות${n !== null ? ` (${n})` : ""}`,
    srcThreshold: (votes, pct) => `אחוז החסימה: ${votes} קולות (${pct}% מהקולות הכשרים שנספרו עד כה). `,
    srcHatched: "התאים המוצללים ממתינים לספירה. ",
    srcAverage: (label, n, through) => `${label}: ממוצע ${n} הסקרים האחרונים באתר, עד ${through}; ההפרש הוא המנדטים בספירה פחות הממוצע. מקור: `,
    srcUntracked: " רשימה שאינה במעקב האתר עוברת כרגע את אחוז החסימה.",
  },
  exitBars: {
    h: "מדגמי הערוצים",
    aria: "מדגמי הערוצים",
    notYet: "טרם פורסם",
    notYetTitle: "טרם פורסם",
    notYetLabel: (pollster) => `מדגם ${pollster}: טרם פורסם.`,
    time: (t) => t,
    notByBloc: "לא דווח לפי גוש",
    label: (poll, blocs) => `${poll}: ${blocs}. רוב: 61.`,
    srcAny: "המדגמים כפי ששודרו. מדגם הוא הערכה, ותוצאות האמת של ועדת הבחירות מחליפות אותו. המנדטים לפי גוש מחושבים מהמספרים של כל ערוץ.",
    srcNone: "כאן 11, חדשות 12 וחדשות 13 משדרים את המדגמים עם סגירת הקלפיות ב-22:00. הם יופיעו כאן מיד עם פרסומם; עד אז לא מוצג דבר.",
  },
  pollThreshold: {
    caption: (closed) => (closed ? "הרשימות על סף אחוז החסימה, בסקר האחרון של כל מכון" : "הרשימות על סף אחוז החסימה, בכל אחד מהסקרים העדכניים"),
    passesIn: "עוברת ב-",
    seats: (n) => mandates(n),
    below: "מתחת לאחוז החסימה",
    of: (n) => ` מתוך ${n}`,
    average: (avg) => `, ממוצע ${avg}`,
    src: (n) =>
      `כל נקודה היא אחד מ-${n} הסקרים האחרונים; נקודה באפס היא סקר שבו הרשימה מתחת לאחוז החסימה. השטח המוצלל הוא אחוז החסימה עצמו: 3.25% מהקולות הכשרים הם כ-4 מנדטים, ולכן רשימה שעוברת מקבלת לפחות 4, ורשימה שלא עוברת לא מקבלת אף מנדט. הטור "עוברת ב-" סופר את הסקרים שבהם הרשימה עוברת. כל רשימה שעוברת או נופלת בליל הבחירות מזיזה כ-4 מנדטים בין הגושים.`,
  },
  freshness: {
    aria: "עדכניות הספירה",
    fixture: "קובץ חזרה מקומי, לא ספירת הקולות של 2026.",
    stale: "ספירה שמורה; העדכון מוועדת הבחירות אינו זמין.",
    fresh: "העדכון האחרון מאתר ועדת הבחירות.",
    captured: (t) => ` נקלט ב-${t}.`,
    sourceTime: (t) => (t ? ` חותמת הזמן של קובץ הוועדה: ${t}.` : " קובץ הוועדה אינו מציין שעת עדכון מאומתת."),
    attempt: (t) => ` ניסיון העדכון האחרון: ${t}.`,
    partial: "ספירה חלקית; המנדטים הם הערכה של האתר, לא החלוקה הרשמית של ועדת הבחירות. המעטפות הכפולות: ",
    envelopes: (valid, present) =>
      `${present === null ? "אין מידע" : present ? `נכללו ${valid} קולות כשרים, וייתכן שעוד לא כולן נספרו` : "עדיין אינן בקובץ"}.`,
  },
  changes: {
    none: "אין ספירה שמורה קודמת להשוואה.",
    h: "מה השתנה מאז הספירה הקודמת",
    compared: "לעומת הספירה שנקלטה ב-",
    after: [": ", " קולות כשרים. ירידה יכולה לנבוע מתיקון בספירה. אלה הפרשים בין שתי ספירות שנשמרו באתר, לא יומן שינויים רשמי."],
    th: { list: "רשימה", votes: "שינוי בקולות", seats: "שינוי משוער במנדטים" },
  },
  asPollNote: (localities, thresholdVotes) => `הקולות שנספרו עד כה ${plural(localities, { one: "ביישוב אחד", two: "בשני יישובים", other: `ב-${localities} יישובים` })}; המנדטים לפי הערכת האתר (אחוז החסימה: ${thresholdVotes} קולות).`,
  // The short names Israeli media use (STYLE.md), keyed by the ballot letters in data/results.json.
  lists: {
    מחל: "הליכוד",
    ב: "עוצמה יהודית",
    שס: 'ש"ס',
    ג: "יהדות התורה",
    ט: "הציונות הדתית",
    ך: "עמך ישראל",
    ני: "נעם",
    דרך: "ישר!",
    רק: "ביחד",
    אמת: "הדמוקרטים",
    ל: "ישראל ביתנו",
    כן: "כחול לבן",
    די: "המילואימניקים והכלכלית",
    ודם: "הרשימה המשותפת",
    עם: 'רע"ם',
  },
  // Daniel, 2026-10-06 (STYLE.md).
  blocs: { net: "גוש נתניהו", opp: "גוש האופוזיציה", mid: "מחוץ לגושים", arab: "המפלגות הערביות" },
  channels: { "Kan 11": "כאן 11", "Channel 12": "חדשות 12", "Channel 13": "חדשות 13" },
};

const resultsText = { en, he };
export default resultsText;
