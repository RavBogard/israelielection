import Link from "next/link";
import "./party-profile.css";
import { partyColor, partyInk } from "@/lib/party-colors";
import { partiesData } from "@/lib/data";
import { mediumDate, shortDate } from "@/lib/format";
import { SEATS_LABEL, seatFigure } from "@/lib/polls";
import { lettersOf } from "@/lib/letters";
import type { Party, Sourced } from "@/lib/types";
import { blocLabel, glance, readings, result2022, strongholds, tiles, voterBase } from "./profile/model";
import SeatSparkline from "./profile/SeatSparkline";
import StanceTiles from "./profile/StanceTiles";
import StrongholdsMap from "./profile/StrongholdsMap";
import VoterBaseBar from "./profile/VoterBaseBar";
import SeatBar from "./SeatBar";

const Src = ({ s }: { s: string | null }) => (s ? <> <span className="s">({s})</span></> : null);

function Items({ items }: { items: Sourced[] }) {
  return (
    <ul className="pp-items">
      {items.map((x, i) => (
        <li key={i}>
          {x.text}
          <Src s={x.source} />
        </li>
      ))}
    </ul>
  );
}

const one = seatFigure;
const thousands = (n: number) => n.toLocaleString("en-US");
const MAJORITY = 61, TOTAL = 120;

/**
 * The party profile as an election-guide spread: figures down the left column, the sentences
 * down the right, in the same order, so the page reads as one column of charts beside one
 * column of prose. On phones the two columns interleave by `order`, each figure next to the
 * section it belongs to. The running head and every figure take the party's own colour;
 * everything else is paper and ink.
 */
