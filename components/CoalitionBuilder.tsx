"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./interactives.css";
import "./coalition.css";
import ProfileDetail from "./ProfileDetail";
import { blocs, mainPolls, parties, pledgeRules } from "@/lib/data";
import { MAJORITY, KNESSET, tally, warnings } from "@/lib/coalition";
import { mediumDate } from "@/lib/format";
import { blocTotals, pollLabel } from "@/lib/polls";
import type { Party, Poll } from "@/lib/types";

const POLL_KEY = "cb-poll";
const cardParties = parties.filter((p) => p.coalitionCard !== "hidden");
const fillVars = (p: Party) =>
  ({ "--fill": `var(--b-${p.bloc})`, "--fill-ink": `var(--b-${p.bloc}-ink)` }) as React.CSSProperties;

function seatLabel(p: Party, poll: Poll) {
  const r = poll.results[p.id];
  if (!r) return { txt: "n/a", na: true, below: false };
  return { txt: String(r.seats), na: false, below: !!r.belowThreshold };
}

function PollNote({ poll }: { poll: Poll }) {
  const t = blocTotals(poll, parties);
  const shown = blocs.filter((b) => t[b.id] > 0);
  const lumped = poll.combined.map((c) =>
    c.parties.map((id) => parties.find((p) => p.id === id)?.name ?? id).join(" and ")
  );
  return (
    <p className="pollnote">
      Showing <b>{pollLabel(poll)}, published {mediumDate(poll.published)}</b>. Seats by bloc in this poll:{" "}
      {shown.map((b, i) => (
        <span key={b.id}>
          {i > 0 && " · "}
          {b.label} <b>{t[b.id]}</b>
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
  if (p.coalitionCard === "out") {
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
  const src = `${pollLabel(poll)}, ${mediumDate(poll.published)}`;
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
          {s.na ? `Not reported by ${poll.pollster}` : s.below ? "Below threshold in this poll" : "seats"}
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

export default function CoalitionBuilder() {
  const [pollId, setPollId] = useState(mainPolls[0].id);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore after hydration
    if (p && mainPolls.some((x) => x.id === p)) setPollId(p);
    const ids = (q.get("with") ?? "").split(",").filter((id) => cardParties.some((x) => x.id === id && x.coalitionCard === "active"));
    if (ids.length) setSel(new Set(ids));
    ready.current = true;
  }, []);

  // Keep the URL shareable.
  useEffect(() => {
    if (!ready.current) return;
    const q = new URLSearchParams(window.location.search);
    q.set("poll", pollId);
    if (sel.size) q.set("with", cardParties.filter((p) => sel.has(p.id)).map((p) => p.id).join(","));
    else q.delete("with");
    history.replaceState(null, "", `${window.location.pathname}?${q.toString().replace(/%2C/g, ",")}`);
  }, [pollId, sel]);

  const poll = mainPolls.find((p) => p.id === pollId)!;
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
            {mainPolls.map((p) => (
              <button key={p.id} type="button" aria-pressed={p.id === pollId} onClick={() => choosePoll(p.id)}>
                {p.pollster}
                <small>{mediumDate(p.published)}</small>
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
                {cardParties.filter((p) => p.bloc === b.id).map((p) => (
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
            <span className="n">{t.total}{t.partial ? "+" : ""}</span>
            <span className="of">of {MAJORITY} needed</span>
            {t.total >= MAJORITY ? (
              <span className="pill maj">Majority</span>
            ) : t.chosen.length ? (
              <span className="pill short">{MAJORITY - t.total} short</span>
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

