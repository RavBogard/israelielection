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
export default function PartyPreview({ party: p, headingId, lang }: { party: Party; headingId?: string; lang: Lang }) {
  const T = builder[lang];
  const color = partyColor(p.id);
  const bloc = blocs.find((b) => b.id === p.bloc);
  const name = partyText(p, "name", lang);
  const href = `${lang === "he" ? "/he" : ""}/parties/${p.id}`;
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
        <dt>{T.seatsAverage}</dt>
        <dd>{seats}</dd>
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
