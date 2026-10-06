"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "./votemap.css";
import LocalityHistory from "./LocalityHistory";
import { readMapState, mapHref } from "@/lib/locality-history";
import { BINS, binOf, decodeArcs, pathOf, project, ringsOf, type Places, type Topology, type VoteMapElection } from "@/lib/votemap";
import {localLeader,listColor,voteMix,voteMarkers,visibleVoteMarkers,markerRadius,wedgePath,rampDeep,MODE_LABELS,OTHER_COLOR,type MapMode,type VoteSlice} from "@/lib/votemap-visual";

/*
 * The vote map: one list's share of the valid vote in each locality, for one election.
 * Three user-approved views: one-list share, proportional vote-mix markers and local plurality.
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
const leaderText=(mix:VoteSlice[]|null)=>{const l=localLeader(mix);return l.status==="named" ? `${l.names[0]} leads with ${pct(l.share!)}` : l.status==="tie" ? `Tie: ${l.names.join(" / ")} at ${pct(l.share!)}` : l.status==="unresolved" ? "Leading list cannot be established from the grouped Other lists" : "No valid-vote denominator";};
function MixBar({mix,label}:{mix:VoteSlice[]|null;label:string}){return <div><p className="vm-k">{label}</p>{mix ? <div className="vm-mixbar" role="img" aria-label={mix.map(s=>`${s.name}: ${pct(s.share)}`).join(", ")}>{mix.filter(s=>s.votes>0).map(s=><span key={s.name} style={{width:`${s.share*100}%`,background:s.color}} title={`${s.name}: ${pct(s.share)}`} />)}</div> : <p>Not available</p>}</div>;}

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
  const [mode,setMode]=useState<MapMode>("single");
  const [mapSize,setMapSize]=useState({w:600,h:700});
  const [selected, setSelected] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [view, setView] = useState<View | null>(null);
  const [query, setQuery] = useState("");
  const [home, setHome] = useState<View | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; view: View; moved: boolean } | null>(null);
  const moved=useRef(false);
  // Touch: one finger scrolls the page (touch-action: pan-y); two move and zoom the map from where they started.
  const touches=useRef(new Map<number,{x:number;y:number}>());
  const pinch=useRef<{view:View;mid:[number,number];dist:number;wpp:number;cx:number;cy:number}|null>(null);
  // The scroll wheel zooms only with Ctrl or Cmd held, or once the map has been clicked, so it never traps the page's scroll.
  const active=useRef(false);

  useEffect(() => {
    const restore = () => { const state = readMapState(new URLSearchParams(window.location.search)); setElectionId(state.election); setListName(state.list); setMode(state.mode); setSelected(state.locality); setQuery(""); };
    restore(); window.addEventListener("popstate", restore); return () => window.removeEventListener("popstate", restore);
  }, []);
  function save(id: string, name: string, code: number | null,nextMode=mode) { const path = mapHref(id,name,code,nextMode); if (`${location.pathname}${location.search}` !== path) history.pushState(history.state,"",path); setCopied(false); }

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
  const asked = election ? election.lists.findIndex((l) => l.name === listName) : 0;
  const listIdx = election && asked < 0 ? Math.max(0, election.lists.findIndex((l) => l.name === "Likud")) : Math.max(0, asked);
  const list = election?.lists[listIdx];
  const markerData=useMemo(()=>election&&places ? voteMarkers(election,places) : {markers:[],missingCoordinates:0},[election,places]);
  const loaded=!!(shapes&&context&&places&&view&&election&&list);
  useEffect(()=>{const el=svg.current;if(!loaded||!el)return;const measure=()=>setMapSize({w:el.clientWidth||600,h:el.clientHeight||700});measure();const observer=new ResizeObserver(measure);observer.observe(el);return ()=>observer.disconnect();},[loaded]);
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
    if(mode==="mix")return rows.get(code)?.[3] ? "var(--vm-base)" : places?.[code] ? "url(#vm-none)" : "var(--vm-land)";
    if(mode==="leader" && election){const l=localLeader(voteMix(election,rows.get(code)));return l.status==="named" ? l.color : l.status==="tie" ? "url(#vm-tie)" : l.status==="unresolved" ? "url(#vm-unresolved)" : places?.[code] ? "url(#vm-none)" : "var(--vm-land)";}
    const s = shareOf(code);
    if (s !== null) return `var(--vm-${binOf(s)})`;
    return places?.[code] ? "url(#vm-none)" : "var(--vm-land)";
  };

  const toView = (clientX: number, clientY: number) => {
    const m = svg.current?.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return [p.x, p.y] as const;
  };
  const clampW = (w: number) => (home ? Math.min(home.w, Math.max(home.w / 60, w)) : w);
  const zoom = (k: number, at?: readonly [number, number]) =>
    setView((v) => {
      if (!v || !home) return v;
      const w = clampW(v.w * k);
      const h = (w / v.w) * v.h;
      const [cx, cy] = at ?? [v.x + v.w / 2, v.y + v.h / 2];
      return { x: cx - ((cx - v.x) * w) / v.w, y: cy - ((cy - v.y) * h) / v.h, w, h };
    });
  const focus = (code: number, persist = true) => {
    setSelected(code);
    if (places?.[code]) setQuery(places[code][0]);
    if (persist) save(electionId, list?.name ?? listName, code);
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
    if (selected !== null && places && home) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- validate restored locality once data arrives
      if (!places[selected]) { setSelected(null); return; }
      focus(selected, false);
    }
  // A restored selection is focused after geometry arrives, without rewriting its URL.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, places, home, shapeByCode]);

  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey && !active.current) return;
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
  const unit=Math.max(view.w/mapSize.w,view.h/mapSize.h);
  const maxValid=Math.max(...election.rows.map(r=>r[3]));
  const markers=visibleVoteMarkers(markerData.markers,view,unit,maxValid,selected);
  const infoMix=voteMix(election,infoRow);
  const localityMix=voteMix(election,[0,0,0,election.national.valid-election.envelopes.valid,...election.lists.map((l,i)=>l.votes-election.envelopes.votes[i])]);
  const envelopeMix=voteMix(election,[0,0,0,election.envelopes.valid,...election.envelopes.votes]);
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
    <div className="vm" style={mode==="single" ? {["--vm-hue" as string]:listColor(list.name),["--vm-deep" as string]:`${rampDeep(listColor(list.name))}%`} : undefined}>
      <div className="vm-controls">
        <label><span>View</span><select aria-label="View" value={mode} onChange={e=>{const next=e.target.value as MapMode;setMode(next);save(electionId,list.name,selected,next);}}>{Object.entries(MODE_LABELS).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
        <label>
          <span>Election</span>
          <select aria-label="Election" value={electionId} onChange={(e) => { const id = e.target.value; setElectionId(id); save(id,listName,selected); }}>
            {ELECTIONS.map((e) => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{mode==="single" ? "List" : "List for secondary comparison"}</span>
          <select aria-label={mode==="single" ? "List" : "List for secondary comparison"} value={list.name} onChange={(e) => { setListName(e.target.value); save(electionId,e.target.value,selected); }}>
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

      <p className="vm-fallback" role="status">{asked < 0 ? `${listName} did not run in the ${election.label} election, so the map shows ${list.name}.` : ""}</p>
      <p className="vm-share"><button type="button" className="btn" onClick={async () => { const path = mapHref(electionId,list.name,selected,mode); history.replaceState(history.state,"",path); try { await navigator.clipboard.writeText(`https://www.israelielection.org${path}`); setCopied(true); } catch { setCopied(false); } }}>Copy link</button><span role="status">{copied ? "Link copied." : ""}</span></p>
      <div className="vm-body">
        <div className="vm-mapwrap">
          <svg
            ref={svg}
            className="vm-map"
            viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
            role="group"
            aria-label={`Map: ${MODE_LABELS[mode]}, ${mode==="single" ? list.name+", " : ""}${election.label}. ${mode==="mix" ? "Select a marker for results, or find a town." : "Localities on this map cannot be reached by keyboard; use Find a town above to choose one."}`}
            onPointerDown={(e) => {
              moved.current=false;
              if (e.pointerType === "touch") {
                touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
                const pts = [...touches.current.values()], m = svg.current?.getScreenCTM(), r = svg.current?.getBoundingClientRect();
                if (pts.length === 2 && m && r) {
                  pinch.current = { view, mid: [(pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2], dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1, wpp: 1 / m.a, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
                  for (const id of touches.current.keys()) svg.current!.setPointerCapture(id);
                }
                return;
              }
              active.current = true;
              drag.current = { x: e.clientX, y: e.clientY, view, moved: false };
            }}
            onPointerMove={(e) => {
              if (e.pointerType === "touch") {
                if (!touches.current.has(e.pointerId)) return;
                touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
                const p = pinch.current, pts = [...touches.current.values()];
                if (!p || pts.length < 2) return;
                moved.current = true;
                const mid = [(pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2], dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
                const w = clampW(p.view.w * (p.dist / dist)), h = (w / p.view.w) * p.view.h, wpp = (p.wpp * w) / p.view.w;
                // The map point under the fingers' first midpoint stays under their midpoint now.
                const at = [p.view.x + p.view.w / 2 + (p.mid[0] - p.cx) * p.wpp, p.view.y + p.view.h / 2 + (p.mid[1] - p.cy) * p.wpp];
                setView({ x: at[0] - (mid[0] - p.cx) * wpp - w / 2, y: at[1] - (mid[1] - p.cy) * wpp - h / 2, w, h });
                return;
              }
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
            onPointerUp={(e) => {
              if (e.pointerType === "touch") { touches.current.delete(e.pointerId); if (touches.current.size < 2) pinch.current = null; return; }
              moved.current=!!drag.current?.moved;
              drag.current = null;
            }}
            onPointerCancel={(e) => { touches.current.delete(e.pointerId); pinch.current = null; drag.current = null; }}
            onLostPointerCapture={(e) => { if (e.pointerType === "touch") { touches.current.delete(e.pointerId); if (touches.current.size < 2) pinch.current = null; } else drag.current = null; }}
            onPointerLeave={(e) => { setHover(null); if (e.pointerType !== "touch") active.current = false; }}
          >
            <defs>
              <pattern id="vm-none" width={0.01 * scale} height={0.01 * scale} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width={0.01 * scale} height={0.01 * scale} fill="var(--sheet)" />
                <line x1="0" y1="0" x2="0" y2={0.01 * scale} stroke="var(--line-2)" strokeWidth={0.003 * scale} />
              </pattern>
              <pattern id="vm-tie" width={6*unit} height={6*unit} patternUnits="userSpaceOnUse"><rect width={6*unit} height={6*unit} style={{fill:"var(--vm-tie-bg)"}}/><circle cx={3*unit} cy={3*unit} r={unit} style={{fill:"var(--vm-tie-dot)"}}/></pattern>
              <pattern id="vm-unresolved" width={6*unit} height={6*unit} patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width={6*unit} height={6*unit} style={{fill:"var(--vm-unres-bg)"}}/><line y2={6*unit} style={{stroke:"var(--vm-unres-line)"}} strokeWidth={2*unit}/></pattern>
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
                  onClick={() => !moved.current && places[s.code] && focus(s.code)}
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
                  onClick={() => !moved.current && focus(p.code)}
                />
              ))}
            </g>
            <path d={context.wb} className="vm-wb" />
            {mode==="mix" && <g className="vm-pies">{markers.shown.map(p=>{const r=markerRadius(p.valid,maxValid,unit);let start=0;return <g key={p.code} transform={`translate(${p.x} ${p.y})`} role="button" tabIndex={0} aria-label={`${places[p.code][0]}, ${num(p.valid)} valid votes. Select for vote breakdown.`} onPointerEnter={()=>setHover(p.code)} onClick={()=>!moved.current&&focus(p.code)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();focus(p.code);}}}><title>{places[p.code][0]}: {num(p.valid)} valid votes</title>{p.mix.filter(s=>s.votes>0).map(s=>{const a=start;start+=s.share;return <path key={s.name} d={wedgePath(a,start,r)} fill={s.color}/>;})}<circle r={r} className={p.code===selected ? "pie-outline selected" : "pie-outline"}/></g>;})}</g>}
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
          <p className="fig-note vm-hint">To zoom with the scroll wheel, click the map first or hold Ctrl or Cmd; on a touch screen, move and zoom with two fingers.</p>
          {mode==="mix" && <p className="vm-marker-count" aria-live="polite">Showing {markers.shown.length} of {markers.available} mapped towns in view; others omitted for overlap or the 80-marker limit. {markerData.missingCoordinates} valid-result towns lack usable coordinates and are excluded from pies.</p>}
        </div>

        <aside className="vm-side">
          <p className="vm-k">{mode==="single" ? list.name : MODE_LABELS[mode]}, {election.label}</p>
          <ul className={`fig-key vm-legend${mode!=="single" ? " vm-category-legend" : ""}`} aria-label={mode==="single" ? "Share of the valid vote" : "Historical list colors"}>
            {mode==="single" ? BIN_LABELS.map((l, i) => (
              <li key={l}><span style={{ background: `var(--vm-${i})` }} />{l}</li>
            )) : election.lists.map(l=><li key={l.letters}><span style={{background:listColor(l.name)}}/>{l.name}</li>)}
            {mode==="mix" && <li><span style={{background:OTHER_COLOR}}/>Other lists (combined)</li>}
            {mode==="leader" && <><li><span className="vm-sw-tie"/>Tie among named leaders</li><li><span className="vm-sw-unknown"/>Leader not established: Other may conceal it</li></>}
            <li><span className="vm-sw-none" />No result or no valid votes in the file</li>
            <li><span className="vm-sw-land" />Outside any voting locality</li>
          </ul>
          {mode==="mix" && <div className="fig-key vm-size-key"><svg width="110" height="60" role="img" aria-label={`Circle areas: ${num(Math.round(maxValid/4))} and ${num(maxValid)} valid votes`}><circle cx="17" cy="31" r="13"/><circle cx="72" cy="31" r="26"/></svg><p>Example sizes: {num(Math.round(maxValid/4))} / {num(maxValid)} valid votes. The same area scale applies throughout this election.</p></div>}

          <div className="vm-info" aria-live="polite">
            {info !== null && places[info] ? (
              <>
                <p className="vm-place">{places[info][0] || `Locality ${info}`}</p>
                {infoRow && infoRow[3] ? (
                  <>
                    <p className="vm-big">{mode==="single" ? pct(infoRow[4 + listIdx] / infoRow[3]) : num(infoRow[3])}</p>
                    <p className="vm-sub">
                      {mode==="single" ? `${list.name}: ${num(infoRow[4 + listIdx])} of ${num(infoRow[3])} valid votes.` : `Valid votes. ${leaderText(infoMix)}.`} Turnout {infoRow[1] ? pct(infoRow[2] / infoRow[1]) : "not available"}.
                    </p>
                    <p className="vm-k">How this town voted</p>
                    <ol className="vm-tops">
                      {[...(infoMix ?? [])]
                        .sort((a, b) => b.votes - a.votes)
                        .map((x) => (
                          <li key={x.name}><span><i style={{background:x.color}}/>{x.name}</span><span>{num(x.votes)}, {pct(x.share)}</span></li>
                        ))}
                    </ol>
                  </>
                ) : (
                  <p className="vm-sub">No result for this locality in the {election.label} file.</p>
                )}
              </>
            ) : (
              <p className="vm-sub">Hover over or tap a locality to see how it voted. Drag to move the map, or use two fingers on a touch screen; zoom with the buttons.</p>
            )}
          </div>

          <div className="vm-nat">
            <p className="vm-k">Nationally</p>
            {mode!=="single" ? <><MixBar mix={localityMix} label={`Votes by locality (${num(localValid)})`}/><MixBar mix={envelopeMix} label={`Special envelopes (${num(election.envelopes.valid)})`}/><p className="vm-sub">Special envelopes have no home-locality geography and remain separate. {pct(election.envelopes.valid/nat.valid)} of national valid votes. Bars show all named lists plus Other.</p></> : <>
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
            </>}
          </div>
        </aside>
      </div>

      <p className="fig-note vm-mode-note vm-method">{mode==="single" ? `Deeper ${list.name} color means a larger share of valid votes for that list.` : mode==="leader" ? "Color shows the local plurality among named lists, not a majority or individual voters. A tie or a grouped Other total large enough to conceal the leader is marked separately. Land area is not vote count." : "Each pie shows a town's vote mix; circle area is proportional to valid votes. Larger towns are prioritized when markers overlap. Zoom in or find any town for its full recorded breakdown."} Named lists reached at least 1% nationally in that election. Other lists are combined; their individual results are not in this map file. Lists that run on under the same party in 2026 take that list&apos;s color; other colors identify historical lists, not today&apos;s political blocs. Hatched localities have no result in the file; plain land lies outside any voting locality.</p>
      {selected !== null && places[selected] && <LocalityHistory code={selected} name={places[selected][0]} election={electionId} list={list.name} mode={mode} />}
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
      <p className="fig-src vm-src">
        Source: Central Elections Committee, <a href={election.source.results}>national results</a> and{" "}
        <a href={election.source.csv}>results by locality</a> ({election.label}).
      </p>
    </div>
  );
}
