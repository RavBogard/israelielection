import file from "@/data/outgoing-seats.json";
import partyFile from "@/data/parties.json";

export type OutgoingComponent = { faction: string; seats: number };
export type OutgoingSource = { name: string; url: string; date: string | null };
export type OutgoingList = {
  seats: number | null;
  components: OutgoingComponent[];
  note: string;
  sources: OutgoingSource[];
};
export type OutgoingSeatsFile = {
  checked: string;
  rule: string;
  sourceNote: string;
  lists: Record<string, OutgoingList>;
  reconciliation: {
    listSum: number;
    notRunning: OutgoingComponent[];
    total: number;
    note: string;
  };
};

export const outgoingSeatsData = file as OutgoingSeatsFile;

/** Seats the list's faction(s) held in the outgoing 25th Knesset at dissolution; null when unknown or not a listed id. */
export function outgoingSeats(id: string): number | null {
  return outgoingSeatsData.lists[id]?.seats ?? null;
}

/** Each list's bloc, from data/parties.json. */
export const blocOfList: Record<string, string> = Object.fromEntries(partyFile.parties.map((p) => [p.id, p.bloc]));

/** Seats each bloc's lists held in the outgoing Knesset (net 68, opp 42, mid 0, arab 10 at dissolution). */
export const outgoingBlocSeats: Record<string, number> = Object.entries(outgoingSeatsData.lists).reduce<Record<string, number>>((acc, [id, list]) => {
  const bloc = blocOfList[id];
  if (bloc) acc[bloc] = (acc[bloc] ?? 0) + (list.seats ?? 0);
  return acc;
}, { net: 0, opp: 0, mid: 0, arab: 0 });
