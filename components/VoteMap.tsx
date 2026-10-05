"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "./votemap.css";
import { BINS, binOf, decodeArcs, pathOf, project, ringsOf, type Places, type Topology, type VoteMapElection } from "@/lib/votemap";

/*
 * The vote map: one list's share of the valid vote in each locality, for one election.
 * Shading is one hue, light to dark (ruling 101: share for a chosen party, not the winner).
 * Special-envelope votes have no locality and get their own national bar (ruling 100).
 * The West Bank is outlined from OCHA's boundary file; settlements are drawn like any
 * other locality, with a note on who votes (ruling 99).
 */

export const ELECTIONS = [
  { id: "2022", label: "Nov 2022" },
  { id: "2021", label: "Mar 2021" },
  { id: "2020", label: "Mar 2020" },
  { id: "2019b", label: "Sep 2019" },
  { id: "2019a", label: "Apr 2019" },
] as const;

type Shape = { code: number; d: string; box: [number, number, number, number] };
type Context = { westBank: number[][][]; gaza: number[][][] };
type View = { x: number; y: number; w: number; h: number };

const pct = (x: number, dp = 1) => `${(x * 100).toFixed(dp)}%`;
const num = (n: number) => n.toLocaleString("en-US");
const BIN_LABELS = ["under 2%", ...BINS.map((b, i) => (i < BINS.length - 1 ? `${b * 100}–${BINS[i + 1] * 100}%` : `${b * 100}% and over`))];

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json() as Promise<T>;
}

function boxOf(rings: [number, number][][]): [number, number, number, number] {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const r of rings)
    for (const p of r) {
      const [x, y] = project(p);
      [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
    }
  return [x0, y0, x1, y1];
}

