/** Quantities are compared in the source and target locale, including ordinary localized notation. */
export function numericTokens(value, locale = "en") {
  const text = String(value)
    .replace(/[٠-٩۰-۹０-９]/g, (c) => {
      const n = c.charCodeAt(0);
      return String(
        n >= 0xff10 ? n - 0xff10 : n >= 0x06f0 ? n - 0x06f0 : n - 0x0660,
      );
    })
    .replace(/٫|．/g, ".")
    .replace(/٬|，/g, ",")
    .replace(/٪/g, "%")
    .replace(/−/g, "-");
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
