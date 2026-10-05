"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { filterPolls, readPollFilter, undatedListNames } from "@/lib/poll-browser";
import { isExit, pollLabel } from "@/lib/polls";
import type { Party, Poll, PollsConfig } from "@/lib/types";
import CorrectionLink from "./CorrectionLink";

type Props = { polls: Poll[]; parties: Pick<Party, "id" | "name" | "short">[]; currentIds: string[]; config: PollsConfig };
export default function PollBrowser({ polls, parties, currentIds, config }: Props) {
  const params = useSearchParams(); const router = useRouter();
  const query = params.toString();
  const [filter, setFilter] = useState(() => readPollFilter(new URLSearchParams(query), polls, parties.map((p) => p.id)));
  const [active, setActive] = useState<string | null>(null);
  const methodRef=useRef<HTMLElement>(null),methodOpener=useRef<HTMLButtonElement>(null);
  useEffect(()=>{if(active&&methodRef.current){methodRef.current.focus({preventScroll:true});methodRef.current.scrollIntoView({block:"start"});}},[active]);
  function closeMethod(){setActive(null);methodOpener.current?.focus();}
  // A shared URL/history navigation replaces the applied filter, never a typed keystroke.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setFilter(readPollFilter(new URLSearchParams(query), polls, parties.map((p) => p.id))), [query, polls, parties]);
  const visible = useMemo(() => filterPolls(polls, filter), [polls, filter]);
  const method = polls.find((p) => p.id === active);
  const undated=visible.flatMap(poll=>undatedListNames(poll,parties));
  function apply(clear = false) {
    const next = new URLSearchParams(params);
    for (const key of ["from", "to", "pollster", "party"]) next.delete(key);
    if (clear) setFilter({ from: "", to: "", pollster: "", parties: [] });
    else { if (filter.from) next.set("from", filter.from); if (filter.to) next.set("to", filter.to); if (filter.pollster) next.set("pollster", filter.pollster); if (filter.parties.length) next.set("party", filter.parties.join(",")); }
    router.push(`/polls${next.size ? `?${next}` : ""}#browser`, { scroll: false });
  }
  return <section id="browser" className="poll-browser" aria-labelledby="browser-h"><h2 id="browser-h" className="sec-h">Browse every poll</h2>
    <form className="poll-controls" onSubmit={(event) => { event.preventDefault(); apply(); }}>
      <label>Published from<input type="date" value={filter.from} onChange={(e) => setFilter({ ...filter, from: e.target.value })} /></label><label>Published through<input type="date" value={filter.to} onChange={(e) => setFilter({ ...filter, to: e.target.value })} /></label>
      <label>Publisher / pollster<select value={filter.pollster} onChange={(e) => setFilter({ ...filter, pollster: e.target.value })}><option value="">All publishers</option>{[...new Set(polls.map((p) => p.pollster))].sort().map((p) => <option key={p}>{p}</option>)}</select></label><button type="submit">Apply to link</button><button type="button" onClick={() => apply(true)}>Clear filters</button>
    </form>
    <details className="poll-party-filter"><summary>Require coverage of selected lists ({filter.parties.length})</summary><p className="note">A combined group report counts as coverage here; it does not establish a separate total for one constituent.</p><div className="poll-choices">{parties.map((p) => <label key={p.id}><input type="checkbox" checked={filter.parties.includes(p.id)} onChange={() => setFilter({ ...filter, parties: filter.parties.includes(p.id) ? filter.parties.filter((id) => id !== p.id) : [...filter.parties, p.id] })} />{p.name}</label>)}</div></details>
    <p role="status" aria-live="polite">{visible.length} of {polls.length} polls. Newest first.{filter.from && filter.to && filter.from > filter.to && " The start date is after the end date."}</p><p className="poll-scroll-cue">Scroll the table sideways to see every list. Date and publisher stay visible. “Below” is a reported threshold failure; “not reported” is missing separate evidence.</p>
    {undated.length>0&&<p className="note">† A marked list figure has no recorded date of its own. The row date is the poll entry’s publication date, not a verified date for that figure. These figures remain in the register; the date flag does not change the site’s inclusion rules.</p>}
    {visible.length ? <div className="table-scroll sheet poll-scroller" tabIndex={0} role="region" aria-label="Poll results, horizontally scrollable"><table className="data-table poll-table"><thead><tr><th scope="col" className="poll-identity">Published / publisher</th><th scope="col" className="num">Sample n</th>{parties.map((p) => <th scope="col" className="num" key={p.id} title={p.name}>{p.short}</th>)}<th scope="col">Source</th></tr></thead><tbody>{visible.map((poll) => <tr key={poll.id} className={config.withoutVariant.pollsters.includes(poll.pollster) ? "ref" : undefined}><th scope="row" className="poll-identity"><time dateTime={poll.published}>{poll.published}</time><span>{poll.pollster}{isExit(poll) && " (exit poll)"}</span><button type="button" aria-expanded={active === poll.id} aria-controls="poll-method" onClick={(e) => {methodOpener.current=e.currentTarget;if(active===poll.id)closeMethod();else setActive(poll.id);}}>Method / source</button></th><td className="num">{poll.n ?? "Not recorded"}</td>{parties.map((p) => { const r = poll.results[p.id]; const g = poll.combined.find((group) => group.parties.includes(p.id)); return <td className={`num${!r ? " na" : r.belowThreshold ? " below" : ""}`} key={p.id}>{r ? r.belowThreshold ? <>Below{r.dateUncertain&&<sup aria-label="figure date not recorded">†</sup>}</> : <>{r.seats}{r.dateUncertain&&<sup aria-label="figure date not recorded">†</sup>}</> : g ? <span title={`Combined with ${g.parties.filter((id) => id !== p.id).map((id) => parties.find((party) => party.id === id)?.name ?? id).join(", ")}`}>{g.seats} combined*</span> : "Not reported"}</td>; })}<td>{poll.url && /^https?:\/\//.test(poll.url) ? <a href={poll.url}>{poll.via ?? "Original report"}</a> : poll.via ?? "Not recorded"}</td></tr>)}</tbody></table></div> : <p>No polls match these filters. Clear them or widen the date range.</p>}
    <p className="src">* A group’s seats appear beside its constituents for reference and must be counted only once. Imported from <a href="https://en.wikipedia.org/wiki/Opinion_polling_for_the_2026_Israeli_legislative_election">Wikipedia’s polling tables</a>, retaining cited source reports. <CorrectionLink /></p>
    {method && <section id="poll-method" className="poll-method" aria-labelledby="poll-method-h" ref={methodRef} tabIndex={-1} onKeyDown={(e)=>{if(e.key==="Escape"){e.preventDefault();closeMethod();}}}><h3 id="poll-method-h">{pollLabel(method)} · {method.published}</h3><dl>
      <div><dt>Published</dt><dd>{method.published}</dd></div><div><dt>Fieldwork</dt><dd>{method.fieldwork ?? "Not recorded"}</dd></div><div><dt>List-figure dates</dt><dd>{undatedListNames(method,parties).length?<>Date not recorded for {undatedListNames(method,parties).join(", ")}. The row’s publication date does not establish those figures’ dates.</>:"No list-specific date uncertainty is flagged in this entry."}</dd></div><div><dt>Research firm</dt><dd>{method.firm ?? "Not recorded"}</dd></div><div><dt>Sample size</dt><dd>{method.n ?? "Not recorded"}</dd></div><div><dt>Population sampled</dt><dd>Not recorded</dd></div><div><dt>Interview / sample mode</dt><dd>Not recorded</dd></div><div><dt>Reported margin</dt><dd>{method.margin ?? "Not recorded"}; not a seat-confidence interval</dd></div><div><dt>Average inclusion</dt><dd>{isExit(method) ? "Exit poll; never included in campaign averages" : currentIds.includes(method.id) ? "In the current default average" : "Older than its publisher's latest eligible poll, or outside the current window"}{config.withoutVariant.pollsters.includes(method.pollster) && "; excluded by the named-publisher alternative only"}</dd></div>
    </dl><p>{method.note ?? "No additional method note is recorded."}</p><p className="note">Unknown metadata is not inferred from a firm’s reputation. Missing sample size receives the median known sample size of the chosen pool for the site’s square-root weighting, or equal weight if none are known.</p>{method.url && /^https?:\/\//.test(method.url) && <p><a href={method.url}>Open the cited report</a></p>}<button type="button" onClick={closeMethod}>Close method card</button></section>}
  </section>;
}
