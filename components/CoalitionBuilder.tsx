"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./interactives.css";
import "./coalition.css";
import ProfileDetail from "./ProfileDetail";
import { averagePoll, blocs, mainPolls, parties, pledgeRules } from "@/lib/data";
import { MAJORITY, KNESSET, tally, warnings } from "@/lib/coalition";
import { fmt, mediumDate, shortDate } from "@/lib/format";
import { AVERAGE_ID, blocTotals, pollLabel } from "@/lib/polls";
import { RESULTS_ID } from "@/lib/results";
import type { Party, Poll } from "@/lib/types";

const POLL_KEY = "cb-poll";
/** The picker: election results once counting starts, then the current average, then each current poll. */
const pickList = (results: Poll | null) => (results ? [results, averagePoll, ...mainPolls] : [averagePoll, ...mainPolls]);
const cardParties = parties.filter((p) => p.coalitionCard !== "hidden");
/** Cards for a poll: a list hidden for lack of polling still appears if the count gives it seats. */
const cardsFor = (poll: Poll) =>
  parties.filter((p) => p.coalitionCard !== "hidden" || (poll.id === RESULTS_ID && (poll.results[p.id]?.seats ?? 0) > 0));
const fillVars = (p: Party) =>
  ({ "--fill": `var(--b-${p.bloc})`, "--fill-ink": `var(--b-${p.bloc}-ink)` }) as React.CSSProperties;

function seatLabel(p: Party, poll: Poll) {
  const r = poll.results[p.id];
  if (!r) return { txt: "n/a", na: true, below: false };
  return { txt: fmt(r.seats), na: false, below: !!r.belowThreshold };
}

function PollNote({ poll }: { poll: Poll }) {
  const t = blocTotals(poll, parties);
  const shown = blocs.filter((b) => t[b.id] > 0);
  const lumped = poll.combined.map((c) =>
    c.parties.map((id) => parties.find((p) => p.id === id)?.name ?? id).join(" and ")
  );
  return (
    <p className="pollnote">
      {poll.id === RESULTS_ID ? (
        <>
          Showing <b>the election results so far</b>. {poll.note} Seats by bloc:{" "}
        </>
      ) : poll.id === AVERAGE_ID ? (
        <>
          Showing <b>the average of the latest {mainPolls.length} polls</b>, one per pollster ({mainPolls.map((p) => `${p.pollster} ${shortDate(p.published)}`).join(", ")}), so seats can be fractional. Seats by bloc:{" "}
        </>
      ) : (
        <>
          Showing <b>{pollLabel(poll)}, published {mediumDate(poll.published)}</b>. Seats by bloc in this poll:{" "}
        </>
      )}
      {shown.map((b, i) => (
        <span key={b.id}>
          {i > 0 && " · "}
          {b.label} <b>{fmt(t[b.id])}</b>
        </span>
      ))}
      .{lumped.map((l) => ` ${l} were not reported separately.`)}
    </p>
  );
}

