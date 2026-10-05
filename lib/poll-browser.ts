import { byNewest } from "./polls";
import type { Poll } from "./types";
export type PollFilter = { from: string; to: string; pollster: string; parties: string[] };
export const validDateFilter = (value: string) => /^\d{4}-\d\d-\d\d$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value ? value : "";
export function filterPolls(polls: Poll[], filter: PollFilter) {
  return polls.filter((poll) => (!filter.from || poll.published >= filter.from) && (!filter.to || poll.published <= filter.to) && (!filter.pollster || poll.pollster === filter.pollster) && filter.parties.every((id) => !!poll.results[id] || poll.combined.some((group) => group.parties.includes(id)))).sort(byNewest);
}
export function readPollFilter(query: URLSearchParams, polls: Poll[], ids: string[]): PollFilter {
  return { from: validDateFilter(query.get("from") ?? ""), to: validDateFilter(query.get("to") ?? ""), pollster: polls.some((p) => p.pollster === query.get("pollster")) ? query.get("pollster")! : "", parties: [...new Set((query.get("party") ?? "").split(",").filter((id) => ids.includes(id)))] };
}

/** Publication metadata and a list figure's own date are separate evidence. */
export function undatedListNames(poll:Poll,parties:readonly {id:string;name:string}[]):string[]{return parties.filter(p=>poll.results[p.id]?.dateUncertain).map(p=>p.name);}
