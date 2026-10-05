import { historicalElections, historicalPlaces } from "./votemap-data";
import { averagePoll, exitPolls, dataUpdated, mainPolls, parties, pledgeRules, pollsData } from "./data";
import { comparisonIssues, evidenceLabel } from "./positions";
import { arrangement, arrangementWarnings, restoreRoles, roleOf, ROLE_LABELS } from "./coalition-arrangement";
import { pollLabel } from "./polls";
import { fetchCount, resultsConfig } from "./results-live";
import { resultsAsPoll, RESULTS_ID } from "./results";
import { localityHistory, mapHref, readMapState } from "./locality-history";
import type { SourcedExport } from "./export";
export async function buildExport(kind: string, q: URLSearchParams): Promise<SourcedExport | null> {
  const ids = [...new Set((q.get("p") ?? "").split(",").filter((id)=>parties.some((p)=>p.id===id)))];
  if (kind === "issue") {
    const issues = comparisonIssues(); const chosenIssues = q.get("issue") ? issues.filter((i)=>i.key===q.get("issue") || i.key.startsWith(`${q.get("issue")}-`)) : issues;
    if (!chosenIssues.length) return null;
    const selected = ids.length ? parties.filter((p)=>ids.includes(p.id)) : parties.filter((p)=>p.coalitionCard!=="hidden");
    const sources = new Map<string,string>();
    const rows = chosenIssues.flatMap((issue)=>selected.map((p)=> { const row=issue.file.rows.find((r)=>r.party===p.id); if(row?.url && /^https?:\/\//.test(row.url))sources.set(row.url,row.source ?? "Cited evidence"); return [issue.label,issue.file.question ?? issue.file.title,p.name, row?.status==="none" || !row?.text ? `Not established by these sources${row?.text ? `; retained source context: ${row.text}` : ""}` : row.declined || row.status==="declined" ? "Declined to answer" : row.text, evidenceLabel(row),row?.source ?? "Source not recorded",row?.url ?? null]; }));
    return {title: chosenIssues.length===1 ? chosenIssues[0].file.title : "Selected issue comparison", asOf:dataUpdated, assumptions:[`Selected lists: ${selected.map((p)=>p.name).join(", ")}.`,"Recorded answers are evidence, not a forecast. Missing evidence is not a policy position. Evidence publication dates are shown separately from source checks."],headers:["Issue","Question","List","Recorded answer / status","Evidence date and check","Source","Source link"],rows,sources:[...sources].map(([url,label])=>({url,label})),view:`/compare?${new URLSearchParams({p:selected.map((p)=>p.id).join(",")})}`};
  }
  if (kind === "coalition") {
    const roles=restoreRoles(q,parties.map((p)=>p.id)); const requested=q.get("poll") ?? averagePoll.id;
    let poll=[averagePoll,...exitPolls,...mainPolls].find((p)=>p.id===requested); const assumptions:string[]=[];
    if(requested===RESULTS_ID) { const live=await fetchCount(); if(live.state!=="open") return {title:"Coalition arrangement — count unavailable",asOf:resultsConfig.election,assumptions:["The selected results count is unavailable. No poll average has been substituted. Reopen this export when a validated count is available."],headers:["List","Assigned role"],rows:parties.map((p)=>[p.name,ROLE_LABELS[roleOf(p.id,roles.cabinet,roles.overrides)]]),sources:[{label:resultsConfig.source.label,url:resultsConfig.source.url}],view:`/coalition-builder?${q}`}; poll=resultsAsPoll(live.count,resultsConfig,live.fetchedAt,live); assumptions.push(`Count ${live.freshness}; captured ${live.fetchedAt}. Source update: ${live.sourceUpdatedAt ?? "not provided"}. Estimated seats, not official allocation.`); }
    if(!poll)return null;
    const vote=arrangement(roles.cabinet,roles.overrides,parties,poll);
    const averaged=poll.id===averagePoll.id;
    assumptions.push(`Selected seat basis: ${averaged ? "Normalized coalition average" : pollLabel(poll)}, ${poll.published}.`,"Every assigned role is hypothetical. Cabinet membership, outside support and abstention are distinct. An initial confidence vote requires more for than against; 61 seats is the absolute-majority planning target.",`Cabinet ${vote.cabinet}; votes for ${vote.yes}, against ${vote.no}, hypothetical abstention ${vote.abstain}. ${vote.complete ? `Arithmetic outcome: ${vote.outcome}.` : "Coverage or rounded totals are incomplete; no confidence outcome inferred."}`);
    if(vote.approximate)assumptions.push("Fractional averages illustrate support; real MKs cast whole votes. This hypothetical arithmetic is not a prediction of a parliamentary vote.");
    for(const warning of arrangementWarnings(roles.cabinet,roles.overrides,parties,pledgeRules)) assumptions.push(`Recorded ${warning.kind}: ${warning.message} Source: ${warning.source}`);
    if(averaged)assumptions.push(`${pollsData.config.currentWindowDays}-day publication window; one latest poll per publisher; square-root sample-size weights, median n when absent; passing-only means; near-threshold lists excluded and sum scaled down only if over 120.`, `Inputs: ${mainPolls.map((p)=>`${p.pollster} ${p.published} (n ${p.n ?? "not recorded"})`).join("; ")}.`);
    return { title:"Selected coalition arrangement",asOf:poll.resultState?.capturedAt ?? poll.published,assumptions,headers:["List","Assigned role","Seats / coverage"],rows:parties.map((p)=>[p.name,ROLE_LABELS[roleOf(p.id,roles.cabinet,roles.overrides)],poll.results[p.id]?.seats ?? (poll.combined.find((g)=>g.parties.includes(p.id)) ? "Reported combined; cannot split" : "Not reported")]),sources:[...(averaged?mainPolls:[poll]).filter((p)=>p.url && /^https?:\/\//.test(p.url)).map((p)=>({label:`${p.pollster}, ${p.published}`,url:p.url!})),{label:"Initial confidence: Basic Law, The Government",url:"https://main.knesset.gov.il/EN/activity/Documents/BasicLawsPDF/BasicLawTheGovernment.pdf"},{label:"Polling average method",url:"https://www.israelielection.org/polls#method"}],view:`/coalition-builder?${q}` };
  }
  if(kind==="locality") {
    const elections=historicalElections; const places=historicalPlaces;
    const state=readMapState(q,places); if(state.locality===null)return null;
    const election=elections.find((e)=>e.id===state.election)!; const selected=readMapState(q,places,election);
    const history=localityHistory(elections,state.locality);
    return {title:`${places[state.locality][0]}: locality voting history`,asOf:`${elections[0].date} through ${elections.at(-1)!.date}; source files fetched ${[...new Set(elections.map((e)=>e.source.fetched))].sort().join(", ")}`,assumptions:[`Selected observation: ${election.label}, ${selected.list}; locality code ${state.locality}; map view ${({single:"one list’s vote share",mix:"vote mix",leader:"leading list"})[state.mode]}.`,`Election-specific lists retain original names and ballot letters. Ballot letters do not identify the same political party across elections.`,"Shares use valid local votes; turnout is voted / eligible. Missing rows or denominators are unavailable, not zero. Special envelopes have no locality and are excluded. Aggregate changes cannot establish individual voter migration; population, eligibility and boundaries can change."],headers:["Election","List","Letters","Votes","Share of valid votes (%)","Eligible","Voted","Valid","Turnout (%)"],rows:history.flatMap(({election:e,row,turnout,lists})=>!row?[[e.label,"No locality row",null,null,null,null,null,null,null]]: [...lists.map((l)=>[e.label,l.name,l.letters,l.votes,l.share===null?null:(l.share*100).toFixed(2),row[1],row[2],row[3],turnout===null?null:(turnout*100).toFixed(2)]),[e.label,"Other lists",null,row[3]-lists.reduce((n,l)=>n+l.votes,0),row[3]>0?((row[3]-lists.reduce((n,l)=>n+l.votes,0))/row[3]*100).toFixed(2):null,row[1],row[2],row[3],turnout===null?null:(turnout*100).toFixed(2)]]),sources:elections.map((e)=>({label:`CEC ${e.label}, fetched ${e.source.fetched}`,url:e.source.csv})),view:mapHref(state.election,selected.list,state.locality,state.mode)};
  }
  return null;
}
