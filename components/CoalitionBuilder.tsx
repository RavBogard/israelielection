"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {partyColor,partyInk,blocColorStrip} from "@/lib/party-colors";
import { arrangementKey, restorationGate } from "@/lib/builder-state";
import "./interactives.css";
import "./coalition.css";
import Governing from "./Governing";
import type { StanceMap } from "@/lib/cohesion";
import ProfileDetail from "./ProfileDetail";
import SeatGrid from "./SeatGrid";
import { averagePoll, blocs, exitPolls, mainPolls, parties, pledgeRules } from "@/lib/data";
import { MAJORITY, KNESSET, tally, type Warning } from "@/lib/coalition";
import { arrangement, arrangementWarnings, initialVoteDependence, restoreRoles, roleOf, ROLE_LABELS, writeRoles, type RoleOverrides, type SupportRole } from "@/lib/coalition-arrangement";
import scenarioData from "@/data/coalition-scenarios.json";
import { fmt, mediumDate, shortDate } from "@/lib/format";
import { lettersOf } from "@/lib/letters";
import { AVERAGE_ID, blocTotals, pollLabel } from "@/lib/polls";
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

function seatLabel(p: Party, poll: Poll) {
  const r = poll.results[p.id];
  if (!r) return { txt: "n/a", na: true, below: false };
  return { txt: fmt(r.seats), na: false, below: !!r.belowThreshold };
}

function PollNote({ poll }: { poll: Poll }) {
  const t = blocTotals(poll, parties);
  const shown = blocs.filter((b) => t[b.id] > 0);
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
          Seats are a <b>normalized coalition average</b> of the latest {mainPolls.length} polls, one per pollster (
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
          {b.label} <b>{fmt(t[b.id])}</b>
        </span>
      ))}
      .{lumped.map((l) => ` ${l} were not reported separately.`)}
    </p>
  );
}

