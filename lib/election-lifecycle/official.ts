import config from "../../data/results.json";
import partyData from "../../data/parties.json";
import { ELECTION, fingerprint, POLLS_CLOSE, validSeats } from "./core";
import { articleOf, htmlTables, isTestEnvironment, textOf } from "./html";
import type { SharedSeatContext, SourceRef } from "./types";
export type OfficialOptions = {
  election: string;
  knesset: number;
  dateMarkers: string[];
  now: string;
  url: string;
  letters: Record<string, string>;
};
export const officialOptions = (now: string, url: string): OfficialOptions => ({
  election: ELECTION,
  knesset: 26,
  dateMarkers: ["27 באוקטובר 2026", "27.10.2026", "27/10/2026", "2026-10-27"],
  now,
  url,
  letters: config.letters,
});
/** Published seat table + explicit official-final heading, never a completed-looking raw count. */
export function parseOfficialSeats(
  html: string,
  o: OfficialOptions,
): SharedSeatContext {
  const text = textOf(html);
  if (o.election === ELECTION && Date.parse(o.now) < Date.parse(POLLS_CLOSE))
    throw new Error("before_current_election_close");
  if (isTestEnvironment(html)) throw new Error("test_environment");
  if (
    /תוצאות.{0,100}(?:יפורסמו|טרם פורסמו)|(?:official|final).{0,80}(?:will be published|not yet published)/i.test(
      text,
    )
  )
    throw new Error("future_publication_notice");
  if (
    !new RegExp(`לכנסת\\s*ה?[-־– ]*${o.knesset}(?!\\d)`).test(text) ||
    !o.dateMarkers.some((d) => text.includes(d))
  )
    throw new Error("wrong_election");
  const finalHeadings = [
    ...html.matchAll(/<(h[1-6]|span|strong|p)\b[^>]*>([\s\S]*?)<\/\1>/gi),
  ].map((m) => textOf(m[2]));
  if (
    !finalHeadings.some((s) =>
      /^(?:תוצאות סופיות רשמיות|Official final results)[\s.:]*$/i.test(s),
    )
  )
    throw new Error("official_publication_not_established");
  const table = htmlTables(html).find((rows) =>
    rows.some(
      (r) =>
        r.some((c) => c.includes("אותיות הרשימה")) &&
        r.some((c) => /^מנדטים$/.test(c)),
    ),
  );
  if (!table) throw new Error("seat_table_missing");
  const header = table.find((r) => r.some((c) => c.includes("אותיות הרשימה")))!,
    letterCol = header.findIndex((c) => c.includes("אותיות הרשימה")),
    seatCol = header.indexOf("מנדטים"),
    nameCol = header.findIndex((c) => c.includes("שם הרשימה"));
  const pointSeats: Record<string, number> = {},
    votes: Record<string, number> = {},
    parties: SharedSeatContext["parties"] = [],
    seen = new Set<string>();
  const voteCol = header.findIndex((c) => /מספר.*קולות.*לרשימה/.test(c));
  for (const row of table) {
    if (
      row === header ||
      row.length <= Math.max(letterCol, seatCol) ||
      !/^\d+$/.test(row[seatCol])
    )
      continue;
    const letters = row[letterCol];
    if (!letters || seen.has(letters)) throw new Error("duplicate_list");
    seen.add(letters);
    const id =
        o.letters[letters] ?? `cec-${Buffer.from(letters).toString("hex")}`,
      seats = Number(row[seatCol]);
    if (id in pointSeats || seats > 120) throw new Error("invalid_list");
    pointSeats[id] = seats;
    const known = partyData.parties.find((p) => p.id === id);
    parties.push({
      id,
      label: known?.short ?? row[nameCol] ?? letters,
      letters,
      profiled: !!known,
      ...(known ? { bloc: known.bloc } : {}),
    });
  }
  if (!validSeats(pointSeats)) throw new Error("not_120_seats");
  if (voteCol >= 0)
    for (const row of table) {
      if (row === header || !/^\d+$/.test(row[seatCol] ?? "")) continue;
      const id =
          o.letters[row[letterCol]] ??
          `cec-${Buffer.from(row[letterCol]).toString("hex")}`,
        value = Number(row[voteCol]?.replace(/,/g, ""));
      if (!Number.isSafeInteger(value) || value < 0)
        throw new Error("invalid_votes");
      votes[id] = value;
    }
  const captureHash = fingerprint(html),
    publication = articleOf(html).publishedAt,
    publishedAt =
      publication &&
      Date.parse(publication) >= Date.parse(o.election + "T00:00:00Z") &&
      Date.parse(publication) <= Date.parse(o.now)
        ? publication
        : null,
    source: SourceRef = {
      id: "cec-official",
      publisher: "Central Elections Committee",
      title: `Official published seats: Knesset ${o.knesset}`,
      url: o.url,
      authority: "cec",
      publishedAt,
      observedAt: o.now,
      captureHash,
    };
  const notice = text.match(
    /(?:פורסמו|פורסמה|published).{0,60}(?:ברשומות|Official Gazette).{0,50}?(\d{4}-\d{2}-\d{2}|\d{1,2}[./]\d{1,2}[./]\d{4})/i,
  );
  let statutoryPublication: SharedSeatContext["statutoryPublication"];
  if (notice) {
    const raw = notice[1],
      pieces = raw.split(/[./]/),
      day =
        pieces.length === 3
          ? `${pieces[2]}-${pieces[1].padStart(2, "0")}-${pieces[0].padStart(2, "0")}`
          : raw;
    const parsed = Date.parse(day + "T00:00:00Z");
    if (
      Number.isFinite(parsed) &&
      new Date(parsed).toISOString().slice(0, 10) === day &&
      day >= o.election &&
      parsed <= Date.parse(o.now)
    )
      statutoryPublication = {
        publishedOn: day,
        source,
        evidenceQuote: notice[0],
      };
  }
  const snapshotRevision = fingerprint({
      election: o.election,
      pointSeats,
      votes,
      statutoryPublicationOn: statutoryPublication?.publishedOn ?? null,
    }),
    revision = fingerprint({
      basis: "official_seats",
      snapshotRevision,
      captureHash,
    });
  return {
    schemaVersion: 1,
    election: o.election,
    revision,
    snapshotRevision,
    sequence: 0,
    updatedAt: o.now,
    evidenceStage: "official",
    basis: "official_seats",
    seatStatus: "official",
    pointMethod: "published_official_allocation",
    pointSeats,
    parties,
    sourceRefs: [source],
    publishedAt,
    observedAt: o.now,
    correctionOf: null,
    freshness: { status: "complete", checkedAt: o.now, lastAttemptAt: o.now },
    reasonCodes: parties.some((p) => !p.profiled && pointSeats[p.id] > 0)
      ? ["unknown_party"]
      : [],
    ...(statutoryPublication ? { statutoryPublication } : {}),
    ...(voteCol >= 0
      ? {
          officialVotes: {
            valid: Object.values(votes).reduce((a, b) => a + b, 0),
            byParty: votes,
          },
        }
      : {}),
  };
}
export const OFFICIAL_URLS = [
  "https://cdn-votes26.bechirot.gov.il/nationalresults?lang=he",
  "https://votes26.bechirot.gov.il/nationalresults",
];
export function officialAcquisitionOpen(now: string) {
  return Date.parse(now) >= Date.parse(POLLS_CLOSE);
}
