"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {partyColor,partyInk,blocColorStrip,PARTY_FALLBACK} from "@/lib/party-colors";
import { arrangementKey, restorationGate } from "@/lib/builder-state";
import "./interactives.css";
import "./coalition.css";
import Governing from "./Governing";
import type { StanceMap } from "@/lib/cohesion";
import ProfileDetail from "./ProfileDetail";
import PathsTo61, { supportFill } from "./coalition/PathsTo61";
import PageHead from "./PageHead";
import SeatBar from "./SeatBar";
import { averagePoll, blocs, exitPolls, mainPolls, parties, pledgeRules } from "@/lib/data";
import { MAJORITY, KNESSET, pledgeConflicts, tally, type Warning } from "@/lib/coalition";
import type { UnstatedMap } from "@/lib/coalition-governing";
import { arrangement, arrangementWarnings, initialVoteDependence, restoreRoles, roleOf, ROLE_LABELS, writeRoles, type RoleOverrides, type SupportRole } from "@/lib/coalition-arrangement";
import scenarioData from "@/data/coalition-scenarios.json";
import { fmt, mediumDate, shortDate } from "@/lib/format";
import { lettersOf } from "@/lib/letters";
import { AVERAGE_ID, BLOC_ORDER, blocTotals, pollLabel, seatFigure } from "@/lib/polls";
import { RESULTS_ID } from "@/lib/results";
import type { Party, Poll } from "@/lib/types";

const POLL_KEY = "cb-poll";
/** The picker: election results once counting starts, then the current average, then each current poll. */
const pickList = (results: Poll | null) => [...(results ? [results] : []), ...exitPolls, averagePoll, ...mainPolls];
const cardParties = parties.filter((p) => p.coalitionCard !== "hidden");
/** Cards for a poll: a list hidden for lack of polling still appears if the count gives it seats. */
const cardsFor = (poll: Poll) =>
  parties.filter((p) => p.coalitionCard !== "hidden" || (poll.id === RESULTS_ID && (poll.results[p.id]?.seats ?? 0) > 0));
const fillVars = (p: Party) =>
  ({ "--fill": partyColor(p.id), "--fill-ink": partyInk(p.id) }) as React.CSSProperties;
const countPhrase = (poll: Poll) => poll.resultState?.freshness === "stale" ? "the saved count (stale)" : "the count so far";

/** Averages print one decimal, as everywhere on the site; a single poll or the count prints its own figures. */
const seatNum = (poll: Poll) => (poll.id === AVERAGE_ID ? seatFigure : fmt);

function seatLabel(p: Party, poll: Poll) {
  const r = poll.results[p.id];
  if (!r) return { txt: "n/a", na: true, below: false };
  const below = !!r.belowThreshold || r.seats === 0;
  return { txt: below ? "below" : seatNum(poll)(r.seats), na: false, below };
}

function PollNote({ poll }: { poll: Poll }) {
  const t = blocTotals(poll, parties);
  const shown = BLOC_ORDER.filter((b) => t[b] > 0).map((b) => blocs.find((x) => x.id === b)!);
  const lumped = poll.combined.map((c) => c.parties.map((id) => parties.find((p) => p.id === id)?.name ?? id).join(" and "));
  return (
    <p className="pollnote">
      {poll.id === RESULTS_ID ? (
        <>
          Seats are <b>{countPhrase(poll)}</b>. {poll.note}{" "}
          {poll.resultState && <>Snapshot captured {poll.resultState.capturedAt}. Source update time: {poll.resultState.sourceUpdatedAt ?? "not supplied by source"}. </>}
          By bloc:{" "}
        </>
      ) : poll.id === AVERAGE_ID ? (
        <>
          Seats are the <b>polling average</b> of the latest {mainPolls.length} polls, one per pollster (
          {mainPolls.map((p) => `${p.pollster} ${shortDate(p.published)}`).join(", ")}), scaled to 120, so they can be fractional. <Link href="/polls#method">Average method</Link>. By bloc:{" "}
        </>
      ) : (
        <>
          Seats are from <b>{pollLabel(poll)}, published {mediumDate(poll.published)}</b>. By bloc:{" "}
        </>
      )}
      {shown.map((b, i) => (
        <span key={b.id}>
          {i > 0 && ", "}
          {b.label} <b>{seatNum(poll)(t[b.id])}</b>
        </span>
      ))}
      .{lumped.map((l) => ` ${l} were not reported separately.`)}
    </p>
  );
}