/** A party card drawn as its ballot slip: the letters a voter picks, the name, the seats. */
function Slip({ p, poll, on, onToggle, onProfile, role, onRole }: { p: Party; poll: Poll; on: boolean; onToggle: () => void; onProfile: (el: HTMLButtonElement) => void; role: SupportRole; onRole: (role: SupportRole) => void }) {
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
  const src = poll.id === RESULTS_ID ? countPhrase(poll) : poll.id === AVERAGE_ID ? `the normalized coalition average of ${mainPolls.length} polls` : `${pollLabel(poll)}, ${mediumDate(poll.published)}`;
  const tip = s.na ? `${poll.pollster} did not report ${p.name} separately (${src})` : s.below ? `Below threshold in ${src}` : `${s.txt} seats in ${src}`;
  return (
    <div className={`slip${on ? " on" : ""}`} style={fillVars(p)}>
      <button type="button" className="face" aria-pressed={on} onClick={onToggle} title={tip}>
        {letters && <span className="letters" lang="he" dir="rtl">{letters}</span>}
        <span className="nm">{p.name}</span>
        <span className="ld">{p.leader}</span>
        <span className={`seats${s.na ? " na" : ""}`}>
          {s.txt}
          <small>{s.na ? "not reported" : s.below ? "below threshold" : "seats"}</small>
        </span>
      </button>
      <div className="foot">
        {profile}
        <span className="state" aria-hidden="true">{ROLE_LABELS[role]}</span>
      </div>
      <label className="role-picker">Role for {p.name}
        <select value={role} onChange={(e) => onRole(e.target.value as SupportRole)}>
          {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
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
          <p className="lbl">Party profile</p>
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
  poll.id === RESULTS_ID ? countPhrase(poll) : poll.id === AVERAGE_ID ? `the normalized coalition average of the latest ${mainPolls.length} polls` : `${pollLabel(poll)}, ${mediumDate(poll.published)}`;

export default function CoalitionBuilder({ results = null, embedded = false, preset, stances }: { results?: Poll | null; embedded?: boolean; preset?: Preset; stances?: StanceMap }) {
  // On the home page the builder sits under the page's own heading, so its title is an h2.
  const Title = embedded ? "h2" : "h1";
  const choices = useMemo(() => pickList(results), [results]);
  const [pollId, setPollId] = useState(results ? RESULTS_ID : AVERAGE_ID);
  const [sel, setSel] = useState<Set<string>>(() => new Set());
  const [roles, setRoles] = useState<RoleOverrides>({});
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [profile, setProfile] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const opener = useRef<HTMLButtonElement | null>(null);
  const ready = useRef(false);
  const gate = useRef(restorationGate());

  // Restore from the URL (?poll=…&with=a,b) first, then the remembered poll.
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
  const t = tally(sel, parties, poll);
  const warns = arrangementWarnings(sel, roles, parties, pledgeRules);
  const vote = arrangement(sel, roles, parties, poll);
  const supportIds = Object.keys(roles).filter((id) => roles[id] === "support");
  const cooperation = new Set([...sel, ...supportIds]);
  const voteNeeded = initialVoteDependence(sel, roles, parties, poll);
  const scenario = scenarioData.scenarios.find((s) => s.id === scenarioId);
  const segments = t.segments.map((s) => { const party=parties.find((p)=>p.name===s.name); return {id:party?.id??s.name,seats:s.seats,color:party?partyColor(party.id):"#8c939b",label:s.name,href:party?`/parties?party=${party.id}`:"/parties"}; });

  const choosePoll = (id: string) => {
    setPollId(id);
    try { localStorage.setItem(POLL_KEY, id); } catch {}
  };
  const assignRole = (id: string, role: SupportRole) => {
    setScenarioId(null);
    setSel((s) => { const n = new Set(s); if (role === "cabinet") n.add(id); else n.delete(id); return n; });
    setRoles((r) => { const n = { ...r }; if (role === "support" || role === "abstain") n[id] = role; else delete n[id]; return n; });
  };
  const toggle = (id: string) => assignRole(id, sel.has(id) ? "opposition" : "cabinet");
  const loadScenario = (id: string) => {
    const s = scenarioData.scenarios.find((s) => s.id === id);
    if (!s) return;
    setSel(new Set(s.cabinet));
    setRoles(Object.fromEntries([...s.support.map((p) => [p, "support"]), ...s.abstain.map((p) => [p, "abstain"])]));
    setScenarioId(id);
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
  const short = MAJORITY - t.total;
  // The preset loads only slips that can be selected in this poll; a list without a figure is named in its note instead.
  const presetIds = preset ? preset.ids.filter((id) => cardsFor(poll).some((p) => p.id === id && (p.coalitionCard === "active" || (poll.results[id]?.seats ?? 0) > 0))) : [];
  const presetOn = preset ? presetIds.length > 0 && sel.size === presetIds.length && presetIds.every((id) => sel.has(id)) : false;

  return (
    <div className="cb">
      <header className="ix-head">
        <div>
          <Title className="h1">Build a coalition</Title>
          <p className="sub">
            Tap a ballot slip to add a cabinet partner; <b>{MAJORITY}</b> of {KNESSET} seats is a majority.
          </p>
          {preset && presetIds.length > 0 && (
            <p className="preset">
              Start from{" "}
              <button type="button" className="linkish" onClick={() => { setSel(new Set(presetIds)); setRoles({}); setScenarioId(null); }} aria-pressed={presetOn}>
                {preset.label}
              </button>
              : {presetIds.map((id) => parties.find((p) => p.id === id)!.name).join(", ")}.
            </p>
          )}
        </div>
        <div className="controls">
          <div className="seg" role="group" aria-label="Choose a poll">
            {choices.map((p) => (
              <button key={p.id} type="button" aria-pressed={p.id === pollId} onClick={() => choosePoll(p.id)}>
                {pollLabel(p)}
                <small>{p.id === RESULTS_ID ? (p.resultState?.freshness === "stale" ? "saved count (stale)" : "count so far") : p.id === AVERAGE_ID ? "normalized coalition average" : mediumDate(p.published)}</small>
              </button>
            ))}
          </div>
          <button className="btn" type="button" onClick={() => { setSel(new Set()); setRoles({}); setScenarioId(null); }} disabled={!sel.size && !Object.keys(roles).length}>
            Start over
          </button>
        </div>
      </header>
      <section className="arrangement-scenarios" aria-label="Explore a hypothetical arrangement">
        <p>Try a governing arrangement</p>
        <div>{scenarioData.scenarios.map((s) => <button key={s.id} type="button" className="btn" aria-pressed={scenarioId === s.id} onClick={() => loadScenario(s.id)}>{s.title}</button>)}</div>
        {scenario && <div className="scenario-reading"><p>{scenario.agenda}</p><ol>{scenario.obstacles.map((text) => <li key={text}>{text}</li>)}</ol><p>{scenario.leadership}</p><p className="src"><a href={scenario.url}>{scenario.source}</a>, Research checked {scenarioData.updated}. Pledge sources appear with each warning.</p></div>}
      </section>

      <div className="layout">
        <div className="mobile-arrangement" aria-live="polite">
          <span><b>{fmt(t.total)}</b> cabinet seats, <b>{fmt(vote.yes)}</b> for / <b>{fmt(vote.no)}</b> against</span>
          <a href="#arrangement-result">View the arrangement</a>
        </div>
        <div className="blocs">
          {blocs.map((b) => (
            <section className="bloc" key={b.id}>
              <h3>
                <span className="sw" style={{ background: blocColorStrip(b.id) }} />
                {b.label}
              </h3>
              <div className="slips">
                {cardsFor(poll).filter((p) => p.bloc === b.id).map((p) => (
                  <Slip key={p.id} p={p} poll={poll} on={sel.has(p.id)} onToggle={() => toggle(p.id)}
                    role={roleOf(p.id, sel, roles)} onRole={(role) => assignRole(p.id, role)}
                    onProfile={(el) => { opener.current = el; setProfile(p.id); }} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="panel" id="arrangement-result" aria-live="polite">
          <div className="total">
            <span className="n">{fmt(t.total)}{t.partial ? "+" : ""}</span>
            <span className="read">
              {t.total >= MAJORITY ? (
                <b className="maj">A majority</b>
              ) : t.chosen.length ? (
                <>
                  <b>{fmt(short)} short</b> of {MAJORITY}
                </>
              ) : (
                <>cabinet seats; {MAJORITY} is a majority</>
              )}
            </span>
          </div>
          <SeatGrid variant="meter" segments={segments} labelRule title={`Your coalition: ${fmt(t.total)} of ${KNESSET} seats; ${MAJORITY} is a majority`} />
          {t.groupNote && <p className="naflag">{t.groupNote}</p>}
          <section className="confidence" aria-labelledby="confidence-h">
            <h3 id="confidence-h">Hypothetical initial confidence vote</h3>
            <dl><div><dt>For (cabinet + outside support)</dt><dd>{fmt(vote.yes)}</dd></div><div><dt>Against (opposition)</dt><dd>{fmt(vote.no)}</dd></div><div><dt>Abstain (excluded)</dt><dd>{fmt(vote.abstain)}</dd></div></dl>
            <p>{vote.outcome === "empty" ? "Choose a cabinet party to simulate an initial vote." : vote.outcome === "incomplete" ? "No verdict: this poll cannot resolve all role totals." : vote.outcome === "passes" ? "More for than against: passes under these hypothetical assignments." : "No majority of votes cast: fails under these hypothetical assignments."}</p>
            {vote.approximate && <p className="naflag">Poll averages can be fractional. These totals illustrate relative support; real MKs cast whole votes. This is not a forecast of their vote.</p>}
            {!vote.complete && vote.outcome !== "empty" && <p className="naflag">{vote.crossed ? "A combined poll group spans different roles and cannot be divided from the source. " : ""}{vote.notReported.length ? `${vote.notReported.map((p) => p.name).join(", ")} not reported separately. ` : ""}Accounted for: {fmt(vote.represented)} of 120 seats.</p>}
            {Object.entries(roles).length > 0 && <ul>{Object.entries(roles).map(([id, role]) => <li key={id}>{parties.find((p) => p.id === id)?.name ?? id}: {ROLE_LABELS[role]}</li>)}</ul>}
            {voteNeeded.length > 0 && <p>If any one of {voteNeeded.map((id) => parties.find((p) => p.id === id)?.name ?? id).join(", ")} votes against rather than for, this hypothetical initial vote no longer passes.</p>}
            <p className="note">Outside support here concerns the initial vote; it promises no ministers or future budget support. Cabinet refusals do not prove a party will refuse outside support or abstention. Replacing an existing government through constructive no-confidence requires 61 MKs to support an alternative government.</p>
            <p className="src"><a href="https://main.knesset.gov.il/EN/activity/Documents/BasicLawsPDF/BasicLawTheGovernment.pdf">Basic Law: Government §§13(d), 28</a>; <a href="https://main.knesset.gov.il/EN/activity/documents/BasicLawsPDF/BasicLawTheKnesset.pdf">Knesset §25</a>; <a href="https://en.idi.org.il/articles/28888">IDI explanation</a>.</p>
          </section>
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
              <li className="empty">No parties yet. Tap a slip to add one.</li>
            )}
          </ul>
          {preset && presetOn && (
            <p className="thennow">
              {preset.label[0].toUpperCase() + preset.label.slice(1)} held <b>{preset.seats}</b> seats in {preset.year}; its parties have <b>{fmt(t.total)}</b> in{" "}
              {pollPhrase(poll)}.{preset.note ? ` ${preset.note}` : ""}
            </p>
          )}
          {stances ? (
            <Governing sel={cooperation} parties={parties} poll={poll} map={stances} withOutsideSupport={supportIds.length > 0}>
              <Warns warns={warns} />
            </Governing>
          ) : (
            <Warns warns={warns} />
          )}
          <details className="arrangement-history"><summary>{scenarioData.historical.title}</summary><p>{scenarioData.historical.text}</p><a href={scenarioData.historical.url}>{scenarioData.historical.source}</a></details>
          {t.chosen.length > 0 && (
            <div className="share">
              <button className="btn" type="button" onClick={copyLink}>Copy a link to this coalition</button>
              <span aria-live="polite">{copied ? "Copied" : ""}</span>
            </div>
          )}
          <div className="note">
            <p>
              Parties have made public pledges about partners. You can build any combination here; a yellow note means it goes against a recorded
              pledge, a grey one is a stated condition, not a refusal.
            </p>
            <p>
              The Central Elections Committee voted Sept 23 to bar the Joint List and Ra&apos;am. The Supreme Court heard the appeals Oct 1 and
              reinstated both lists 9–0 on Oct 2.
            </p>
          </div>
        </aside>
      </div>
      <PollNote poll={poll} />
      <p><Link href={`/export/coalition?${writeRoles(new URLSearchParams({poll:poll.id}),sel,roles,parties.map((p)=>p.id))}`}>Print or export this arrangement</Link></p>

      {profileParty && <Drawer party={profileParty} onClose={closeProfile} />}
    </div>
  );
}
