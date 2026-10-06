"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {partyColor,partyInk,blocColorStrip,PARTY_FALLBACK} from "@/lib/party-colors";
import { arrangementKey, restorationGate } from "@/lib/builder-state";
import "./interactives.css";
import "./coalition.css";
import Governing from "./coalition/Governing";
import type { StanceMap } from "@/lib/cohesion";
import ProfileDetail from "./ProfileDetail";
import PartyPreview from "./coalition/PartyPreview";
import PathsTo61, { supportFill } from "./coalition/PathsTo61";
import { En, Loc, rich } from "./coalition/Loc";
import PageHead from "./PageHead";
import SeatBar from "./SeatBar";
import { averagePoll, blocs, exitPolls, mainPolls, parties, pledgeRules } from "@/lib/data";
import { MAJORITY, KNESSET, pledgeConflicts, tally, type TallyText, type Warning, type WarningText } from "@/lib/coalition";
import type { UnstatedMap } from "@/lib/coalition-governing";
import { arrangement, arrangementWarnings, initialVoteDependence, restoreRoles, roleOf, ROLE_LABELS, writeRoles, type RoleOverrides, type SupportRole } from "@/lib/coalition-arrangement";
import scenarioData from "@/data/coalition-scenarios.json";
import { fmt, longDate, mediumDate, shortDate } from "@/lib/format";
import { lettersOf } from "@/lib/letters";
import { AVERAGE_ID, BLOC_ORDER, blocTotals, pollLabel, seatFigure } from "@/lib/polls";
import { RESULTS_ID } from "@/lib/results";
import type { Party, Poll } from "@/lib/types";
import type { Lang } from "@/lib/i18n";
import builder, { type BuilderText, type VerdictKey } from "@/lib/i18n/builder";
import { list } from "@/lib/i18n/he-grammar";
import { useLang } from "@/lib/i18n/lang";
import { blocText, partyText, pledgeText, pollsterText, scenarioText } from "@/lib/i18n/overlays";

const POLL_KEY = "cb-poll";
/** The history note under the panel, keyed "historical" in data/he/coalition-scenarios.json. */
const HISTORY = { id: "historical", ...scenarioData.historical };
/** The picker: election results once counting starts, then the current average, then each current poll. */
const pickList = (results: Poll | null) => [...(results ? [results] : []), ...exitPolls, averagePoll, ...mainPolls];
const cardParties = parties.filter((p) => p.coalitionCard !== "hidden");
/** Cards for a poll: a list hidden for lack of polling still appears if the count gives it seats. */
const cardsFor = (poll: Poll) =>
  parties.filter((p) => p.coalitionCard !== "hidden" || (poll.id === RESULTS_ID && (poll.results[p.id]?.seats ?? 0) > 0));
const fillVars = (p: Party) =>
  ({ "--fill": partyColor(p.id), "--fill-ink": partyInk(p.id) }) as React.CSSProperties;
const countPhrase = (poll: Poll, T: BuilderText) => T.countPhrase(poll.resultState?.freshness === "stale");

/** Averages print one decimal, as everywhere on the site; a single poll or the count prints its own figures. */
const seatNum = (poll: Poll) => (poll.id === AVERAGE_ID ? seatFigure : fmt);

function seatLabel(p: Party, poll: Poll, T: BuilderText = builder.en) {
  const r = poll.results[p.id];
  if (!r) return { txt: T.seatNA, na: true, below: false };
  const below = !!r.belowThreshold || r.seats === 0;
  return { txt: below ? T.seatBelow : seatNum(poll)(r.seats), na: false, below };
}

/** A party's name as this edition shows it, as text (for titles, labels and sentences). */
const nameIn = (p: Party, lang: Lang) => partyText(p, "name", lang).text;

