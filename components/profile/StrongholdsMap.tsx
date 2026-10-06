import context from "@/public/vote-map/context.json";
import { project } from "@/lib/votemap";
import type { Strongholds } from "./model";

const W = 230, H = 430, PAD = 14;
const ctx = context as unknown as { gaza: [number, number][][]; westBank: [number, number][][] };

/**
 * Where the list ran strongest in 2022: every locality as a dot shaded by the list's share of the
 * valid vote, so the country's shape comes from the places themselves, with the strongest five
 * and the three biggest cities named. The table beside it carries the numbers.
 */
export default function StrongholdsMap({ data, color, name }: { data: Strongholds; color: string; name: string }) {
  const xs = data.dots.map((d) => d.x), ys = data.dots.map((d) => d.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const s = Math.min((W - PAD * 2) / (x1 - x0), (H - PAD * 2) / (y1 - y0));
  const ox = (W - (x1 - x0) * s) / 2, oy = (H - (y1 - y0) * s) / 2;
  const px = (x: number) => ox + (x - x0) * s, py = (y: number) => oy + (y - y0) * s;
  const max = Math.max(data.national * 2, ...data.dots.filter((d) => d.valid >= 15000).map((d) => d.share));
  const tint = (share: number) => `color-mix(in oklab, ${color} ${Math.round(Math.min(1, share / max) * 100)}%, var(--sheet))`;
  const ring = (rings: [number, number][][]) => rings.map((r) => r.map(([lng, lat], i) => { const [x, y] = project([lng, lat]); return `${i ? "L" : "M"}${px(x).toFixed(1)},${py(y).toFixed(1)}`; }).join("") + "Z").join("");
  const plain = data.dots.filter((d) => !d.labelled);
  // Place each label on the side with more room, then nudge it down past any label already set there.
  const GAP = 11;
  const placed: { left: boolean; y: number }[] = [];
  const named = data.dots
    .filter((d) => d.labelled)
    .sort((a, b) => py(a.y) - py(b.y))
    .map((d) => {
      const cx = px(d.x), cy = py(d.y);
      const room = (left: boolean) => placed.filter((p) => p.left === left && Math.abs(p.y - cy) < GAP * 2).length;
      let left = cx > W * 0.55;
      if (room(left) > room(!left)) left = !left;
      let ly = cy;
      for (const p of placed.filter((p) => p.left === left).sort((a, b) => a.y - b.y)) if (Math.abs(p.y - ly) < GAP) ly = p.y + GAP;
      placed.push({ left, y: ly });
      return { d, cx, cy, left, ly };
    });
  return (
    <div className="pp-mapwrap">
      <svg className="pp-map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${name}'s share of the valid vote in 2022, by locality. Strongest: ${data.table.filter((t) => t.kind === "top").map((t) => `${t.name} ${(t.share * 100).toFixed(1)}%`).join(", ")}. The table beside the map carries the numbers.`}>
        <path className="wb" d={ring(ctx.westBank)} />
        <path className="gaza" d={ring(ctx.gaza)} />
        {plain.map((d) => (
          <circle key={d.code} cx={px(d.x).toFixed(1)} cy={py(d.y).toFixed(1)} r={d.valid >= 50000 ? 2.6 : d.valid >= 15000 ? 1.9 : 1.1} fill={tint(d.share)} />
        ))}
        {named.map(({ d, cx, cy, left, ly }) => (
          <g key={d.code}>
            <circle cx={cx.toFixed(1)} cy={cy.toFixed(1)} r={d.valid >= 50000 ? 5 : 4} fill={tint(d.share)} stroke="var(--ink)" strokeWidth={0.8} />
            {Math.abs(ly - cy) > 2 && <line x1={cx + (left ? -5 : 5)} y1={cy} x2={cx + (left ? -9 : 9)} y2={ly} stroke="var(--ink-2)" strokeWidth={0.6} />}
            <text className="lbl" x={cx + (left ? -11 : 11)} y={ly + 3.5} textAnchor={left ? "end" : "start"}>{d.name} {(d.share * 100).toFixed(0)}%</text>
          </g>
        ))}
      </svg>
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
      <p className="pp-scale" aria-hidden="true">
        <span>0%</span>
        <i style={{ background: `linear-gradient(90deg, var(--sheet), ${color})` }} />
        <span>{Math.round(max * 100)}%</span>
      </p>
    </div>
  );
}