function Card({ p, poll, on, onToggle, onProfile }: {
  p: Party; poll: Poll; on: boolean; onToggle: () => void; onProfile: (el: HTMLButtonElement) => void;
}) {
  const info = (
    <button type="button" className="info" aria-haspopup="dialog" aria-label={`Profile: ${p.name}`} onClick={(e) => onProfile(e.currentTarget)}>
      <span className="i" aria-hidden="true">i</span>Profile
    </button>
  );
  // A list written off in the polls gets a normal card if the count gives it seats.
  if (p.coalitionCard === "out" && !(poll.id === RESULTS_ID && (poll.results[p.id]?.seats ?? 0) > 0)) {
    return (
      <div className="card out" style={fillVars(p)} title={p.status ?? undefined}>
        <button type="button" className="tog" disabled>
          <span className="nm">{p.name}</span>
          <span className="seats na">—</span>
          <span className="ld">{p.leader}</span>
          <span className="meta">{p.status}</span>
        </button>
        <div className="foot">{info}</div>
      </div>
    );
  }
  const s = seatLabel(p, poll);
  const src = poll.id === RESULTS_ID ? "the count so far" : poll.id === AVERAGE_ID ? `average of ${mainPolls.length} polls` : `${pollLabel(poll)}, ${mediumDate(poll.published)}`;
  const tip = s.na ? `${poll.pollster} did not report ${p.name} separately (${src})` : s.below ? `Below threshold in ${src}` : `${s.txt} seats, ${src}`;
  return (
    <div className={`card${on ? " on" : ""}`} style={fillVars(p)} title={tip} onClick={(e) => {
      if (!(e.target as HTMLElement).closest("button")) onToggle();
    }}>
      <button type="button" className="tog" aria-pressed={on} onClick={onToggle}>
        <span className="nm">{p.name}</span>
        <span className={`seats${s.na ? " na" : ""}`}>{s.txt}</span>
        <span className="ld">{p.leader}</span>
        {p.surplusLine && <span className="sp">{p.surplusLine}</span>}
        <span className="meta">
          <span className="sw" style={{ background: `var(--b-${p.bloc})` }} />
          {s.na ? `Not reported by ${poll.pollster}` : s.below ? `Below threshold in ${poll.id === RESULTS_ID ? "the count" : "this poll"}` : "seats"}
        </span>
      </button>
      <div className="foot">
        {info}
        <span className="state">{on ? "In" : "Add"}</span>
      </div>
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
            Close <span aria-hidden="true">✕</span>
          </button>
        </div>
        <div className="dbody">
          <ProfileDetail party={party} headingId="dtitle" linkToPage />
        </div>
      </aside>
    </>
  );
}

