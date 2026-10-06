import { GH, GW } from "@/components/HomeGlyphs";
import { shortDate } from "@/lib/format";

/*
 * Small pictures for the directory, one per page that the home row does not already draw. Each
 * is built from that page's own data where it has some (dates, counts, letters, seats) and is a
 * neutral mark otherwise. All share the home glyphs' 300×190 box and are decorative.
 */
const Svg = ({ k, children }: { k: string; children: React.ReactNode }) => (
  <svg className={`gl rg-${k}`} viewBox={`0 0 ${GW} ${GH}`} aria-hidden="true" focusable="false">
    {children}
  </svg>
);
const t = (iso: string) => Date.parse(iso.length === 4 ? `${iso}-07-01` : iso);

/** The newest briefing: one bar per sentence, its length the sentence's. */
export function NewsGlyph({ date, sentences }: { date: string; sentences: string[] }) {
  const rows = sentences.slice(0, 8), max = Math.max(1, ...rows.map((s) => s.length));
  return (
    <Svg k="news">
      <text className="big" x="20" y="40">{date}</text>
      {rows.map((s, i) => <rect key={i} className={i ? "bar" : "bar first"} x="20" y={56 + i * 15} width={Math.max(20, (s.length / max) * 260)} height="8" />)}
    </Svg>
  );
}

/** The changes log: each logged change as a dot on its date; same-month dots stack. */
export function ChangesGlyph({ dates }: { dates: string[] }) {
  const sorted = [...dates].sort();
  const ts = dates.map(t), lo = Math.min(...ts), hi = Math.max(...ts), x = (v: number) => 24 + ((v - lo) / Math.max(1, hi - lo)) * 252;
  const seen = new Map<number, number>();
  const dots = [...ts].sort((a, b) => a - b).map((v) => { const k = Math.round(x(v) / 10); const n = seen.get(k) ?? 0; seen.set(k, n + 1); return { cx: x(v), cy: 112 - n * 16 }; });
  return (
    <Svg k="changes">
      <line className="axis" x1="16" x2="284" y1="126" y2="126" />
      {dots.map((d, i) => <circle key={i} cx={d.cx} cy={d.cy} r="6" />)}
      <text className="lab" x="16" y="150">{sorted[0].slice(0, 4) === sorted.at(-1)!.slice(0, 4) ? shortDate(sorted[0]) : sorted[0].slice(0, 4)}</text>
      <text className="lab" x="284" y="150" textAnchor="end">{shortDate(sorted.at(-1)!)}</text>
    </Svg>
  );
}

/** Results: the 120-seat bar with its 61 line, hatched while there is no count to show. */
export function ResultsGlyph({ closed }: { closed: boolean }) {
  const x0 = 20, w = 260, x61 = x0 + (61 / 120) * w;
  return (
    <Svg k="results">
      <defs><pattern id="rg-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" className="hatch" /></pattern></defs>
      <rect className="frame" x={x0} y="74" width={w} height="44" fill={closed ? "var(--tint-base)" : "url(#rg-hatch)"} />
      <line className="sixtyone" x1={x61} x2={x61} y1="64" y2="128" />
      <text className="lab" x={x61} y="150" textAnchor="middle">61</text>
    </Svg>
  );
}

/** The outgoing coalition's seats after each step, against 61. */
export function GovernmentGlyph({ points }: { points: { date: string; seats: number }[] }) {
  const ts = points.map((p) => t(p.date)), lo = Math.min(...ts), hi = Date.parse("2026-10-27");
  const x = (v: number) => 20 + ((v - lo) / Math.max(1, hi - lo)) * 250, y = (s: number) => 170 - ((s - 50) / 30) * 150;
  const d = points.map((p, i) => `${i ? `H${x(ts[i]).toFixed(1)}V` : `M${x(ts[i]).toFixed(1)},`}${y(p.seats).toFixed(1)}`).join("") + `H${x(hi).toFixed(1)}`;
  return (
    <Svg k="government">
      <line className="sixtyone" x1="16" x2="284" y1={y(61)} y2={y(61)} />
      <text className="lab" x="284" y={y(61) + 18} textAnchor="end">61</text>
      <path className="step" d={d} />
    </Svg>
  );
}

/** Compare: one cell for each list and question. */
export function CompareGlyph({ questions, lists }: { questions: number; lists: number }) {
  const c = Math.min(lists, 16), cw = 260 / c, rh = Math.min(18, 150 / questions);
  return (
    <Svg k="compare">
      {Array.from({ length: questions }, (_, r) => Array.from({ length: c }, (_, i) => <rect key={`${r}-${i}`} x={20 + i * cw + 1} y={20 + r * rh + 1} width={cw - 2} height={rh - 2} className="cell" />))}
    </Svg>
  );
}

