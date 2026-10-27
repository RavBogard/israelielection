import { numericTokens } from "../reference/numeric.mjs";
import type { EmailLocale } from "./email";
import type { PoliticalRecord } from "./types";
export type NumericIssue = {
  code:
    | "unsupported_date"
    | "unsupported_unit"
    | "unsupported_quantity"
    | "sign_conflict";
  token: string;
  unit: string;
};
const MONTHS = [
  ["January", "Jan", "Januar", "janvier", "ינואר", "يناير", "ژانویه"],
  ["February", "Feb", "Februar", "février", "פברואר", "فبراير", "فوریه"],
  ["March", "Mar", "März", "mars", "מרץ", "مارس"],
  ["April", "Apr", "avril", "אפריל", "أبريل", "آوریل"],
  ["May", "Mai", "mai", "מאי", "مايو", "مه"],
  ["June", "Jun", "Juni", "juin", "יוני", "يونيو", "ژوئن"],
  ["July", "Jul", "Juli", "juillet", "יולי", "يوليو", "ژوئیه"],
  ["August", "Aug", "août", "אוגוסט", "أغسطس", "اوت"],
  ["September", "Sep", "Sept", "septembre", "ספטמבר", "سبتمبر", "سپتامبر"],
  ["October", "Oct", "Oktober", "octobre", "אוקטובר", "أكتوبر", "اکتبر"],
  ["November", "Nov", "novembre", "נובמבר", "نوفمبر", "نوامبر"],
  ["December", "Dec", "Dezember", "décembre", "דצמבר", "ديسمبر", "دسامبر"],
];
function normalize(text: string) {
  return text
    .normalize("NFKC")
    .replace(/[٠-٩۰-۹]/g, (c) =>
      String(
        c.charCodeAt(0) >= 0x6f0
          ? c.charCodeAt(0) - 0x6f0
          : c.charCodeAt(0) - 0x660,
      ),
    )
    .replace(/٫/g, ".")
    .replace(/٬/g, ",")
    .replace(/٪/g, "%")
    .replace(/−/g, "-");
}
const percentWords =
  /^(?:\s*)(?:percent(?:age)?(?!\s+points?)|per\s+cent|Prozent|pour\s+cent|אחוזים|אחוז|في\s+المئة|في\s+المائة|بالمئة|بالمائة|درصد)(?!\p{L})/iu;
const percentagePoints =
  /^\s*(?:percentage\s+points?|percent\s+points?|Prozentpunkte|points?\s+de\s+pourcentage|נקודות?\s+אחוז|نقاط?\s+مئوية|واحد\s+درصد|个百分点)/iu;
const seatUnits =
  /^\s*(?:seats?|mandates?|מנדטים|מושבים|مقاعد|کرسی|Sitze|Sitzen|sièges|席)(?!\p{L})/iu;
const otherCounts =
  /^\s*(?:people|voters?|households?|persons?|dollars?|shekels?|km|אנשים|בוחרים|أشخاص|ناخبين|نفر|Personen|personnes|人)(?!\p{L})/iu;
const negativeDirection =
  /(?:fell|fall|decreased?|declined?|down|minus|negative|sank|fiel|gesunken|baisse|baissé|diminué|reculé|ירד|ירידה|פחת|انخفض|انخفاض|تراجع|کاهش|افت|下降|下跌|降低)\s*(?:(?:by|of|was|is|um|de|ب|بنسبة)\s*)?$/iu;
const positiveDirection =
  /(?:rose|rise|increased?|up|plus|positive|stieg|gestiegen|hausse|augmenté|עלה|עלייה|עליה|ارتفع|ارتفاع|افزایش|رشد|上涨|增长|上升)\s*(?:(?:by|of|was|is|um|de|ب|بنسبة)\s*)?$/iu;
