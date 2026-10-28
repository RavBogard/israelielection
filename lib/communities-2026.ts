import type { GeographySnapshot } from "./election-lifecycle/types";

/**
 * The 2026 locality block on the community pages. Each community uses the towns its own 2019 to 2022 tables already
 * use (data/charts/<slug>.json), named here by their Central Elections Committee locality code (the same codes as
 * public/vote-map/places.json). The figures are read from the stored CEC locality snapshot the count already keeps
 * (GET /api/election-lifecycle/geography), never invented: a town the file does not hold yet is "not yet counted".
 */
export type Town = { code: number; name: string };
export type CommunityDef = {
  towns: Town[];
  /** List ids always shown, in this order (profile ids; the vote map and the count share them). */
  pin: string[];
  /** Rows to show in all: the pinned lists plus the largest others by combined votes. */
  rows: number;
  /** One combined column only, for a community the page treats as one block (the ten Druze villages). */
  combinedOnly?: boolean;
};

const t = (code: number, name: string): Town => ({ code, name });

export const COMMUNITY_TOWNS: Record<string, CommunityDef> = {
  haredim: {
    towns: [t(6100, "Bnei Brak"), t(3797, "Modi'in Illit"), t(3780, "Beitar Illit"), t(1309, "Elad"), t(1137, "Kiryat Ye'arim")],
    pin: ["utj", "shas", "likud", "rz"],
    rows: 5,
  },
  druze: {
    towns: [t(494, "Daliyat al-Karmel"), t(502, "Yarka"), t(480, "Beit Jann"), t(496, "Hurfeish"), t(1296, "Kisra-Sumei"), t(1295, "Yanuh-Jat"), t(536, "Peqi'in"), t(485, "Julis"), t(525, "Sajur"), t(546, "Ein al-Asad")],
    pin: ["likud", "yashar", "dem"],
    rows: 7,
    combinedOnly: true,
  },
  "palestinian-citizens": {
    towns: [t(7300, "Nazareth"), t(2710, "Umm al-Fahm"), t(1161, "Rahat"), t(7500, "Sakhnin"), t(8800, "Shefa-Amr")],
    pin: ["jl", "raam"],
    rows: 4,
  },
  "russian-speakers": {
    towns: [t(1061, "Nof HaGalil"), t(1139, "Karmiel"), t(9600, "Kiryat Yam"), t(6200, "Bat Yam"), t(70, "Ashdod"), t(4000, "Haifa")],
    pin: ["yb", "likud"],
    rows: 5,
  },
  settlers: {
    towns: [t(3797, "Modi'in Illit"), t(3780, "Beitar Illit"), t(3616, "Ma'ale Adumim"), t(3730, "Givat Ze'ev"), t(3570, "Ariel"), t(3650, "Efrat"), t(3640, "Karnei Shomron"), t(3760, "Oranit"), t(3826, "Sha'ar Shomron"), t(3750, "Alfe Menashe"), t(3611, "Kiryat Arba")],
    pin: ["likud", "rz", "utj", "shas"],
    rows: 6,
    combinedOnly: true,
  },
  masorti: {
    towns: [t(1031, "Sderot"), t(246, "Netivot"), t(31, "Ofakim"), t(9200, "Beit She'an"), t(2800, "Kiryat Shmona"), t(2200, "Dimona")],
    pin: ["likud", "shas"],
    rows: 5,
    combinedOnly: true,
  },
  "religious-zionists": {
    towns: [t(3574, "Beit El"), t(3765, "Eli"), t(3557, "Kedumim"), t(3611, "Kiryat Arba"), t(3650, "Efrat"), t(681, "Givat Shmuel")],
    pin: ["rz", "otzma", "likud"],
    rows: 5,
  },
  secular: {
    towns: [t(5000, "Tel Aviv-Yafo"), t(6300, "Givatayim"), t(2650, "Ramat HaSharon"), t(6400, "Herzliya")],
    pin: ["likud", "yashar", "dem"],
    rows: 5,
  },
};

export type CommunityRow = { id: string; letters: string; votes: number; share: number; perTown: (number | null)[] };
export type CommunityBlock = { towns: Town[]; counted: number; valid: number; rows: CommunityRow[] };

/** The block for one community from the stored locality snapshot: combined shares of valid votes, and each town's own. */
export function communityBlock(snapshot: Pick<GeographySnapshot, "lists" | "rows">, def: CommunityDef): CommunityBlock {
  const byCode = new Map(snapshot.rows.map((r) => [r.code, r]));
  const present = def.towns.map((town) => byCode.get(town.code) ?? null);
  const counted = present.filter((r) => r && r.valid > 0);
  const valid = counted.reduce((n, r) => n + r!.valid, 0);
  const all = snapshot.lists.map((list) => {
    const votes = counted.reduce((n, r) => n + (r!.votes[list.id] ?? 0), 0);
    return { id: list.id, letters: list.letters, votes, share: valid > 0 ? votes / valid : 0, perTown: present.map((r) => (r && r.valid > 0 ? (r.votes[list.id] ?? 0) / r.valid : null)) };
  });
  const pinned = def.pin.map((id) => all.find((l) => l.id === id)).filter((l): l is CommunityRow => !!l);
  const rest = all.filter((l) => !def.pin.includes(l.id)).sort((a, b) => b.votes - a.votes).slice(0, Math.max(0, def.rows - pinned.length));
  const rows = [...pinned, ...rest].sort((a, b) => b.votes - a.votes || a.letters.localeCompare(b.letters));
  return { towns: def.towns, counted: counted.length, valid, rows };
}
