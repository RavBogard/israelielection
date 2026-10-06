/**
 * Hebrew number and list grammar for generated sentences. Hebrew has a dual ("two"), so plural forms
 * take one, two and other. Digits stay digits (Israeli media practice); only the noun agrees.
 */

const RULES = new Intl.PluralRules("he");

export type HeForms = { one: string; two?: string; other: string };

/**
 * The form for n under Hebrew plural rules: one (1), two (2, falling back to other), other.
 * Fractions (4.5 seats) take other.
 */
export function plural(n: number, forms: HeForms): string {
  const cat = RULES.select(n);
  if (cat === "one") return forms.one;
  if (cat === "two") return forms.two ?? forms.other;
  return forms.other;
}

/** Seats in Hebrew: "מנדט אחד", otherwise "N מנדטים" (digits kept, fractions as given). */
export function seatsHe(n: number): string {
  return plural(n, { one: "מנדט אחד", other: `${n} מנדטים` });
}

const LISTS = {
  and: new Intl.ListFormat("he", { style: "long", type: "conjunction" }),
  or: new Intl.ListFormat("he", { style: "long", type: "disjunction" }),
};

/** A Hebrew list: "א, ב וג" / "א, ב או ג". */
export function list(items: readonly string[], type: "and" | "or" = "and"): string {
  return LISTS[type].format(items);
}
