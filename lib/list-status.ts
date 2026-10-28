import type { SharedSeatContext } from "./election-lifecycle/types";

/** Vote shares (0 to 1) of the lists in the live count, by the party id where one is mapped and by ballot letters. */
export type ListShares = { byParty: Record<string, number>; byLetters: Record<string, number>; /** Raw votes by ballot letters, for the lists page; absent in older callers. */ votesByLetters?: Record<string, number> };

export type ListStatus = { kind: "entered" } | { kind: "below"; official: boolean; pct: number | null };

/** A list with seats entered; one without is below the threshold, and only "official" may say so without "so far". */
export function listStatus(seats: number, seatStatus: SharedSeatContext["seatStatus"], pct: number | null): ListStatus {
  return seats > 0 ? { kind: "entered" } : { kind: "below", official: seatStatus === "official", pct };
}

/** The list's vote share: the official figure once published, otherwise the live count's. Null when neither has it. */
export function shareOf(ids: { party?: string | null; letters?: string | null }, shares: ListShares | null, context: SharedSeatContext | null): number | null {
  const official = context?.seatStatus === "official" ? context.officialVotes : undefined;
  if (official && official.valid > 0) {
    for (const k of [ids.letters, ids.party]) if (k && Object.hasOwn(official.byParty, k)) return official.byParty[k] / official.valid;
  }
  if (!shares) return null;
  if (ids.party && Object.hasOwn(shares.byParty, ids.party)) return shares.byParty[ids.party];
  if (ids.letters && Object.hasOwn(shares.byLetters, ids.letters)) return shares.byLetters[ids.letters];
  return null;
}

/** The list's votes: the official count once published, otherwise the live count's, found by ballot letters (or party id for the official file). Null when neither has it. */
export function votesOf(ids: { party?: string | null; letters?: string | null }, shares: ListShares | null, context: SharedSeatContext | null): number | null {
  const official = context?.seatStatus === "official" ? context.officialVotes : undefined;
  if (official && official.valid > 0) {
    for (const k of [ids.letters, ids.party]) if (k && Object.hasOwn(official.byParty, k)) return official.byParty[k];
  }
  if (ids.letters && shares?.votesByLetters && Object.hasOwn(shares.votesByLetters, ids.letters)) return shares.votesByLetters[ids.letters];
  return null;
}

const LOCALE: Record<string, string> = { en: "en", he: "he", ar: "ar-u-nu-latn", fa: "fa-u-nu-latn", de: "de", fr: "fr", zh: "zh" };
/** "1.6%" in the edition's own decimal and percent conventions. */
export function percentText(pct: number, lang: string): string {
  return new Intl.NumberFormat(LOCALE[lang] ?? "en", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(pct);
}
