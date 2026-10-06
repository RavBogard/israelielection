import type { GlossaryEntry } from "./briefing";
import type { HeOverlay } from "./i18n/localize";

/**
 * The parties' names for the jobs that write Hebrew (the daily briefing, the party register): each party's English
 * forms as the press writes them, and the Hebrew edition's own name for it. `parties` names are checked in the
 * Hebrew (by the short name); `leaders` are given to the model for spelling only, since a sentence may use a surname.
 */
const ALSO: Record<string, string[]> = { utj: ["United Torah Judaism"], rz: ["Religious Zionism"], dem: ["Democrats"], yashar: ["Yashar"], raam: ["Raam"], yb: ["Yisrael Beytenu"], res: ["Reservists"] };
/** English names that are also ordinary words or someone's first name (Justice Noam Sohlberg). */
const SKIP = new Set(["noam", "byachad", "poi"]);

export function partyGlossary(parties: readonly { id: string; name: string; short: string; leader?: string }[], he: HeOverlay): { parties: GlossaryEntry[]; leaders: GlossaryEntry[] } {
  return {
    parties: parties.flatMap((p) => (SKIP.has(p.id) || !he[p.id]?.name ? [] : [{ en: [...new Set([p.name, p.short, ...(ALSO[p.id] ?? [])])].filter((x) => !x.includes(".")), he: he[p.id].name.text, must: he[p.id].short?.text }])),
    leaders: parties.flatMap((p) => (p.leader && he[p.id]?.leader ? [{ en: [p.leader], he: he[p.id].leader.text }] : [])),
  };
}