export default function CoalitionBuilder({ results = null }: { results?: Poll | null }) {
  const choices = useMemo(() => pickList(results), [results]);
  const [pollId, setPollId] = useState(results ? RESULTS_ID : AVERAGE_ID);
  const [sel, setSel] = useState<Set<string>>(() => new Set());
  const [profile, setProfile] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const opener = useRef<HTMLButtonElement | null>(null);
  const ready = useRef(false);

  // Restore from the URL (?poll=…&with=a,b) first, then the remembered poll.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    let p = q.get("poll");
    if (!p) try { p = localStorage.getItem(POLL_KEY); } catch {}
    // On results night the count wins over a remembered poll; a shared link still picks its own.
    if (results && !q.get("poll")) p = RESULTS_ID;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore after hydration
    if (p && choices.some((x) => x.id === p)) setPollId(p);
    const ids = (q.get("with") ?? "").split(",").filter((id) => (results ? cardsFor(results) : cardParties).some((x) => x.id === id && (x.coalitionCard === "active" || (results?.results[id]?.seats ?? 0) > 0)));
    if (ids.length) setSel(new Set(ids));
    ready.current = true;
  }, [choices, results]);

  // Keep the URL shareable.
  useEffect(() => {
    if (!ready.current) return;
    const q = new URLSearchParams(window.location.search);
    q.set("poll", pollId);
    if (sel.size) q.set("with", parties.filter((p) => sel.has(p.id)).map((p) => p.id).join(","));
    else q.delete("with");
    history.replaceState(null, "", `${window.location.pathname}?${q.toString().replace(/%2C/g, ",")}`);
  }, [pollId, sel]);

  const poll = choices.find((p) => p.id === pollId) ?? choices[0];
  const t = tally(sel, parties, poll);
  const warns = warnings(sel, parties, pledgeRules);

  const choosePoll = (id: string) => {
    setPollId(id);
    try { localStorage.setItem(POLL_KEY, id); } catch {}
  };
  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
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

  return (
    <div className="cb">
      <header className="ix-head">
        <div>
          <h1>Build a Coalition</h1>
          <p className="sub">
            Tap a party card to add it; tap <b>Profile</b> for who they are and where they stand. A government needs {MAJORITY} of the
            Knesset&apos;s {KNESSET} seats to win a confidence vote. Seat numbers come from the poll you pick.
          </p>
        </div>
        <div className="controls">
          <div className="seg" role="group" aria-label="Choose a poll">
            {choices.map((p) => (
              <button key={p.id} type="button" aria-pressed={p.id === pollId} onClick={() => choosePoll(p.id)}>
                {p.pollster}
                <small>{p.id === RESULTS_ID ? "count so far" : p.id === AVERAGE_ID ? `latest ${mainPolls.length} polls` : mediumDate(p.published)}</small>
              </button>
            ))}
          </div>
          <button className="btn" type="button" onClick={() => setSel(new Set())}>
            Reset
          </button>
        </div>
      </header>
      <PollNote poll={poll} />

      <div className="layout">
        <div className="blocs">
          {blocs.map((b) => (
            <section className="bloc" key={b.id}>
              <h2>
                <span className="sw" style={{ background: `var(--b-${b.id})` }} />
                {b.label}
              </h2>
              <div className="cards">
                {cardsFor(poll).filter((p) => p.bloc === b.id).map((p) => (
                  <Card key={p.id} p={p} poll={poll} on={sel.has(p.id)} onToggle={() => toggle(p.id)}
                    onProfile={(el) => { opener.current = el; setProfile(p.id); }} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="panel" aria-live="polite">
          <h3>Your coalition</h3>
          <div className="total">
            <span className="n">{fmt(t.total)}{t.partial ? "+" : ""}</span>
            <span className="of">of {MAJORITY} needed</span>
            {t.total >= MAJORITY ? (
              <span className="pill maj">Majority</span>
            ) : t.chosen.length ? (
              <span className="pill short">{fmt(MAJORITY - t.total)} short</span>
            ) : null}
          </div>
          <div>
            <div className="meter">
              <div className="segs">
                {t.segments.map((s) => (
                  <div key={s.name} className="seg-p" title={`${s.name}: ${s.seats}`}
                    style={{ flex: `0 0 calc(${s.seats}/${KNESSET}*100% - 2px)`, background: `var(--b-${s.bloc})` }} />
                ))}
              </div>
              <div className="mark" style={{ left: `calc(${MAJORITY}/${KNESSET}*100%)` }} />
            </div>
            <div className="scale">
              <span style={{ left: 0 }}>0</span>
              <span className="m61" style={{ left: `calc(${MAJORITY}/${KNESSET}*100%)` }}>{MAJORITY}</span>
              <span style={{ left: "100%" }}>{KNESSET}</span>
            </div>
          </div>
          {t.groupNote && <div className="naflag">{t.groupNote}</div>}
          <ul className="list">
            {t.chosen.length ? (
              t.chosen.map((p) => (
                <li key={p.id}>
                  <span className="sw" style={{ background: `var(--b-${p.bloc})` }} />
                  {p.name}
                  <span className="v">{seatLabel(p, poll).txt}</span>
                </li>
              ))
            ) : (
              <li className="empty">No parties yet. Tap a party card to add it.</li>
            )}
          </ul>
          {warns.length > 0 && (
            <div className="warns">
              {warns.map((w) => (
                <div key={w.id} className={`warn${w.kind === "condition" ? " info" : ""}`}>
                  <b>{w.kind === "condition" ? "Condition" : "Goes against a pledge"}</b>
                  {w.message}
                  <cite>Source: {w.source}</cite>
                </div>
              ))}
            </div>
          )}
          {t.chosen.length > 0 && (
            <div className="share">
              <button className="btn" type="button" onClick={copyLink}>Copy link to this coalition</button>
              <span aria-live="polite">{copied ? "Copied" : ""}</span>
            </div>
          )}
          <div className="note">
            <p>
              Parties have made public pledges about partners. This page lets you build any combination. A yellow label means the
              combination goes against a recorded pledge; a grey dashed label is a stated condition, not a refusal.
            </p>
            <p>
              The Central Elections Committee voted Sept 23 to bar the Joint List and Ra&apos;am. The Supreme Court heard the appeals Oct
              1 and reinstated both lists 9–0 on Oct 2.
            </p>
            <p>
              <b>Surplus-vote partners</b> share leftover votes when seats are divided; it is a technical deal, not a coalition promise.
            </p>
          </div>
        </aside>
      </div>
      {profileParty && <Drawer party={profileParty} onClose={closeProfile} />}
    </div>
  );
}

