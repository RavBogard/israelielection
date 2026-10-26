"use client";
import { useSeatContext } from "../seat-context/SeatContextProvider";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import Link from "next/link";
import { partyColor } from "@/lib/party-colors";
import { blocs } from "@/lib/data";
import { lettersOf } from "@/lib/letters";
import { listSeats } from "@/lib/list-seats";
import { seatFigure } from "@/lib/polls";
import type { Lang } from "@/lib/i18n";
import builder from "@/lib/i18n/builder";
import { blocText, partyText } from "@/lib/i18n/overlay-text";
import type { Party, Sourced } from "@/lib/types";
import { En, Loc } from "./Loc";

/**
 * The Coalition Builder drawer's party preview in the Hebrew edition: who the list is, its seats, its coalition
 * pledges and a way into the full profile. The same job as components/ProfileDetail.tsx (which the English builder
 * and the Party Map keep), with every field read through the Hebrew overlays and each fallback marked English.
 */
export default function PartyPreview({ party: p, headingId, lang, context:initial }: { party: Party; headingId?: string; lang: Lang;context?:SharedSeatContext|null }) {
  const {context,refreshFailed}=useSeatContext(initial,!!initial);
  const T = builder[lang];
  const color = partyColor(p.id);
  const bloc = blocs.find((b) => b.id === p.bloc);
  const name = partyText(p, "name", lang);
  const href = `${lang !== "en" ? `/${lang}` : ""}/parties/${p.id}`;
  const items = (key: "who" | "pledges", list: Sourced[]) => (
    <ul>
      {list.map((x, i) => (
        <li key={i}>
          <Loc v={partyText(p, `${key}.${i}.text`, lang)} page={lang} />
          {x.source && <> <span className="s">(<En page={lang}>{x.source}</En>)</span></>}
        </li>
      ))}
    </ul>
  );
  const s = listSeats(p.id);
  const seats = !s.n
    ? p.status ? <Loc v={partyText(p, "status", lang)} page={lang} /> : T.noPollFigures
    : s.k === 0 ? T.seatsAllBelow(s.n) : s.nearThreshold ? T.seatsNear(s.k, s.n, seatFigure(s.passing!)) : T.seatsPasses(s.text ?? "", s.k, s.n);
  return (
    <div className="profile preview" style={{ ["--qc" as string]: color }}>
      <div className="ident">
        {lettersOf[p.id] && (
          <span className="letters" lang="he" dir="rtl" title={T.lettersTitle(lettersOf[p.id])}>
            {lettersOf[p.id]}
          </span>
        )}
        <span className="bchip">
          <span className="sw" style={{ background: color }} />
          {bloc && <Loc v={blocText(bloc, lang)} page={lang} />}
        </span>
        <h2 className="pname" id={headingId}>
          <Loc v={name} page={lang} />
        </h2>
      </div>
      <Link className="open-profile" href={href}>
        {T.openProfile}
      </Link>
      <dl className="kv">
        <dt>{T.leader}</dt>
        <dd><Loc v={partyText(p, "leader", lang)} page={lang} /></dd>
        <dt>{context?LIFECYCLE[lang][context.basis]:T.seatsAverage}</dt>
        <dd>{!context&&refreshFailed?LIFECYCLE[lang].sourceUnavailable:context?`${context.pointSeats[p.id]??0} · ${LIFECYCLE[lang][context.seatStatus]}`:seats}</dd>
      </dl>
      {p.who.length > 0 && (
        <div className="sec">
          <p className="lbl">{T.whoTheyAre}</p>
          {items("who", p.who.slice(0, 2))}
        </div>
      )}
      {p.pledges && (
        <div className="sec">
          <p className="lbl">{T.coalitionPledges}</p>
          {items("pledges", p.pledges)}
        </div>
      )}
      <p className="fig-src">
        {T.profileLead}<Link href={href}>{T.fullProfile}</Link> {T.profileMore(name.text)}
      </p>
    </div>
  );
}