/** The family tree: one lane per party history, a dot for each split, merger or alliance. */
export function FamilyGlyph({ lanes }: { lanes: string[][] }) {
  const all = lanes.flat().map(t), lo = Math.min(...all), hi = Date.parse("2026-10-27"), x = (v: number) => 20 + ((v - lo) / (hi - lo)) * 260;
  const gap = 160 / Math.max(1, lanes.length);
  return (
    <Svg k="family">
      {lanes.map((ev, i) => { const yy = 18 + i * gap; const xs = ev.map(t); return <g key={i}><line className="lane" x1={x(Math.min(...xs))} x2="280" y1={yy} y2={yy} />{xs.map((v, k) => <circle key={k} cx={x(v)} cy={yy} r="3.2" />)}</g>; })}
    </Svg>
  );
}

/** Every ballot list: a slip for each, with its ballot letters. */
export function BallotGlyph({ letters }: { letters: string[] }) {
  const cols = 10, w = 26, h = 38;
  return (
    <Svg k="ballot">
      {letters.slice(0, 40).map((l, i) => { const xx = 13 + (i % cols) * 28, yy = 8 + Math.floor(i / cols) * 45; return <g key={i}><rect className="slip" x={xx} y={yy} width={w} height={h} /><text className="let" x={xx + w / 2} y={yy + 24} textAnchor="middle" lang="he">{l}</text></g>; })}
    </Svg>
  );
}

/** The timeline: prime ministers' terms as alternating bands, each election a tick above. */
export function TimelineGlyph({ elections, terms }: { elections: string[]; terms: { from: string; to: string }[] }) {
  const lo = t("1977-01-01"), hi = t("2026-12-31"), x = (v: number) => 16 + ((v - lo) / (hi - lo)) * 268;
  return (
    <Svg k="timeline">
      {terms.map((g, i) => <rect key={i} className={i % 2 ? "term" : "term alt"} x={x(Math.max(lo, t(g.from)))} y="82" width={Math.max(1, x(Math.min(hi, t(g.to))) - x(Math.max(lo, t(g.from))))} height="30" />)}
      {elections.map((e) => <line key={e} className="tick" x1={x(t(e))} x2={x(t(e))} y1="58" y2="76" />)}
      <text className="lab" x="16" y="140">1977</text>
      <text className="lab" x="284" y="140" textAnchor="end">2026</text>
    </Svg>
  );
}

/** The glossary: how many terms begin with each letter. */
export function GlossaryGlyph({ initials }: { initials: string[] }) {
  const az = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), n = az.map((c) => initials.filter((i) => i === c).length), max = Math.max(1, ...n), bw = 260 / 26;
  return (
    <Svg k="glossary">
      {n.map((v, i) => v ? <rect key={i} className="bar" x={20 + i * bw + 1} y={150 - (v / max) * 120} width={bw - 2} height={(v / max) * 120} /> : null)}
      <line className="axis" x1="20" x2="280" y1="150" y2="150" />
      <text className="lab" x="20" y="172">A</text>
      <text className="lab" x="280" y="172" textAnchor="end">Z</text>
    </Svg>
  );
}

/** A neutral count mark: one sheet per guide, community or issue. */
export function SheetsGlyph({ n, k }: { n: number; k: string }) {
  const cols = Math.min(n, 5), rows = Math.ceil(n / cols), w = 44, h = Math.min(56, 150 / rows - 8);
  return (
    <Svg k={k}>
      {Array.from({ length: n }, (_, i) => { const xx = (GW - cols * (w + 10) + 10) / 2 + (i % cols) * (w + 10), yy = (GH - rows * (h + 8) + 8) / 2 + Math.floor(i / cols) * (h + 8); return <g key={i}><rect className="sheet" x={xx} y={yy} width={w} height={h} /><line className="rule" x1={xx + 8} x2={xx + w - 8} y1={yy + 12} y2={yy + 12} /><line className="rule" x1={xx + 8} x2={xx + w - 16} y1={yy + 20} y2={yy + 20} /></g>; })}
    </Svg>
  );
}

/** The American lens: two frames that overlap only in part. */
export function LensGlyph() {
  return (
    <Svg k="lens">
      <circle className="ring" cx="120" cy="95" r="58" />
      <circle className="ring b" cx="180" cy="95" r="58" />
    </Svg>
  );
}
