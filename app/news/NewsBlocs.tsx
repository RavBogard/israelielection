import Link from "next/link";
import SeatBar from "@/components/SeatBar";
import { blocChange, blocSeries, newestPoll, signedSeats } from "@/lib/bloc-change";
import { allPolls, averagePoll, blocLabel, blocs, parties, pollsData } from "@/lib/data";
import { mediumDate, shortDate } from "@/lib/format";
import { homeRaceModel } from "@/lib/home-race";
import { BLOC_ORDER, BLOC_SEAT_ORDER, pollLabel, seatFigure } from "@/lib/polls";
import type { BlocId } from "@/lib/types";

/** The bar runs as every 120-seat bar does; the key reads as every key does. */
const ORDER = BLOC_SEAT_ORDER, KEY = BLOC_ORDER;
const one = seatFigure;

/** The home race's average as one compact bar, each bloc's change over the past week, and the newest poll. */
export default function NewsBlocs() {
  const rows = homeRaceModel(averagePoll, parties, blocs).rows, seats = (b: BlocId) => rows.find((r) => r.id === b)!.seats;
  const change = blocChange(blocSeries(pollsData.polls, parties, pollsData.config)), newest = newestPoll(allPolls);
  return (
    <figure className="nw-blocs">
      <SeatBar size="m" segments={ORDER.map((b) => ({ key: b, seats: seats(b), color: `var(--b-${b})` }))}
        label={KEY.map((b) => `${blocLabel[b]} ${one(seats(b))}`).join(", ") + ". A majority is 61."} />
      <ul className="fig-key nw-blockey">
        {KEY.map((b) => (
          <li key={b}><span className="sw" style={{ background: `var(--b-${b})` }} aria-hidden="true" />{blocLabel[b]} <b>{one(seats(b))}</b>{change && <span className="nw-delta">{signedSeats(change.delta[b])}</span>}</li>
        ))}
      </ul>
      <figcaption className="fig-src">
        Seats in the polling average, scaled to 120{change && <>, with the change since {shortDate(change.since)}</>}.{newest && <> Newest poll: <Link href="/polls#browser">{pollLabel(newest)}, {mediumDate(newest.published)}</Link>.</>} <Link href="/polls">All polls and the method</Link>.
      </figcaption>
    </figure>
  );
}
