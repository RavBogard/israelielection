import { parseExpc } from "../results";
import { splitCsv } from "../votemap";
import config from "../../data/results.json";
import { ELECTION, fingerprint, POLLS_CLOSE } from "./core";
import { fetchPrimary, sourceRecord } from "./acquisition";
import type { GeographySnapshot, SharedSeatContext } from "./types";
export function parseGeography(
  csv: string,
  now: string,
  official: SharedSeatContext | null,
): GeographySnapshot {
  if (Date.parse(now) < Date.parse(POLLS_CLOSE))
    throw new Error("preclose_geography");
  const count = parseExpc(csv);
  if (!count.valid) throw new Error("empty_geography");
  const { head, rows } = splitCsv(csv),
    col = (s: string) => head.indexOf(s),
    validCol = col("כשרים"),
    letters = head.slice(validCol + 1),
    mapping = config.letters as Record<string, string>;
  const lists = letters.map((letters) => {
    const known = official?.parties.find((p) => p.letters === letters);
    return {
      id:
        known?.id ??
        mapping[letters] ??
        `cec-${Buffer.from(letters).toString("hex")}`,
      letters,
      name: known?.label ?? letters,
    };
  });
  const envelopes: GeographySnapshot["envelopes"] = {
      valid: 0,
      votes: Object.fromEntries(lists.map((p) => [p.id, 0])),
    },
    seen = new Set<number>();
  const localities: GeographySnapshot["rows"] = [];
  for (const r of rows) {
    const code = Number(r[col("סמל ישוב")]);
    if (!Number.isSafeInteger(code) || seen.has(code))
      throw new Error("invalid_locality_code");
    seen.add(code);
    const votes = Object.fromEntries(
      lists.map((p, i) => [p.id, Number(r[validCol + 1 + i])]),
    );
    const row = {
      code,
      eligible: Number(r[col("בזב")]),
      voted: Number(r[col("מצביעים")]),
      valid: Number(r[validCol]),
      votes,
    };
    if (code === 9999 || code === 99999) {
      envelopes.valid += row.valid;
      for (const [id, v] of Object.entries(votes)) envelopes.votes[id] += v;
    } else localities.push(row);
  }
  const actual = Object.fromEntries(
    lists.map((p) => [
      p.id,
      localities.reduce((n, r) => n + r.votes[p.id], 0) + envelopes.votes[p.id],
    ]),
  );
  const complete =
    !!official?.officialVotes &&
    official.seatStatus === "official" &&
    official.election === ELECTION &&
    official.officialVotes.valid === count.valid &&
    Object.entries(official.officialVotes.byParty).every(
      ([id, v]) => (actual[id] ?? 0) === v,
    ) &&
    Object.entries(actual).every(
      ([id, v]) => (official.officialVotes!.byParty[id] ?? 0) === v,
    );
  const source = sourceRecord(
    "cec-localities",
    "Central Elections Committee",
    config.source.url,
    "cec",
    csv,
    now,
    "Current-election locality count; envelopes separate",
  );
  return {
    schemaVersion: 1,
    election: ELECTION,
    revision: fingerprint({
      csv,
      officialSeatRevision: official?.revision ?? null,
    }),
    observedAt: now,
    source,
    complete,
    coverage: complete ? "documented_complete" : "unknown",
    lists,
    rows: localities,
    envelopes,
    totals: {
      eligible: count.eligible,
      voted: count.voted,
      valid: count.valid,
    },
    officialSeatRevision: official?.revision ?? null,
  };
}
export async function acquireGeography(
  now: string,
  official: SharedSeatContext | null,
) {
  if (Date.parse(now) < Date.parse(POLLS_CLOSE)) return null;
  const csv = await fetchPrimary(config.source.url, [
    "media26.bechirot.gov.il",
  ]);
  return { snapshot: parseGeography(csv, now, official), body: csv };
}
