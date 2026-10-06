import json from "@/data/party-history.json";
export const HISTORY_KINDS = {
  party: "Party established", alliance: "Electoral alliance", merger: "Party merger", partial: "Partial merger",
  split: "Split or departure", rename: "Name change", leader: "Leader's political path", list: "Published 2026 list",
} as const;
export type HistoryKind = keyof typeof HISTORY_KINDS;
export type HistoryEvent = { date: string; kind: HistoryKind; inputs: string[]; output: string; letters?: string; text: string; sources: string[] };
export type PartyHistory = { id: string; name: string; family: string; related: string[]; events: HistoryEvent[] };
export const histories = json.histories as PartyHistory[];
export const historySources: Record<string,{name:string;url:string;date:string|null}> = json.sources;
export const historyFamilies = [...new Set(histories.map(h=>h.family))];
export function filterHistories(family: string, query: string) {
  const q = query.trim().toLocaleLowerCase();
  return histories.filter(h=>(family === "all" || h.family === family) && [h.name, ...h.events.flatMap(e=>[e.output,e.letters ?? "",...e.inputs])].some(t=>t.toLocaleLowerCase().includes(q)));
}
/** Rows for marks along one lane, given their positions (% of the track) in time order: a mark closer than `close` to the last mark in a row goes to the next free row. */
export function markRows(xs: number[], close = 5): number[] {
  const last: number[] = [];
  return xs.map((v) => { let r = last.findIndex((l) => v - l >= close); if (r < 0) r = last.length; last[r] = v; return r; });
}