function PollNote({ poll, lang }: { poll: Poll; lang: Lang }) {
  const T = builder[lang];
  const t = blocTotals(poll, parties);
  const shown = BLOC_ORDER.filter((b) => t[b] > 0).map((b) => blocs.find((x) => x.id === b)!);
  const lumped = poll.combined.map((c) => c.parties.map((id) => { const p = parties.find((x) => x.id === id); return p ? nameIn(p, lang) : id; }));
  return (
    <p className="pollnote">
      {poll.id === RESULTS_ID ? (
        <>
          {rich(T.noteResults(countPhrase(poll, T)))}<En page={lang}>{poll.note}</En>{" "}
          {poll.resultState && T.noteSnapshot(poll.resultState.capturedAt, poll.resultState.sourceUpdatedAt)}
          {T.noteByBloc}
        </>
      ) : poll.id === AVERAGE_ID ? (
        <>
          {rich(T.noteAverage(mainPolls.length, mainPolls.map((p) => `${pollsterText(p.pollster, lang).text} ${shortDate(p.published, lang)}`).join(", ")))}
          <Link href={lang === "he" ? "/he/polls#method" : "/polls#method"}>{T.noteMethod}</Link>. {T.noteByBloc}
        </>
      ) : (
        <>{rich(T.notePoll(pollLabel(poll, lang), mediumDate(poll.published, lang)))}{T.noteByBloc}</>
      )}
      {shown.map((b, i) => (
        <span key={b.id}>
          {i > 0 && ", "}
          <Loc v={blocText(b, lang)} page={lang} /> <b>{seatNum(poll)(t[b.id])}</b>
        </span>
      ))}
      .{lumped.map((l) => T.noteLumped(l))}
    </p>
  );
}

/** A party card drawn as its ballot slip: the letters a voter picks, the name, the seats. */
function Slip({ p, poll, on, onToggle, onProfile, role, onRole, conflict, lang }: { p: Party; poll: Poll; on: boolean; onToggle: () => void; onProfile: (el: HTMLButtonElement) => void; role: SupportRole; onRole: (role: SupportRole) => void; conflict: boolean; lang: Lang }) {
  const T = builder[lang];
  const letters = lettersOf[p.id];
  const name = nameIn(p, lang);
  const nm = <span className="nm"><Loc v={partyText(p, "name", lang)} page={lang} /></span>;
  const ld = <span className="ld"><Loc v={partyText(p, "leader", lang)} page={lang} /></span>;
  const profile = (
    <button type="button" className="prof" aria-haspopup="dialog" aria-label={T.profileLabel(name)} onClick={(e) => onProfile(e.currentTarget)}>
      {T.profile}
    </button>
  );
  // A list written off in the polls gets a normal slip if the count gives it seats.
  if (p.coalitionCard === "out" && !(poll.id === RESULTS_ID && (poll.results[p.id]?.seats ?? 0) > 0)) {
    return (
      <div className="slip out" style={fillVars(p)}>
        <div className="face">
          {letters && <span className="letters" lang="he" dir="rtl">{letters}</span>}
          {nm}
          {ld}
          <span className="status">{p.status != null && <Loc v={partyText(p, "status", lang)} page={lang} />}</span>
        </div>
        <div className="foot">{profile}</div>
      </div>
    );
  }
  const s = seatLabel(p, poll, T);
  const src = poll.id === RESULTS_ID ? countPhrase(poll, T) : poll.id === AVERAGE_ID ? T.averageSource(mainPolls.length) : T.pollWithDate(pollLabel(poll, lang), mediumDate(poll.published, lang));
  const tip0 = s.na ? T.tipNA(poll.pollster, name, src) : s.below ? T.tipBelow(src) : T.tipSeats(s.txt, src);
  const tip = conflict ? T.tipConflict(tip0) : tip0;
  return (
    <div className={`slip${on ? " on" : ""}${role !== "cabinet" && role !== "opposition" ? " outside" : ""}`} style={fillVars(p)}>
      <button type="button" className="face" aria-pressed={on} onClick={onToggle} title={tip}>
        {letters && <span className="letters" lang="he" dir="rtl">{letters}</span>}
        {nm}
        {ld}
        <span className={`seats${s.na ? " na" : ""}`}>
          {s.txt}
          <small>{s.na ? T.seatSmall.na : s.below ? T.seatSmall.below : T.seatSmall.seats}</small>
        </span>
      </button>
      <div className="foot">
        {profile}
        {conflict && <span className="pmark">{T.pledgeMark}</span>}
      </div>
      {role !== "opposition" && (
        <label className="role-picker">{T.roleFor(name)}
          <select value={role} onChange={(e) => onRole(e.target.value as SupportRole)}>
            {(Object.keys(ROLE_LABELS) as SupportRole[]).map((value) => <option key={value} value={value}>{T.roles[value]}</option>)}
          </select>
        </label>
      )}
    </div>
  );
}

