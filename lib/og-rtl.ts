/**
 * Hebrew for the share cards. Satori (next/og) has no bidirectional text: it draws Hebrew left to right in typing
 * order, so the letters come out backwards. These put a line in the order it is seen instead. Satori then draws
 * it left to right and it reads correctly from the right. Lines must be broken before the reordering (and drawn
 * without wrapping): a line that satori wrapped after reordering would start with the sentence's end.
 */

/** Runs that stay left to right inside Hebrew: numbers ("52.4", "27"), Latin words, a web address. */
const LTR = /[0-9A-Za-z](?:[0-9A-Za-z.,:%/@-]*[0-9A-Za-z%])?/g;
const MIRROR: Record<string, string> = { "(": ")", ")": "(", "[": "]", "]": "[", "<": ">", ">": "<" };

/** One Hebrew line, typed order → seen order: "עוד 21 ימים." → ".םימי 21 דוע". */
export function visualOrder(line: string): string {
  const tokens: string[] = [];
  let at = 0;
  for (const m of line.matchAll(LTR)) {
    tokens.push(...line.slice(at, m.index), m[0]);
    at = m.index! + m[0].length;
  }
  tokens.push(...line.slice(at));
  return tokens.reverse().map((t) => MIRROR[t] ?? t).join("");
}

