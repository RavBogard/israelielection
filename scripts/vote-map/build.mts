/**
 * Builds the vote map's files in public/vote-map/ (run by hand: `npx tsx scripts/vote-map/build.mts`).
 *
 * - Results: each election's per-locality file, fetched from the Central Elections Committee
 *   (media2X.bechirot.gov.il/files/expc.csv). The build fails unless every list's column
 *   sum matches the committee's national page (scraped into the research sample) exactly.
 * - Boundaries: the research prototype (docs/research/data-vote-map/samples), which merges the
 *   Ministry of Transport 2026 locality layer with the CBS 2008 census layer for the West Bank.
 *   data.gov.il refuses requests without a browser user agent, so the build does not refetch it.
 * - Context: the West Bank and Gaza outlines from OCHA's common operational dataset on HDX
 *   (CC BY-IGO). Its West Bank outline includes East Jerusalem.
 * - Names and points: the CBS localities file as joined in the research sample, with the
 *   house spellings in lib/votemap.ts.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import path from "node:path";
import { inflateRawSync } from "node:zlib";
import { englishName, isEnvelopeCode, splitCsv, type Places, type VoteMapElection } from "../../lib/votemap";

const UA = "israelielection.org data build (+https://www.israelielection.org)";
const ROOT = process.cwd();
const SAMPLES = path.join(ROOT, "docs/research/data-vote-map/samples");
const OUT = path.join(ROOT, "public/vote-map");
const OCHA =
  "https://data.humdata.org/dataset/2caf8373-816f-458c-9913-71bddb9cab7c/resource/ca372385-4c79-4378-abf1-cb506fb98023/download/pse_admin_boundaries.geojson.zip";

type ListsFile = {
  elections: {
    knesset: number; id: string; label: string; date: string; results: string; csv: string; encoding: string;
    lists: { letters: string; name: string }[];
  }[];
};
type Scraped = Record<string, { letters: string; seats: number; votes: number }[]>;
type SampleRow = { code: number; name_en: string | null; latlng: [number, number] | null };

const readJson = <T,>(p: string): T => JSON.parse(readFileSync(p, "utf8")) as T;

async function get(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function fail(msg: string): never {
  console.error(`vote-map build: ${msg}`);
  process.exit(1);
}

const listsFile = readJson<ListsFile>(path.join(ROOT, "data/vote-map/lists.json"));
const scraped = readJson<Scraped>(path.join(SAMPLES, "party-letters-k21-k25.json"));
const sample = readJson<SampleRow[]>(path.join(SAMPLES, "localities-2022.sample.json"));
const ref = new Map(sample.map((r) => [r.code, r]));

mkdirSync(OUT, { recursive: true });
const places: Places = {};
const unnamed = new Map<number, string>();
const fetched = new Date().toISOString().slice(0, 10);

for (const e of listsFile.elections) {
  const buf = await get(e.csv);
  const sha256 = createHash("sha256").update(buf).digest("hex");
  const { head, rows } = splitCsv(new TextDecoder(e.encoding).decode(buf));
  const col = (name: string) => {
    const i = head.indexOf(name);
    if (i < 0) fail(`${e.id}: no "${name}" column`);
    return i;
  };
  const [iName, iCode, iElig, iVoted, iValid] = [col("שם ישוב"), col("סמל ישוב"), col("בזב"), col("מצביעים"), col("כשרים")];
  const partyCols = head.map((h, i) => ({ h, i })).filter(({ i }) => i > iValid);

  // Integrity: every list's column sum equals the committee's national page.
  const sums = new Map(partyCols.map(({ h }) => [h, 0]));
  for (const r of rows) for (const { h, i } of partyCols) sums.set(h, sums.get(h)! + Number(r[i] || 0));
  const national = scraped[String(e.knesset)];
  if (!national) fail(`${e.id}: no national table for Knesset ${e.knesset}`);
  if (national.length !== partyCols.length) fail(`${e.id}: ${partyCols.length} list columns, national page has ${national.length}`);
  for (const l of national) if (sums.get(l.letters) !== l.votes) fail(`${e.id}: ${l.letters} sums to ${sums.get(l.letters)}, national page ${l.votes}`);

  const named = e.lists.map((l) => {
    const i = head.indexOf(l.letters);
    if (i <= iValid) fail(`${e.id}: no column for ${l.letters} (${l.name})`);
    const n = national.find((x) => x.letters === l.letters)!;
    return { ...l, i, votes: n.votes, seats: n.seats };
  });
  const validTotal = [...sums.values()].reduce((a, b) => a + b, 0);
  for (const l of named) if (l.votes / validTotal < 0.01) fail(`${e.id}: ${l.name} is under 1% and should not be named`);
  for (const { h } of partyCols) {
    if (!named.some((l) => l.letters === h) && sums.get(h)! / validTotal >= 0.01) fail(`${e.id}: list ${h} has ≥1% but no name in data/vote-map/lists.json`);
  }

  const out: VoteMapElection = {
    id: e.id, label: e.label, date: e.date, knesset: e.knesset,
    source: { results: e.results, csv: e.csv, sha256, fetched },
    lists: named.map(({ letters, name, votes, seats }) => ({ letters, name, votes, seats })),
    national: { eligible: 0, voted: 0, valid: 0, other: 0 },
    envelopes: { valid: 0, votes: [], other: 0 },
    rows: [],
  };
  for (const r of rows) {
    const code = Number(r[iCode]);
    const [elig, voted, valid] = [Number(r[iElig]), Number(r[iVoted]), Number(r[iValid])];
    const votes = named.map((l) => Number(r[l.i] || 0));
    const other = valid - votes.reduce((a, b) => a + b, 0);
    out.national.eligible += elig;
    out.national.voted += voted;
    out.national.valid += valid;
    out.national.other += other;
    if (isEnvelopeCode(code)) {
      out.envelopes = { valid, votes, other };
      continue;
    }
    out.rows.push([code, elig, voted, valid, ...votes]);
    if (!places[code]) {
      const s = ref.get(code);
      const name = englishName(code, s?.name_en ?? null);
      if (!name) unnamed.set(code, r[iName]);
      places[code] = [name ?? "", s?.latlng?.[0] ?? 0, s?.latlng?.[1] ?? 0];
    }
  }
  if (out.national.valid !== validTotal) fail(`${e.id}: valid ${out.national.valid} ≠ list sum ${validTotal}`);
  if (!out.envelopes.valid) fail(`${e.id}: no envelope row`);
  writeFileSync(path.join(OUT, `${e.id}.json`), JSON.stringify(out));
  console.log(`${e.id}: ${out.rows.length} localities, envelopes ${((out.envelopes.valid / out.national.valid) * 100).toFixed(2)}%, sha256 ${sha256.slice(0, 12)}`);
}

if (unnamed.size) {
  console.log(`No English name for ${unnamed.size} localities (shown by code):`);
  for (const [c, he] of unnamed) console.log(`  ${c} ${he}`);
}
writeFileSync(path.join(OUT, "places.json"), JSON.stringify(places));
copyFileSync(path.join(SAMPLES, "localities-prototype.topo.json"), path.join(OUT, "boundaries.topo.json"));

/* Context outlines: West Bank (on the 1949 armistice line) and Gaza, simplified. */
/** One member of a zip archive, read from its central directory. */
function unzipEntry(zip: Buffer, name: string): Buffer {
  const eocd = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  let p = zip.readUInt32LE(eocd + 16);
  for (let n = zip.readUInt16LE(eocd + 10); n--; ) {
    const [method, size, nameLen, extraLen, commentLen, local] = [
      zip.readUInt16LE(p + 10), zip.readUInt32LE(p + 20), zip.readUInt16LE(p + 28),
      zip.readUInt16LE(p + 30), zip.readUInt16LE(p + 32), zip.readUInt32LE(p + 42),
    ];
    if (zip.toString("utf8", p + 46, p + 46 + nameLen) === name) {
      const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
      const data = zip.subarray(start, start + size);
      return method === 8 ? inflateRawSync(data) : data;
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  fail(`zip has no ${name}`);
}
type Feature = { properties: { adm1_name: string }; geometry: { type: string; coordinates: number[][][] | number[][][][] } };
const admin1 = JSON.parse(unzipEntry(await get(OCHA), "pse_admin1.geojson").toString("utf8")) as { features: Feature[] };

function simplify(pts: number[][], tol: number): number[][] {
  if (pts.length < 3) return pts;
  let max = 0;
  let idx = 0;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / len;
    if (d > max) [max, idx] = [d, i];
  }
  if (max <= tol) return [a, b];
  return [...simplify(pts.slice(0, idx + 1), tol).slice(0, -1), ...simplify(pts.slice(idx), tol)];
}
const round = (p: number[]) => [+p[0].toFixed(4), +p[1].toFixed(4)];
const context: Record<string, number[][][]> = {};
for (const f of admin1.features) {
  const polys = (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) as number[][][][];
  const key = f.properties.adm1_name === "West Bank" ? "westBank" : f.properties.adm1_name === "Gaza Strip" ? "gaza" : null;
  if (!key) continue;
  context[key] = polys.map((p) => {
    // Split the closed ring so the simplifier keeps it closed.
    const ring = p[0];
    const mid = Math.floor(ring.length / 2);
    return [...simplify(ring.slice(0, mid + 1), 0.001).slice(0, -1), ...simplify(ring.slice(mid), 0.001)].map(round);
  });
}
if (!context.westBank || !context.gaza) fail("OCHA file: no West Bank or Gaza outline");
writeFileSync(path.join(OUT, "context.json"), JSON.stringify({ source: { name: "OCHA, State of Palestine subnational boundaries (HDX), CC BY-IGO", url: "https://data.humdata.org/dataset/cod-ab-pse" }, ...context }));
console.log(`context: West Bank ${context.westBank.map((r) => r.length)} pts, Gaza ${context.gaza.map((r) => r.length)} pts`);