/** A party card drawn as its ballot slip: the letters a voter picks, the name, the seats. */
function Slip({ p, poll, on, onToggle, onProfile, role, onRole, conflict }: { p: Party; poll: Poll; on: boolean; onToggle: () => void; onProfile: (el: HTMLButtonElement) => void; role: SupportRole; onRole: (role: SupportRole) => void; conflict: boolean }) {
  const letters = lettersOf[p.id];
  const profile = (
    <button type="button" className="prof" aria-haspopup="dialog" aria-label={`Profile: ${p.name}`} onClick={(e) => onProfile(e.currentTarget)}>
      Profile
    </button>
  );
  // A list written off in the polls gets a normal slip if the count gives it seats.
  if (p.coalitionCard === "out" && !(poll.id === RESULTS_ID && (poll.results[p.id]?.seats ?? 0) > 0)) {
    return (
      <div className="slip out" style={fillVars(p)}>
        <div className="face">
          {letters && <span className="letters" lang="he" dir="rtl">{letters}</span>}
          <span className="nm">{p.name}</span>
          <span className="ld">{p.leader}</span>
          <span className="status">{p.status}</span>
        </div>
        <div className="foot">{profile}</div>
      </div>
    );
  }
  const s = seatLabel(p, poll);
  const src = poll.id === RESULTS_ID ? countPhrase(poll) : poll.id === AVERAGE_ID ? `the polling average of ${mainPolls.length} polls` : `${pollLabel(poll)}, ${mediumDate(poll.published)}`;
  const tip0 = s.na ? `${poll.pollster} did not report ${p.name} separately (${src})` : s.below ? `Below threshold in ${src}` : `${s.txt} seats in ${src}`;
  const tip = conflict ? `${tip0}. In a pledge conflict with this coalition` : tip0;
  return (
    <div className={`slip${on ? " on" : ""}${role !== "cabinet" && role !== "opposition" ? " outside" : ""}`} style={fillVars(p)}>
      <button type="button" className="face" aria-pressed={on} onClick={onToggle} title={tip}>
        {letters && <span className="letters" lang="he" dir="rtl">{letters}</span>}
        <span className="nm">{p.name}</span>
        <span className="ld">{p.leader}</span>
        <span className={`seats${s.na ? " na" : ""}`}>
          {s.txt}
          <small>{s.na ? "not reported" : s.below ? "the threshold" : "seats"}</small>
        </span>
      </button>
      <div className="foot">
        {profile}
        {conflict && <span className="pmark">Pledge conflict</span>}
      </div>
      {role !== "opposition" && (
        <label className="role-picker">Role for {p.name}
          <select value={role} onChange={(e) => onRole(e.target.value as SupportRole)}>
            {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      )}
    </div>
  );
}

function Drawer({ party, onClose }: { party: Party; onClose: () => void }) {
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
            Close
          </button>
        </div>
        <div className="dbody">
          <ProfileDetail party={party} headingId="dtitle" />
        </div>
      </aside>
    </>
  );
}

/** A named line-up a reader can load in one tap, with the seats it once held for the "then vs now" line. */
/** The pledge and condition notes for the chosen parties: yellow goes against a recorded pledge, grey is a stated condition. */
function Warns({ warns }: { warns: Warning[] }) {
  if (!warns.length) return null;
  return (
    <div className="warns">
      {warns.map((w) => (
        <div key={w.id} className={`warn${w.kind === "condition" ? " info" : ""}`}>
          <b>{w.kind === "condition" ? "A stated condition" : "Goes against a pledge"}</b>
          {w.message}
          <cite>{w.source}</cite>
        </div>
      ))}
    </div>
  );
}

export type Preset = { ids: string[]; label: string; seats: number; year: number; note?: string | null };

/** How the current poll is named in a sentence. */
const pollPhrase = (poll: Poll) =>
  poll.id === RESULTS_ID ? countPhrase(poll) : poll.id === AVERAGE_ID ? `the polling average (${mainPolls.length} polls)` : `${pollLabel(poll)}, ${mediumDate(poll.published)}`;

/** Against in the first vote: a grey between ink-3 and the empty track, so it reads as filled but not as a list. */
const AGAINST = "color-mix(in srgb, var(--ink-3) 65%, var(--cell))";
const OUTSIDE_NEXT: Record<SupportRole, SupportRole> = { opposition: "support", support: "abstain", abstain: "opposition", cabinet: "cabinet" };
const OUTSIDE_WORD: Record<SupportRole, string> = { opposition: "Against", support: "Outside support", abstain: "Abstains", cabinet: "Cabinet" };

