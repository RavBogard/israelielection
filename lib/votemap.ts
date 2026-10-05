/**
 * The vote map: Knesset results by locality, 2019–2022, from the Central Elections
 * Committee's per-locality files (expc.csv). scripts/vote-map/build.mts writes the
 * files in public/vote-map/; this module holds their shapes and the pure helpers the
 * build, the tests and the map share.
 */

/** One election file, public/vote-map/<id>.json. */
export type VoteMapElection = {
  id: string;
  label: string;
  date: string;
  knesset: number;
  source: { results: string; csv: string; sha256: string; fetched: string };
  /** Named lists (≥1% nationally), in the order of `rows` columns after the totals. */
  lists: { letters: string; name: string; votes: number; seats: number }[];
  national: { eligible: number; voted: number; valid: number; other: number };
  /** Special-envelope votes: cast outside the voter's home station, so they have no locality. */
  envelopes: { valid: number; votes: number[]; other: number };
  /** [code, eligible, voted, valid, ...votes per named list]; "other lists" = valid − the rest. */
  rows: number[][];
};

/** public/vote-map/places.json: code → [English name, lat, lng] (lat/lng 0 when unknown). */
export type Places = Record<string, [string, number, number]>;

/** Splits a CEC expc.csv into its header and rows; drops the empty column a trailing comma makes. */
export function splitCsv(text: string): { head: string[]; rows: string[][] } {
  const lines = text.replace(/^﻿/, "").trim().split(/\r?\n/).map((l) => l.split(","));
  const head = lines[0].map((h) => h.trim());
  while (head.length && !head[head.length - 1]) head.pop();
  const rows = lines.slice(1).filter((r) => r.length >= head.length).map((r) => r.slice(0, head.length).map((c) => c.trim()));
  return { head, rows };
}

/** The CEC envelope pseudo-locality: 99999 in April 2019, 9999 after. */
export const isEnvelopeCode = (code: number) => code === 9999 || code === 99999;

/** House spellings (ruling 32) over the CBS transliteration, by locality code. */
export const NAME_OVERRIDES: Record<number, string> = {
  6100: "Bnei Brak",
  2610: "Beit Shemesh",
  3797: "Modi'in Illit",
  3780: "Beitar Illit",
  9200: "Beit She'an",
  1034: "Kiryat Malachi",
  2800: "Kiryat Shmona",
  3616: "Ma'ale Adumim",
  3611: "Kiryat Arba",
  681: "Givat Shmuel",
  3574: "Beit El",
  31: "Ofakim",
  8800: "Shefa-Amr",
  494: "Daliyat al-Karmel",
  534: "Isfiya",
  502: "Yarka",
  481: "Maghar",
  9000: "Beersheba",
  7900: "Petah Tikva",
  8300: "Rishon LeZion",
  3570: "Ariel",
  5000: "Tel Aviv-Yafo",
  2600: "Eilat",
  8000: "Safed",
  6400: "Herzliya",
  9100: "Nahariya",
  8700: "Ra'anana",
  1139: "Karmiel",
  7100: "Ashkelon",
  7200: "Ness Ziona",
  6900: "Kfar Saba",
  1200: "Modi'in-Maccabim-Re'ut",
  1015: "Mevaseret Zion",
  1167: "Caesarea",
  3730: "Givat Ze'ev",
  6300: "Givatayim",
  240: "Yokneam Illit",
  1020: "Or Akiva",
  634: "Kafr Qasim",
  4100: "Katzrin",
  3557: "Kedumim",
  3640: "Karnei Shomron",
  3779: "Kochav Yaakov",
  1224: "Kochav Yair",
  9400: "Yehud-Monosson",
  3400: "Hebron",
  1309: "Elad",
  3560: "Elkana",
  2730: "Tayibe",
  3563: "Tekoa",
  6000: "Baqa al-Gharbiyye",
  1063: "Ma'alot-Tarshiha",
  1060: "Lakiya",
  1059: "Kuseife",
  1031: "Sderot",
  // In earlier files only, so not in the 2022 CBS join; transliterated from the CEC Hebrew name.
  3778: "Etz Efraim",
  3720: "Sha'arei Tikva",
  3637: "Ma'ale Shomron",
  3620: "Niran",
};

/** CBS → common English: "Qiryat" → "Kiryat", "Bet X" → "Beit X"; then the house list wins. */
export function englishName(code: number, cbs: string | null): string | null {
  if (NAME_OVERRIDES[code]) return NAME_OVERRIDES[code];
  if (!cbs) return null;
  return cbs.replace(/^Qiryat /, "Kiryat ").replace(/^Bet /, "Beit ");
}

/* ---------- TopoJSON (the subset the boundary file uses) ---------- */

export type Topology = {
  type: "Topology";
  transform?: { scale: [number, number]; translate: [number, number] };
  arcs: [number, number][][];
  objects: Record<string, { type: "GeometryCollection"; geometries: TopoGeometry[] }>;
};
export type TopoGeometry =
  | { type: "Polygon"; arcs: number[][]; properties: { code: number; src: string } }
  | { type: "MultiPolygon"; arcs: number[][][]; properties: { code: number; src: string } };

/** Decodes every arc to absolute [lng, lat] (quantized arcs are delta-encoded). */
export function decodeArcs(t: Topology): [number, number][][] {
  const tr = t.transform;
  if (!tr) return t.arcs;
  const [sx, sy] = tr.scale;
  const [tx, ty] = tr.translate;
  return t.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * sx + tx, y * sy + ty] as [number, number];
    });
  });
}

/** The rings of a polygon geometry as point lists (a negative index ~i is arc i reversed). */
export function ringsOf(g: TopoGeometry, arcs: [number, number][][]): [number, number][][] {
  const polys = g.type === "Polygon" ? [g.arcs] : g.arcs;
  const out: [number, number][][] = [];
  for (const poly of polys) {
    for (const ring of poly) {
      const pts: [number, number][] = [];
      for (const i of ring) {
        const a = i < 0 ? arcs[~i].slice().reverse() : arcs[i];
        // Consecutive arcs share their joining point.
        pts.push(...(pts.length ? a.slice(1) : a));
      }
      out.push(pts);
    }
  }
  return out;
}

/** Equirectangular projection scaled for Israel's latitude; y grows downward. */
export const LAT0 = 31.5;
const KX = Math.cos((LAT0 * Math.PI) / 180);
export const project = ([lng, lat]: [number, number]): [number, number] => [lng * KX, -lat];

/** An SVG path for rings already projected, rounded to `dp` decimals. */
export function pathOf(rings: [number, number][][], dp = 4): string {
  const f = (n: number) => +n.toFixed(dp);
  return rings
    .map((r) => {
      const pts = r.map(project);
      return "M" + pts.map(([x, y]) => `${f(x)},${f(y)}`).join("L") + "Z";
    })
    .join("");
}

/* ---------- Shares ---------- */

/** Bin edges for a party's share of a locality's valid votes (sequential, one hue). */
export const BINS = [0.02, 0.05, 0.1, 0.2, 0.35, 0.5] as const;

/** 0 for under 2%, …, BINS.length for 50% and over. */
export function binOf(share: number): number {
  let i = 0;
  while (i < BINS.length && share >= BINS[i]) i++;
  return i;
}
