import Link from "next/link";
import type { ReactNode } from "react";
import "./party-profile.css";
import { partyColor, partyInk } from "@/lib/party-colors";
import { partiesData } from "@/lib/data";
import { mediumDate, shortDate } from "@/lib/format";
import { hePath, type Lang } from "@/lib/i18n";
import type { Localized } from "@/lib/i18n/localize";
import { OVERLAYS, blocText, overlayText, partyText, pollsterText } from "@/lib/i18n/overlays";
import profileText from "@/lib/i18n/profile";
import { seatFigure } from "@/lib/polls";
import { lettersOf } from "@/lib/letters";
import type { Party } from "@/lib/types";
import Loc, { plain, type Txt } from "./compare/Loc";
import { blocLabel, blocNote, glance, readings, result2022, strongholds, tiles, voterBase, type VoterBase } from "./profile/model";
import SeatSparkline from "./profile/SeatSparkline";
import StanceTiles from "./profile/StanceTiles";
import StrongholdsMap from "./profile/StrongholdsMap";
import VoterBaseBar from "./profile/VoterBaseBar";
import SeatBar from "./SeatBar";

/** An item as the page prints it: in Hebrew `text` is Localized and `prefix` (the surplus line's lead) is Hebrew UI. */
type Item = { text: Txt; source: string | null; prefix?: string };

function Src({ s, he }: { s: string | null; he: boolean }) {
  if (!s) return null;
  return <> <span className="s">({he ? <span lang="en" dir="ltr">{s}</span> : s})</span></>;
}

function Items({ items, he }: { items: Item[]; he: boolean }) {
  return (
    <ul className="pp-items">
      {items.map((x, i) => (
        <li key={i}>
          {x.prefix}
          <Loc v={x.text} />
          <Src s={x.source} he={he} />
        </li>
      ))}
    </ul>
  );
}

/** Nodes joined as a list: "a and b", "a, b and c"; Hebrew attaches ו to the last ("א וב", "א ו-i24NEWS"). */
function joined(nodes: { key: string; text: string; node: ReactNode }[], and: string): ReactNode {
  return nodes.map((n, i) => {
    const last = i === nodes.length - 1 && i > 0;
    const sep = i === 0 ? "" : last ? (and === " ו" && !/^[֐-׿]/.test(n.text) ? " ו-" : and) : ", ";
    return <span key={n.key}>{sep}{n.node}</span>;
  });
}

const one = seatFigure;
const thousands = (n: number) => n.toLocaleString("en-US");
const MAJORITY = 61, TOTAL = 120;

/**
 * The party profile as an election-guide spread: figures down the left column, the sentences
 * down the right, in the same order, so the page reads as one column of charts beside one
 * column of prose. On phones the two columns interleave by `order`, each figure next to the
 * section it belongs to. The running head and every figure take the party's own colour;
 * everything else is paper and ink. Both editions: the words are lib/i18n/profile's, and in Hebrew the
 * data text is read through lib/i18n/overlays (English where no current Hebrew exists, marked lang="en").
 */
