import type { Places, VoteMapElection } from "./votemap";
import {mapMode,type MapMode} from "./votemap-visual";
export const HISTORY_ELECTIONS = ["2019a", "2019b", "2020", "2021", "2022"] as const;
export function readMapState(q: URLSearchParams, places?: Places, election?: VoteMapElection) {
  const requested = q.get("election") ?? "2022";
  const id = HISTORY_ELECTIONS.includes(requested as typeof HISTORY_ELECTIONS[number]) ? requested : "2022";
  const raw = q.get("locality"); const code = raw && /^\d{1,5}$/.test(raw) ? Number(raw) : null;
  const locality = code && (!places || places[code]) && code !== 9999 && code !== 99999 ? code : null;
  const list = q.get("list") ?? "Likud";
  return { election: id, locality, mode:mapMode(q.get("mode")), list: election && election.id === id ? election.lists.find((l) => l.name === list)?.name ?? election.lists[0].name : list };
}
export function mapHref(election: string, list: string, locality: number | null, mode:MapMode="single") {
  const q = new URLSearchParams({ election, list }); if (locality !== null) q.set("locality", String(locality)); if(mode!=="single")q.set("mode",mode);return `/vote-map?${q}`;
}
/** Join by locality code only; keep each election's original lists, never reuse a ballot letter as party identity. */
export function localityHistory(elections: VoteMapElection[], code: number) {
  return [...elections].sort((a,b) => a.date.localeCompare(b.date)).map((election) => {
    const row = election.rows.find((r) => r[0] === code);
    return { election, row: row ?? null, turnout: row && row[1] > 0 ? row[2] / row[1] : null, lists: row ? election.lists.map((list,i) => ({ ...list, votes: row[4+i], share: row[3] > 0 ? row[4+i] / row[3] : null })).sort((a,b) => b.votes-a.votes) : [] };
  });
}