const seriesIdentifier =
  /(?:^|[^\p{L}])(?:series(?:\s+ID)?|série|Reihe|סדרה|סדרת|סلسلة|السلسلة|سری|系列)\s*[:#]?\s*$/iu;
function periodText(text: string, period: string, issues: NumericIssue[]) {
  const [year, month] = period.split("-").map(Number);
  const consume = (raw: string, y: number, m: number, day = false) => {
    if (day || y !== year || m !== month)
      issues.push({
        code: "unsupported_date",
        token: raw,
        unit: day ? "calendar_day" : "month",
      });
    return " ".repeat(raw.length);
  };
  text = text.replace(
    /\b((?:19|20)\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/g,
    (raw, y, m) => consume(raw, +y, +m, true),
  );
  text = text.replace(/\b((?:19|20)\d{2})[-/](\d{1,2})\b(?!%)/g, (raw, y, m) =>
    consume(raw, +y, +m),
  );
  text = text.replace(/\b(\d{1,2})\/((?:19|20)\d{2})\b/g, (raw, m, y) =>
    consume(raw, +y, +m),
  );
  text = text.replace(/((?:19|20)\d{2})年(\d{1,2})月/g, (raw, y, m) =>
    consume(raw, +y, +m),
  );
  MONTHS.forEach((aliases, index) => {
    const words = aliases.join("|");
    text = text.replace(
      new RegExp(
        `(?<![\\p{L}])(?:[בלמה](?=[א-ת]))?(?:${words})\\.?[\\s,]+((?:19|20)\\d{2})(?![\\p{L}\\d%])`,
        "giu",
      ),
      (raw, y) => consume(raw, +y, index + 1),
    );
    text = text.replace(
      new RegExp(`\\b((?:19|20)\\d{2})[\\s,]+(?:${words})(?![\\p{L}])`, "giu"),
      (raw, y) => consume(raw, +y, index + 1),
    );
  });
  return text;
}
function mentions(text: string, locale: EmailLocale) {
  const regex =
    /[-+]?\d+(?:(?:[.,]\d+)|(?:[ \u00a0\u202f\u2009]\d{3}(?!\d)))*(?:st|nd|rd|th)?[ \u00a0\u202f\u2009]*%?/gi;
  return [...text.matchAll(regex)].map((match) => {
    const raw = match[0].trim(),
      offset = match.index!,
      before = text.slice(Math.max(0, offset - 48), offset),
      after = text.slice(
        offset + match[0].length,
        offset + match[0].length + 48,
      );
    const token = numericTokens(raw, locale)[0] ?? "",
      value = Number(token.replace(/%$/, ""));
    const quantityUnit = percentagePoints.test(after)
      ? "percentage_points"
      : /%$/.test(raw) || percentWords.test(after) || /百分之\s*$/.test(before)
        ? "percent"
        : seatUnits.test(after)
          ? "seats"
          : otherCounts.test(after)
            ? "count"
            : "bare";
    const unit = seriesIdentifier.test(before)
      ? quantityUnit === "bare"
        ? "series_identifier"
        : `series_identifier_${quantityUnit}`
      : quantityUnit;
    const directionText = before.replace(/百分之\s*$/, "");
    const negative = negativeDirection.test(directionText),
      positive = positiveDirection.test(directionText);
    return {
      raw,
      value,
      unit,
      negative,
      positive,
      explicitNegative: /^-/.test(token),
    };
  });
}
/** Units come from typed facts, never a percent-stripped bag of every number in source JSON. */
export function validatePrimaryNumbers(
  fact: PoliticalRecord,
  text: string,
  locale: EmailLocale,
  legacyInput?: unknown,
) {
  const issues: NumericIssue[] = [];
  let normalized = normalize(text);
  if (
    fact.kind === "indicator_observation" &&
    fact.payload.seriesId === 120010
  ) {
    const payload = fact.payload;
    const period = String(payload.period);
    if (!/^20\d{2}-\d{2}$/.test(period))
      return [
        {
          code: "unsupported_date" as const,
          token: period,
          unit: "source_month",
        },
      ];
    normalized = periodText(normalized, period, issues);
    const years = new Set(
      [
        Number(period.slice(0, 4)),
        ...String(payload.baseDescription).matchAll(/\b(?:19|20)\d{2}\b/g),
      ].map((value) => (typeof value === "number" ? value : Number(value[0]))),
    );
    for (const mention of mentions(normalized, locale)) {
      if (mention.positive && mention.explicitNegative) {
        issues.push({
          code: "sign_conflict",
          token: mention.raw,
          unit: mention.unit,
        });
        continue;
      }
      const value =
        mention.negative && !mention.explicitNegative
          ? -mention.value
          : mention.value;
      const allowed =
        mention.unit === "series_identifier"
          ? mention.value === payload.seriesId &&
            !mention.negative &&
            !mention.positive
          : mention.unit === "percent"
            ? [payload.monthlyPercent, payload.annualPercent].includes(value)
            : mention.unit === "bare" && !mention.negative && !mention.positive
              ? mention.value === payload.indexValue || years.has(mention.value)
              : false;
      if (!allowed)
        issues.push({
          code:
            ["percentage_points", "seats", "count"].includes(mention.unit) ||
            mention.unit.startsWith("series_identifier_")
              ? "unsupported_unit"
              : "unsupported_quantity",
          token: mention.raw,
          unit: mention.unit,
        });
    }
    return issues;
  }
  const snapshot = fact.payload.snapshot as
    { pointSeats?: Record<string, number> } | undefined;
  if (fact.kind === "snapshot" && snapshot?.pointSeats) {
    for (const mention of mentions(normalized, locale))
      if (["percent", "percentage_points", "count"].includes(mention.unit))
        issues.push({
          code: "unsupported_unit",
          token: mention.raw,
          unit: mention.unit,
        });
  }
  const allowed = new Set(
    numericTokens(JSON.stringify(legacyInput ?? fact.payload)),
  );
  for (const token of numericTokens(text, locale))
    if (!allowed.has(token))
      issues.push({
        code: "unsupported_quantity",
        token,
        unit: "source_exact",
      });
  return issues;
}
export function primaryNumberGuidance(fact: PoliticalRecord) {
  if (fact.kind !== "indicator_observation" || fact.payload.seriesId !== 120010)
    return "Preserve exact source numbers and their units.";
  return `Numeric rendering contract: observation month ${fact.payload.period}; index value ${fact.payload.indexValue} in index units; monthly percentage change ${fact.payload.monthlyPercent}%; annual percentage change ${fact.payload.annualPercent}%; base ${fact.payload.baseDescription}. Preserve negative signs or an unambiguous decrease statement. Percent changes are not percentage-point changes. No release day is known; do not invent a publication date, observation day, base value or extra quantity.`;
}
