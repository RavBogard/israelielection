import { ui } from "./ui";
import type { Lang } from "./index";

/** The method tab, using exactly the same poll selection and arithmetic in every edition. */
export function toolMethod(lang: Lang) {
  return {
    intake: (move: number) => ui(lang, "Polls are collected twice daily from Wikipedia's polling tables and checked before publication: seats must total 120, the publisher must be known, and no party may move more than {0} seats from that publisher's previous poll.", move),
    window: (days: number, to: string, n: number, polls: string) => ui(lang, "The average uses each publisher's latest poll from the {0} days through {1} ({2} polls: {3}). ", days, to, n, polls),
    sameIn: { a: "", builder: ui(lang, "Coalition Builder"), mid: ui(lang, " and "), map: ui(lang, "Party Map (English)"), b: ui(lang, " use the same polls. ") },
    inclusionRule: ui(lang, "Every publisher that reports its sample size and methodology is included, including Channel 14. Inclusion depends on the polling firm and its method, never on the results."),
    average: ui(lang, "Each list's average uses only polls where it passes the 3.25% threshold, so a passing list never averages below 4 seats. A list passing in fewer than half its reports is marked near the threshold and excluded from the coalition builder's default count. Polls are weighted by the square root of sample size; a missing sample size is replaced with the median of known sample sizes."),
    scaling: ui(lang, "When the sum of the averages exceeds 120, every list is reduced proportionally to 120 seats. Every average on this page, including the trend lines, uses this weighted and adjusted figure. "),
    variantNote: ui(lang, "The alternative average excludes Shlomo Filber's firms: Channel 14 (NEXT DATA) and i24NEWS (Direct Polls)."),
    forecastPage: (date: string) => ui(lang, "The forecast and its method, generated {0}", date),
    undated: (names: string) => ui(lang, "Uncertain dates: {0} includes figures without their own publication date. Charts and calculations use the report's date, which is not verified for every figure. Such figures are marked †; the poll's method card explains the difference.", names),
    sources: { a: ui(lang, "Sources: "), wiki: ui(lang, "Wikipedia's English polling tables"), b: ui(lang, " and the original reports linked from "), every: ui(lang, "Every poll"), c: "." },
  };
}
