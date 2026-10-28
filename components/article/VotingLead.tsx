import Link from "next/link";
import "@/components/live-count.css";
import "./voting-lead.css";
import { countView } from "@/lib/count-view";

const WHEN = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/**
 * The voting guide's 2026 box: the double-envelope count and how much of the vote is still out, read from the
 * saved count (as the home page's LiveCount does) and never typed in. The walk-through of casting a vote now
 * sits lower on the page as "How a Knesset vote works".
 */
export default async function VotingLead() {
  const view = await countView();
  const out = view ? Math.round(view.out * 100) : null;
  return (
    <figure className="voting-lead">
      <figcaption className="ct">The October 27, 2026 election</figcaption>
      <p className="vl-line"><b>Double-envelope votes counted through Thu 29 Oct</b></p>
      {view ? (
        <>
          <div className="lc-progress" role="img" aria-label={`${Math.round(view.counted * 100)}% of the expected vote counted`}><i style={{ inlineSize: `${Math.min(1, view.counted) * 100}%` }} /></div>
          <p className="vl-share">
            {out === 0 ? "All of the expected vote is counted" : <>About <b>{out}%</b> of the expected vote is still out</>}, provisional: {view.valid.toLocaleString("en-US")} valid votes counted so far, as of {WHEN.format(new Date(view.at))} Israel time.
          </p>
        </>
      ) : (
        <p className="vl-share">The share still out appears here once the committee&apos;s count is saved.</p>
      )}
      <p className="fig-src cs">
        Count: Central Elections Committee file, captured by this site. The expected total is this site&apos;s estimate, so the share still out is an estimate until the official result. <Link href="/results">Results</Link> and <Link href="/government">what happens next</Link>.
      </p>
    </figure>
  );
}