export default function PartyProfile({ party: p }: { party: Party }) {
  const color = partyColor(p.id);
  const ink = partyInk(p.id);
  const series = readings(p);
  const g = glance(p, series);
  const r22 = result2022(p);
  const map = strongholds(p);
  const vb = voterBase(p);
  const stand = tiles(p);
  const letters = lettersOf[p.id];
  const leaderName = p.leader.split(" (")[0].split(",")[0];
  const reported = series.filter((s) => s.seats !== null);
  const publishers = new Set(reported.map((s) => s.pollster)).size;
  // The sentences about voters, minus what a figure on the page already shows: the breakdown the bar draws,
  // the 2022 count the glance block states, and older city shares when the 2022 locality map is drawn.
  const voterText = (p.voters ?? []).filter(
    (v) =>
      !(vb && /self-description|% traditional|% secular/.test(v.text)) &&
      !(r22 && r22.sameName && /^2022: [\d,]+ votes, [\d.]+%, \d+ seats\.$/.test(v.text)) &&
      !(map && /^Strong in /.test(v.text))
  );
  const who: Sourced[] = p.surplusPartner ? [...p.who, { text: `Surplus-vote partner: ${p.surplusPartner.text}`, source: p.surplusPartner.source }] : p.who;
  return (
    <article className="pp" style={{ ["--pc" as string]: color, ["--pc-ink" as string]: ink }}>
      <header className="pp-head">
        <div className="wrap">
          {letters && (
            <span className="letters" lang="he" dir="rtl" title={`Ballot letters: ${letters}`}>
              {letters}
            </span>
          )}
          <div className="who">
            <h1>{p.name}</h1>
            <p className="lead">Led by <b>{p.leader}</b></p>
          </div>
          <div className="bloc">
            <span className="chip"><i style={{ background: `var(--b-${p.bloc})` }} />{blocLabel[p.bloc]}</span>
            <span className="total">{g.avg === null ? (p.status ?? "Not polled separately") : g.below ? "Below the threshold in the polling average" : <><b>{one(g.avg)}</b> seats, polling average</>}</span>
          </div>
        </div>
      </header>

      <div className="wrap">
        <div className="pp-grid">
          <div className="pp-col pp-col-f">
            <figure className="pp-fig o1">
              <figcaption className="lbl">At a glance</figcaption>
              <dl className="pp-glance">
                <div>
                  <dd>{g.avg === null ? <span className="nf">{p.status ?? "Not polled"}</span> : g.below ? "below" : one(g.avg)}</dd>
                  <dt>{SEATS_LABEL}</dt>
                  <small>{g.avg === null ? "no seat figures" : g.below ? (g.passingAvg !== null ? `${one(g.passingAvg)} where it passes` : "the threshold in every poll") : g.low !== null ? `scaled to 120; ${g.low} to ${g.high} in ${g.n} polls` : "scaled to 120"}</small>
                </div>
                <div>
                  <dd>{r22 ? r22.seats : <span className="nf">New</span>}</dd>
                  <dt>Seats in 2022</dt>
                  <small>{r22 ? `${(r22.share * 100).toFixed(1)}% of the vote${r22.sameName ? "" : `, as ${r22.listName}`}` : "did not run in 2022"}</small>
                </div>
                <div>
                  <dd>{g.k}<span className="of"> of {g.n}</span></dd>
                  <dt>Polls it passes</dt>
                  <small>{g.nearThreshold ? "near the threshold" : g.k === g.n && g.n > 0 ? "never near the threshold" : g.k === 0 ? "below the threshold in all" : "passes in most"}</small>
                </div>
                <div className="blocbox">
                  <dd>{one(g.blocSeats)}<span className="of"> of {MAJORITY}</span></dd>
                  <dt>{blocLabel[p.bloc]}</dt>
                  <SeatBar className="pp-majority" total={TOTAL} majority={MAJORITY} segments={[{ key: p.bloc, seats: Math.min(TOTAL, g.blocSeats), color: `var(--b-${p.bloc})` }]} label={`${one(g.blocSeats)} of 120 seats; a majority is 61.`} />
                  <small>{g.avg !== null && !g.below ? `${g.blocSeats >= MAJORITY ? "a majority" : `${one(MAJORITY - g.blocSeats)} short of 61`}; this list is ${["the largest", "second", "third", "fourth", "fifth", "sixth"][g.blocRank - 1] ?? `${g.blocRank}th`} of ${g.blocSize} in the bloc` : "this list is not counted in the bloc total"}</small>
                </div>
              </dl>
              <p className="fig-src">
                Average over the latest poll from each of {g.n} pollsters, {shortDate(g.mainFrom)} to {mediumDate(g.mainTo)}, weighted by sample size and scaled to 120 seats.{g.variantAvg !== null ? ` Without ${g.variantPollsters.join(" and ")}, the two the site’s alternative average leaves out: ${one(g.variantAvg)}.` : ""}{r22 ? ` 2022: Central Elections Committee, ${thousands(r22.votes)} votes.` : ""}
              </p>
            </figure>

            <figure className="pp-fig o3">
              <figcaption className="lbl">Seats in every poll since the Knesset dissolved</figcaption>
              <SeatSparkline series={series} result={r22} id={p.id} name={p.name} avg={g.avg !== null && !g.below ? g.avg : null} />
              <p className="fig-src">
                {reported.length} polls from {publishers} publishers, {mediumDate(g.firstDate)} to {mediumDate(g.lastDate)}. A dot on the floor is a poll that had the list below the threshold; a gap is a poll that did not report it separately.
              </p>
            </figure>

            {vb && (
              <figure className="pp-fig o6">
                <figcaption className="lbl">{vb.listName === p.name ? `${p.name}’s` : `${vb.listName}`} 2022 voters, by religious self-description</figcaption>
                <VoterBaseBar base={vb} color={color} />
                <p className="fig-src">{vb.source}.</p>
              </figure>
            )}

            {map && (
              <figure className="pp-fig o7">
                <figcaption className="lbl">{r22 && !r22.sameName ? `${r22.listName}’s` : `${p.name}’s`} share of the valid vote, 2022, by locality</figcaption>
                <StrongholdsMap data={map} color={color} name={r22 && !r22.sameName ? r22.listName : p.name} />
                <p className="fig-src">Central Elections Committee, 25th Knesset results by locality. Nationally {(map.national * 100).toFixed(1)}%. The five strongest localities with at least 15,000 valid votes; below the national line, the three biggest cities and the weakest place with 50,000 or more valid votes, for comparison.</p>
              </figure>
            )}
          </div>

          <div className="pp-col pp-col-t">
            <section className="pp-text o4">
              <h2>Where they stand</h2>
              <StanceTiles tiles={stand} partyName={p.name} />
            </section>

            {/* Shares order 4 with the stances, so on phones it follows them, as it does here. */}
            <section className="pp-text o4">
              <h2>Who they are</h2>
              <Items items={who} />
              {p.thin && <p className="fig-src">{p.thin}</p>}
            </section>

            {voterText.length > 0 && (
              <section className="pp-text o5">
                <h2>Who votes for them</h2>
                <Items items={voterText} />
              </section>
            )}

            <section className="pp-text o8">
              {p.names && (
                <>
                  <h2>Names on the list</h2>
                  <ul className="pp-names">
                    {p.names.map((n) => (
                      <li key={n.name}>
                        <span className="slot">{n.slot === "—" ? "—" : `No. ${n.slot}`}</span>
                        <span><b>{n.name}</b>{n.note ? `, ${n.note}` : ""}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="fig-src">{p.namesSource}</p>
                </>
              )}
              {p.pledges && (
                <>
                  <h2>Coalition pledges</h2>
                  <Items items={p.pledges} />
                </>
              )}
            </section>

            <section className="pp-text o9">
              {p.quote && (
                <>
                  <h2>In their words</h2>
                  <blockquote className="pp-quote">
                    “{p.quote.text}”
                    <footer>{p.quote.speaker}. {p.quote.source}</footer>
                  </blockquote>
                </>
              )}
              {p.bios ? (
                <>
                  <h2>{p.bios.length > 1 ? "The people" : "The leader"}</h2>
                  {p.bios.map((b) => (
                    <p className="pp-bio" key={b.name}><b>{b.name}.</b> {b.text}</p>
                  ))}
                  <p className="fig-src">Bio source: {partiesData.bioSource}</p>
                </>
              ) : (
                <>
                  <h2>The leader</h2>
                  <p className="pp-bio">Our research registers have no bio for {leaderName}.</p>
                </>
              )}
              <p className="pp-links">
                <Link href={`/parties#${p.id}`}>Party Map</Link>
                <Link href={`/party-history#${p.id}`}>Party family tree</Link>
                <Link href={`/ballot#${p.id}`}>Official ballot entry</Link>
                <Link href="/coalition-builder">Coalition Builder</Link>
              </p>
            </section>
          </div>
        </div>
      </div>
    </article>
  );
}
