import type { ElectionLifecycleSnapshot, PoliticalEvent, SourceRef } from "./election-lifecycle/types";

/**
 * The standing-reference home (Daniel, 2026-10-28): once a government is sworn in, the home page stops being the
 * count and becomes the reference for the next election. The switch reads only the lifecycle record /government
 * uses: the resolver's `formationState === "governing"`, which needs a confirmed `government_formed` event from a
 * Knesset source (lib/election-lifecycle/events.ts), never elapsed time or seat totals.
 */
export type SwornGovernment = {
  /** The prime minister as the Knesset record names them. */
  person: string;
  /** The swearing-in, as the record dates it. */
  swornAt: string;
  /** The coalition's lists, each with official seats. */
  coalition: string[];
  coalitionSeats: number;
  /** Official seats for every list in the house. */
  seats: Record<string, number>;
  sources: SourceRef[];
  event: PoliticalEvent;
};

/**
 * The sworn-in government, or null while none is on the record. Coalition lists are the event's own lists; when the
 * event names none, the lists that confirmed a cabinet seat in the same person's proposal. Seats must be official.
 */
export function swornGovernment(snapshot: ElectionLifecycleSnapshot | null | undefined): SwornGovernment | null {
  if (!snapshot) return null;
  const p = snapshot.politics, ctx = snapshot.seatContext;
  if (p.formationState !== "governing" || p.status !== "formed" || ctx.seatStatus !== "official") return null;
  const event = p.events.filter((e) => e.type === "government_formed" && e.status === "confirmed").at(-1);
  if (!event?.person || !event.sources.length) return null;
  const seats = Object.fromEntries(Object.entries(ctx.pointSeats).filter(([, n]) => n > 0));
  const cabinet = p.proposals.find((x) => x.person === event.person)?.decisions.filter((d) => d.decision === "cabinet").map((d) => d.partyId) ?? [];
  const coalition = [...new Set(event.partyIds.length ? event.partyIds : cabinet)].filter((id) => seats[id] > 0);
  if (!coalition.length) return null;
  const coalitionSeats = coalition.reduce((a, id) => a + seats[id], 0);
  return { person: event.person, swornAt: event.effectiveAt, coalition, coalitionSeats, seats, sources: event.sources, event };
}

/** Hebrew month of a date, in the ICU Hebrew calendar ("Heshvan", "Tishri", ...). */
const hebrew = new Intl.DateTimeFormat("en-u-ca-hebrew", { timeZone: "UTC", year: "numeric", month: "long", day: "numeric" });
const hebrewParts = (d: Date) => {
  const parts = hebrew.formatToParts(d);
  return { month: parts.find((x) => x.type === "month")!.value, year: Number(parts.find((x) => x.type === "year")!.value) };
};

/**
 * When the next Knesset election falls due if the Knesset serves its full term (Basic Law: The Knesset, sections 8
 * and 9): a four-year term, and the election on the third Tuesday of Heshvan in the Hebrew year that term ends.
 * `electionDay` is the date the current Knesset was elected (YYYY-MM-DD). A dissolution brings it forward.
 */
export function nextElectionDue(electionDay: string, termYears = 4): string {
  const elected = new Date(`${electionDay}T12:00:00Z`);
  const termEnds = new Date(elected);
  termEnds.setUTCFullYear(termEnds.getUTCFullYear() + termYears);
  const year = hebrewParts(termEnds).year;
  // Heshvan falls in October or November; walk from the start of September and take the third Tuesday.
  let tuesdays = 0;
  for (let d = new Date(Date.UTC(termEnds.getUTCFullYear(), 8, 1, 12)); d.getUTCFullYear() <= termEnds.getUTCFullYear(); d = new Date(+d + 86400000)) {
    const h = hebrewParts(d);
    if (h.year === year && h.month === "Heshvan" && d.getUTCDay() === 2 && ++tuesdays === 3) return d.toISOString().slice(0, 10);
  }
  throw new Error(`No third Tuesday of Heshvan ${year}`);
}

/** The Basic Law: The Knesset, as published (English by the Knesset; Hebrew on Wikisource). */
export const KNESSET_LAW_URL = {
  en: "https://main.knesset.gov.il/EN/activity/documents/BasicLawsPDF/BasicLawTheKnesset.pdf",
  he: "https://he.wikisource.org/wiki/%D7%97%D7%95%D7%A7_%D7%99%D7%A1%D7%95%D7%93:_%D7%94%D7%9B%D7%A0%D7%A1%D7%AA",
} as const;