export default function PartyProfile({ party: p, lang = "en" }: { party: Party; lang?: Lang }) {
  const P = profileText[lang];
  const he = lang === "he";
  const href = (en: string) => (he ? hePath(en) ?? en : en);
  /** A party field in the page's edition: the English string as is, or the Hebrew overlay's Localized. */
  const pt = (field: string, english: string): Txt => (he ? partyText(p, field, lang) : english);
  const color = partyColor(p.id);
  const ink = partyInk(p.id);
  const series = readings(p);
  const g = glance(p, series);
  const r22 = result2022(p);
  const map = strongholds(p);
  const vb = voterBase(p);
  const stand = tiles(p, lang);
  const letters = lettersOf[p.id];
  const name = pt("name", p.name);
  const leader = pt("leader", p.leader);
  const bloc: Txt = he ? blocText({ id: p.bloc, label: blocLabel[p.bloc] }, lang) : blocLabel[p.bloc];
  const status: Txt | null = p.status ? pt("status", p.status) : null;
  const leaderName = he ? plain(leader).split(" (")[0].split(",")[0] : p.leader.split(" (")[0].split(",")[0];
  const reported = series.filter((s) => s.seats !== null);
  const publishers = new Set(reported.map((s) => s.pollster)).size;
  const pollster = (s: string) => (he ? pollsterText(s, lang).text : s);
  // The sentences about voters, minus what a figure on the page already shows: the breakdown the bar draws,
  // the 2022 count the glance block states, and older city shares when the 2022 locality map is drawn.
  const voterText: Item[] = (p.voters ?? [])
    .map((v, i) => ({ v, i }))
    .filter(
      ({ v }) =>
        !(vb && /self-description|% traditional|% secular/.test(v.text)) &&
        !(r22 && r22.sameName && /^2022: [\d,]+ votes, [\d.]+%, \d+ seats\.$/.test(v.text)) &&
        !(map && /^Strong in /.test(v.text))
    )
    .map(({ v, i }) => ({ text: pt(`voters.${i}.text`, v.text), source: v.source }));
  // No poll has reported the list at all: the seat figures are absent, drawn hatched, not zero.
  const unpolled = reported.length === 0 && g.n === 0;
  const note = blocNote(g, p.bloc, one, lang);
  const thin: Txt | null = p.thin ? (he ? partyText(p, "thin", lang) : p.thin.replace(/^Our research registers have no /, "We have not yet found a sourced ")) : null;
  const whoItems: Item[] = p.who.map((w, i) => ({ text: pt(`who.${i}.text`, w.text), source: w.source }));
  const who: Item[] = p.surplusPartner
    ? [...whoItems, he ? { prefix: P.text.surplus, text: partyText(p, "surplusPartner.text", lang), source: p.surplusPartner.source } : { text: `${P.text.surplus}${p.surplusPartner.text}`, source: p.surplusPartner.source }]
    : whoItems;
  const pledges: Item[] | null = p.pledges ? p.pledges.map((x, i) => ({ text: pt(`pledges.${i}.text`, x.text), source: x.source })) : null;
  const vbHe: VoterBase | null = vb && he ? localVoterBase(p.id, vb, lang) : vb;
  const vbName = vb ? (vb.listName === p.name ? plain(name) : vbHe!.listName) : "";
  const mapName = r22 && !r22.sameName ? r22.listName : plain(name);
  // The quote: the speaker is the leader in most entries, so the leader's Hebrew name serves.
  const quote = p.quote ? (he ? partyText(p, "quote.text", lang) : p.quote.text) : null;
  const speaker: Txt | null = p.quote ? (he ? (p.quote.speaker === p.leader ? leader : partyText(p, "quote.speaker", lang)) : p.quote.speaker) : null;
  const variant = g.variantPollsters.map((s) => (he ? pollsterText(s, lang) : s));
  return (
    <article className="pp" style={{ ["--pc" as string]: color, ["--pc-ink" as string]: ink }}>
      <header className="pp-head">
        <div className="wrap">
          {letters && (
            <span className="letters" lang="he" dir="rtl" title={P.head.letters(letters)}>
              {letters}
            </span>
          )}
          <div className="who">
            <h1><Loc v={name} /></h1>
            <p className="lead">{P.head.ledBy}<b><Loc v={leader} /></b></p>
          </div>
          <div className="bloc">
            <span className="chip"><i style={{ background: `var(--b-${p.bloc})` }} /><Loc v={bloc} /></span>
            <span className="total">{g.avg === null ? (unpolled ? P.head.noPolls : status ? <Loc v={status} /> : P.head.notPolledSeparately) : g.below ? P.head.belowAverage : <><b>{one(g.avg)}</b>{P.head.seatsAverage}</>}</span>
          </div>
        </div>
      </header>

      <div className="wrap">
        <div className="pp-grid">
          <div className="pp-col pp-col-f">
            <figure className="pp-fig o1">
              <figcaption className="lbl">{P.glance.title}</figcaption>
              <dl className="pp-glance">
                <div className={unpolled ? "pp-none" : undefined}>
                  <dd>{g.avg === null ? <span className="nf">{unpolled ? P.head.noPolls : status ? <Loc v={status} /> : P.glance.notPolled}</span> : g.below ? P.glance.below : one(g.avg)}</dd>
                  <dt>{P.glance.seatsLabel}</dt>
                  <small>{g.avg === null ? P.glance.noSeatFigures : g.below ? (g.passingAvg !== null ? P.glance.wherePasses(one(g.passingAvg)) : P.glance.belowEvery) : g.low !== null ? P.glance.range(g.low, g.high!, g.n) : P.glance.scaled}</small>
                </div>
                <div>
                  <dd>{r22 ? r22.seats : <span className="nf">{P.glance.newList}</span>}</dd>
                  <dt>{P.glance.seats2022}</dt>
                  <small>{r22 ? (he ? <>{P.glance.share2022((r22.share * 100).toFixed(1))}{!r22.sameName && <>{P.glance.asList}<span lang="en" dir="ltr">{r22.listName}</span></>}</> : `${P.glance.share2022((r22.share * 100).toFixed(1))}${r22.sameName ? "" : `${P.glance.asList}${r22.listName}`}`) : P.glance.didNotRun}</small>
                </div>
                <div className={unpolled ? "pp-none" : undefined}>
                  <dd>{unpolled ? <span className="nf">{P.head.noPolls}</span> : <>{g.k}<span className="of">{P.glance.of}{g.n}</span></>}</dd>
                  <dt>{P.glance.pollsPasses}</dt>
                  <small>{unpolled ? P.glance.notReported : g.nearThreshold ? P.glance.near : g.k === g.n && g.n > 0 ? P.glance.never : g.k === 0 ? P.glance.belowAll : P.glance.most}</small>
                </div>
                <div className="blocbox">
                  <dd>{one(g.blocSeats)}<span className="of">{P.glance.blocUnit}</span></dd>
                  <dt><Loc v={bloc} /></dt>
                  <SeatBar className="pp-majority" total={TOTAL} majority={MAJORITY} segments={[{ key: p.bloc, seats: Math.min(TOTAL, g.blocSeats), color: `var(--b-${p.bloc})` }]} label={P.glance.blocBar(one(g.blocSeats))} />
                  <small>{note}</small>
                </div>
              </dl>
              <p className="fig-src">
                {g.n > 0 && (
                  <>
                    {P.glance.avgSource(g.n, shortDate(g.mainFrom, lang), mediumDate(g.mainTo, lang))}
                    {g.variantAvg !== null ? (he ? <>{P.glance.variantPre}{joined(variant.map((v) => ({ key: plain(v), text: plain(v), node: <Loc v={v} /> })), P.glance.and)}{P.glance.variantPost(one(g.variantAvg))}</> : `${P.glance.variantPre}${g.variantPollsters.join(P.glance.and)}${P.glance.variantPost(one(g.variantAvg))}`) : ""}
                  </>
                )}
                {r22 ? P.glance.cec2022(thousands(r22.votes)) : ""}
              </p>
            </figure>

            <figure className="pp-fig o3">
              <figcaption className="lbl">{P.spark.title}</figcaption>
              {reported.length < 2 ? (
                <p className="pp-nopolls">{reported.length === 0 ? P.spark.noPolls : P.spark.onePoll}</p>
              ) : (
                <SeatSparkline series={series} result={r22} id={p.id} name={plain(name)} avg={g.avg !== null && !g.below ? g.avg : null} lang={lang} pollsterName={pollster} />
              )}
              <p className="fig-src">
                {reported.length === 0
                  ? P.spark.noneReported(series.length, mediumDate(series[0]?.date ?? g.firstDate, lang))
                  : P.spark.reported(reported.length, publishers, mediumDate(g.firstDate, lang), mediumDate(g.lastDate, lang))}
              </p>
            </figure>

            {vb && vbHe && (
              <figure className="pp-fig o6">
                <figcaption className="lbl">{P.voters.caption(vbName, vb.listName === p.name)}</figcaption>
                <VoterBaseBar base={vbHe} color={color} lang={lang} />
                <p className="fig-src">{vbHe.source}.</p>
              </figure>
            )}

            {map && (
              <figure className="pp-fig o7">
                <figcaption className="lbl">{P.map.caption(mapName)}</figcaption>
                <StrongholdsMap data={map} color={color} name={mapName} lang={lang} />
                <p className="fig-src">{P.map.source((map.national * 100).toFixed(1))}</p>
              </figure>
            )}
          </div>

          <div className="pp-col pp-col-t">
            <section className="pp-text o4">
              <h2>{P.text.stand}</h2>
              <StanceTiles tiles={stand} partyName={plain(name)} />
            </section>

            {/* Shares order 4 with the stances, so on phones it follows them, as it does here. */}
            <section className="pp-text o4">
              <h2>{P.text.who}</h2>
              <Items items={who} he={he} />
              {thin && <p className="fig-src"><Loc v={thin} /></p>}
            </section>

            {voterText.length > 0 && (
              <section className="pp-text o5">
                <h2>{P.text.voters}</h2>
                <Items items={voterText} he={he} />
              </section>
            )}

            <section className="pp-text o8">
              {p.names && (
                <>
                  <h2>{P.text.names}</h2>
                  <ul className="pp-names">
                    {p.names.map((n, i) => (
                      <li key={n.name}>
                        <span className="slot">{n.slot === "—" ? "—" : P.text.slot(n.slot)}</span>
                        {he ? (
                          <span><b><Loc v={partyText(p, `names.${i}.name`, lang)} /></b>{n.note ? <>, <Loc v={partyText(p, `names.${i}.note`, lang)} /></> : ""}</span>
                        ) : (
                          <span><b>{n.name}</b>{n.note ? `, ${n.note}` : ""}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <p className="fig-src">{he && p.namesSource ? <>{P.text.sourcePrefix}<span lang="en" dir="ltr">{p.namesSource}</span></> : p.namesSource}</p>
                </>
              )}
              {pledges && (
                <>
                  <h2>{P.text.pledges}</h2>
                  <Items items={pledges} he={he} />
                </>
              )}
            </section>

            <section className="pp-text o9">
              {p.quote && quote && speaker && (
                <>
                  <h2>{P.text.words}</h2>
                  <blockquote className="pp-quote">
                    {P.text.quoteOpen}{typeof quote === "string" ? quote : <Loc v={{ ...quote, translated: undefined }} />}{P.text.quoteClose}
                    {typeof quote !== "string" && quote.translated ? " (תרגום)" : null}
                    <footer><Loc v={speaker} />. {he ? <span lang="en" dir="ltr">{p.quote.source}</span> : p.quote.source}</footer>
                  </blockquote>
                </>
              )}
              {p.bios ? (
                <>
                  <h2>{p.bios.length > 1 ? P.text.people : P.text.leader}</h2>
                  {p.bios.map((b, i) => (
                    <p className="pp-bio" key={b.name}><b><Loc v={pt(`bios.${i}.name`, b.name)} />.</b> <Loc v={pt(`bios.${i}.text`, b.text)} /></p>
                  ))}
                  <p className="fig-src">{P.text.bioSource(partiesData.bioSource)}</p>
                </>
              ) : (
                <>
                  <h2>{P.text.leader}</h2>
                  <p className="pp-bio">{P.text.noBio(leaderName)}</p>
                </>
              )}
              <p className="pp-links">
                <Link href={`/parties#${p.id}`}>{P.links.map}</Link>
                <Link href={`/party-history#${p.id}`}>{P.links.tree}</Link>
                <Link href={`/ballot#${p.id}`}>{P.links.ballot}</Link>
                <Link href={href("/coalition-builder")}>{P.links.builder}</Link>
              </p>
            </section>
          </div>
        </div>
      </div>
    </article>
  );
}

/** The voter-base entry with its words in the page's edition (data/he/voter-base.json, keyed by party id). */
function localVoterBase(id: string, vb: VoterBase, lang: Lang): VoterBase {
  const o = OVERLAYS.voterBase[id];
  const t = (english: string, field: string): string => {
    const l: Localized = overlayText(english, o?.[field], lang);
    return l.text;
  };
  return {
    listName: t(vb.listName, "listName"),
    source: t(vb.source, "source"),
    groups: vb.groups.map((g, i) => ({ ...g, label: t(g.label, `groups.${i}.label`) })),
    won: vb.won.map((w, i) => ({ ...w, label: t(w.label, `won.${i}.label`) })),
  };
}

