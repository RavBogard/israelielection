import { ImageResponse } from "next/og";
import { ELECTION_DAY, daysUntil } from "@/components/Countdown";
import { COLS, MAJORITY, ROWS, TOTAL, allocate } from "@/components/SeatGrid";
import { KNESSET } from "@/lib/coalition";
import { averagePoll, blocs, mainPolls, parties } from "@/lib/data";
import { plural } from "@/lib/i18n/he-grammar";
import { blocText } from "@/lib/i18n/overlays";
import { BLOC, CELL, G, GRID_ORDER, INK, INK3, LINE, PAPER, TEXT, ogFonts } from "@/lib/og";
import { visualOrder } from "@/lib/og-rtl";
import { blocTotals } from "@/lib/polls";
import { resultsAsPoll } from "@/lib/results";
import { fetchCount, resultsConfig } from "@/lib/results-live";

// The Hebrew edition's share card: the English card (app/(en)/opengraph-image.tsx) mirrored, the text on the right
// and the grid filling from the top right as it does on the Hebrew pages. Satori cannot lay out Hebrew, so every
// line is broken by hand and put in visual order by lib/og-rtl.ts and drawn without wrapping. Frank Ruhl Libre carries the
// Hebrew; Public Sans (no Hebrew letters) sets only the address.
export const revalidate = 3600;
export const alt = "פתק 2026: 120 המושבים בכנסת לפי גוש, בממוצע הסקרים העדכני. 61 מנדטים הם רוב.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const { S, P } = G;

/** Two lines, the number with its unit on the first. */
function headline(days: number, live: boolean): [string, string] {
  if (live) return ["ישראל הצביעה.", "הספירה עד כה."];
  if (days > 1) return [`עוד ${plural(days, { one: "יום אחד", two: "יומיים", other: `${days} ימים` })}`, "לבחירות."];
  if (days === 1) return ["הבחירות", "מחר."];
  if (days === 0) return ["הבחירות", "היום."];
  return ["ישראל הצביעה", "ב-27 באוקטובר."];
}

/** A right-aligned Hebrew line, drawn in visual order. */
const Line = ({ text, style }: { text: string; style?: React.CSSProperties }) => <div style={{ display: "flex", justifyContent: "flex-end", whiteSpace: "nowrap", ...style }}>{visualOrder(text)}</div>;

export default async function Image() {
  const live = await fetchCount(revalidate);
  const poll = live.state === "open" ? resultsAsPoll(live.count, resultsConfig, live.fetchedAt, live) : averagePoll;
  const isLive = live.state === "open";
  const totals = blocTotals(poll, parties);
  const ordered = GRID_ORDER.map((id) => { const b = blocs.find((x) => x.id === id)!; return { id, label: blocText(b, "he").text, seats: totals[id] }; });
  const counts = allocate(ordered.map((b) => ({ id: b.id, seats: b.seats, color: BLOC[b.id], label: b.label })));

  // The grid mirrored: the first seat at the top right, the "61" to its left.
  const W = COLS * P - 6, H = ROWS * P - 6, ruleY = 5 * P - 3;
  const x = (i: number) => (COLS - 1 - (i % COLS)) * P + 4;
  const cells: React.ReactNode[] = [];
  let i = 0;
  ordered.forEach((b, k) => {
    for (let n = 0; n < counts[k]; n++, i++) cells.push(<rect key={i} x={x(i)} y={Math.floor(i / COLS) * P} width={S} height={S} fill={BLOC[b.id]} />);
  });
  for (; i < TOTAL; i++) cells.push(<rect key={i} x={x(i)} y={Math.floor(i / COLS) * P} width={S} height={S} fill={CELL} />);

  // Broken by hand at the phrase boundaries; the numbers are short enough not to move a break.
  const standfirst = isLive
    ? [`הספירה עד כה, ב-${KNESSET} המושבים`, `בכנסת. ${MAJORITY} מנדטים הם רוב.`]
    : [`תמונת המרוץ לפי ממוצע ${mainPolls.length} הסקרים`, `האחרונים, ב-${KNESSET} המושבים בכנסת.`, `${MAJORITY} מנדטים הם רוב.`];
  const newest = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", timeZone: "Asia/Jerusalem" }).format(new Date(mainPolls[0].published));
  const dateline = isLive ? live.state === "open" && live.freshness === "stale" ? "ספירה שמורה, לא מעודכנת" : "ספירת ועדת הבחירות המרכזית" : `סקרים עד ${newest}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: PAPER, color: INK, padding: "56px 64px", fontFamily: "Frank Ruhl Libre" }}>
        <div style={{ display: "flex", flexGrow: 1, alignItems: "center", justifyContent: "flex-start" }}>
          <div style={{ display: "flex", position: "relative", width: W + 44, height: H }}>
            <div style={{ display: "flex", position: "absolute", left: 0, top: ruleY - 14, fontWeight: 700, fontSize: 26, lineHeight: 1, color: INK }}>61</div>
            <svg style={{ position: "absolute", left: 40 }} width={W + 4} height={H} viewBox={`0 0 ${W + 4} ${H}`}>
              {cells}
              <line x1={0} x2={W + 4} y1={ruleY} y2={ruleY} stroke={INK} strokeWidth={3} />
            </svg>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: 480, flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 64, fontWeight: 700, lineHeight: 1.05 }}>
            {headline(daysUntil(ELECTION_DAY), isLive).map((line) => <Line key={line} text={line} />)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 23, lineHeight: 1.4, color: TEXT, marginTop: 20 }}>
            {standfirst.map((line) => <Line key={line} text={line} />)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 26, borderTop: `1px solid ${LINE}` }}>
            {ordered.map((b) => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${LINE}`, fontSize: 21, color: TEXT }}>
                <div style={{ display: "flex", marginRight: "auto", fontWeight: 700, fontSize: 26, color: INK }}>{String(Math.round(b.seats * 10) / 10)}</div>
                <Line text={b.label} />
                <div style={{ width: 14, height: 14, background: BLOC[b.id], marginLeft: 10 }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", marginTop: "auto", fontSize: 20 }}>
            <div style={{ display: "flex", fontFamily: "Public Sans", fontWeight: 600, fontSize: 18 }}>israelielection.org/he</div>
            <Line text={dateline} style={{ marginLeft: "auto", color: INK3 }} />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: await ogFonts(),
    }
  );
}
