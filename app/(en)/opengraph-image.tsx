import { israelTimeLabel } from "@/lib/exit-line";
import { updatedFromCount } from "@/lib/i18n/strip-fresh";
import { getSharedSeatContext } from "@/lib/election-lifecycle/server";
import { contextToPoll } from "@/lib/seat-context";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import { ImageResponse } from "next/og";
import { COLS, MAJORITY, ROWS, TOTAL, allocate } from "@/components/SeatGrid";
import { KNESSET } from "@/lib/coalition";
import { blocs, parties } from "@/lib/data";
import { heroHeadline } from "@/lib/og-headline";
import { mediumDate } from "@/lib/format";
import { blocTotals } from "@/lib/polls";
import { BLOC, CELL, G, GRID_ORDER, INK, INK3, LINE, OgNameplate, PAPER, TEXT, ogFonts } from "@/lib/og";

// The share card is the home page's opening: the race as the 120 seats of the Knesset, coloured
// by bloc from the shared seat context (the count, or the official result). It is drawn on request and
// cached for five minutes, so a link shared while the count is open never shows an hour-old figure.
export const revalidate = 300;
export const alt = "Israel Votes: the 120 seats of the Knesset by bloc, from the count so far. 61 seats is an absolute majority.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const { S, P } = G;

export default async function Image() {
  const selected=await getSharedSeatContext();const context=selected.state==="ready"?selected.context:null;
  if(!context)return new ImageResponse(<div style={{display:"flex",background:PAPER,color:INK,width:"100%",height:"100%",padding:64,fontSize:40,fontFamily:"Frank Ruhl Libre"}}>Count unavailable</div>,{...size,fonts:await ogFonts()});
  const poll = contextToPoll(context);
  const totals = blocTotals(poll, parties);
  const ordered: {id:string;label:string;seats:number;color:string}[] = GRID_ORDER.map((id) => ({ id, label: blocs.find((b) => b.id === id)!.label, seats: totals[id],color:BLOC[id] }));
  const unclassified = 120-ordered.reduce((n,b)=>n+b.seats,0);if(unclassified>0)ordered.push({id:"unclassified",label:LIFECYCLE.en.unknown,seats:unclassified,color:CELL});
  const counts = allocate(ordered.map((b) => ({ id: b.id, seats: b.seats, color: b.color, label: b.label })));

  // The grid: cell 36, gap 6, the heavy rule under row five, "61" beside it.
  const W = COLS * P - 6, H = ROWS * P - 6, ruleY = 5 * P - 3;
  const cells: React.ReactNode[] = [];
  let i = 0;
  ordered.forEach((b, k) => {
    for (let n = 0; n < counts[k]; n++, i++) cells.push(<rect key={i} x={(i % COLS) * P} y={Math.floor(i / COLS) * P} width={S} height={S} fill={b.color} />);
  });
  for (; i < TOTAL; i++) cells.push(<rect key={i} x={(i % COLS) * P} y={Math.floor(i / COLS) * P} width={S} height={S} fill={CELL} />);

  const standfirst = `${LIFECYCLE.en[context.basis]} (${LIFECYCLE.en[context.seatStatus].toLowerCase()}). The ${KNESSET} seats of the Knesset; ${MAJORITY} is an absolute majority.`;
  // The as-of time on the card: the committee file's time while the context is current, else its status and the time we last updated it.
  const dateline = context.freshness.status === "current" ? updatedFromCount("en", context.updatedAt, context.countSourceUpdatedAt) : `${LIFECYCLE.en[context.freshness.status]}, ${israelTimeLabel(context.updatedAt, "en", LIFECYCLE.en.noTime)}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: PAPER, color: INK, padding: "56px 64px", fontFamily: "Frank Ruhl Libre" }}>
        <div style={{ display: "flex", flexDirection: "column", width: 480, flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 64, fontWeight: 700, lineHeight: 0.98, letterSpacing: "-0.02em" }}>
            {heroHeadline(context, "en").map((line) => (
              <div key={line} style={{ display: "flex" }}>
                {line}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 22, lineHeight: 1.4, color: TEXT, marginTop: 20 }}>{standfirst}</div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 26, borderTop: `1px solid ${LINE}` }}>
            {ordered.filter((b) => b.seats > 0).map((b) => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${LINE}`, fontFamily: "Public Sans", fontSize: 18, fontWeight: 500, color: TEXT }}>
                <div style={{ width: 14, height: 14, background: b.color, marginRight: 10 }} />
                <div style={{ display: "flex" }}>{b.label}</div>
                <div style={{ display: "flex", marginLeft: "auto", fontFamily: "Frank Ruhl Libre", fontWeight: 700, fontSize: 26, color: INK }}>{String(Math.round(b.seats * 10) / 10)}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", marginTop: "auto", fontFamily: "Public Sans", fontSize: 18 }}>
            <OgNameplate scale={0.66} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginLeft: "auto", fontSize: 16 }}><div style={{ display: "flex", fontWeight: 600 }}>israelvotes.org</div><div style={{ display: "flex", fontWeight: 500, color: INK3, marginTop: 4 }}>{dateline}</div></div>
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
      fonts: await ogFonts(),
    }
  );
}
