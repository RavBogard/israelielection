"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./interactives.css";
import "./coalition.css";
import Governing from "./Governing";
import type { StanceMap } from "@/lib/cohesion";
import ProfileDetail from "./ProfileDetail";
import SeatGrid from "./SeatGrid";
import { averagePoll, blocs, exitPolls, mainPolls, parties, pledgeRules } from "@/lib/data";
import { MAJORITY, KNESSET, tally, warnings } from "@/lib/coalition";
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
  ({ "--fill": `var(--b-${p.bloc})`, "--fill-ink": `var(--b-${p.bloc}-ink)` }) as React.CSSProperties;

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
          Seats are <b>the election results so far</b>. {poll.note} By bloc:{" "}
        </>
      ) : poll.id === AVERAGE_ID ? (
        <>
          Seats are <b>the average of the latest {mainPolls.length} polls</b>, one per pollster (
          {mainPolls.map((p) => `${p.pollster} ${shortDate(p.published)}`).join(", ")}), so they can be fractional. By bloc:{" "}
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
function Slip({ p, poll, on, onToggle, onProfile }: { p: Party; poll: Poll; on: boolean; onToggle: () => void; onProfile: (el: HTMLButtonElement) => void }) {
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
  const src = poll.id === RESULTS_ID ? "the count so far" : poll.id === AVERAGE_ID ? `the average of ${mainPolls.length} polls` : `${pollLabel(poll)}, ${mediumDate(poll.published)}`;
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
        <span className="state" aria-hidden="true">{on ? "In your coalition" : "Tap to add"}</span>
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
            Close
          </button>
        </div>
        <div className="dbody">
          <ProfileDetail party={party} headingId="dtitle" linkToPage />
        </div>
      </aside>
    </>
  );
}

/** A named line-up a reader can load in one tap, with the seats it once held for the "then vs now" line. */
/** The pledge and condition notes for the chosen parties: yellow goes against a recorded pledge, grey is a stated condition. */
function Warns({ warns }: { warns: ReturnType<typeof warnings> }) {
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
  poll.id === RESULTS_ID ? "the count so far" : poll.id === AVERAGE_ID ? `the average of the latest ${mainPolls.length} polls` : `${pollLabel(poll)}, ${mediumDate(poll.published)}`;

export default function CoalitionBuilder({ results = null, embedded = false, preset, stances }: { results?: Poll | null; embedded?: boolean; preset?: Preset; stances?: StanceMap }) {
  // On the home page the builder sits under the page's own heading, so its title is an h2.
  const Title = embedded ? "h2" : "h1";
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
  const segments = t.segments.map((s) => ({ id: s.name, seats: s.seats, color: `var(--b-${s.bloc})`, label: s.name }));

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
            Each card is a party&apos;s ballot slip. Tap one to add the party; a government needs <b>{MAJORITY}</b> of the Knesset&apos;s {KNESSET}{" "}
            seats to win a confidence vote. Seat numbers come from the poll you pick.
          </p>
          {preset && presetIds.length > 0 && (
            <p className="preset">
              Start from{" "}
              <button type="button" className="linkish" onClick={() => setSel(new Set(presetIds))} aria-pressed={presetOn}>
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
                <small>{p.id === RESULTS_ID ? "count so far" : p.id === AVERAGE_ID ? `latest ${mainPolls.length} polls` : mediumDate(p.published)}</small>
              </button>
            ))}
          </div>
          <button className="btn" type="button" onClick={() => setSel(new Set())} disabled={!sel.size}>
            Start over
          </button>
        </div>
      </header>
      <PollNote poll={poll} />

      <div className="layout">
        <div className="blocs">
          {blocs.map((b) => (
            <section className="bloc" key={b.id}>
              <h3>
                <span className="sw" style={{ background: `var(--b-${b.id})` }} />
                {b.label}
              </h3>
              <div className="slips">
                {cardsFor(poll).filter((p) => p.bloc === b.id).map((p) => (
                  <Slip key={p.id} p={p} poll={poll} on={sel.has(p.id)} onToggle={() => toggle(p.id)}
                    onProfile={(el) => { opener.current = el; setProfile(p.id); }} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="panel" aria-live="polite">
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
                <>of {MAJORITY} needed</>
              )}
            </span>
          </div>
          <SeatGrid variant="meter" segments={segments} labelRule title={`Your coalition: ${fmt(t.total)} of ${KNESSET} seats; ${MAJORITY} is a majority`} />
          {t.groupNote && <p className="naflag">{t.groupNote}</p>}
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
            <Governing sel={sel} parties={parties} poll={poll} map={stances}>
              <Warns warns={warns} />
            </Governing>
          ) : (
            <Warns warns={warns} />
          )}
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
      {profileParty && <Drawer party={profileParty} onClose={closeProfile} />}
    </div>
  );
}
