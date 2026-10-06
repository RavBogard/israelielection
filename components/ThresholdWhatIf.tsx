"use client";
import { useMemo, useState } from "react";
import "./whatif.css";
import {partyColor,blocColorStrip} from "@/lib/party-colors";
import SeatGrid from "./SeatGrid";
import { allocate } from "@/lib/results";
import type { BlocId } from "@/lib/types";
import builder from "@/lib/i18n/builder";
import { useLang } from "@/lib/i18n/lang";

export type WhatIfParty = { id: string; name: string; bloc: BlocId; letters: string | null; seats: number; near: boolean };
export type WhatIfProps = {
  parties: WhatIfParty[];
  blocs: { id: BlocId; label: string }[];
  threshold: number;
  /** Surplus-vote agreements as id pairs, signed ones only. */
  agreements: [string, string][];
  pollsLabel: string;
};

const ORDER: BlocId[] = ["net", "mid", "opp", "arab"];
/** A round number of valid votes, in thousands, close to 2022's 4,764,742, so the threshold is a real-looking figure. */
const VALID = 4800;

/**
 * The threshold as arithmetic a reader can move: each list near 3.25% is set to pass or fail,
 * and the 120 seats are re-counted by the same method the results page uses. Shares come from
 * the poll average (seats over 120); a list set to pass sits exactly at the threshold.
 */
export default function ThresholdWhatIf({ parties, blocs, threshold, agreements, pollsLabel }: WhatIfProps) {
  // The caller passes names, bloc labels and pollsLabel in the page's edition.
  const lang = useLang();
  const T = builder[lang];
  const near = parties.filter((p) => p.near);
  const [passing, setPassing] = useState<Record<string, boolean>>(() => Object.fromEntries(near.map((p) => [p.id, p.seats > 0])));
  const base = useMemo(() => count(parties, threshold, agreements, Object.fromEntries(near.map((p) => [p.id, p.seats > 0]))), [parties, threshold, agreements, near]);
  const now = useMemo(() => count(parties, threshold, agreements, passing), [parties, threshold, agreements, passing]);
  const label = Object.fromEntries(blocs.map((b) => [b.id, b.label])) as Record<BlocId, string>;
  const segments = ORDER.flatMap((bloc)=>parties.filter((p)=>p.bloc===bloc&&(now.byParty[p.id]??0)>0).map((p)=>({id:p.id,seats:now.byParty[p.id],color:partyColor(p.id),label:p.name,href:`/parties?party=${p.id}`})));
  const wasted = now.wasted / VALID;

  return (
    <figure className="whatif" aria-label={T.whatIfLabel}>
      <figcaption>
        <b>{T.whatIfTry}</b>{T.whatIfCaption(pollsLabel, threshold * 100)}
      </figcaption>
      <div className="wi-body">
        <ul className="wi-toggles">
          {near.map((p) => (
            <li key={p.id}>
              <span className="sw" style={{ background: partyColor(p.id) }} />
              <span className="nm">
                {p.name}
                {p.letters && (
                  <span className="let" lang="he" dir="rtl">
                    {p.letters}
                  </span>
                )}
              </span>
              <span className="avg">{p.seats > 0 ? T.whatIfAverage(p.seats) : T.whatIfBelowAll}</span>
              <span className="seg" role="group" aria-label={T.whatIfToggle(p.name)}>
                <button type="button" aria-pressed={passing[p.id]} onClick={() => setPassing({ ...passing, [p.id]: true })}>
                  {T.passes}
                </button>
                <button type="button" aria-pressed={!passing[p.id]} onClick={() => setPassing({ ...passing, [p.id]: false })}>
                  {T.fails}
                </button>
              </span>
            </li>
          ))}
        </ul>
        <div className="wi-out">
          <SeatGrid segments={segments} variant="meter" labelRule title={T.whatIfGrid(ORDER.map((id) => `${label[id]} ${now.byBloc[id]}`).join(", "))} />
          <dl className="wi-blocs">
            {ORDER.map((id) => {
              const d = now.byBloc[id] - base.byBloc[id];
              return (
                <div key={id}>
                  <dt>
                    <span className="sw" style={{ background: blocColorStrip(id) }} />
                    {label[id]}
                  </dt>
                  <dd>
                    {now.byBloc[id]}
                    {d !== 0 && <small>{lang === "en" ? (d > 0 ? `+${d}` : d) : <bdi dir="ltr">{d > 0 ? `+${d}` : `−${-d}`}</bdi>}</small>}
                  </dd>
                </div>
              );
            })}
          </dl>
          <p className="wi-waste">
            {T.whatIfWasted}<b>{(wasted * 100).toFixed(1)}%</b>{T.whatIfWastedOf}
            {now.failed.length ? T.whatIfCastFor(now.failed) : "."}
          </p>
        </div>
      </div>
    </figure>
  );
}

/** Seats by bloc and wasted votes for one setting of the toggles. */
function count(parties: WhatIfParty[], threshold: number, agreements: [string, string][], passing: Record<string, boolean>) {
  const t = threshold * VALID;
  const votes: Record<string, number> = {};
  for (const p of parties) {
    if (p.near) votes[p.id] = passing[p.id] ? Math.ceil(t) + 1 : Math.floor(t * 0.9);
    else if (p.seats > 0) votes[p.id] = (p.seats / 120) * VALID;
  }
  const alloc = allocate(votes, VALID, threshold, agreements);
  const byBloc: Record<BlocId, number> = { net: 0, opp: 0, mid: 0, arab: 0 };
  for (const p of parties) byBloc[p.bloc] += alloc.seats[p.id] ?? 0;
  const failed = parties.filter((p) => votes[p.id] && !alloc.passing.includes(p.id)).map((p) => p.name);
  const wasted = parties.filter((p) => votes[p.id] && !alloc.passing.includes(p.id)).reduce((s, p) => s + votes[p.id], 0);
  return { byBloc, byParty: alloc.seats, failed, wasted };
}
