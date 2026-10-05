import { dataUpdated } from "@/lib/data";
import { mediumDate } from "@/lib/format";

export const ELECTION_DAY = "2026-10-27";

function daysUntil(iso: string) {
  return Math.ceil((Date.parse(`${iso}T00:00:00+02:00`) - Date.now()) / 86_400_000);
}

/** Top strip on every interactive page: election countdown and data date. */
export default function Banner() {
  const days = daysUntil(ELECTION_DAY);
  return (
    <div className="banner">
      Election Day: Tuesday, Oct 27, 2026{days > 0 ? ` (${days} day${days === 1 ? "" : "s"} away)` : ""}. Polls last updated{" "}
      {mediumDate(dataUpdated)}.
    </div>
  );
}
