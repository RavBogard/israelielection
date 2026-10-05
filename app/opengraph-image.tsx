import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ELECTION_DAY, daysUntil } from "@/components/Countdown";
import { COLS, MAJORITY, ROWS, TOTAL, allocate } from "@/components/SeatGrid";
import { KNESSET } from "@/lib/coalition";
import { averagePoll, blocs, mainPolls, parties } from "@/lib/data";
import { mediumDate } from "@/lib/format";
import { blocTotals } from "@/lib/polls";
import { resultsAsPoll } from "@/lib/results";
import { fetchCount, resultsConfig } from "@/lib/results-live";
import type { BlocId } from "@/lib/types";

// The share card is the home page's opening: the race as the 120 seats of the Knesset, coloured
// by bloc from the current poll average (or the count, on election night). It is drawn on request
// and cached for an hour, so a link shared today shows today's numbers.
export const revalidate = 3600;
export const alt = "Israel Votes 2026: the 120 seats of the Knesset by bloc in the current poll average. A government needs 61.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Satori cannot read CSS variables; these mirror --b-* and the paper tokens in app/globals.css.
const BLOC: Record<BlocId, string> = { net: "#233f86", opp: "#d98a1f", mid: "#3fb0a2", arab: "#8d4fae" };
const PAPER = "#f6f5f1", CELL = "#e4e2db", INK = "#000000", TEXT = "#2a2925", INK3 = "#8b8880", LINE = "#dedcd5";
const GRID_ORDER: BlocId[] = ["net", "mid", "opp", "arab"];

const font = (file: string) => readFile(join(process.cwd(), "assets/og", file));
const fonts = Promise.all([font("FrankRuhlLibre-Regular.ttf"), font("FrankRuhlLibre-Bold.ttf"), font("PublicSans-Medium.ttf"), font("PublicSans-SemiBold.ttf")]);

/** Two lines, broken after "votes" so the number never sits alone on the second line. */
function headline(days: number): [string, string] {
  if (days > 1) return ["Israel votes", `in ${days} days.`];
  if (days === 1) return ["Israel votes", "tomorrow."];
  if (days === 0) return ["Israel votes", "today."];
  return ["Israel voted", "on October 27."];
}

export default async function Image() {
  const [frank, frankBold, sans, sansSemi] = await fonts;
  const live = await fetchCount(revalidate);
  const poll = live.state === "open" ? resultsAsPoll(live.count, resultsConfig, live.fetchedAt) : averagePoll;
  const isLive = live.state === "open";
  const totals = blocTotals(poll, parties);
  const ordered = GRID_ORDER.map((id) => ({ id, label: blocs.find((b) => b.id === id)!.label, seats: totals[id] }));
  const counts = allocate(ordered.map((b) => ({ id: b.id, seats: b.seats, color: BLOC[b.id], label: b.label })));

  // The grid: cell 36, gap 6, the heavy rule under row five, "61" beside it.
  const S = 36, P = 42, W = COLS * P - 6, H = ROWS * P - 6, ruleY = 5 * P - 3;
  const cells: React.ReactNode[] = [];
  let i = 0;
  ordered.forEach((b, k) => {
    for (let n = 0; n < counts[k]; n++, i++) cells.push(<rect key={i} x={(i % COLS) * P} y={Math.floor(i / COLS) * P} width={S} height={S} fill={BLOC[b.id]} />);
  });
  for (; i < TOTAL; i++) cells.push(<rect key={i} x={(i % COLS) * P} y={Math.floor(i / COLS) * P} width={S} height={S} fill={CELL} />);

  const standfirst = isLive
    ? `The count so far, as the ${KNESSET} seats of the Knesset. A government needs ${MAJORITY}.`
    : `Where the race stands: the average of the latest ${mainPolls.length} polls as the ${KNESSET} seats of the Knesset. A government needs ${MAJORITY}.`;
  const dateline = isLive ? "Central Elections Committee count" : `Polls to ${mediumDate(mainPolls[0].published)}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: PAPER, color: INK, padding: "56px 64px", fontFamily: "Frank Ruhl Libre" }}>
        <div style={{ display: "flex", flexDirection: "column", width: 480, flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 64, fontWeight: 700, lineHeight: 0.98, letterSpacing: "-0.02em" }}>
            {headline(daysUntil(ELECTION_DAY)).map((line) => (
              <div key={line} style={{ display: "flex" }}>
                {line}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 22, lineHeight: 1.4, color: TEXT, marginTop: 20 }}>{standfirst}</div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 26, borderTop: `1px solid ${LINE}` }}>
            {ordered.map((b) => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${LINE}`, fontFamily: "Public Sans", fontSize: 18, fontWeight: 500, color: TEXT }}>
                <div style={{ width: 14, height: 14, background: BLOC[b.id], marginRight: 10 }} />
                <div style={{ display: "flex" }}>{b.label}</div>
                <div style={{ display: "flex", marginLeft: "auto", fontFamily: "Frank Ruhl Libre", fontWeight: 700, fontSize: 26, color: INK }}>{String(Math.round(b.seats * 10) / 10)}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", marginTop: "auto", fontFamily: "Public Sans", fontSize: 18 }}>
            <div style={{ display: "flex", fontWeight: 600 }}>israelielection.org</div>
            <div style={{ display: "flex", marginLeft: "auto", fontWeight: 500, color: INK3 }}>{dateline}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexGrow: 1, alignItems: "center", justifyContent: "flex-end" }}>
          <div style={{ display: "flex", position: "relative", width: W + 44, height: H }}>
            <svg width={W + 4} height={H} viewBox={`0 0 ${W + 4} ${H}`}>
              {cells}
              <line x1={0} x2={W + 4} y1={ruleY} y2={ruleY} stroke={INK} strokeWidth={3} />
            </svg>
            <div style={{ display: "flex", position: "absolute", left: W + 14, top: ruleY - 14, fontWeight: 700, fontSize: 26, lineHeight: 1, color: INK }}>61</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Frank Ruhl Libre", data: frank, weight: 400, style: "normal" },
        { name: "Frank Ruhl Libre", data: frankBold, weight: 700, style: "normal" },
        { name: "Public Sans", data: sans, weight: 500, style: "normal" },
        { name: "Public Sans", data: sansSemi, weight: 600, style: "normal" },
      ],
    }
  );
}
