import type {Metadata} from "next";
import Link from "next/link";
import type {ReactNode} from "react";
import {BuilderGlyph,PartyMapGlyph,PollsGlyph,VoteMapGlyph} from "@/components/HomeGlyphs";
import {BallotGlyph,ChangesGlyph,CompareGlyph,FamilyGlyph,GlossaryGlyph,GovernmentGlyph,LensGlyph,NewsGlyph,ResultsGlyph,SheetsGlyph,TimelineGlyph} from "./glyphs";
import briefingsJson from "@/data/briefings/_index.json";
import questionsJson from "@/data/comparison-questions.json";
import glossaryJson from "@/data/glossary.json";
import outgoingJson from "@/data/outgoing-government.json";
import historyJson from "@/data/party-history.json";
import timelineJson from "@/data/timeline.json";
import election2022 from "@/public/vote-map/2022.json";
import type {Briefing} from "@/lib/briefing";
import {COMMUNITIES,GUIDES,ISSUES} from "@/lib/articles";
import {ballotLists} from "@/lib/ballot";
import {changes} from "@/lib/changes";
import {allPolls,averagePoll,mainPolls,parties,pollsData} from "@/lib/data";
import {longDate,mediumDate,shortDate} from "@/lib/format";
import {initialOf} from "@/lib/glossary";
import {journeys} from "@/lib/journeys";
import {clip} from "@/lib/nav-facts";
import {blocTotals,isExit} from "@/lib/polls";
import {resultsConfig} from "@/lib/results-live";
import {NAV_GROUPS,NAV_UTILITIES} from "@/lib/site";
import PageHead from "@/components/PageHead";
import "@/components/home.css";
import "./resources.css";

export const metadata:Metadata={title:"All resources",description:"Every section, election tool and guide on Israel Votes 2026, with a picture and a current fact for each."};
// Captions are live facts; the results caption changes when polls close.
export const revalidate=3600;

const IL=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Jerusalem",hour:"numeric",minute:"2-digit"});
const r=(x:number)=>Math.round(x);

function tiles():Record<string,{fig:ReactNode;caption?:string}>{
 const closed=Date.now()>=Date.parse(resultsConfig.pollsClose);
 const b=(briefingsJson as Briefing[]).toSorted((x,y)=>y.date.localeCompare(x.date))[0];
 const blocsNow=blocTotals(averagePoll,parties);
 const trend=allPolls.filter(p=>!isExit(p));
 const steps=outgoingJson.events.filter(e=>e.seatsAfter!=null).map(e=>({date:e.date,seats:e.seatsAfter as number}));
 const changeDates=changes.map(c=>c.date).sort();
 const lanes=historyJson.histories.map(h=>h.events.map(e=>e.date.slice(0,4)));
 const terms=glossaryJson.terms;
 const listed=parties.filter(p=>(averagePoll.results[p.id]?.seats??0)>0).length;
 return {
  "/polls":{fig:<PollsGlyph polls={trend} parties={parties} config={pollsData.config}/>,caption:`${mainPolls.length} current polls in the average, newest ${shortDate(mainPolls[0].published)}`},
  "/news":{fig:b?<NewsGlyph date={shortDate(b.date)} sentences={b.sentences.map(s=>s.text)}/>:<SheetsGlyph n={1} k="news"/>,caption:b?`${longDate(b.date)}: ${clip(b.sentences[0]?.text??"",90)}`:undefined},
  "/changes":{fig:<ChangesGlyph dates={changeDates}/>,caption:`${changes.length} logged changes, newest dated ${shortDate(changeDates.at(-1)!)}`},
  "/results":{fig:<ResultsGlyph closed={closed}/>,caption:closed?"Polls have closed; the count as it comes in":`The count opens when polls close, ${IL.format(new Date(resultsConfig.pollsClose))} Israel time on October 27`},
  "/government":{fig:<GovernmentGlyph points={steps}/>,caption:`Outgoing coalition at ${steps.at(-1)!.seats} seats since ${mediumDate(steps.at(-1)!.date)}`},
  "/parties":{fig:<PartyMapGlyph parties={parties} poll={averagePoll}/>,caption:`${listed} lists win seats in the polling average`},
  "/compare":{fig:<CompareGlyph questions={questionsJson.questions.length} lists={parties.length}/>,caption:`${questionsJson.questions.length} questions across ${parties.length} lists`},
  "/coalition-builder":{fig:<BuilderGlyph parties={parties} poll={averagePoll}/>,caption:`Netanyahu bloc ${r(blocsNow.net)}, anti-Netanyahu bloc ${r(blocsNow.opp)}; 61 is a majority`},
  "/party-history":{fig:<FamilyGlyph lanes={lanes}/>,caption:`${lanes.length} party histories, from ${lanes.flat().sort()[0].slice(0,4)}`},
  "/ballot":{fig:<BallotGlyph letters={ballotLists.map(l=>l.letters)}/>,caption:`${ballotLists.length} submitted lists`},
  "/vote-map":{fig:<VoteMapGlyph/>,caption:`${(election2022 as {rows:unknown[]}).rows.length.toLocaleString("en-US")} localities in the 2022 count`},
  "/communities":{fig:<SheetsGlyph n={COMMUNITIES.length} k="communities"/>,caption:`${COMMUNITIES.length} communities`},
  "/issues":{fig:<SheetsGlyph n={ISSUES.length} k="issues"/>,caption:`${ISSUES.length} issues, each with recorded positions`},
  "/how-it-works":{fig:<SheetsGlyph n={GUIDES.length} k="guides"/>,caption:`${GUIDES.length} guides`},
  "/timeline":{fig:<TimelineGlyph elections={timelineJson.elections.map(e=>e.date)} terms={timelineJson.governments.map(g=>({from:g.from,to:g.to||"2026-10-27"}))}/>,caption:`${timelineJson.elections.length} elections and ${timelineJson.events.length} events since 1977`},
  "/glossary":{fig:<GlossaryGlyph initials={terms.map(x=>initialOf(x.term))}/>,caption:`${terms.length} terms, ${terms.filter(x=>x.hebrew).length} with the Hebrew`},
  "/american-lens":{fig:<LensGlyph/>},
 };
}

export default function Page(){
 const t=tiles();
 return <div className="wrap resource-directory"><PageHead title="All resources" standfirst="Every tool and guide on the site, with a current fact from each." />
  {NAV_GROUPS.map(g=><section key={g.id} className="rd-group" aria-labelledby={`resources-${g.id}`}><h2 id={`resources-${g.id}`} className="sec-h3">{g.label}</h2>
   <ul className="rd-tiles">{g.items.map(n=><li key={n.href}><Link href={n.href}>{t[n.href]?.fig}<span className="t">{n.label}</span><span className="p">{t[n.href]?.caption??n.description}</span></Link></li>)}</ul>
  </section>)}
  <section className="rd-group" aria-labelledby="resources-more"><h2 id="resources-more" className="sec-h3">Start, search and contact</h2>
   <ul className="rd-more">{NAV_UTILITIES.filter(n=>n.href!=="/resources").map(n=><li key={n.href}><Link href={n.href}>{n.label}</Link><p>{n.href==="/start"?`${journeys.routes.length} guided routes: ${journeys.routes.map(x=>`“${x.title}”`).join(" and ")}`:n.description}</p></li>)}</ul>
  </section>
 </div>;
}
