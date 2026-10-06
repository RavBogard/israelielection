import e2020 from "@/public/vote-map/2020.json";
import e2022 from "@/public/vote-map/2022.json";
import places from "@/public/vote-map/places.json";
import { mapHref } from "@/lib/locality-history";
import type { VoteMapElection } from "@/lib/votemap";
import { localLeader, voteMix } from "@/lib/votemap-visual";

const ELECTIONS: Record<string, VoteMapElection> = { "2020": e2020 as unknown as VoteMapElection, "2022": e2022 as unknown as VoteMapElection };

/**
 * Each community page's "how these towns voted" figure ends with the vote map set to one of its towns:
 * that election, that locality, and the list named here or else the town's largest list.
 */
export const VOTE_MAP_LINKS: Record<string, { place: string; election: keyof typeof ELECTIONS; list?: string }> = {
  "druze.vote": { place: "Daliyat al-Karmel", election: "2022" },
  "ethiopian-israelis.kiryat-malachi": { place: "Kiryat Malachi", election: "2020" },
  "haredim.towns": { place: "Bnei Brak", election: "2022", list: "United Torah Judaism" },
  "masorti.six-towns": { place: "Sderot", election: "2022" },
  "palestinian-citizens.towns": { place: "Nazareth", election: "2022" },
  "religious-zionists.towns": { place: "Beit El", election: "2022", list: "Religious Zionism–Otzma Yehudit" },
  "russian-speakers.yb-towns": { place: "Nof HaGalil", election: "2022", list: "Yisrael Beiteinu" },
  "secular.largest-list": { place: "Tel Aviv-Yafo", election: "2022" },
  "settlers.vote-2022": { place: "Ariel", election: "2022" },
};

/** The link for a chart, or null; throws when a configured town or list is not in the vote map's files. */
export function voteMapLink(chartId: string): { href: string; text: string } | null {
  const cfg = VOTE_MAP_LINKS[chartId];
  if (!cfg) return null;
  const e = ELECTIONS[cfg.election];
  const entry = Object.entries(places as unknown as Record<string, [string, number, number]>).find(([, p]) => p[0] === cfg.place);
  if (!entry) throw new Error(`Vote map link for ${chartId}: no locality named "${cfg.place}"`);
  const code = Number(entry[0]);
  const row = e.rows.find((r) => r[0] === code);
  const lead = localLeader(voteMix(e, row));
  const list = cfg.list ?? (lead.status === "named" ? lead.names[0] : null);
  if (!list || !e.lists.some((l) => l.name === list)) throw new Error(`Vote map link for ${chartId}: no list "${list}" in ${e.label}`);
  const i = e.lists.findIndex((l) => l.name === list);
  const share = row && row[3] ? ` (${((row[4 + i] / row[3]) * 100).toFixed(1)}%)` : "";
  return { href: mapHref(e.id, list, code), text: `See ${cfg.place} on the vote map: ${list}${share}, ${e.label}` };
}
