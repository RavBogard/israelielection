import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import type { Lang } from "@/lib/i18n";
import { POST_COUNT, fill } from "@/lib/i18n/post-count";
import { listStatus, percentText } from "@/lib/list-status";
import "./list-status.css";

/** The words of a list's status on the count: "Entered", or "Below 3.25% in the count so far (1.6%)", never "failed" before the official result. */
export function listStatusText(seats: number, seatStatus: SharedSeatContext["seatStatus"], pct: number | null, lang: Lang): string {
  const T = POST_COUNT[lang];
  const s = listStatus(seats, seatStatus, pct);
  if (s.kind === "entered") return T.entered;
  if (s.pct === null) return s.official ? T.belowOfficialNoShare : T.belowSoFarNoShare;
  return fill(s.official ? T.belowOfficial : T.belowSoFar, { p: percentText(s.pct, lang) });
}

/** A chip for a list with no seats (or "Entered" for one with seats), in place of "0 seats. Estimate". */
export default function ListStatusChip({ seats, seatStatus, pct, lang }: { seats: number; seatStatus: SharedSeatContext["seatStatus"]; pct: number | null; lang: Lang }) {
  const entered = seats > 0;
  return (
    <span className={`list-status ${entered ? "entered" : "below"}`} data-testid="list-status" data-status={entered ? "entered" : "below"}>
      {listStatusText(seats, seatStatus, pct, lang)}
    </span>
  );
}
