/** Historical final files with synthetic reporting order; never presented as authentic reporting timestamps or accuracy calibration. */
import fs from "node:fs";
import { geographicReplay, type LocalityCount } from "../../lib/live-forecast/geography";
import type { VoteMapElection } from "../../lib/votemap";
const results = [];
for (const election of ["2019a", "2019b", "2020", "2021", "2022"]) {
  const raw = JSON.parse(fs.readFileSync(`public/vote-map/${election}.json`, "utf8")) as VoteMapElection;
  // Named-list-only plumbing stress test. This intentionally does not score historical vote/threshold accuracy.
  const history = structuredClone(raw);
  history.rows = history.rows.map((r) => { r[3] = r.slice(4).reduce((a,b)=>a+b,0); return r; });
  history.envelopes.valid = history.envelopes.votes.reduce((a,b)=>a+b,0);
  const ids = history.lists.map((_,i)=>`list${i}`), total = history.lists.reduce((n,l)=>n+l.votes,0);
  const prior = Object.fromEntries(ids.map((id,i)=>[id,history.lists[i].votes/total]));
  const mapping = Object.fromEntries(ids.map((id,i)=>[id,[history.lists[i].letters]]));
  const blocs = Object.fromEntries(ids.map((id,i)=>[id,i%2 ? "net" : "opp"]));
  for (const order of ["small-first", "large-first"]) {
    const ordered = history.rows.toSorted((a,b)=>order === "small-first" ? a[3]-b[3] : b[3]-a[3]);
    for (const fraction of [0, .5, 1]) {
      const rows = ordered.slice(0,Math.round(ordered.length*fraction));
      const counts: LocalityCount[] = rows.map((r)=>({code:r[0],eligible:r[1],voted:r[3],valid:r[3],votes:Object.fromEntries(ids.map((id,i)=>[id,r[4+i]])),envelope:false}));
      if (fraction === 1) counts.push({code:9999,eligible:0,voted:history.envelopes.valid,valid:history.envelopes.valid,votes:Object.fromEntries(ids.map((id,i)=>[id,history.envelopes.votes[i]])),envelope:true});
      const coverage=Object.fromEntries(rows.map((r)=>[r[0],{countedStations:1,totalStations:1}]));
      const out=geographicReplay({history,counts,priorDraws:[prior,prior,prior],blocs,agreements:[],coverage,profileMap:mapping,envelopeComplete:fraction===1});
      if (out.publicationEligible || out.draws.some((d)=>Object.values(d).reduce((a,b)=>a+b,0)!==120)) throw new Error(`Replay failed: ${election}/${order}/${fraction}`);
      results.push({election,order,fraction,draws:out.draws.length,seatSum:120,publicationEligible:false});
    }
  }
}
console.log(JSON.stringify({kind:"synthetic_reporting_order_over_real_historical_final_localities",scoredCalibration:false,note:"Named-list-only stress test with oracle national priors and arbitrary alternating blocs, not historical prediction accuracy; three reproducible draws per stage. Actual partial-locality station metadata is still required before production assimilation.",checks:results},null,2));
