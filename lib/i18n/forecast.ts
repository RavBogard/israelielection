/**
 * The forecast page's words in both editions (/forecast and /he/forecast, components/pages/ForecastPage.tsx).
 * The English is the page's own prose; the Hebrew is written fresh in Israeli data-desk Hebrew
 * (docs/planning/2026-10-06-hebrew/STYLE.md), doing each element's job. "אנחנו" is allowed here, as on the method tab.
 * Figures come from data/forecast.json at render time, so the words never carry a number the data does not.
 */
import { heText } from "./he-text";

const en = {
  meta: {
    title: "Forecast",
    description: "The site's seat forecast for the October 27 election: a simulation over the field polls, every parameter set by a rule, generated daily and scored against the result.",
  },
  title: "The forecast",
  standfirst: (date: string, final: boolean) =>
    final
      ? `The site's own prediction for October 27, locked ${date}: a seat simulation over the field polls, every parameter set by a rule from the six elections held under the 3.25% threshold. It is scored against the official result beside the two polling averages.`
      : `The site's own prediction for October 27, generated ${date}: a seat simulation over the field polls, every parameter set by a rule from the six elections held under the 3.25% threshold. It is regenerated daily until Monday night, then locked and scored against the official result beside the two polling averages.`,
  meta2: (runs: string, n: number) => `${runs} simulated elections over ${n} polls. Whole seats: the list centrals add to 120; a bloc's central is the median of its simulated total, so the blocs can leave a seat unassigned.`,
  prediction: {
    h: (date: string, final: boolean) => `${final ? "The final prediction" : "The prediction"}, ${date}`,
    barCaption: "Central seats by bloc; 61 is an absolute majority",
    cols: { bloc: "Bloc", list: "List", share: "Vote share", prior: "Prior", central: "Central", median: "Sum of list centrals", mean: "Mean of runs", range: "90% of runs", chance: "61 or more", passes: "Passes" },
    pct: (n: number) => `${n}%`,
    range: (lo: number, hi: number) => `${lo} to ${hi}`,
    centralNote: "Central: each list's median run, reconciled to 120, the whole seats the forecast is scored on; for a bloc, the median of its simulated total (version 3: on the record the sum of the list centrals over-shot the Netanyahu bloc by a seat on average), with the sum of its lists' centrals beside it. Vote share: the field mean after the priors and the lean. Prior: the class correction in vote-share points. Mean, range and the percentages count the runs.",
    majority: (net: number, opp: number, neither: number, withArab: number) =>
      `The Netanyahu bloc reaches 61 in ${net}% of runs, the anti-Netanyahu Zionist bloc in ${opp}%, neither in ${neither}%. The anti-Netanyahu bloc with the Arab lists and the lists between the blocs reaches 61 in ${withArab}%.`,
    largest: (entries: string) => `Largest list: ${entries}.`,
    largestEntry: (name: string, pct: number) => `${name} in ${pct}% of runs`,
    netLarger: (pct: number) => `The Netanyahu bloc is the larger of the two Zionist blocs in ${pct}% of runs.`,
  },
  inputs: {
    h: "What goes in",
    field: (n: number, through: string, days: number) => `The field: the newest poll from each publisher within ${days} days of the latest, ${n} polls to ${through}, less the two firms below. The weight is the square root of the sample, shared between outlets polled by one firm.`,
    cols: { publisher: "Publisher", firm: "Firm", published: "Published", sample: "Sample", weight: "Weight" },
    noSample: "not stated",
    checks: (names: string) => `Left out of the field and used as checks: ${names}, Shlomo Filber's firms. Their historical lean over the field is what step 4 below supplies from results; counting both would count it twice.`,
    agreements: (n: number) => `Surplus-vote agreements in the count (${n}, all published by the Central Elections Committee on October 19): `,
    withdrawn: (names: string) => `Withdrawn after the ballot was set and dropped from the model: ${names}.`,
    priorEntry: (name: string, pts: number) => `${name} ${pts > 0 ? "+" : "−"}${Math.abs(pts).toFixed(1)}`,
    pair: (a: string, b: string) => `${a} with ${b}`,
  },
  steps: {
    h: "How it is made",
    intro: "Version 2, October 24: eleven steps, each a rule from the record wherever the record allows one, each tested on the six elections since 2015 before it was kept. The two marked as judgments are the size of the width and of the consolidation draw.",
    s1: (n: number, checks: string, days: number) => `Polls. The newest poll from each publisher within ${days} days of the latest. The field is every publisher except ${checks}, which the model uses as checks rather than inputs. Two outlets polled by one firm share that firm's weight (Maariv and Walla by Lazar; Kan 11 and Israel Hayom by Kantar), weights by the square root of the sample. Today: ${n} field polls.`,
    s2: "Seats to shares. A poll's seats are the firm's own Bader-Ofer allocation, so a list with k seats holds a share between k and k+1 times the poll's divisor, and at least the threshold since it passed: the model takes the midpoint. The old seats-out-of-120 rule put every 4-seat list at 3.1 to 3.2%, under the line, and called lists failing that every poll had passing. A list the firm put below keeps the percentage it printed; with none printed, the firm's last printed figure, else the other polls' median.",
    s3: (fringe: number) => `Average. The weighted mean share per list, scaled to ${100 - fringe}% of the vote: ${fringe}% is reserved for the lists the polls do not report (Noam, Haredi Public, micro-lists) and for Blue and White, which withdrew on October 19 and is dropped, its ballot slips still counted as wasted votes.`,
    s4: (priors: string) => `Priors by list. Vote-share points added where the final-week polls have missed one kind of list in one direction in both halves of the record since 2013, shrunk 20 to 40% toward zero: ${priors}. Shas is under-polled in six of seven elections; Ra'am beats its polls (its base votes at a steady rate), while the Joint List's correction is the turnout term of the next step; every new or first-time-solo list polled at 2.4 to 4.6% has failed, five of five; Bennett's lists have fallen short six times in six.`,
    s4b: (shift: number, sd: number) => `Arab turnout. The polls behave as if anchored on the previous election's Arab turnout: the change in Arab list votes per Arab elector, relative to general turnout, explains about nine tenths of the Arab lists' final-poll miss since 2013. That index reverts to its long-run mean; from 2022, which sat on the mean, the expected change is ${shift >= 0 ? "+" : "−"}${Math.abs(shift).toFixed(1)}% of the Joint List's share, and each run draws a further swing of ${sd}% around it, every other list diluted in proportion. This replaces the old fixed Joint List prior and the Arab turnout swing. Pre-blackout turnout expectations of about 60% were not added on top: the corrected polls already imply them.`,
    s5: (lean: number, resid: number) => `The lean. A common swing of ${lean} seats toward the Netanyahu bloc: the field's miss on that bloc in the final week of the six elections held under the 3.25% threshold, 2015 to 2022, weighted toward the recent ones with a half-life of two elections (the table below). The spread left after the lean is ${resid} seats. Taking the lean net of Shas's own miss was tested and rejected: it under-predicts the bloc by three seats on the record.`,
    s6: "Why the two firms are checks. In 2020, 2021 and 2022 Direct Polls sat about two seats above the field, and so did the result. That house lean is the signal the lean already encodes, estimated from results rather than from the firm. This year the two firms sit 8 to 12 seats above the field, four times their historical lean; nothing in the record explains that, so the model neither follows it nor rules it out: it widens.",
    s7: (scale: number, df: number) => `Width. Each simulated election moves the whole Netanyahu bloc by a random swing drawn from a Student-t distribution with ${df} degrees of freedom and a scale of ${scale} seats: the predictive distribution of the next miss given the six on the record (the residual, widened for a seventh draw; never under 1.5 seats). Version 2 used a normal swing of 3.1 seats, twice the residual; on the record that put all six past results between the 31st and 66th percentiles, a width the data did not support.`,
    s8: (sd: number, floor: number, arab: number) => `List noise. Every list is moved on its own, ${sd} points at an 8% share scaling with the square root of the share, never under ${floor} point for a small list (the misses of lists near the threshold run about a point). Inside each bloc the moves sum to zero: history shows lists trading votes within a bloc while the bloc total holds, so the noise is substitution, not a second bloc movement. The Arab lists get a turnout swing of their own, ${arab} seats, the size of their misses in 2020 to 2022.`,
    s9: (sd: number) => `Consolidation (judgment on the size). One draw per bloc, ${sd} seats standard deviation, moved between the bloc's largest list and its partners: in 2015, April 2019 and 2020 Likud beat its polls by 3 to 9 seats while its bloc moved under one.`,
    s10: (agreements: number, runs: string) => `Count. The 3.25% threshold on the whole vote, the reserve included, then 120 seats by Bader-Ofer with the ${agreements} surplus-vote agreements the Central Elections Committee published on October 19, in ${runs} runs.`,
    s11: "Central seats. Each list's median seat count across the runs, the figure that minimises expected seat error and always agrees with the threshold call (a list passes when it does so in half the runs or more), reconciled to 120 among the lists that pass in 95% of runs. A bloc's central is the median of its simulated total, the figure the bloc error is scored on; the sum of its lists' centrals is shown beside it (on the record the sum over-shot the Netanyahu bloc by 0.6 seats on average).",
  },
  calibration: {
    h: "The record the rules come from",
    intro: "Final-week polls against the result for the Netanyahu bloc, every election under the 3.25% threshold. The field is the mean of each firm's final poll other than Direct Polls; the miss is the result less the field.",
    cols: { election: "Election", field: "Field", dp: "Direct Polls", result: "Result", miss: "Field miss" },
    none: "—",
    threshold: (passed: number, total: number) => `Lists shown at 4 or 5 seats by most final-week polls since 2015 passed ${passed} times in ${total}.`,
  },
  record: {
    h: "The daily record",
    intro: "Every run whose figures changed, oldest first. The last row is the prediction shown on the site; after Monday night it is the final one, and exit polls and the count never touch it. The first row is version 1, kept on the record.",
    cols: { date: "Generated", version: "Version", net: "Netanyahu bloc", opp: "Anti-Netanyahu bloc", arab: "Arab lists", mid: "Between", chance: "Netanyahu bloc at 61", status: "Status" },
    final: "Final",
    draft: "Daily run",
    changesH: "Changes to the rules",
    changesIntro: "Each change to the algorithm, with its date and its effect on the backtest. The reasoning behind each is in the research notes linked below.",
  },
  scoring: {
    h: "How it will be scored",
    intro: "Fixed before the result. On the official count, for the forecast and for both site averages:",
    r1: "Mean absolute seat error per list, over the lists above (the averages: their scaled figures).",
    r2: "Absolute error on each bloc's central (the median of its simulated total).",
    r3: "Threshold calls: a list is called passing at 50% of runs or more (the averages: by their passes-in-k-of-n rule).",
    r4: "Whether the outcome given the highest probability above occurred.",
    r5: "Every current poll's final figures, scored the same way, for the pollster record.",
  },
  wrong: {
    h: "What would have to be true for this to be badly wrong",
    text: (chance: number) => `Channel 14 at 62 is right. That requires the field to miss the Netanyahu bloc by 8 to 10 seats, more than twice its worst miss since 2015, or a late swing. The model gives 61 or more a ${chance}% chance; if it happens, the lesson is that right-wing non-response grew after the war faster than six elections of history could show, and the next model's lean should be estimated from 2026 alone. The other way to be wrong is a first-time list passing: both are given about one chance in four or five, and every such list since 2013 has failed.`,
  },
  sources: {
    lead: "Reproducible: ",
    script: "the script",
    data: "the data file",
    history: "the run history",
    memo: "the research notes",
    backtest: "the backtest",
    tail: ", all in the site's public repository. The same figures are a choice on the home page, the polls page and the Coalition Builder.",
    and: " and ",
    sep: ", ",
  },
};

export type ForecastText = typeof en;

const FORECAST = {
  en,
  /** Loaded on Hebrew pages only (lib/i18n/he/register.ts). */
  get he(): ForecastText {
    return heText<ForecastText>("forecast");
  },
};
export default FORECAST;
