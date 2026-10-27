import file from "@/data/outgoing-seats.json";

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
