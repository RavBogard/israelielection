import { dataUpdated } from "@/lib/data";
import { mediumDate } from "@/lib/format";

export const ELECTION_DAY = "2026-10-27";

function daysUntil(iso: string) {
  return Math.ceil((Date.parse(`${iso}T00:00:00+02:00`) - Date.now()) / 86_400_000);
}

/** The dateline under the masthead on every page: election countdown and data date. */
export default function Banner() {
  const days = daysUntil(ELECTION_DAY);
  return (
    <div className="dateline">
      <div className="row">
        <span>
          <b>Election Day</b> Tuesday, Oct 27, 2026
        </span>
        {days > 0 && (
          <>
            <span className="sep" aria-hidden="true">·</span>
            <span>
              <b>{days}</b> day{days === 1 ? "" : "s"} away
            </span>
          </>
        )}
        <span className="sep" aria-hidden="true">·</span>
        <span>Polls last updated {mediumDate(dataUpdated)}</span>
      </div>
    </div>
  );
}
