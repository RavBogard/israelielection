import context from "@/public/vote-map/context.json";
import election from "@/public/vote-map/2022.json";
import places from "@/public/vote-map/places.json";
import { lettersOf } from "@/lib/letters";
import { averageAsPoll, blocTotals, currentPolls } from "@/lib/polls";
import { squarify } from "@/lib/treemap";
import type { Party, Poll, PollsConfig } from "@/lib/types";
import type { Places, VoteMapElection } from "@/lib/votemap";
import { binOf, project } from "@/lib/votemap";

/*
 * Four small pictures for the home page's tool row, each drawn from the live data in the
 * vocabulary of the tool it opens: ballot slips for the Builder, a treemap for the Party Map,
 * bloc lines for the polls, a shaded dot map for the vote map. All sit in the same 300×190 box.
 */
export const GW = 300, GH = 190;

/** The Builder: a hand of ballot slips, the biggest list of each bloc, fanned as a voter might hold them. */
export function BuilderGlyph({ parties, poll }: { parties: Party[]; poll: Poll }) {
  const order = ["net", "opp", "mid", "arab"] as const;
  const picks = order
    .map((b) => parties.filter((p) => p.bloc === b && (poll.results[p.id]?.seats ?? 0) > 0).sort((a, c) => (poll.results[c.id]?.seats ?? 0) - (poll.results[a.id]?.seats ?? 0))[0])
    .filter(Boolean);
  const W = 112, H = 150;
  return (
    <svg className="gl gl-builder" viewBox={`0 0 ${GW} ${GH}`} aria-hidden="true" focusable="false">
      {picks.map((p, i) => {
        const n = picks.length;
        const rot = (i - (n - 1) / 2) * 6;
        const cx = GW / 2 + (i - (n - 1) / 2) * 58;
        const seats = Math.round(poll.results[p.id]!.seats);
        return (
          <g key={p.id} transform={`translate(${cx} ${GH + 10}) rotate(${rot}) translate(${-W / 2} ${-H})`}>
            <rect className="paper" x="0" y="0" width={W} height={H} />
            <rect x="0" y="0" width={W} height="7" fill={`var(--b-${p.bloc})`} />
            <text className="let" x="12" y="52" lang="he">
              {lettersOf[p.id]}
            </text>
            <text className="seats" x="12" y="82">
              {seats}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** The Party Map: every list as a tile sized by its average seats, grouped by bloc. */
export function PartyMapGlyph({ parties, poll }: { parties: Party[]; poll: Poll }) {
  const order = ["net", "mid", "opp", "arab"] as const;
  const seats = (id: string) => poll.results[id]?.seats ?? 0;
  const blocItems = order.map((b) => ({ id: b, v: parties.filter((p) => p.bloc === b).reduce((s, p) => s + seats(p.id), 0) }));
  const rects = squarify(blocItems, 0, 0, GW, GH).flatMap((br) => {
    const items = parties
      .filter((p) => p.bloc === br.id && seats(p.id) > 0)
      .map((p) => ({ id: p.id, bloc: p.bloc, v: seats(p.id) }))
      .sort((a, b) => b.v - a.v);
    return squarify(items, br.x, br.y, br.w, br.h);
  });
  return (
    <svg className="gl gl-partymap" viewBox={`0 0 ${GW} ${GH}`} aria-hidden="true" focusable="false">
      {rects.map((r) => (
        <rect key={r.id} x={r.x + 1.5} y={r.y + 1.5} width={Math.max(0, r.w - 3)} height={Math.max(0, r.h - 3)} fill={`var(--b-${r.bloc})`} />
      ))}
    </svg>
  );
}

/** The polls: the site's average for the two big blocs as it stood on each poll date, against the 61 line. */
export function PollsGlyph({ polls, parties, config }: { polls: Poll[]; parties: Party[]; config: PollsConfig }) {
  const ids = parties.map((p) => p.id);
  const dates = [...new Set(polls.map((p) => p.published))].sort();
  const pts = dates.map((date) => {
    const main = currentPolls(polls.filter((p) => p.published <= date), config);
    return { t: Date.parse(date), ...blocTotals(averageAsPoll(main, ids), parties) };
  });
  if (pts.length < 2) return null;
  const t0 = pts[0].t, t1 = pts[pts.length - 1].t;
  const PAD = { l: 10, r: 30, t: 16, b: 14 };
  const all = pts.flatMap((p) => [p.net, p.opp]);
  const lo = Math.min(45, Math.floor(Math.min(...all) / 5) * 5), hi = Math.max(65, Math.ceil(Math.max(...all) / 5) * 5);
  const x = (t: number) => PAD.l + ((t - t0) / Math.max(1, t1 - t0)) * (GW - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (GH - PAD.t - PAD.b);
  const line = (k: "net" | "opp") => pts.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p[k]).toFixed(1)}`).join("");
  const last = pts[pts.length - 1];
  return (
    <svg className="gl gl-polls" viewBox={`0 0 ${GW} ${GH}`} aria-hidden="true" focusable="false">
      <line className="rule" x1={PAD.l} x2={GW - 10} y1={y(61)} y2={y(61)} />
      <text className="rl" x={GW - 10} y={y(61) - 5} textAnchor="end">
        61
      </text>
      <path d={line("opp")} stroke="var(--b-opp)" />
      <path d={line("net")} stroke="var(--b-net)" />
      <circle cx={x(last.t)} cy={y(last.net)} r="3.5" fill="var(--b-net)" />
      <circle cx={x(last.t)} cy={y(last.opp)} r="3.5" fill="var(--b-opp)" />
      <text className="end" x={x(last.t) + 7} y={y(last.net) + 4}>
        {Math.round(last.net)}
      </text>
      <text className="end" x={x(last.t) + 7} y={y(last.opp) + 4}>
        {Math.round(last.opp)}
      </text>
    </svg>
  );
}

/**
 * The vote map: localities from Beersheba north as dots sized by their 2022 vote and shaded by
 * Likud's share of it, the map's own default view, with Gaza and the West Bank drawn as the map
 * draws them. Each dot is a zero-length stroke with round caps, bucketed by shade and size, so
 * seven hundred localities cost a few kilobytes of markup.
 */
const SOUTH = 31.15;
const SIZES = [2.2, 3.8, 5.6, 7.8];
export function VoteMapGlyph() {
  const e = election as unknown as VoteMapElection;
  const pl = places as unknown as Places;
  const ctx = context as unknown as { gaza: [number, number][][]; westBank: [number, number][][] };
  const col = e.lists.findIndex((l) => l.name === "Likud");
  const dots: { x: number; y: number; valid: number; bin: number }[] = [];
  for (const row of e.rows) {
    const p = pl[String(row[0])];
    if (!p || !p[1] || !p[2] || p[1] < SOUTH) continue;
    const valid = row[3];
    if (!valid) continue;
    const [x, y] = project([p[2], p[1]]);
    dots.push({ x, y, valid, bin: binOf(col >= 0 ? row[4 + col] / valid : 0) });
  }
  const xs = dots.map((d) => d.x), ys = dots.map((d) => d.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const s = Math.min((GW - 20) / (x1 - x0), (GH - 14) / (y1 - y0));
  const ox = (GW - (x1 - x0) * s) / 2, oy = (GH - (y1 - y0) * s) / 2;
  const px = (x: number) => (ox + (x - x0) * s).toFixed(1), py = (y: number) => (oy + (y - y0) * s).toFixed(1);
  const vmax = Math.max(...dots.map((d) => d.valid));
  const sizeOf = (v: number) => Math.min(SIZES.length - 1, Math.floor(Math.sqrt(v / vmax) * SIZES.length));
  const buckets = new Map<string, string>();
  for (const d of dots) {
    const k = `${d.bin}-${sizeOf(d.valid)}`;
    buckets.set(k, (buckets.get(k) ?? "") + `M${px(d.x)},${py(d.y)}h0`);
  }
  const outline = (rings: [number, number][][]) =>
    rings
      .map((r) => "M" + r.filter((_, i) => i % 3 === 0).map(project).map(([x, y]) => `${px(x)},${py(y)}`).join("L") + "Z")
      .join("");
  return (
    <svg className="gl gl-votemap" viewBox={`0 0 ${GW} ${GH}`} aria-hidden="true" focusable="false">
      <path className="gaza" d={outline(ctx.gaza)} />
      <path className="wb" d={outline(ctx.westBank)} />
      {[...buckets].map(([k, d]) => (
        <path key={k} className={`v${k.split("-")[0]}`} d={d} strokeWidth={SIZES[+k.split("-")[1]]} />
      ))}
    </svg>
  );
}
