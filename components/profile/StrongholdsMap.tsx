import context from "@/public/vote-map/context.json";
import { project } from "@/lib/votemap";
import type { Strongholds } from "./model";

const W = 410, H = 430, PAD = 14, BAND = 130;
const ctx = context as unknown as { gaza: [number, number][][]; westBank: [number, number][][] };

/**
 * Where the list ran strongest in 2022: every locality as a dot shaded by the list's share of the
 * valid vote, so the country's shape comes from the places themselves, with the strongest five
 * and the three biggest cities named in the margins. The table under it carries the numbers.
 */
export default function StrongholdsMap({ data, color, name }: { data: Strongholds; color: string; name: string }) {
  const xs = data.dots.map((d) => d.x), ys = data.dots.map((d) => d.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  // The country fills a central band; the named places are set in the margins either side of it, so no label sits on a dot.
  const s = Math.min(BAND / (x1 - x0), (H - PAD * 2) / (y1 - y0));
  const ox = (W - (x1 - x0) * s) / 2, oy = (H - (y1 - y0) * s) / 2;
  const px = (x: number) => ox + (x - x0) * s, py = (y: number) => oy + (y - y0) * s;
  const max = Math.max(data.national * 2, ...data.dots.filter((d) => d.valid >= 15000).map((d) => d.share));
  // The low end of the ramp is --map-low: a pale tint on light paper, a dim one on dark, so the strongest places are
  // always the most saturated marks and the weakest the quietest, in either mode.
  const tint = (share: number) => `color-mix(in oklab, ${color} ${Math.round(Math.min(1, share / max) * 100)}%, var(--map-low))`;
  const ring = (rings: [number, number][][]) => rings.map((r) => r.map(([lng, lat], i) => { const [x, y] = project([lng, lat]); return `${i ? "L" : "M"}${px(x).toFixed(1)},${py(y).toFixed(1)}`; }).join("") + "Z").join("");
  const plain = data.dots.filter((d) => !d.labelled);
  // Each named place goes to the margin on its own side of the country, its label clear of every dot in that row, and
  // labels on one side are stacked at least GAP apart (pushed down, then back up if the stack runs off the foot).
  const GAP = 17, mid = W / 2, est = (t: string) => t.length * 7.4;
  const all = data.dots.map((d) => ({ x: px(d.x), y: py(d.y) }));
  const edge = (y: number, x: number, left: boolean) => {
    const row = [x, ...all.filter((p) => Math.abs(p.y - y) < GAP).map((p) => p.x)];
    return left ? Math.min(...row) - 10 : Math.max(...row) + 10;
  };
  const named = data.dots
    .filter((d) => d.labelled)
    .map((d) => ({ d, cx: px(d.x), cy: py(d.y), text: `${d.name} ${(d.share * 100).toFixed(1)}%` }))
    .sort((a, b) => a.cy - b.cy)
    .map((n) => ({ ...n, left: n.cx < mid, ly: n.cy, lx: 0 }));
  for (const left of [true, false]) {
    const side = named.filter((n) => n.left === left);
    side.forEach((n, i) => { if (i) n.ly = Math.max(n.ly, side[i - 1].ly + GAP); });
    for (let i = side.length - 1; i >= 0; i--) side[i].ly = Math.min(side[i].ly, (i === side.length - 1 ? H - 4 : side[i + 1].ly - GAP));
    for (const n of side) {
      const e = edge(n.ly, n.cx, left);
      n.lx = left ? Math.max(e, est(n.text) + 2) : Math.min(e, W - est(n.text) - 2);
    }
  }
  return (
    <div className="pp-mapwrap">
      <svg className="pp-map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${name}'s share of the valid vote in 2022, by locality. Strongest: ${data.table.filter((t) => t.kind === "top").map((t) => `${t.name} ${(t.share * 100).toFixed(1)}%`).join(", ")}. The table under the map carries the numbers.`}>
        <path className="wb" d={ring(ctx.westBank)} />
        <path className="gaza" d={ring(ctx.gaza)} />
        {plain.map((d) => (
          <circle key={d.code} cx={px(d.x).toFixed(1)} cy={py(d.y).toFixed(1)} r={d.valid >= 50000 ? 2.6 : d.valid >= 15000 ? 1.9 : 1.1} fill={tint(d.share)} />
        ))}
        {named.map(({ d, cx, cy, left, ly, lx, text }) => (
          <g key={d.code}>
            <line className="lead" x1={cx} y1={cy} x2={lx + (left ? 3 : -3)} y2={ly} />
            <circle cx={cx.toFixed(1)} cy={cy.toFixed(1)} r={d.valid >= 50000 ? 5 : 4} fill={tint(d.share)} stroke="var(--ink)" strokeWidth={0.8} />
            <text className="lbl" x={lx} y={ly + 4} textAnchor={left ? "end" : "start"}>{text}</text>
          </g>
        ))}
      </svg>
      <p className="pp-scale" aria-hidden="true">
        <span>0%</span>
        <i style={{ background: `linear-gradient(90deg, var(--map-low), ${color})` }} />
        <span>{Math.round(max * 100)}%</span>
      </p>
      <table className="pp-maptable">
        <tbody>
          {data.table.map((t) => (
            <tr key={t.name} className={t.kind}>
              <th scope="row">{t.name}</th>
              <td>{(t.share * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
