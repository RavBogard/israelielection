import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { MAJORITY, tally, warnings } from "@/lib/coalition";
import { averagePoll, exitPolls, mainPolls, parties, pledgeRules } from "@/lib/data";
import { mediumDate } from "@/lib/format";
import { lettersOf } from "@/lib/letters";
import { BLOC, Grid, INK, INK2, INK3, LINE, PAPER, SIZE, TEXT, ogFonts } from "@/lib/og";
import { AVERAGE_ID, pollLabel } from "@/lib/polls";
import { RESULTS_ID, resultsAsPoll } from "@/lib/results";
import { fetchCount, resultsConfig } from "@/lib/results-live";

// Satori has no bidi: Hebrew ballot letters are reversed by hand so they read right to left.
const rtl = (s: string) => [...s].reverse().join("");

// A reader's coalition as a card, for links copied from the Builder: /api/card?with=likud,shas&poll=avg
export const revalidate = 3600;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const pollId = q.get("poll") || AVERAGE_ID;
  const ids = (q.get("with") ?? "").split(",").filter((id) => parties.some((p) => p.id === id));
  let poll = [averagePoll, ...exitPolls, ...mainPolls].find((p) => p.id === pollId) ?? averagePoll;
  if (pollId === RESULTS_ID) {
    const live = await fetchCount(60);
    if (live.state === "open") poll = resultsAsPoll(live.count, resultsConfig, live.fetchedAt, live);
  }
  const sel = new Set(ids);
  const t = tally(sel, parties, poll);
  const warns = warnings(sel, parties, pledgeRules).filter((w) => w.kind === "pledge");
  const whole = Math.round(t.total);
  const fills = t.chosen
    .map((p) => ({ count: Math.round(poll.results[p.id]?.seats ?? 0), color: BLOC[p.bloc] }))
    .filter((f) => f.count > 0);
  const title = ids.length ? `${whole} seats` : "Build a coalition";
  const read = !ids.length
    ? `Pick parties from any poll and see whether they reach ${MAJORITY}.`
    : whole >= MAJORITY
      ? `An absolute seat majority; initial confidence depends on votes for and against.`
      : `${MAJORITY - whole} short of the ${MAJORITY}-seat absolute-majority target.`;
  const source =
    poll.id === RESULTS_ID
      ? poll.resultState?.freshness === "stale" ? "Saved committee count (stale)" : "The committee's count so far"
      : poll.id === AVERAGE_ID
        ? `Normalized average of the latest ${mainPolls.length} polls, to ${mediumDate(mainPolls[0].published)}`
        : `${pollLabel(poll)}, ${mediumDate(poll.published)}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: PAPER, color: INK, padding: "52px 64px 48px", fontFamily: "Frank Ruhl Libre" }}>
        <div style={{ display: "flex", flexDirection: "column", width: 480, flexShrink: 0 }}>
          <div style={{ display: "flex", fontSize: 72, fontWeight: 700, lineHeight: 0.98, letterSpacing: "-0.02em" }}>{title}</div>
          <div style={{ display: "flex", fontSize: 22, lineHeight: 1.4, color: TEXT, marginTop: 14 }}>{read}</div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 20, borderTop: `1px solid ${LINE}` }}>
            {t.chosen.slice(0, 7).map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${LINE}`, fontFamily: "Public Sans", fontSize: 17, fontWeight: 500, color: TEXT }}>
                <div style={{ width: 12, height: 12, background: BLOC[p.bloc], marginRight: 10 }} />
                <div style={{ display: "flex" }}>{p.name}</div>
                {lettersOf[p.id] && <div style={{ display: "flex", marginLeft: 8, fontFamily: "Frank Ruhl Libre", fontWeight: 700, color: INK3 }}>{rtl(lettersOf[p.id])}</div>}
                <div style={{ display: "flex", marginLeft: "auto", fontFamily: "Frank Ruhl Libre", fontWeight: 700, fontSize: 22, color: INK }}>{String(Math.round((poll.results[p.id]?.seats ?? 0) * 10) / 10)}</div>
              </div>
            ))}
            {t.chosen.length > 7 && <div style={{ display: "flex", fontFamily: "Public Sans", fontSize: 14, color: INK3, padding: "6px 0" }}>{`and ${t.chosen.length - 7} more`}</div>}
          </div>
          {warns.length > 0 && (
            <div style={{ display: "flex", fontFamily: "Public Sans", fontSize: 14, fontWeight: 600, color: INK2, marginTop: 10 }}>
              {warns.length === 1 ? "Goes against one recorded pledge." : `Goes against ${warns.length} recorded pledges.`}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", fontFamily: "Public Sans", fontSize: 15, color: INK3 }}>
            <div style={{ display: "flex" }}>{source}. Built by a reader, not a forecast.</div>
            <div style={{ display: "flex", fontWeight: 600, color: INK, marginTop: 4 }}>israelielection.org/coalition-builder</div>
          </div>
        </div>
        <div style={{ display: "flex", flexGrow: 1, alignItems: "center", justifyContent: "flex-end" }}>
          <Grid fills={fills} />
        </div>
      </div>
    ),
    { ...SIZE, fonts: await ogFonts() }
  );
}
