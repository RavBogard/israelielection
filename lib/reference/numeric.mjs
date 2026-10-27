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
      return /(?:\b(?:19|20)\d{2}|\b[0-3]?\d)[\s,./-]*$/.test(before) ||
        /^[\s,./-]*(?:[0-3]?\d\b|(?:19|20)\d{2}\b)/.test(after)
        ? String(index + 1)
        : month;
    });
  }
  return text;
}
/** Quantities are compared in the source and target locale, including ordinary localized notation. */
export function numericTokens(value, locale = "en") {
  const text = numericDates(
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
      .replace(/−/g, "-"),
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