export default function VoteMap() {
  const [shapes, setShapes] = useState<Shape[] | null>(null);
  const [context, setContext] = useState<{ wb: string; gaza: string } | null>(null);
  const [places, setPlaces] = useState<Places | null>(null);
  const [cache, setCache] = useState<Record<string, VoteMapElection>>({});
  const [electionId, setElectionId] = useState<string>("2022");
  const [listName, setListName] = useState<string>("Likud");
  const [selected, setSelected] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [view, setView] = useState<View | null>(null);
  const [query, setQuery] = useState("");
  const [home, setHome] = useState<View | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; view: View; moved: boolean } | null>(null);

  useEffect(() => {
    Promise.all([getJson<Topology>("/vote-map/boundaries.topo.json"), getJson<Context>("/vote-map/context.json"), getJson<Places>("/vote-map/places.json")])
      .then(([topo, ctx, pl]) => {
        const arcs = decodeArcs(topo);
        const out: Shape[] = topo.objects.merged.geometries.map((g) => {
          const rings = ringsOf(g, arcs);
          return { code: g.properties.code, d: pathOf(rings), box: boxOf(rings) };
        });
        const ring = (r: number[][][]) => pathOf(r as [number, number][][]);
        setShapes(out);
        setContext({ wb: ring(ctx.westBank), gaza: ring(ctx.gaza) });
        setPlaces(pl);
        const all = out.map((s) => s.box);
        const [x0, y0] = [Math.min(...all.map((b) => b[0])), Math.min(...all.map((b) => b[1]))];
        const [x1, y1] = [Math.max(...all.map((b) => b[2])), Math.max(...all.map((b) => b[3]))];
        const pad = 0.04;
        const h = { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
        setHome(h);
        setView(h);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    if (cache[electionId]) return;
    getJson<VoteMapElection>(`/vote-map/${electionId}.json`)
      .then((e) => setCache((c) => ({ ...c, [electionId]: e })))
      .catch(() => setError(true));
  }, [electionId, cache]);

  const election = cache[electionId];
  const listIdx = election ? Math.max(0, election.lists.findIndex((l) => l.name === listName)) : 0;
  const list = election?.lists[listIdx];
  const rows = useMemo(() => new Map((election?.rows ?? []).map((r) => [r[0], r])), [election]);
  // A few localities are several shapes; their boxes merge.
  const shapeByCode = useMemo(() => {
    const m = new Map<number, Shape>();
    for (const s of shapes ?? []) {
      const p = m.get(s.code);
      m.set(s.code, p ? { ...p, box: [Math.min(p.box[0], s.box[0]), Math.min(p.box[1], s.box[1]), Math.max(p.box[2], s.box[2]), Math.max(p.box[3], s.box[3])] } : s);
    }
    return m;
  }, [shapes]);
  const dots = useMemo(
    () => (places && shapes ? Object.entries(places).filter(([c, p]) => !shapeByCode.has(+c) && p[1]).map(([c, p]) => ({ code: +c, xy: project([p[2], p[1]]) })) : []),
    [places, shapes, shapeByCode]
  );

  const shareOf = (code: number) => {
    const r = rows.get(code);
    if (!r || !r[3]) return null;
    return r[4 + listIdx] / r[3];
  };
  const fillOf = (code: number) => {
    const s = shareOf(code);
    if (s !== null) return `var(--vm-${binOf(s)})`;
    return places?.[code] ? "url(#vm-none)" : "var(--surface)";
  };

  const toView = (clientX: number, clientY: number) => {
    const m = svg.current?.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return [p.x, p.y] as const;
  };
  const zoom = (k: number, at?: readonly [number, number]) =>
    setView((v) => {
      if (!v || !home) return v;
      const w = Math.min(home.w, Math.max(home.w / 60, v.w * k));
      const h = (w / v.w) * v.h;
      const [cx, cy] = at ?? [v.x + v.w / 2, v.y + v.h / 2];
      return { x: cx - ((cx - v.x) * w) / v.w, y: cy - ((cy - v.y) * h) / v.h, w, h };
    });
  const focus = (code: number) => {
    setSelected(code);
    const s = shapeByCode.get(code);
    const p = places?.[code];
    if (!home) return;
    const [cx, cy] = s ? [(s.box[0] + s.box[2]) / 2, (s.box[1] + s.box[3]) / 2] : p && p[1] ? project([p[2], p[1]]) : [NaN, NaN];
    if (Number.isNaN(cx)) return;
    const w = Math.max(home.w / 14, s ? (s.box[2] - s.box[0]) * 4 : 0);
    const h = (w / home.w) * home.h;
    setView({ x: cx - w / 2, y: cy - h / 2, w, h });
  };

  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom(e.deltaY > 0 ? 1.25 : 0.8, toView(e.clientX, e.clientY) ?? undefined);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  if (error) return <p className="vm-msg">The map&apos;s data could not be loaded. Reload the page to try again.</p>;
  if (!shapes || !context || !places || !view || !election || !list) return <p className="vm-msg">Loading the map…</p>;

  const info = hover ?? selected;
  const infoRow = info !== null ? rows.get(info) : undefined;
  const scale = view.w / (home?.w ?? view.w);
  const nat = election.national;
  const localValid = nat.valid - election.envelopes.valid;
  const localVotes = list.votes - election.envelopes.votes[listIdx];
  const top = election.rows
    .filter((r) => r[3] >= 1000)
    .map((r) => ({ code: r[0], share: r[4 + listIdx] / r[3], votes: r[4 + listIdx], valid: r[3] }))
    .sort((a, b) => b.share - a.share)
    .slice(0, 25);
  const names = Object.entries(places).filter(([, p]) => p[0]).map(([c, p]) => ({ code: +c, name: p[0] }));
  const pick = (v: string) => {
    setQuery(v);
    const hit = names.find((n) => n.name.toLowerCase() === v.trim().toLowerCase());
    if (hit) focus(hit.code);
  };

  return (
    <div className="vm">
      <div className="vm-controls">
        <label>
          <span>Election</span>
          <select value={electionId} onChange={(e) => setElectionId(e.target.value)}>
            {ELECTIONS.map((e) => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span>List</span>
          <select value={list.name} onChange={(e) => setListName(e.target.value)}>
            {election.lists.map((l) => (
              <option key={l.letters} value={l.name}>
                {l.name} ({pct(l.votes / nat.valid)})
              </option>
            ))}
          </select>
        </label>
        <label className="vm-find">
          <span>Find a town</span>
          <input list="vm-places" value={query} placeholder="e.g. Haifa" onChange={(e) => pick(e.target.value)} />
          <datalist id="vm-places">
            {names.map((n) => (
              <option key={n.code} value={n.name} />
            ))}
          </datalist>
        </label>
      </div>

      <div className="vm-body">
        <div className="vm-mapwrap">
          <svg
            ref={svg}
            className="vm-map"
            viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
            role="img"
            aria-label={`Map: ${list.name}'s share of the valid vote by locality, ${election.label}`}
            onPointerDown={(e) => {
              drag.current = { x: e.clientX, y: e.clientY, view, moved: false };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d || !svg.current) return;
              const dx = e.clientX - d.x;
              const dy = e.clientY - d.y;
              if (!d.moved && Math.hypot(dx, dy) < 4) return;
              if (!d.moved) svg.current.setPointerCapture(e.pointerId);
              d.moved = true;
              const k = d.view.w / svg.current.clientWidth;
              setView({ ...d.view, x: d.view.x - dx * k, y: d.view.y - dy * k });
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerLeave={() => setHover(null)}
          >
            <defs>
              <pattern id="vm-none" width={0.01 * scale} height={0.01 * scale} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width={0.01 * scale} height={0.01 * scale} fill="var(--surface)" />
                <line x1="0" y1="0" x2="0" y2={0.01 * scale} stroke="var(--line-2)" strokeWidth={0.003 * scale} />
              </pattern>
            </defs>
            <path d={context.gaza} className="vm-gaza" />
            <g className="vm-shapes">
              {shapes.map((s, i) => (
                <path
                  key={i}
                  d={s.d}
                  fill={fillOf(s.code)}
                  className={s.code === selected ? "on" : undefined}
                  onPointerEnter={() => places[s.code] && setHover(s.code)}
                  onClick={() => !drag.current?.moved && places[s.code] && setSelected(s.code)}
                />
              ))}
              {dots.map((p) => (
                <circle
                  key={p.code}
                  cx={p.xy[0]}
                  cy={p.xy[1]}
                  r={0.012 * scale}
                  fill={fillOf(p.code)}
                  className={p.code === selected ? "on dot" : "dot"}
                  onPointerEnter={() => setHover(p.code)}
                  onClick={() => setSelected(p.code)}
                />
              ))}
            </g>
            <path d={context.wb} className="vm-wb" />
            <g className="vm-labels" fontSize={0.07 * scale}>
              <text x={project([35.43, 31.98])[0]} y={project([35.43, 31.98])[1]}>West Bank</text>
              <text x={project([34.2, 31.42])[0]} y={project([34.2, 31.42])[1]} textAnchor="end">Gaza</text>
            </g>
          </svg>
          <div className="vm-zoom">
            <button type="button" onClick={() => zoom(0.6)} aria-label="Zoom in">+</button>
            <button type="button" onClick={() => zoom(1 / 0.6)} aria-label="Zoom out">−</button>
            <button type="button" onClick={() => home && setView(home)}>Reset</button>
          </div>
        </div>

        <aside className="vm-side">
          <p className="vm-k">{list.name}, {election.label}</p>
          <ul className="vm-legend" aria-label="Share of the valid vote">
            {BIN_LABELS.map((l, i) => (
              <li key={l}><span style={{ background: `var(--vm-${i})` }} />{l}</li>
            ))}
            <li><span className="vm-sw-none" />not in this year&apos;s file</li>
          </ul>

          <div className="vm-info" aria-live="polite">
            {info !== null && places[info] ? (
              <>
                <p className="vm-place">{places[info][0] || `Locality ${info}`}</p>
                {infoRow && infoRow[3] ? (
                  <>
                    <p className="vm-big">{pct(infoRow[4 + listIdx] / infoRow[3])}</p>
                    <p className="vm-sub">
                      {list.name}: {num(infoRow[4 + listIdx])} of {num(infoRow[3])} valid votes. Turnout {pct(infoRow[2] / infoRow[1])}.
                    </p>
                    <p className="vm-k">How this town voted</p>
                    <ol className="vm-tops">
                      {election.lists
                        .map((l, i) => ({ name: l.name, v: infoRow[4 + i] }))
                        .sort((a, b) => b.v - a.v)
                        .slice(0, 5)
                        .map((x) => (
                          <li key={x.name}><span>{x.name}</span><span>{pct(x.v / infoRow[3])}</span></li>
                        ))}
                    </ol>
                  </>
                ) : (
                  <p className="vm-sub">No result for this locality in the {election.label} file.</p>
                )}
              </>
            ) : (
              <p className="vm-sub">Hover over or tap a locality to see how it voted. Drag to move the map; zoom with the buttons or the scroll wheel.</p>
            )}
          </div>

          <div className="vm-nat">
            <p className="vm-k">Nationally</p>
            <div className="vm-bar">
              <span className="vm-bl">Votes counted by locality ({num(localValid)})</span>
              <span className="vm-bt"><span style={{ width: pct(localVotes / localValid) }} /></span>
              <span className="vm-bv">{pct(localVotes / localValid)}</span>
            </div>
            <div className="vm-bar">
              <span className="vm-bl">Special-envelope votes ({num(election.envelopes.valid)})</span>
              <span className="vm-bt"><span style={{ width: pct(election.envelopes.votes[listIdx] / election.envelopes.valid) }} /></span>
              <span className="vm-bv">{pct(election.envelopes.votes[listIdx] / election.envelopes.valid)}</span>
            </div>
            <p className="vm-sub">
              {pct(election.envelopes.valid / nat.valid)} of valid votes were cast by special envelope, at special stations for soldiers,
              hospital patients and residents of care facilities, among others. They have no locality, so they are not on the map. In all, {list.name} won{" "}
              {pct(list.votes / nat.valid, 2)} and {list.seats} {list.seats === 1 ? "seat" : "seats"}.
            </p>
          </div>
        </aside>
      </div>

      <details className="vm-table">
        <summary>Table: the 25 localities where {list.name} did best, {election.label} (1,000 valid votes or more)</summary>
        <div className="vm-tw">
          <table>
            <thead>
              <tr><th scope="col">Locality</th><th scope="col">Share</th><th scope="col">Votes</th><th scope="col">Valid votes</th></tr>
            </thead>
            <tbody>
              {top.map((r) => (
                <tr key={r.code}>
                  <th scope="row">
                    <button type="button" onClick={() => focus(r.code)}>{places[r.code]?.[0] || r.code}</button>
                  </th>
                  <td>{pct(r.share)}</td>
                  <td>{num(r.votes)}</td>
                  <td>{num(r.valid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className="vm-src">
        Source: Central Elections Committee, <a href={election.source.results}>national results</a> and{" "}
        <a href={election.source.csv}>results by locality</a> ({election.label}).
      </p>
    </div>
  );
}