export default function CoalitionBuilder({ results = null, embedded = false, preset, stances, unstated }: { results?: Poll | null; embedded?: boolean; preset?: Preset; stances?: StanceMap; unstated?: UnstatedMap }) {
  // On the home page the builder sits under the page's own heading, so its title is an h2.
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
  const t = tally(sel, parties, poll);
  const warns = arrangementWarnings(sel, roles, parties, pledgeRules);
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
    return { key: party?.id ?? s.name, seats: s.seats, color: hatched ? supportFill(c) : c, title: `${s.name}: ${sn(s.seats)}` };
  });
  const cabSegs = segsOf(sel);
  const supSegs = segsOf(new Set(supportIds), true);
  const voteSegs = [...cabSegs, ...supSegs.map((s) => ({ ...s, key: `s-${s.key}` })),
    { key: "abstain", seats: vote.abstain, color: "transparent", title: `Abstain: ${sn(vote.abstain)}` },
    { key: "against", seats: vote.no, color: AGAINST, title: `Against: ${sn(vote.no)}` }];
  const empty = vote.outcome === "empty";
  const verdict = empty ? null : vote.outcome === "incomplete" ? "No verdict" : t.total >= MAJORITY ? "Majority" : vote.outcome === "passes" ? "Passes" : "Fails";
  const short = MAJORITY - t.total;
  const cabText = empty ? "" : t.total >= MAJORITY ? `${sn(t.total)}${t.partial ? "+" : ""}, a majority on its own` : `${sn(t.total)}${t.partial ? "+" : ""}, ${sn(short)} short of ${MAJORITY}`;
  const voteLine = `For ${sn(vote.yes)}, against ${sn(vote.no)}${vote.abstain ? `, abstaining ${sn(vote.abstain)}` : ""}`;
  const status = said && `${said} ${empty ? "No parties yet." : `Cabinet ${sn(t.total)}. ${verdict === "Majority" ? `A majority, ${sn(vote.yes)} for` : verdict === "No verdict" ? "First vote: no verdict" : `First vote ${verdict!.toLowerCase()}, ${sn(vote.yes)} for`}. ${conflicts.length ? `${conflicts.length} pledge conflict${conflicts.length > 1 ? "s" : ""}.` : "No pledge conflict."}`}`;
  const nameOf = (id: string) => parties.find((p) => p.id === id)?.name ?? id;

  const choosePoll = (id: string) => {
    setPollId(id);
    try { localStorage.setItem(POLL_KEY, id); } catch {}
  };
  const assignRole = (id: string, role: SupportRole, quiet = false) => {
    setScenarioId(null);
    setSel((s) => { const n = new Set(s); if (role === "cabinet") n.add(id); else n.delete(id); return n; });
    setRoles((r) => { const n = { ...r }; if (role === "support" || role === "abstain") n[id] = role; else delete n[id]; return n; });
    if (!quiet) setSaid(`${nameOf(id)}: ${OUTSIDE_WORD[role].toLowerCase()}.`);
  };
  const toggle = (id: string) => {
    const on = sel.has(id);
    assignRole(id, on ? "opposition" : "cabinet", true);
    setSaid(`${nameOf(id)} ${on ? "removed" : "added"}.`);
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
    setSaid(`${s.title} loaded.`);
  };
  const loadPath = (cabinet: string[], support: string[]) => {
    load(cabinet, support);
    setScenarioId(null);
    setSaid(`Loaded ${cabinet.map(nameOf).join(", ")}${support.length ? ` with outside support from ${support.map(nameOf).join(", ")}` : ""}.`);
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
  const atRest = !sel.size && !Object.keys(roles).length;
  // Lists outside the cabinet that hold seats here: the ones a reader may give outside support or an abstention.
  const outside = cardsFor(poll).filter((p) => !sel.has(p.id) && p.coalitionCard !== "out" && !seatLabel(p, poll).na && !seatLabel(p, poll).below);
  const keyColor = cabSegs[0]?.color ?? "var(--ink)";

  return (
    <div className="cb">
      <PageHead as={embedded ? "h2" : "h1"} title="Build a coalition" standfirst={<>
            Tap a ballot slip to add a cabinet partner; <b>{MAJORITY}</b> of {KNESSET} seats is a majority.
          </>}
        aside={
        <label className="poll-pick">Seats from
          <select value={pollId} onChange={(e) => choosePoll(e.target.value)}>
            {choices.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id === AVERAGE_ID ? `Polling average (${mainPolls.length} polls)` : `${pollLabel(p)}, ${p.id === RESULTS_ID ? (p.resultState?.freshness === "stale" ? "saved count (stale)" : "count so far") : mediumDate(p.published)}`}
              </option>
            ))}
          </select>
        </label>
        } />
      <a className="to-result" href="#arrangement-result">Skip to result</a>
      <p className="sr-only" role="status">{status}</p>

      <PathsTo61 poll={poll} parties={parties} rules={pledgeRules} pollName={pollPhrase(poll)} sn={sn} onLoad={loadPath} open={atRest} />

      <section className="arrangement-scenarios" aria-label="Load a named arrangement">
        <p>Or load a named arrangement</p>
        <div>
          {preset && presetIds.length > 0 && (
            <button type="button" className="btn" aria-pressed={presetOn} onClick={() => { load(presetIds, []); setScenarioId(null); setSaid(`${preset.label[0].toUpperCase() + preset.label.slice(1)} loaded.`); }}>
              {preset.label[0].toUpperCase() + preset.label.slice(1)}
            </button>
          )}
          {scenarioData.scenarios.map((s) => <button key={s.id} type="button" className="btn" aria-pressed={scenarioId === s.id} onClick={() => loadScenario(s.id)}>{s.title}</button>)}
          <button className="btn reset" type="button" onClick={() => { load([], []); setScenarioId(null); setSaid("Cleared."); }} disabled={atRest}>
            Start over
          </button>
        </div>
        {preset && presetOn && (
          <div className="scenario-reading">
            <p className="thennow">
              {preset.label[0].toUpperCase() + preset.label.slice(1)} ({presetIds.map((id) => parties.find((p) => p.id === id)!.name).join(", ")}) held <b>{preset.seats}</b> seats in {preset.year}; its parties have <b>{sn(t.total)}</b> in{" "}
              {pollPhrase(poll)}.{preset.note ? ` ${preset.note}` : ""}
            </p>
          </div>
        )}
        {scenario && <div className="scenario-reading"><p>{scenario.agenda}</p><ol>{scenario.obstacles.map((text) => <li key={text}>{text}</li>)}</ol><p>{scenario.leadership}</p><p className="fig-src"><a href={scenario.url}>{scenario.source}</a>, Research checked {mediumDate(scenarioData.updated)}. Pledge sources appear with each warning.</p></div>}
      </section>

      <div className="layout" id="builder">
        <div className={`mobile-arrangement${meterSeen ? " gone" : ""}`} aria-hidden={meterSeen || undefined}>
          <span>{verdict ? <><b>{verdict}</b>. {voteLine}</> : "No parties yet"}</span>
          <a href="#arrangement-result">View the arrangement</a>
          <SeatBar className="ma-bar" total={KNESSET} majority={MAJORITY} segments={empty ? [] : voteSegs} />
        </div>
        <div className="blocs">
          <h2 className="sr-only">The lists, by bloc</h2>
          {BLOC_ORDER.map((id) => blocs.find((b) => b.id === id)!).map((b) => (
            <section className="bloc" key={b.id}>
              <h3>
                <span className="sw" style={{ background: blocColorStrip(b.id) }} />
                {b.label}
              </h3>
              <div className="slips">
                {cardsFor(poll).filter((p) => p.bloc === b.id).map((p) => (
                  <Slip key={p.id} p={p} poll={poll} on={sel.has(p.id)} onToggle={() => toggle(p.id)}
                    role={roleOf(p.id, sel, roles)} onRole={(role) => assignRole(p.id, role)} conflict={conflictIds.has(p.id)}
                    onProfile={(el) => { opener.current = el; setProfile(p.id); }} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="panel" id="arrangement-result" tabIndex={-1}>
          <h2 className="sr-only">Your coalition</h2>
          <div className="meter" ref={meterRef}>
            <p className="verdict">
              {verdict ? <><b className={verdict === "Fails" || verdict === "No verdict" ? "" : "maj"}>{verdict}</b><span>{voteLine}</span></> : <span className="none">No parties yet</span>}
            </p>
            <div className="mrow">
              <span className="ml">Cabinet</span>
              <span className="mv">{cabText}</span>
              <SeatBar size="l" segments={cabSegs} label={`Cabinet: ${cabText || "no parties yet"}. ${MAJORITY} of ${KNESSET} is a majority.`} />
            </div>
            <div className="mrow">
              <span className="ml">First confidence vote</span>
              <span className="mv">{empty ? "" : supportIds.length ? `${sn(t.total)} + ${sn(vote.yes - t.total)} outside support` : vote.abstain ? `Abstaining ${sn(vote.abstain)}` : "Cabinet only"}</span>
              <SeatBar size="l" segments={empty ? [] : voteSegs} label={empty ? "First confidence vote: no parties yet." : `First confidence vote: ${voteLine}. ${verdict}.`} />
            </div>
            <p className="fig-key mkey">
              <span><i className="k" style={{ background: keyColor }} />Cabinet</span>
              <span><i className="k" style={{ background: supportFill(supSegs[0] ? partyColor(supSegs[0].key) : "var(--ink)") }} />Hatched: outside support, not in the cabinet</span>
              <span><i className="k k-gap" />Abstains</span>
              <span><i className="k" style={{ background: AGAINST }} />Against</span>
            </p>
          </div>
          <div className="pbody">
          {t.groupNote && <p className="naflag">{t.groupNote}</p>}
          {!vote.complete && !empty && <p className="naflag">{vote.crossed ? "A combined poll group spans different roles and cannot be divided from the source. " : ""}{vote.notReported.length ? `${vote.notReported.map((p) => p.name).join(", ")} not reported separately. ` : ""}Accounted for: {sn(vote.represented)} of 120 seats.</p>}
          <Warns warns={warns} />
          {voteNeeded.length > 0 && <p className="needed">If any one of {voteNeeded.map(nameOf).join(", ")} votes against rather than for, this first vote no longer passes.</p>}
          {sel.size > 0 && outside.length > 0 && (
            <section className="outside" aria-labelledby="outside-h">
              <h3 id="outside-h">Partners outside the cabinet</h3>
              <p className="fig-note">Tap a list to switch it between against, outside support and abstaining.</p>
              <div className="chips">
                {outside.map((p) => {
                  const r = roleOf(p.id, sel, roles);
                  return (
                    <button key={p.id} type="button" className={`pchip r-${r}`} style={fillVars(p)} onClick={() => assignRole(p.id, OUTSIDE_NEXT[r])}>
                      <i className="k" style={{ background: r === "support" ? supportFill(partyColor(p.id)) : r === "abstain" ? "transparent" : AGAINST }} aria-hidden="true" />
                      <span>{p.name}</span>
                      <small>{OUTSIDE_WORD[r]}</small>
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
                  {p.name}
                  <span className="v">{seatLabel(p, poll).txt}</span>
                </li>
              ))
            ) : (
              <li className="empty">Tap a slip, or a path above, to add a party.</li>
            )}
          </ul>
          {stances && <Governing sel={cooperation} parties={parties} poll={poll} map={stances} unstated={unstated} withOutsideSupport={supportIds.length > 0} />}
          <details className="confidence">
            <summary>What the first vote does and does not show</summary>
            {vote.approximate && <p className="naflag">Poll averages can be fractional. These totals illustrate relative support; real MKs cast whole votes. This is not a forecast of their vote.</p>}
            <p className="callout">Outside support here concerns the initial vote; it promises no ministers or future budget support. Cabinet refusals do not prove a party will refuse outside support or abstention. Replacing an existing government through constructive no-confidence requires 61 MKs to support an alternative government.</p>
            <p className="fig-src"><a href="https://main.knesset.gov.il/EN/activity/Documents/BasicLawsPDF/BasicLawTheGovernment.pdf">Basic Law: Government §§13(d), 28</a>; <a href="https://main.knesset.gov.il/EN/activity/documents/BasicLawsPDF/BasicLawTheKnesset.pdf">Knesset §25</a>; <a href="https://en.idi.org.il/articles/28888">IDI explanation</a>.</p>
          </details>
          <details className="arrangement-history"><summary>{scenarioData.historical.title}</summary><p>{scenarioData.historical.text}</p><a href={scenarioData.historical.url}>{scenarioData.historical.source}</a></details>
          {t.chosen.length > 0 && (
            <div className="share">
              <button className="btn" type="button" onClick={copyLink}>Copy a link to this coalition</button>
              <span aria-live="polite">{copied ? "Copied" : ""}</span>
            </div>
          )}
          <div className="callout">
            <p>
              Parties have made public pledges about partners. You can build any combination here; a yellow note means it goes against a recorded
              pledge, a grey one is a stated condition, not a refusal.
            </p>
            <p>
              The Central Elections Committee voted Sept 23 to bar the Joint List and Ra&apos;am. The Supreme Court heard the appeals Oct 1 and
              reinstated both lists 9–0 on Oct 2.
            </p>
          </div>
          </div>
        </aside>
      </div>
      <PollNote poll={poll} />
      <p><Link href={`/export/coalition?${writeRoles(new URLSearchParams({poll:poll.id}),sel,roles,parties.map((p)=>p.id))}`}>Print or export this arrangement</Link></p>

      {profileParty && <Drawer party={profileParty} onClose={closeProfile} />}
    </div>
  );
}
