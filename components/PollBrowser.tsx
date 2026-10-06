"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { filterPolls, readPollFilter, undatedListNames } from "@/lib/poll-browser";
import { isExit, pollLabel } from "@/lib/polls";
import type { Party, Poll, PollsConfig } from "@/lib/types";
import CorrectionLink from "./CorrectionLink";
import { longDate, mediumDate, shortDate } from "@/lib/format";
import { useLang } from "@/lib/i18n/lang";
import POLLS from "@/lib/i18n/polls";
import { pollsterName, Tx } from "./polls/names";

const dash = (label: string) => <><span aria-hidden="true">–</span><span className="sr-only">{label}</span></>;

type Props = { polls: Poll[]; parties: Pick<Party, "id" | "name" | "short">[]; currentIds: string[]; config: PollsConfig; title?: string };
export default function PollBrowser({ polls, parties, currentIds, config, title = "Browse every poll" }: Props) {
  const lang = useLang(), he = lang === "he", t = POLLS[lang].browser, c = t.card, pn = (name: string) => pollsterName(name, lang);
  const DASH = dash(t.notReported);
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
  // Lists no poll reports, alone or in a group, get no column.
  const cols = useMemo(() => parties.filter((p) => polls.some((poll) => poll.results[p.id] || poll.combined.some((g) => g.parties.includes(p.id)))), [parties, polls]);
  const hasN = polls.some((p) => p.n != null);
  // Phones show a few columns at a time; the picker below chooses which. Wider screens show all.
  const [shown, setShown] = useState(() => cols.slice(0, 3).map((p) => p.id));
  function apply(clear = false) {
    const next = new URLSearchParams(params);
    for (const key of ["from", "to", "pollster", "party"]) next.delete(key);
    if (clear) setFilter({ from: "", to: "", pollster: "", parties: [] });
    else { if (filter.from) next.set("from", filter.from); if (filter.to) next.set("to", filter.to); if (filter.pollster) next.set("pollster", filter.pollster); if (filter.parties.length) next.set("party", filter.parties.join(",")); }
    router.push(`${he ? "/he/polls" : "/polls"}${next.size ? `?${next}` : ""}#browser`, { scroll: false });
  }
  return <section id="browser" className="poll-browser" aria-labelledby="browser-h"><h2 id="browser-h" className="sec-h">{title}</h2>
    <form className="poll-controls" onSubmit={(event) => { event.preventDefault(); apply(); }}>
      <label>{t.from}<input type="date" value={filter.from} onChange={(e) => setFilter({ ...filter, from: e.target.value })} /></label><label>{t.through}<input type="date" value={filter.to} onChange={(e) => setFilter({ ...filter, to: e.target.value })} /></label>
      <label>{t.publisher}<select value={filter.pollster} onChange={(e) => setFilter({ ...filter, pollster: e.target.value })}><option value="">{t.all}</option>{[...new Set(polls.map((p) => p.pollster))].sort().map((p) => he ? <option key={p} value={p}>{pn(p)}</option> : <option key={p}>{p}</option>)}</select></label><button type="submit">{t.apply}</button><button type="button" onClick={() => apply(true)}>{t.clear}</button>
    </form>
    <details className="poll-party-filter"><summary>{he ? t.require(filter.parties.length) : <>Require coverage of selected lists ({filter.parties.length})</>}</summary><p className="note">{t.requireNote}</p><div className="poll-choices">{parties.map((p) => <label key={p.id}><input type="checkbox" checked={filter.parties.includes(p.id)} onChange={() => setFilter({ ...filter, parties: filter.parties.includes(p.id) ? filter.parties.filter((id) => id !== p.id) : [...filter.parties, p.id] })} />{p.name}</label>)}</div></details>
    <p role="status" aria-live="polite">{he ? t.status(visible.length, polls.length) : <>{visible.length} of {polls.length} polls, newest first.</>}{filter.from && filter.to && filter.from > filter.to && t.badRange}</p>
    <details className="poll-colpick"><summary>{he ? t.shown(cols.filter((p) => shown.includes(p.id)).length, cols.length) : <>Lists shown ({cols.filter((p) => shown.includes(p.id)).length} of {cols.length})</>}</summary><div className="poll-choices">{cols.map((p) => <label key={p.id}><input type="checkbox" checked={shown.includes(p.id)} onChange={() => setShown(shown.includes(p.id) ? shown.filter((id) => id !== p.id) : [...shown, p.id])} />{p.name}</label>)}</div></details>
    {visible.length ? <div className="table-scroll sheet poll-scroller" tabIndex={0} role="region" aria-label={t.tableAria}><table className="data-table poll-table"><thead><tr><th scope="col" className="poll-identity">{t.poll}</th>{hasN && <th scope="col" className="num">{t.sample}</th>}{cols.map((p) => <th scope="col" className={`num pcol${shown.includes(p.id) ? " on" : ""}`} key={p.id}>{p.name}</th>)}<th scope="col" className="src">{t.source}</th></tr></thead><tbody>{visible.map((poll) => <tr key={poll.id} className={config.withoutVariant.pollsters.includes(poll.pollster) ? "ref" : undefined}><th scope="row" className="poll-identity"><button type="button" className="poll-id-link" aria-expanded={active === poll.id} aria-controls="poll-method" aria-label={t.idAria(pn(poll.pollster), isExit(poll), mediumDate(poll.published, lang))} onClick={(e) => {methodOpener.current=e.currentTarget;if(active===poll.id)closeMethod();else setActive(poll.id);}}><time dateTime={poll.published}>{shortDate(poll.published, lang)}</time> {he ? <Tx text={pn(poll.pollster)} lang={lang} /> : poll.pollster}{isExit(poll) && t.exit}</button></th>{hasN && <td className="num">{poll.n ?? DASH}</td>}{cols.map((p) => { const r = poll.results[p.id]; const g = poll.combined.find((group) => group.parties.includes(p.id)); return <td className={`num pcol${shown.includes(p.id) ? " on" : ""}${!r ? " na" : r.belowThreshold ? " below" : ""}`} key={p.id}>{r ? r.belowThreshold ? <>{t.belowCell}{r.dateUncertain&&<sup aria-label={t.undatedSup}>†</sup>}</> : <>{r.seats}{r.dateUncertain&&<sup aria-label={t.undatedSup}>†</sup>}</> : g ? <span title={t.combined(`${g.parties.filter((id) => id !== p.id).map((id) => parties.find((party) => party.id === id)?.name ?? id).join(", ")}`)}>{g.seats}<sup aria-label={t.combinedSup(`${g.parties.filter((id) => id !== p.id).map((id) => parties.find((party) => party.id === id)?.name ?? id).join(", ")}`)}>*</sup></span> : DASH}</td>; })}<td className="src">{poll.url && /^https?:\/\//.test(poll.url) ? <a href={poll.url}>{poll.via ? <Tx text={pn(poll.via)} lang={lang} /> : t.original}</a> : poll.via ? <Tx text={pn(poll.via)} lang={lang} /> : DASH}</td></tr>)}</tbody></table></div> : <p>{t.none}</p>}
    <p className="fig-note poll-notes">{t.notes.a}<span aria-hidden="true">–</span><span className="sr-only">{t.notes.dash}</span>{t.notes.b}{undated.length>0&&t.notes.undated}{he ? t.notes.grey(config.withoutVariant.pollsters.map(pn)) : <> Grey rows are {config.withoutVariant.pollsters.join(" and ")}, which only the alternative average leaves out.</>}</p>
    <p className="fig-src">{t.src.a}<a href="https://en.wikipedia.org/wiki/Opinion_polling_for_the_2026_Israeli_legislative_election" {...(he ? { hrefLang: "en" } : {})}>{t.src.link}</a>{t.src.b}<CorrectionLink /></p>
    {method && <section id="poll-method" className="poll-method" aria-labelledby="poll-method-h" ref={methodRef} tabIndex={-1} onKeyDown={(e)=>{if(e.key==="Escape"){e.preventDefault();closeMethod();}}}><h3 id="poll-method-h">{he ? <><Tx text={pollLabel(method, lang)} lang={lang} />, {longDate(method.published, lang)}</> : <>{pollLabel(method)}, {method.published}</>}</h3><dl>
      <div><dt>{c.published}</dt><dd>{he ? longDate(method.published, lang) : method.published}</dd></div><div><dt>{c.fieldwork}</dt><dd>{method.fieldwork ? <Tx text={method.fieldwork} lang={lang} /> : c.notRecorded}</dd></div><div><dt>{c.listDates}</dt><dd>{undatedListNames(method,parties).length?(he ? c.undated(undatedListNames(method,parties).join(", ")) : <>Date not recorded for {undatedListNames(method,parties).join(", ")}. The row’s publication date does not establish those figures’ dates.</>):c.noUndated}</dd></div><div><dt>{c.firm}</dt><dd>{method.firm ? (he ? <Tx text={pn(method.firm)} lang={lang} /> : method.firm) : c.notRecorded}</dd></div><div><dt>{c.n}</dt><dd>{method.n ?? c.notRecorded}</dd></div><div><dt>{c.population}</dt><dd>{c.notRecorded}</dd></div><div><dt>{c.mode}</dt><dd>{c.notRecorded}</dd></div><div><dt>{c.margin}</dt><dd>{method.margin ? <Tx text={method.margin} lang={lang} /> : c.notRecorded}{c.marginTail}</dd></div><div><dt>{c.inclusion}</dt><dd>{isExit(method) ? c.exit : currentIds.includes(method.id) ? c.current : c.older}{config.withoutVariant.pollsters.includes(method.pollster) && c.variantOnly}</dd></div>
    </dl><p>{method.note ? <Tx text={method.note} lang={lang} /> : c.noNote}</p><p className="note">{c.unknown}</p>{method.url && /^https?:\/\//.test(method.url) && <p><a href={method.url}>{c.open}</a></p>}<button type="button" onClick={closeMethod}>{c.close}</button></section>}
  </section>;
}
