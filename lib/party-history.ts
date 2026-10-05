import json from "@/data/party-history.json";
export const HISTORY_KINDS = {
  party: "Party established", alliance: "Electoral alliance", merger: "Party merger", partial: "Partial merger",
  split: "Split or departure", rename: "Name change", leader: "Leader's political path", list: "Published 2026 list",
} as const;
export type HistoryKind = keyof typeof HISTORY_KINDS;
export type HistoryEvent = { date: string; kind: HistoryKind; inputs: string[]; output: string; text: string; sources: string[] };
export type PartyHistory = { id: string; name: string; family: string; related: string[]; events: HistoryEvent[] };
export const histories = json.histories as PartyHistory[];
export const historySources: Record<string,{name:string;url:string;date:string|null}> = json.sources;
export const historyFamilies = [...new Set(histories.map(h=>h.family))];
export function filterHistories(family: string, query: string) {
  const q = query.trim().toLocaleLowerCase();
  return histories.filter(h=>(family === "all" || h.family === family) && [h.name, ...h.events.flatMap(e=>[e.output,...e.inputs])].some(t=>t.toLocaleLowerCase().includes(q)));
}
