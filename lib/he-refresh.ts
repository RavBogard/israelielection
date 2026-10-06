import type { GlossaryEntry } from "./briefing";
import { fieldAt, heField, srcHash, type HeOverlay } from "./i18n/localize";

/**
 * Keeps the Hebrew party register in step when the daily job changes the English (scripts/jobs/party-proposals.mts).
 * Every Hebrew field whose English changed, and every new pledge, is written again in Israeli news Hebrew and marked
 * `machine: true` (Daniel approved unreviewed Hebrew from the jobs, 2026-10-06). A line that fails the checks is
 * dropped from the overlay instead, so the page shows the English and the stale-Hebrew test still passes.
 */
export type Target = { id: string; field: string; english: string; previous?: string };

/** The fields the daily job can set (lib/proposals.ts applyProposals); when one gains English it gains Hebrew. */
const JOB_FIELDS = ["leader", "status", "surplusLine", "surplusPartner.text"];

/** Fields to rewrite: stale party fields (English changed), and job fields and pledges with English but no Hebrew yet. */
export function refreshTargets(parties: readonly { id: string; pledges?: { text: string }[] | null }[], overlay: HeOverlay): Target[] {
  const out: Target[] = [];
  for (const p of parties) {
    const fields = overlay[p.id] ?? {};
    for (const [field, he] of Object.entries(fields)) {
      const english = fieldAt(p, field);
      if (english !== undefined && he.src !== srcHash(english)) out.push({ id: p.id, field, english, previous: he.text });
    }
    const missing = [...JOB_FIELDS, ...(p.pledges ?? []).map((_, i) => `pledges.${i}.text`)];
    for (const field of missing) {
      const english = fieldAt(p, field);
      if (english && !fields[field]) out.push({ id: p.id, field, english });
    }
  }
  return out;
}

export type RefreshDraft = { items: { n: number; text: string }[] };
export const REFRESH_SCHEMA = {
  type: "object",
  properties: { items: { type: "array", items: { type: "object", properties: { n: { type: "integer" }, text: { type: "string" } }, required: ["n", "text"] } } },
  required: ["items"],
} as const;

const KIND: Record<string, string> = {
  leader: 'שם יו"ר הרשימה',
  status: "מצב הרשימה בבחירות (משפט קצר)",
  surplusLine: 'שורה קצרה על הסכם העודפים, בפורמט "הסכם עודפים: ..."',
  "surplusPartner.text": "משפט על הסכם העודפים",
};
const kind = (field: string) => KIND[field] ?? (field.startsWith("pledges.") ? "הבטחת בחירות של המפלגה (משפט אחד)" : "טקסט");

export function refreshPrompt(targets: Target[], partyName: (id: string) => string, glossary: GlossaryEntry[]): string {
  return `אתה עורך בעיתון ישראלי. לפניך שדות קצרים מתוך מאגר מפלגות באנגלית על הבחירות לכנסת ב-27 באוקטובר 2026. כתוב כל שדה מחדש בעברית עיתונאית ישראלית טבעית, כמו בכאן חדשות, ynet או הארץ: אותה עובדה, בניסוח שקורא ישראלי מצפה לו, לא תרגום מילולי.

כללים:
- שדה עברי אחד לכל שדה, עם אותו מספר (n). אל תוסיף ואל תשמיט עובדות.
- כל מספר שכתוב בספרות נשאר אותו מספר בספרות.
- קול ניטרלי, בלי דעה. טקסט רגיל בלבד, בלי markdown ובלי קישורים.
- כשיש "נוסח קודם", שמור על הסגנון שלו ושנה רק את מה שהשתנה באנגלית.
- שמות מפלגות ומנהיגים בדיוק כך:
${glossary.map((g) => `  ${g.en[0]} = ${g.he}`).join("\n")}

השדות:
${targets.map((t, i) => `${i + 1}. מפלגה: ${partyName(t.id)}. סוג: ${kind(t.field)}.\n   אנגלית: ${t.english}${t.previous ? `\n   נוסח קודם: ${t.previous}` : ""}`).join("\n")}`;
}

const numbers = (s: string) => (s.match(/\d+(?:[.,]\d+)*/g) ?? []).map((n) => n.replace(/,/g, "")).sort().join();

/** Why one Hebrew line can't be used, or null when it can. */
export function refreshProblem(english: string, he: string | undefined): string | null {
  const h = (he ?? "").replace(/\s+/g, " ").trim();
  if (!h) return "empty";
  if (/https?:\/\/|\[|\]|\*|#/.test(h)) return "markup or a link";
  const hebrew = (h.match(/[֐-׿]/g) ?? []).length, latin = (h.match(/[A-Za-z]/g) ?? []).length;
  if (hebrew < 2 * latin || hebrew < 2) return "not mostly Hebrew";
  if (numbers(english) !== numbers(h)) return "numbers differ";
  return null;
}

/** Writes the checked lines into a copy of the overlay; failed or missing lines leave the field out. */
export function applyRefresh(overlay: HeOverlay, targets: Target[], draft: RefreshDraft | null): { overlay: HeOverlay; written: Target[]; dropped: (Target & { reason: string })[] } {
  const next: HeOverlay = structuredClone(overlay);
  const byN = new Map((draft?.items ?? []).map((x) => [x.n, x.text]));
  const written: Target[] = [], dropped: (Target & { reason: string })[] = [];
  targets.forEach((t, i) => {
    const text = byN.get(i + 1)?.replace(/\s+/g, " ").trim();
    const reason = refreshProblem(t.english, text);
    next[t.id] ??= {};
    if (reason) {
      delete next[t.id][t.field];
      dropped.push({ ...t, reason });
    } else {
      next[t.id][t.field] = heField(t.english, text!, true);
      written.push(t);
    }
  });
  return { overlay: next, written, dropped };
}