function Drawer({ party, onClose, lang }: { party: Party; onClose: () => void; lang: Lang }) {
  const ref = useRef<HTMLElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeBtn.current?.focus();
    const root = document.documentElement;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Tab" && ref.current) {
        const f = [...ref.current.querySelectorAll<HTMLElement>('button,a[href],[tabindex]:not([tabindex="-1"])')];
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="dtitle" ref={ref}>
        <div className="dhead">
          <button className="btn" type="button" onClick={onClose} ref={closeBtn}>
            {builder[lang].close}
          </button>
        </div>
        <div className="dbody">
          {lang === "en" ? <ProfileDetail party={party} headingId="dtitle" /> : <PartyPreview party={party} headingId="dtitle" lang={lang} />}
        </div>
      </aside>
    </>
  );
}

/** The pledge and condition notes for the chosen parties: yellow goes against a recorded pledge, grey is a stated condition. */
function Warns({ warns, lang }: { warns: Warning[]; lang: Lang }) {
  if (!warns.length) return null;
  const T = builder[lang];
  return (
    <div className="warns">
      {warns.map((w) => (
        <div key={w.id} className={`warn${w.kind === "condition" ? " info" : ""}`}>
          <b>{w.kind === "condition" ? T.warnCondition : T.warnPledge}</b>
          <Loc v={{ text: w.message, lang: w.lang ?? "en" }} page={lang} />
          <cite><En page={lang}>{w.source}</En></cite>
        </div>
      ))}
    </div>
  );
}

/** A named line-up a reader can load in one tap, with the seats it once held for the "then vs now" line. `noteLang`: the language `note` is in. */
export type Preset = { ids: string[]; label: string; seats: number; year: number; note?: string | null; noteLang?: Lang };

/** How the current poll is named in a sentence. */
const pollPhrase = (poll: Poll, T: BuilderText, lang: Lang) =>
  poll.id === RESULTS_ID ? countPhrase(poll, T) : poll.id === AVERAGE_ID ? T.averagePhrase(mainPolls.length) : T.pollWithDate(pollLabel(poll, lang), mediumDate(poll.published, lang));

/** Against in the first vote: a grey between ink-3 and the empty track, so it reads as filled but not as a list. */
const AGAINST = "color-mix(in srgb, var(--ink-3) 65%, var(--cell))";
const OUTSIDE_NEXT: Record<SupportRole, SupportRole> = { opposition: "support", support: "abstain", abstain: "opposition", cabinet: "cabinet" };

