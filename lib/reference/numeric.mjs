const MONTHS = [
  ["January", "Jan", "Januar", "janvier", "ינואר", "يناير", "ژانویه"],
  ["February", "Feb", "Februar", "février", "פברואר", "فبراير", "فوریه"],
  ["March", "Mar", "März", "mars", "מרץ", "مارس"],
  ["April", "Apr", "avril", "אפריל", "أبريل", "ابريل", "آوریل"],
  ["May", "Mai", "mai", "מאי", "مايو", "مه"],
  ["June", "Jun", "Juni", "juin", "יוני", "يونيو", "ژوئن"],
  ["July", "Jul", "Juli", "juillet", "יולי", "يوليو", "ژوئیه"],
  ["August", "Aug", "août", "אוגוסט", "أغسطس", "اغسطس", "اوت"],
  ["September", "Sep", "Sept", "septembre", "ספטמבר", "سبتمبر", "سپتامبر"],
  [
    "October",
    "Oct",
    "Oktober",
    "octobre",
    "אוקטובר",
    "أكتوبر",
    "اكتوبر",
    "اکتبر",
  ],
  ["November", "Nov", "novembre", "נובמבר", "نوفمبر", "نوامبر"],
  ["December", "Dec", "Dezember", "décembre", "דצמבר", "ديسمبر", "دسامبر"],
];
/** Month words only become numbers in an adjacent written date, never standalone quantities. */
function numericDates(text) {
  for (let index = 0; index < MONTHS.length; index++) {
    const pattern = new RegExp(
      `(?<![\\p{L}])(?:[בלמה](?=[א-ת]))?(?:${MONTHS[index].join("|")})(?![\\p{L}])`,
      "giu",
    );
    text = text.replace(pattern, (month, offset, whole) => {
      const before = whole.slice(Math.max(0, offset - 8), offset),
        after = whole.slice(offset + month.length, offset + month.length + 12);
      // A French first of the month is written "1er novembre".
      return /(?:\b(?:19|20)\d{2}|\b[0-3]?\d(?:er)?)[\s,./-]*$/.test(before) ||
        /^[\s,./-]*(?:[0-3]?\d\b|(?:19|20)\d{2}\b)/.test(after)
        ? String(index + 1)
        : month;
    });
  }
  return text;
}
/**
 * Clock times compare on the 24-hour clock. An English "10:00 p.m." (or "10 pm") is 22:00, so a
 * translation that keeps the 12-hour "10:00" fails; leading zeros never matter ("07:00" is 7:00).
 * Only English source text is converted: the target editions are written in 24-hour time.
 */
function clockTimes(text, locale) {
  if (locale === "en")
    text = text.replace(
      /(?<![0-9:.,])([0-1]?[0-9])(?::([0-5][0-9]))?[   ]?([ap])\.?m(?![a-z])\.?/gi,
      (m, h, min, half) => {
        const hour = Number(h);
        if (hour < 1 || hour > 12) return m;
        const h24 = (hour % 12) + (half.toLowerCase() === "p" ? 12 : 0);
        return `${h24}:${min ?? "00"}`;
      },
    );
  return text.replace(
    /(?<![0-9:.,])([0-2]?[0-9]):([0-5][0-9])(?![0-9:])/g,
    (m, h, min) => `${Number(h)}:${min}`,
  );
}
/** Quantities are compared in the source and target locale, including ordinary localized notation. */
export function numericTokens(value, locale = "en") {
  const text = numericDates(
    clockTimes(
      String(value)
        .replace(/[٠-٩۰-۹０-９]/g, (c) => {
          const n = c.charCodeAt(0);
          return String(
            n >= 0xff10 ? n - 0xff10 : n >= 0x06f0 ? n - 0x06f0 : n - 0x0660,
          );
        })
        .replace(/٫|．/g, ".")
        .replace(/٬|，/g, ",")
        .replace(/٪/g, "%")
        .replace(/−/g, "-")
        // Chinese counts large sums in 亿 (10^8): 530亿 is the English "53 billion", whose token is 53.
        .replace(/([0-9]+(?:\.[0-9]+)?)\s*亿/g, (m, n) =>
          locale === "zh" ? `${Number((Number(n) / 10).toFixed(6))} 十亿` : m,
        ),
      locale,
    ),
  );
  const re =
    /[-+]?[0-9]+(?:(?:[.,][0-9]+)|(?:[ \u00a0\u202f\u2009][0-9]{3}(?![0-9])))*(?:st|nd|rd|th)?[ \u00a0\u202f\u2009]*%?/gi;
  return [...text.matchAll(re)]
    .map((m) => {
      let token = m[0]
        .trim()
        .replace(/(?:st|nd|rd|th)(?=[ \u00a0\u202f\u2009]*%?$)/i, "");
      if (
        /^[-+]/.test(token) &&
        m.index > 0 &&
        /[\p{L}\p{N}]/u.test(text[m.index - 1])
      )
        token = token.slice(1);
      const percent = /%$/.test(token) ? "%" : "";
      token = token.replace(/[ \u00a0\u202f\u2009%]/g, "");
      if (
        locale === "de" &&
        /^[-+]?[0-9]{1,3}(?:\.[0-9]{3})+(?:,[0-9]+)?$/.test(token)
      )
        token = token.replaceAll(".", "");
      if (locale === "de" || locale === "fr") token = token.replace(",", ".");
      else if (/^[-+]?[0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]+)?$/.test(token))
        token = token.replaceAll(",", "");
      else token = token.replace(",", ".");
      return token + percent;
    })
    .sort();
}