export default function CoalitionBuilder({ results = null, embedded = false, preset, stances, unstated }: { results?: Poll | null; embedded?: boolean; preset?: Preset; stances?: StanceMap; unstated?: UnstatedMap }) {
  // On the home page the builder sits under the page's own heading, so its title is an h2.
  const lang = useLang();
  const T = builder[lang];
  const choices = useMemo(() => pickList(results), [results]);
  const [pollId, setPollId] = useState(results ? RESULTS_ID : AVERAGE_ID);
  const [sel, setSel] = useState<Set<string>>(() => new Set());
  const [roles, setRoles] = useState<RoleOverrides>({});
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [profile, setProfile] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // The last change, for the one status line screen readers hear.
  const [said, setSaid] = useState("");
  const opener = useRef<HTMLButtonElement | null>(null);
  const ready = useRef(false);
  const gate = useRef(restorationGate());
  // The sticky phone summary steps aside while the full meter is on screen, so the total is never shown twice.
  const meterRef = useRef<HTMLDivElement>(null);
  const [meterSeen, setMeterSeen] = useState(false);
  useEffect(() => {
    const el = meterRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setMeterSeen(e.isIntersecting), { rootMargin: "-60px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Restore from the URL (?poll=…&with=a,b&support=…&abstain=…) first, then the remembered poll.
  useEffect(() => {
    const restore = () => {
    const q = new URLSearchParams(window.location.search);
    let p = q.get("poll");
    if (!p) try { p = localStorage.getItem(POLL_KEY); } catch {}
    // On results night the count wins over a remembered poll; a shared link still picks its own.
    if (results && !q.get("poll")) p = RESULTS_ID;
    if (p && choices.some((x) => x.id === p)) setPollId(p);
    const restored = restoreRoles(q, (results ? cardsFor(results) : cardParties).map((x) => x.id));
    const restoredPoll = p && choices.some((x) => x.id === p) ? p : results ? RESULTS_ID : AVERAGE_ID;
    gate.current.restore(arrangementKey(restoredPoll, restored.cabinet, restored.overrides));
    setPollId(restoredPoll);
    setSel(restored.cabinet);
    setRoles(restored.overrides);
    ready.current = true;
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [choices, results]);

  // Keep the URL shareable.
  useEffect(() => {
    if (!ready.current || !gate.current.shouldWrite(arrangementKey(pollId, sel, roles))) return;
    const q = writeRoles(new URLSearchParams(window.location.search), sel, roles, parties.map((p) => p.id));
    q.set("poll", pollId);
    history.replaceState(history.state, "", `${window.location.pathname}?${q.toString().replace(/%2C/g, ",")}${window.location.hash}`);
  }, [pollId, sel, roles]);

  const poll = choices.find((p) => p.id === pollId) ?? choices[0];
  const sn = seatNum(poll);
  // The Hebrew edition's words for the tally's group note and the pledge notes; English passes none, so its output is unchanged.
  const tallyText: TallyText | undefined = lang === "en" ? undefined : { P: T, name: (p) => nameIn(p, lang), pollster: pollsterText(poll.pollster, lang).text };
  const warnText: WarningText | undefined = lang === "en" ? undefined : { message: (r) => pledgeText(r, lang), name: (p) => nameIn(p, lang), and: (n) => list(n) };
  const t = tally(sel, parties, poll, tallyText);
  const warns = arrangementWarnings(sel, roles, parties, pledgeRules, warnText);
  const conflicts = pledgeConflicts(sel, parties, pledgeRules);
  const conflictIds = new Set(conflicts.flatMap((c) => c.ids));
  const vote = arrangement(sel, roles, parties, poll);
  const supportIds = Object.keys(roles).filter((id) => roles[id] === "support");
  const cooperation = new Set([...sel, ...supportIds]);
  const voteNeeded = initialVoteDependence(sel, roles, parties, poll);
  const scenario = scenarioData.scenarios.find((s) => s.id === scenarioId);
  const segsOf = (ids: Set<string>, hatched = false) => tally(ids, parties, poll).segments.map((s) => {
    const party = parties.find((p) => p.name === s.name);
    const c = party ? partyColor(party.id) : PARTY_FALLBACK;
    return { key: party?.id ?? s.name, seats: s.seats, color: hatched ? supportFill(c) : c, title: `${party ? nameIn(party, lang) : s.name}: ${sn(s.seats)}` };
  });
  const cabSegs = segsOf(sel);
  const supSegs = segsOf(new Set(supportIds), true);
  const voteSegs = [...cabSegs, ...supSegs.map((s) => ({ ...s, key: `s-${s.key}` })),
    { key: "abstain", seats: vote.abstain, color: "transparent", title: T.segAbstain(sn(vote.abstain)) },
    { key: "against", seats: vote.no, color: AGAINST, title: T.segAgainst(sn(vote.no)) }];
  const empty = vote.outcome === "empty";
  const vk: VerdictKey | null = empty ? null : vote.outcome === "incomplete" ? "none" : t.total >= MAJORITY ? "majority" : vote.outcome === "passes" ? "passes" : "fails";
  const verdict = vk && T.verdict[vk];
  const short = MAJORITY - t.total;
  const cabText = empty ? "" : t.total >= MAJORITY ? T.cabMajority(sn(t.total), t.partial) : T.cabShort(sn(t.total), t.partial, sn(short), MAJORITY);
  const voteLine = T.voteLine(sn(vote.yes), sn(vote.no), vote.abstain ? sn(vote.abstain) : null);
  const status = said && `${said} ${empty ? T.statusEmpty : `${T.statusCabinet(sn(t.total))} ${vk === "majority" ? T.statusMajority(sn(vote.yes)) : vk === "none" ? T.statusNoVerdict : T.statusVote(vk!, sn(vote.yes))}. ${T.statusConflicts(conflicts.length)}`}`;
  const nameOf = (id: string) => { const p = parties.find((x) => x.id === id); return p ? nameIn(p, lang) : id; };

  const choosePoll = (id: string) => {
    setPollId(id);
    try { localStorage.setItem(POLL_KEY, id); } catch {}
  };
  const assignRole = (id: string, role: SupportRole, quiet = false) => {
    setScenarioId(null);
    setSel((s) => { const n = new Set(s); if (role === "cabinet") n.add(id); else n.delete(id); return n; });
    setRoles((r) => { const n = { ...r }; if (role === "support" || role === "abstain") n[id] = role; else delete n[id]; return n; });
    if (!quiet) setSaid(T.saidRole(nameOf(id), role));
  };
  const toggle = (id: string) => {
    const on = sel.has(id);
    assignRole(id, on ? "opposition" : "cabinet", true);
    setSaid(T.saidToggle(nameOf(id), on));
  };
  const load = (cabinet: string[], support: string[], abstain: string[] = []) => {
    setSel(new Set(cabinet));
    setRoles(Object.fromEntries([...support.map((p) => [p, "support"]), ...abstain.map((p) => [p, "abstain"])]));
  };
  const loadScenario = (id: string) => {
    const s = scenarioData.scenarios.find((s) => s.id === id);
    if (!s) return;
    load(s.cabinet, s.support, s.abstain);
    setScenarioId(id);
    setSaid(T.saidLoaded(scenarioText(s, "title", lang).text));
  };
  const loadPath = (cabinet: string[], support: string[]) => {
    load(cabinet, support);
    setScenarioId(null);
    setSaid(T.saidPath(cabinet.map(nameOf), support.map(nameOf)));
    document.getElementById("builder")?.scrollIntoView({ block: "start" });
  };
  const closeProfile = useCallback(() => {
    setProfile(null);
    opener.current?.focus();
    opener.current = null;
  }, []);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const profileParty = parties.find((p) => p.id === profile);
  // The preset loads only slips that can be selected in this poll; a list without a figure is named in its note instead.
  const presetIds = preset ? preset.ids.filter((id) => cardsFor(poll).some((p) => p.id === id && (p.coalitionCard === "active" || (poll.results[id]?.seats ?? 0) > 0))) : [];
  const presetOn = preset ? presetIds.length > 0 && sel.size === presetIds.length && presetIds.every((id) => sel.has(id)) : false;
  const presetLabel = preset ? preset.label[0].toUpperCase() + preset.label.slice(1) : "";
  const atRest = !sel.size && !Object.keys(roles).length;
  // Lists outside the cabinet that hold seats here: the ones a reader may give outside support or an abstention.
  const outside = cardsFor(poll).filter((p) => !sel.has(p.id) && p.coalitionCard !== "out" && !seatLabel(p, poll).na && !seatLabel(p, poll).below);
  const keyColor = cabSegs[0]?.color ?? "var(--ink)";

  return (
    <div className="cb">
      <PageHead as={embedded ? "h2" : "h1"} title={T.title} standfirst={<>{rich(T.standfirst(MAJORITY, KNESSET))}</>}
        aside={
        <label className="poll-pick">{T.pickLabel}
          <select value={pollId} onChange={(e) => choosePoll(e.target.value)}>
            {choices.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id === AVERAGE_ID ? T.pickAverage(mainPolls.length) : `${pollLabel(p, lang)}, ${p.id === RESULTS_ID ? T.pickCount(p.resultState?.freshness === "stale") : mediumDate(p.published, lang)}`}
              </option>
            ))}
          </select>
        </label>
        } />
      <a className="to-result" href="#arrangement-result">{T.skip}</a>
      <p className="sr-only" role="status">{status}</p>

      <PathsTo61 poll={poll} parties={parties} rules={pledgeRules} pollName={pollPhrase(poll, T, lang)} sn={sn} onLoad={loadPath} open={atRest} />

      <section className="arrangement-scenarios" aria-label={T.scenariosLabel}>
        <p>{T.scenariosLead}</p>
        <div>
          {preset && presetIds.length > 0 && (
            <button type="button" className="btn" aria-pressed={presetOn} onClick={() => { load(presetIds, []); setScenarioId(null); setSaid(T.saidLoaded(presetLabel)); }}>
              {presetLabel}
            </button>
          )}
          {scenarioData.scenarios.map((s) => <button key={s.id} type="button" className="btn" aria-pressed={scenarioId === s.id} onClick={() => loadScenario(s.id)}><Loc v={scenarioText(s, "title", lang)} page={lang} /></button>)}
          <button className="btn reset" type="button" onClick={() => { load([], []); setScenarioId(null); setSaid(T.saidCleared); }} disabled={atRest}>
            {T.startOver}
          </button>
        </div>
        {preset && presetOn && (
          <div className="scenario-reading">
            <p className="thennow">
              {rich(T.thenNow(presetLabel, presetIds.map(nameOf).join(", "), preset.seats, preset.year, sn(t.total), pollPhrase(poll, T, lang)))}
              {preset.note ? <> <Loc v={{ text: preset.note, lang: preset.noteLang ?? "en" }} page={lang} /></> : null}
            </p>
          </div>
        )}
        {scenario && (
          <div className="scenario-reading">
            <p><Loc v={scenarioText(scenario, "agenda", lang)} page={lang} /></p>
            <ol>{scenario.obstacles.map((text, i) => <li key={text}><Loc v={scenarioText(scenario, `obstacles.${i}`, lang)} page={lang} /></li>)}</ol>
            <p><Loc v={scenarioText(scenario, "leadership", lang)} page={lang} /></p>
            <p className="fig-src"><a href={scenario.url}><En page={lang}>{scenario.source}</En></a>{T.scenarioChecked(lang === "en" ? mediumDate(scenarioData.updated) : longDate(scenarioData.updated, lang))}</p>
          </div>
        )}
      </section>

      <div className="layout" id="builder">
        <div className={`mobile-arrangement${meterSeen ? " gone" : ""}`} aria-hidden={meterSeen || undefined}>
          <span>{verdict ? <><b>{verdict}</b>. {voteLine}</> : T.noParties}</span>
          <a href="#arrangement-result">{T.viewArrangement}</a>
          <SeatBar className="ma-bar" total={KNESSET} majority={MAJORITY} segments={empty ? [] : voteSegs} />
        </div>
        <div className="blocs">
          <h2 className="sr-only">{T.listsByBloc}</h2>
          {BLOC_ORDER.map((id) => blocs.find((b) => b.id === id)!).map((b) => (
            <section className="bloc" key={b.id}>
              <h3>
                <span className="sw" style={{ background: blocColorStrip(b.id) }} />
                <Loc v={blocText(b, lang)} page={lang} />
              </h3>
              <div className="slips">
                {cardsFor(poll).filter((p) => p.bloc === b.id).map((p) => (
                  <Slip key={p.id} p={p} poll={poll} on={sel.has(p.id)} onToggle={() => toggle(p.id)}
                    role={roleOf(p.id, sel, roles)} onRole={(role) => assignRole(p.id, role)} conflict={conflictIds.has(p.id)}
                    onProfile={(el) => { opener.current = el; setProfile(p.id); }} lang={lang} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="panel" id="arrangement-result" tabIndex={-1}>
          <h2 className="sr-only">{T.yourCoalition}</h2>
          <div className="meter" ref={meterRef}>
            <p className="verdict">
              {verdict ? <><b className={vk === "fails" || vk === "none" ? "" : "maj"}>{verdict}</b><span>{voteLine}</span></> : <span className="none">{T.noParties}</span>}
            </p>
            <div className="mrow">
              <span className="ml">{T.cabinetRow}</span>
              <span className="mv">{cabText}</span>
              <SeatBar size="l" segments={cabSegs} label={T.cabLabel(cabText, MAJORITY, KNESSET)} />
            </div>
            <div className="mrow">
              <span className="ml">{T.voteRow}</span>
              <span className="mv">{empty ? "" : supportIds.length ? T.voteWithSupport(sn(t.total), sn(vote.yes - t.total)) : vote.abstain ? T.voteAbstaining(sn(vote.abstain)) : T.voteCabinetOnly}</span>
              <SeatBar size="l" segments={empty ? [] : voteSegs} label={empty ? T.voteLabelEmpty : T.voteLabel(voteLine, verdict!)} />
            </div>
            <p className="fig-key mkey">
              <span><i className="k" style={{ background: keyColor }} />{T.keyCabinet}</span>
              <span><i className="k" style={{ background: supportFill(supSegs[0] ? partyColor(supSegs[0].key) : "var(--ink)") }} />{T.keyHatched}</span>
              <span><i className="k k-gap" />{T.keyAbstains}</span>
              <span><i className="k" style={{ background: AGAINST }} />{T.keyAgainst}</span>
            </p>
          </div>
          <div className="pbody">
          {t.groupNote && <p className="naflag">{t.groupNote}</p>}
          {!vote.complete && !empty && <p className="naflag">{vote.crossed ? T.crossed : ""}{vote.notReported.length ? T.notReported(vote.notReported.map((p) => nameIn(p, lang))) : ""}{T.accounted(sn(vote.represented))}</p>}
          <Warns warns={warns} lang={lang} />
          {voteNeeded.length > 0 && <p className="needed">{T.needed(voteNeeded.map(nameOf))}</p>}
          {sel.size > 0 && outside.length > 0 && (
            <section className="outside" aria-labelledby="outside-h">
              <h3 id="outside-h">{T.outsideHead}</h3>
              <p className="fig-note">{T.outsideNote}</p>
              <div className="chips">
                {outside.map((p) => {
                  const r = roleOf(p.id, sel, roles);
                  return (
                    <button key={p.id} type="button" className={`pchip r-${r}`} style={fillVars(p)} onClick={() => assignRole(p.id, OUTSIDE_NEXT[r])}>
                      <i className="k" style={{ background: r === "support" ? supportFill(partyColor(p.id)) : r === "abstain" ? "transparent" : AGAINST }} aria-hidden="true" />
                      <span><Loc v={partyText(p, "name", lang)} page={lang} /></span>
                      <small>{T.outsideWord[r]}</small>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
          <ul className="list">
            {t.chosen.length ? (
              t.chosen.map((p) => (
                <li key={p.id}>
                  <span className="sw" style={{ background: partyColor(p.id) }} />
                  <Loc v={partyText(p, "name", lang)} page={lang} />
                  <span className="v">{seatLabel(p, poll, T).txt}</span>
                </li>
              ))
            ) : (
              <li className="empty">{T.listEmpty}</li>
            )}
          </ul>
          {stances && <Governing sel={cooperation} parties={parties} poll={poll} map={stances} unstated={unstated} withOutsideSupport={supportIds.length > 0} />}
          <details className="confidence">
            <summary>{T.confidenceSummary}</summary>
            {vote.approximate && <p className="naflag">{T.approximate}</p>}
            <p className="callout">{T.confidenceNote}</p>
            <p className="fig-src">{T.lawLinks.map((l, i) => <Fragment key={l.href}>{i > 0 && "; "}<a href={l.href}>{l.text}</a></Fragment>)}.</p>
          </details>
          <details className="arrangement-history"><summary><Loc v={scenarioText(HISTORY, "title", lang)} page={lang} /></summary><p><Loc v={scenarioText(HISTORY, "text", lang)} page={lang} /></p><a href={HISTORY.url}><En page={lang}>{HISTORY.source}</En></a></details>
          {t.chosen.length > 0 && (
            <div className="share">
              <button className="btn" type="button" onClick={copyLink}>{T.copyLink}</button>
              <span aria-live="polite">{copied ? T.copied : ""}</span>
            </div>
          )}
          <div className="callout">
            <p>{T.pledgeCallout}</p>
            <p>{T.courtCallout}</p>
          </div>
          </div>
        </aside>
      </div>
      <PollNote poll={poll} lang={lang} />
      <p><Link href={`/export/coalition?${writeRoles(new URLSearchParams({poll:poll.id}),sel,roles,parties.map((p)=>p.id))}`}>{T.exportLink}</Link></p>

      {profileParty && <Drawer party={profileParty} onClose={closeProfile} lang={lang} />}
    </div>
  );
}
