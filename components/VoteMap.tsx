"use client";

import { geographyToElection } from "@/lib/geography-view";
import { currentElection } from "@/lib/political-record/elections";
import type { GeographySnapshot } from "@/lib/election-lifecycle/types";
import { useEffect, useMemo, useRef, useState } from "react";
import "./votemap.css";
import { editionPath } from "@/lib/i18n";
import { useLang } from "@/lib/i18n/lang";
import { mapText, mapMessage, mapDate } from "@/lib/i18n/vote-map";
import { locale, type Lang } from "@/lib/i18n";
import LocalityHistory from "./LocalityHistory";
import { readMapState, mapHref } from "@/lib/locality-history";
import {
  BINS,
  binOf,
  decodeArcs,
  pathOf,
  project,
  ringsOf,
  type Places,
  type Topology,
  type VoteMapElection,
} from "@/lib/votemap";
import {
  localLeader,
  listColor,
  voteMix,
  voteMarkers,
  visibleVoteMarkers,
  markerRadius,
  wedgePath,
  rampDeep,
  OTHER_COLOR,
  type MapMode,
  type VoteSlice,
} from "@/lib/votemap-visual";

/*
 * The vote map: one list's share of the valid vote in each locality, for one election.
 * Three user-approved views: one-list share, proportional vote-mix markers and local plurality.
 * Special-envelope votes have no locality and get their own national bar (ruling 100).
 * The West Bank is outlined from OCHA's boundary file; settlements are drawn like any
 * other locality, with a note on who votes (ruling 99).
 */

export const ELECTIONS = [
  { id: "2022", label: "Nov 2022", date: "2022-11-01" },
  { id: "2021", label: "Mar 2021", date: "2021-03-23" },
  { id: "2020", label: "Mar 2020", date: "2020-03-02" },
  { id: "2019b", label: "Sep 2019", date: "2019-09-17" },
  { id: "2019a", label: "Apr 2019", date: "2019-04-09" },
] as const;
/** The gated layer for the current election: its map id is the registry id; ?election=2026 is an alias (readMapState). */
const GEO_ID = currentElection().id;
const monthYearLabel = (iso: string, lang: Lang) =>
  new Intl.DateTimeFormat(locale(lang), { month: "short", year: "numeric", timeZone: "Asia/Jerusalem" }).format(new Date(`${iso}T12:00:00Z`));

type Shape = { code: number; d: string; box: [number, number, number, number] };
type Context = { westBank: number[][][]; gaza: number[][][] };
type View = { x: number; y: number; w: number; h: number };

const pct = (x: number, dp = 1) => `${(x * 100).toFixed(dp)}%`;
const num = (n: number) => n.toLocaleString("en-US");

export function leaderText(mix: VoteSlice[] | null, lang: Lang = "en") {
  const t = mapText(lang),
    l = localLeader(mix);
  return l.status === "named"
    ? mapMessage(t.lead, l.names[0], pct(l.share!))
    : l.status === "tie"
      ? mapMessage(t.leadTie, l.names.join(" / "), pct(l.share!))
      : l.status === "unresolved"
        ? t.unresolved
        : t.noValid;
}
function MixBar({
  mix,
  label,
  lang,
}: {
  mix: VoteSlice[] | null;
  label: string;
  lang: Lang;
}) {
  const t = mapText(lang),
    name = (s: VoteSlice) => (s.other ? t.other : s.name);
  return (
    <div>
      <p className="vm-k">{label}</p>
      {mix ? (
        <div
          className="vm-mixbar"
          role="img"
          aria-label={mix.map((s) => `${name(s)}: ${pct(s.share)}`).join(", ")}
        >
          {mix
            .filter((s) => s.votes > 0)
            .map((s) => (
              <span
                key={s.name}
                style={{ width: `${s.share * 100}%`, background: s.color }}
                title={`${name(s)}: ${pct(s.share)}`}
              />
            ))}
        </div>
      ) : (
        <p>{t.notAvailable}</p>
      )}
    </div>
  );
}

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
      [x0, y0, x1, y1] = [
        Math.min(x0, x),
        Math.min(y0, y),
        Math.max(x1, x),
        Math.max(y1, y),
      ];
    }
  return [x0, y0, x1, y1];
}

export default function VoteMap() {
  const lang = useLang(),
    t = mapText(lang),
    m = mapMessage,
    MODE_LABELS = { single: t.single, mix: t.mix, leader: t.leader };
  const href = (path: string) => editionPath(path, lang) ?? path;
  const BIN_LABELS = [
    `< 2%`,
    ...BINS.map((b, i) =>
      i < BINS.length - 1
        ? `${b * 100}–${BINS[i + 1] * 100}%`
        : `≥ ${b * 100}%`,
    ),
  ];
  const [geography, setGeography] = useState<{
    revision: string;
    election: VoteMapElection;
  } | null>(null);
  const [geographyFailed, setGeographyFailed] = useState(false);
  const [geographyChecked, setGeographyChecked] = useState(false);
  const [shapes, setShapes] = useState<Shape[] | null>(null);
  const [context, setContext] = useState<{ wb: string; gaza: string } | null>(
    null,
  );
  const [places, setPlaces] = useState<Places | null>(null);
  const [cache, setCache] = useState<Record<string, VoteMapElection>>({});
  const [electionId, setElectionId] = useState<string>("2022");
  const [listName, setListName] = useState<string>("Likud");
  const [mode, setMode] = useState<MapMode>("single");
  const [mapSize, setMapSize] = useState({ w: 600, h: 700 });
  const [selected, setSelected] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [view, setView] = useState<View | null>(null);
  const [query, setQuery] = useState("");
  const [home, setHome] = useState<View | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    view: View;
    moved: boolean;
  } | null>(null);
  const moved = useRef(false);
  // Touch: one finger scrolls the page (touch-action: pan-y); two move and zoom the map from where they started.
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{
    view: View;
    mid: [number, number];
    dist: number;
    wpp: number;
    cx: number;
    cy: number;
  } | null>(null);
  // The scroll wheel zooms only with Ctrl or Cmd held, or once the map has been clicked, so it never traps the page's scroll.
  const active = useRef(false);

  useEffect(() => {
    let disposed = false;
    let controller: AbortController | null = null,
      timer: ReturnType<typeof setTimeout> | undefined;
    const pin = new URLSearchParams(window.location.search).get("geography");
    const load = async () => {
      if (disposed || document.visibilityState === "hidden") return;
      controller?.abort();
      const request = new AbortController();
      controller = request;
      const timeout = setTimeout(() => request.abort(), 10000);
      try {
        const response = await fetch(
          `/api/election-lifecycle/geography${pin ? `?revision=${encodeURIComponent(pin)}` : ""}`,
          { signal: request.signal, cache: "no-store" },
        );
        if (!response.ok) throw new Error("unavailable");
        const body = await response.json();
        const snapshot = body.snapshot as GeographySnapshot;
        if (!snapshot?.officialSeatRevision) throw new Error("unreconciled");
        const seats = await fetch(
          `/api/election-lifecycle?view=seats&revision=${snapshot.officialSeatRevision}`,
          { signal: request.signal },
        );
        if (!seats.ok) throw new Error("seats unavailable");
        const selected = await seats.json();
        const election = geographyToElection(snapshot, selected.seatContext);
        if (!election) throw new Error("unreconciled");
        if (!disposed && !request.signal.aborted) {
          setGeographyFailed(false);
          setGeography({ revision: snapshot.revision, election });
          setCache((c) => ({ ...c, [GEO_ID]: election }));
          if (!new URLSearchParams(window.location.search).has("election"))
            setElectionId(GEO_ID);
          setGeographyChecked(true);
        }
      } catch {
        if (!disposed) {
          setGeographyChecked(true);
          setGeographyFailed(true);
        }
      } finally {
        clearTimeout(timeout);
        if (!disposed && !pin) timer = setTimeout(load, 60000);
      }
    };
    const visible = () => {
      clearTimeout(timer);
      if (document.visibilityState === "visible") void load();
      else controller?.abort();
    };
    void load();
    document.addEventListener("visibilitychange", visible);
    return () => {
      disposed = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  useEffect(() => {
    const restore = () => {
      const state = readMapState(new URLSearchParams(window.location.search));
      setElectionId(state.election);
      setListName(state.list);
      setMode(state.mode);
      setSelected(state.locality);
      setQuery("");
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  function save(
    id: string,
    name: string,
    code: number | null,
    nextMode = mode,
  ) {
    let path = href(mapHref(id, name, code, nextMode));
    if (
      id === GEO_ID &&
      geography &&
      new URLSearchParams(window.location.search).has("geography")
    )
      path += `&geography=${geography.revision}`;
    if (`${location.pathname}${location.search}` !== path)
      history.pushState(history.state, "", path);
    setCopied(false);
  }

  useEffect(() => {
    Promise.all([
      getJson<Topology>("/vote-map/boundaries.topo.json"),
      getJson<Context>("/vote-map/context.json"),
      getJson<Places>("/vote-map/places.json"),
    ])
      .then(([topo, ctx, pl]) => {
        const arcs = decodeArcs(topo);
        const out: Shape[] = topo.objects.merged.geometries.map((g) => {
          const rings = ringsOf(g, arcs);
          return {
            code: g.properties.code,
            d: pathOf(rings),
            box: boxOf(rings),
          };
        });
        const ring = (r: number[][][]) => pathOf(r as [number, number][][]);
        setShapes(out);
        setContext({ wb: ring(ctx.westBank), gaza: ring(ctx.gaza) });
        setPlaces(pl);
        const all = out.map((s) => s.box);
        const [x0, y0] = [
          Math.min(...all.map((b) => b[0])),
          Math.min(...all.map((b) => b[1])),
        ];
        const [x1, y1] = [
          Math.max(...all.map((b) => b[2])),
          Math.max(...all.map((b) => b[3])),
        ];
        const pad = 0.04;
        const h = {
          x: x0 - pad,
          y: y0 - pad,
          w: x1 - x0 + 2 * pad,
          h: y1 - y0 + 2 * pad,
        };
        setHome(h);
        setView(h);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    if (cache[electionId] || electionId === GEO_ID) return;
    getJson<VoteMapElection>(`/vote-map/${electionId}.json`)
      .then((e) => setCache((c) => ({ ...c, [electionId]: e })))
      .catch(() => setError(true));
  }, [electionId, cache]);

  const election = cache[electionId];
  const asked = election
    ? election.lists.findIndex((l) => l.name === listName)
    : 0;
  const listIdx =
    election && asked < 0
      ? Math.max(
          0,
          election.lists.findIndex((l) => l.name === "Likud"),
        )
      : Math.max(0, asked);
  const list = election?.lists[listIdx];
  const markerData = useMemo(
    () =>
      election && places
        ? voteMarkers(election, places)
        : { markers: [], missingCoordinates: 0 },
    [election, places],
  );
  const loaded = !!(shapes && context && places && view && election && list);
  useEffect(() => {
    const el = svg.current;
    if (!loaded || !el) return;
    const measure = () =>
      setMapSize({ w: el.clientWidth || 600, h: el.clientHeight || 700 });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [loaded]);
  const rows = useMemo(
    () => new Map((election?.rows ?? []).map((r) => [r[0], r])),
    [election],
  );
  // A few localities are several shapes; their boxes merge.
  const shapeByCode = useMemo(() => {
    const m = new Map<number, Shape>();
    for (const s of shapes ?? []) {
      const p = m.get(s.code);
      m.set(
        s.code,
        p
          ? {
              ...p,
              box: [
                Math.min(p.box[0], s.box[0]),
                Math.min(p.box[1], s.box[1]),
                Math.max(p.box[2], s.box[2]),
                Math.max(p.box[3], s.box[3]),
              ],
            }
          : s,
      );
    }
    return m;
  }, [shapes]);
  const dots = useMemo(
    () =>
      places && shapes
        ? Object.entries(places)
            .filter(([c, p]) => !shapeByCode.has(+c) && p[1])
            .map(([c, p]) => ({ code: +c, xy: project([p[2], p[1]]) }))
        : [],
    [places, shapes, shapeByCode],
  );

  const shareOf = (code: number) => {
    const r = rows.get(code);
    if (!r || !r[3]) return null;
    return r[4 + listIdx] / r[3];
  };
  const fillOf = (code: number) => {
    if (mode === "mix")
      return rows.get(code)?.[3]
        ? "var(--vm-base)"
        : places?.[code]
          ? "url(#vm-none)"
          : "var(--vm-land)";
    if (mode === "leader" && election) {
      const l = localLeader(voteMix(election, rows.get(code)));
      return l.status === "named"
        ? l.color
        : l.status === "tie"
          ? "url(#vm-tie)"
          : l.status === "unresolved"
            ? "url(#vm-unresolved)"
            : places?.[code]
              ? "url(#vm-none)"
              : "var(--vm-land)";
    }
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
  const clampW = (w: number) =>
    home ? Math.min(home.w, Math.max(home.w / 60, w)) : w;
  const zoom = (k: number, at?: readonly [number, number]) =>
    setView((v) => {
      if (!v || !home) return v;
      const w = clampW(v.w * k);
      const h = (w / v.w) * v.h;
      const [cx, cy] = at ?? [v.x + v.w / 2, v.y + v.h / 2];
      return {
        x: cx - ((cx - v.x) * w) / v.w,
        y: cy - ((cy - v.y) * h) / v.h,
        w,
        h,
      };
    });
  const focus = (code: number, persist = true) => {
    setSelected(code);
    if (places?.[code]) setQuery(places[code][0]);
    if (persist) save(electionId, list?.name ?? listName, code);
    const s = shapeByCode.get(code);
    const p = places?.[code];
    if (!home) return;
    const [cx, cy] = s
      ? [(s.box[0] + s.box[2]) / 2, (s.box[1] + s.box[3]) / 2]
      : p && p[1]
        ? project([p[2], p[1]])
        : [NaN, NaN];
    if (Number.isNaN(cx)) return;
    const w = Math.max(home.w / 14, s ? (s.box[2] - s.box[0]) * 4 : 0);
    const h = (w / home.w) * home.h;
    setView({ x: cx - w / 2, y: cy - h / 2, w, h });
  };

  useEffect(() => {
    if (selected !== null && places && home) {
      if (!places[selected]) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- validate restored locality once source data arrives
        setSelected(null);
        return;
      }
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
      zoom(
        e.deltaY > 0 ? 1.25 : 0.8,
        toView(e.clientX, e.clientY) ?? undefined,
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  if (error) return <p className="vm-msg">{t.error}</p>;
  if (electionId === GEO_ID && !geography && geographyChecked)
    return (
      <div className="vm-msg">
        <p>{t.unavailable}</p>
        <a href={href("/vote-map?election=2022")}>{t.historical}</a>
      </div>
    );
  if (!shapes || !context || !places || !view || !election || !list)
    return <p className="vm-msg">{t.loading}</p>;

  const info = hover ?? selected;
  const infoRow = info !== null ? rows.get(info) : undefined;
  const scale = view.w / (home?.w ?? view.w);
  const unit = Math.max(view.w / mapSize.w, view.h / mapSize.h);
  const maxValid = Math.max(...election.rows.map((r) => r[3]));
  const markers = visibleVoteMarkers(
    markerData.markers,
    view,
    unit,
    maxValid,
    selected,
  );
  const infoMix = voteMix(election, infoRow);
  const localityMix = voteMix(election, [
    0,
    0,
    0,
    election.national.valid - election.envelopes.valid,
    ...election.lists.map((l, i) => l.votes - election.envelopes.votes[i]),
  ]);
  const envelopeMix = voteMix(election, [
    0,
    0,
    0,
    election.envelopes.valid,
    ...election.envelopes.votes,
  ]);
  const nat = election.national;
  const localValid = nat.valid - election.envelopes.valid;
  const localVotes = list.votes - election.envelopes.votes[listIdx];
  const top = election.rows
    .filter((r) => r[3] >= 1000)
    .map((r) => ({
      code: r[0],
      share: r[4 + listIdx] / r[3],
      votes: r[4 + listIdx],
      valid: r[3],
    }))
    .sort((a, b) => b.share - a.share)
    .slice(0, 25);
  const names = Object.entries(places)
    .filter(([, p]) => p[0])
    .map(([c, p]) => ({ code: +c, name: p[0] }));
  const pick = (v: string) => {
    setQuery(v);
    const hit = names.find(
      (n) => n.name.toLowerCase() === v.trim().toLowerCase(),
    );
    if (hit) focus(hit.code);
  };

  return (
    <div
      className="vm"
      style={
        mode === "single"
          ? {
              ["--vm-hue" as string]: listColor(list.name),
              ["--vm-deep" as string]: `${rampDeep(listColor(list.name))}%`,
            }
          : undefined
      }
    >
      {geography && geographyFailed && (
        <p className="fig-note" role="status">
          {t.refreshFailed}
        </p>
      )}
      <p className="fig-note">
        {geography
          ? `${t.verified} ${m(t.snapshot, geography.revision.slice(0, 12))}`
          : geographyChecked
            ? t.waiting
            : t.checking}
      </p>
      <p className="fig-note">{t.originalNames}</p>
      <div className="vm-controls">
        <label>
          <span>{t.view}</span>
          <select
            aria-label={t.view}
            value={mode}
            onChange={(e) => {
              const next = e.target.value as MapMode;
              setMode(next);
              save(electionId, list.name, selected, next);
            }}
          >
            {Object.entries(MODE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t.election}</span>
          <select
            aria-label={t.election}
            value={electionId}
            onChange={(e) => {
              const id = e.target.value;
              setElectionId(id);
              save(id, listName, selected);
            }}
          >
            {(geography
              ? [{ id: GEO_ID, label: geography.election.label, date: geography.election.date }, ...ELECTIONS]
              : ELECTIONS
            ).map((e) => (
              <option key={e.id} value={e.id}>
                {mapDate(e.date, lang)}
              </option>
            ))}
            {!geography && (
              <option disabled value="">
                {monthYearLabel(currentElection().electionDay, lang)} ({t.pendingOfficial})
              </option>
            )}
          </select>
        </label>
        <label>
          <span>{mode === "single" ? t.list : t.secondary}</span>
          <select
            aria-label={mode === "single" ? t.list : t.secondary}
            value={list.name}
            onChange={(e) => {
              setListName(e.target.value);
              save(electionId, e.target.value, selected);
            }}
          >
            {election.lists.map((l) => (
              <option key={l.letters} value={l.name}>
                {l.name} ({pct(l.votes / nat.valid)})
              </option>
            ))}
          </select>
        </label>
        <label className="vm-find">
          <span>{t.find}</span>
          <input
            list="vm-places"
            value={query}
            placeholder="Haifa"
            lang="en"
            dir="ltr"
            aria-label={t.find}
            onChange={(e) => pick(e.target.value)}
          />
          <datalist id="vm-places">
            {names.map((n) => (
              <option key={n.code} value={n.name} />
            ))}
          </datalist>
        </label>
      </div>

      <p className="vm-fallback" role="status">
        {asked < 0 ? m(t.fallback, listName, list.name) : ""}
      </p>
      <p className="vm-share">
        <button
          type="button"
          className="btn"
          onClick={async () => {
            const path =
              href(mapHref(electionId, list.name, selected, mode)) +
              (electionId === GEO_ID && geography
                ? `&geography=${geography.revision}`
                : "");
            try {
              await navigator.clipboard.writeText(
                `https://www.israelvotes.org${path}`,
              );
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {t.copy}
        </button>
        <span role="status">{copied ? t.copied : ""}</span>
      </p>
      <div className="vm-body">
        <div className="vm-mapwrap">
          <svg
            ref={svg}
            className="vm-map"
            style={{ direction: "ltr" }}
            viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
            role="group"
            aria-label={`${t.title}: ${MODE_LABELS[mode]}, ${mode === "single" ? list.name + ", " : ""}${mapDate(election.date, lang)}. ${t.choose}`}
            onPointerDown={(e) => {
              moved.current = false;
              if (e.pointerType === "touch") {
                touches.current.set(e.pointerId, {
                  x: e.clientX,
                  y: e.clientY,
                });
                const pts = [...touches.current.values()],
                  m = svg.current?.getScreenCTM(),
                  r = svg.current?.getBoundingClientRect();
                if (pts.length === 2 && m && r) {
                  pinch.current = {
                    view,
                    mid: [(pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2],
                    dist:
                      Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1,
                    wpp: 1 / m.a,
                    cx: r.left + r.width / 2,
                    cy: r.top + r.height / 2,
                  };
                  for (const id of touches.current.keys())
                    svg.current!.setPointerCapture(id);
                }
                return;
              }
              active.current = true;
              drag.current = { x: e.clientX, y: e.clientY, view, moved: false };
            }}
            onPointerMove={(e) => {
              if (e.pointerType === "touch") {
                if (!touches.current.has(e.pointerId)) return;
                touches.current.set(e.pointerId, {
                  x: e.clientX,
                  y: e.clientY,
                });
                const p = pinch.current,
                  pts = [...touches.current.values()];
                if (!p || pts.length < 2) return;
                moved.current = true;
                const mid = [
                    (pts[0].x + pts[1].x) / 2,
                    (pts[0].y + pts[1].y) / 2,
                  ],
                  dist =
                    Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
                const w = clampW(p.view.w * (p.dist / dist)),
                  h = (w / p.view.w) * p.view.h,
                  wpp = (p.wpp * w) / p.view.w;
                // The map point under the fingers' first midpoint stays under their midpoint now.
                const at = [
                  p.view.x + p.view.w / 2 + (p.mid[0] - p.cx) * p.wpp,
                  p.view.y + p.view.h / 2 + (p.mid[1] - p.cy) * p.wpp,
                ];
                setView({
                  x: at[0] - (mid[0] - p.cx) * wpp - w / 2,
                  y: at[1] - (mid[1] - p.cy) * wpp - h / 2,
                  w,
                  h,
                });
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
              setView({
                ...d.view,
                x: d.view.x - dx * k,
                y: d.view.y - dy * k,
              });
            }}
            onPointerUp={(e) => {
              if (e.pointerType === "touch") {
                touches.current.delete(e.pointerId);
                if (touches.current.size < 2) pinch.current = null;
                return;
              }
              moved.current = !!drag.current?.moved;
              drag.current = null;
            }}
            onPointerCancel={(e) => {
              touches.current.delete(e.pointerId);
              pinch.current = null;
              drag.current = null;
            }}
            onLostPointerCapture={(e) => {
              if (e.pointerType === "touch") {
                touches.current.delete(e.pointerId);
                if (touches.current.size < 2) pinch.current = null;
              } else drag.current = null;
            }}
            onPointerLeave={(e) => {
              setHover(null);
              if (e.pointerType !== "touch") active.current = false;
            }}
          >
            <defs>
              <pattern
                id="vm-none"
                width={0.01 * scale}
                height={0.01 * scale}
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect
                  width={0.01 * scale}
                  height={0.01 * scale}
                  fill="var(--sheet)"
                />
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2={0.01 * scale}
                  stroke="var(--line-2)"
                  strokeWidth={0.003 * scale}
                />
              </pattern>
              <pattern
                id="vm-tie"
                width={6 * unit}
                height={6 * unit}
                patternUnits="userSpaceOnUse"
              >
                <rect
                  width={6 * unit}
                  height={6 * unit}
                  style={{ fill: "var(--vm-tie-bg)" }}
                />
                <circle
                  cx={3 * unit}
                  cy={3 * unit}
                  r={unit}
                  style={{ fill: "var(--vm-tie-dot)" }}
                />
              </pattern>
              <pattern
                id="vm-unresolved"
                width={6 * unit}
                height={6 * unit}
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect
                  width={6 * unit}
                  height={6 * unit}
                  style={{ fill: "var(--vm-unres-bg)" }}
                />
                <line
                  y2={6 * unit}
                  style={{ stroke: "var(--vm-unres-line)" }}
                  strokeWidth={2 * unit}
                />
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
                  onClick={() =>
                    !moved.current && places[s.code] && focus(s.code)
                  }
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
            {mode === "mix" && (
              <g className="vm-pies">
                {markers.shown.map((p) => {
                  const r = markerRadius(p.valid, maxValid, unit);
                  let start = 0;
                  return (
                    <g
                      key={p.code}
                      transform={`translate(${p.x} ${p.y})`}
                      role="button"
                      tabIndex={0}
                      aria-label={m(t.marker, places[p.code][0], num(p.valid))}
                      onPointerEnter={() => setHover(p.code)}
                      onClick={() => !moved.current && focus(p.code)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          focus(p.code);
                        }
                      }}
                    >
                      <title>
                        {places[p.code][0]}: {num(p.valid)} {t.valid}
                      </title>
                      {p.mix
                        .filter((s) => s.votes > 0)
                        .map((s) => {
                          const a = start;
                          start += s.share;
                          return (
                            <path
                              key={s.name}
                              d={wedgePath(a, start, r)}
                              fill={s.color}
                            />
                          );
                        })}
                      <circle
                        r={r}
                        className={
                          p.code === selected
                            ? "pie-outline selected"
                            : "pie-outline"
                        }
                      />
                    </g>
                  );
                })}
              </g>
            )}
            <g className="vm-labels" fontSize={0.07 * scale}>
              <text
                x={project([35.43, 31.98])[0]}
                y={project([35.43, 31.98])[1]}
              >
                {t.westBank}
              </text>
              <text
                x={project([34.2, 31.42])[0]}
                y={project([34.2, 31.42])[1]}
                textAnchor="end"
              >
                {t.gaza}
              </text>
            </g>
          </svg>
          <div className="vm-zoom">
            <button
              type="button"
              onClick={() => zoom(0.6)}
              aria-label={t.zoomIn}
            >
              +
            </button>
            <button
              type="button"
              onClick={() => zoom(1 / 0.6)}
              aria-label={t.zoomOut}
            >
              −
            </button>
            <button type="button" onClick={() => home && setView(home)}>
              {t.reset}
            </button>
          </div>
          <p className="fig-note vm-hint">{t.hint}</p>
          {mode === "mix" && (
            <p className="vm-marker-count" aria-live="polite">
              {m(
                t.markers,
                markers.shown.length,
                markers.available,
                markerData.missingCoordinates,
              )}
            </p>
          )}
        </div>

        <aside className="vm-side">
          <p className="vm-k">
            {mode === "single" ? list.name : MODE_LABELS[mode]},{" "}
            {mapDate(election.date, lang)}
          </p>
          <ul
            className={`fig-key vm-legend${mode !== "single" ? " vm-category-legend" : ""}`}
            aria-label={mode === "single" ? t.share : t.colors}
          >
            {mode === "single"
              ? BIN_LABELS.map((l, i) => (
                  <li key={l}>
                    <span style={{ background: `var(--vm-${i})` }} />
                    {l}
                  </li>
                ))
              : election.lists.map((l) => (
                  <li key={l.letters}>
                    <span style={{ background: listColor(l.name) }} />
                    {l.name}
                  </li>
                ))}
            {mode === "mix" && (
              <li>
                <span style={{ background: OTHER_COLOR }} />
                {t.other}
              </li>
            )}
            {mode === "leader" && (
              <>
                <li>
                  <span className="vm-sw-tie" />
                  {t.tie}
                </li>
                <li>
                  <span className="vm-sw-unknown" />
                  {t.unresolved}
                </li>
              </>
            )}
            <li>
              <span className="vm-sw-none" />
              {t.noResult}
            </li>
            <li>
              <span className="vm-sw-land" />
              {t.land}
            </li>
          </ul>
          {mode === "mix" && (
            <div className="fig-key vm-size-key">
              <svg
                width="110"
                height="60"
                role="img"
                aria-label={m(
                  t.size,
                  num(Math.round(maxValid / 4)),
                  num(maxValid),
                )}
              >
                <circle cx="17" cy="31" r="13" />
                <circle cx="72" cy="31" r="26" />
              </svg>
              <p>{m(t.size, num(Math.round(maxValid / 4)), num(maxValid))}</p>
            </div>
          )}

          <div className="vm-info" aria-live="polite">
            {info !== null && places[info] ? (
              <>
                <p className="vm-place">
                  {places[info][0] || `${t.locality} ${info}`}
                </p>
                {infoRow && infoRow[3] ? (
                  <>
                    <p className="vm-big">
                      {mode === "single"
                        ? pct(infoRow[4 + listIdx] / infoRow[3])
                        : num(infoRow[3])}
                    </p>
                    <p className="vm-sub">
                      {mode === "single"
                        ? m(
                            t.validOf,
                            list.name,
                            num(infoRow[4 + listIdx]),
                            num(infoRow[3]),
                          )
                        : `${t.valid}. ${leaderText(infoMix, lang)}.`}{" "}
                      {t.turnout}:{" "}
                      {infoRow[1]
                        ? pct(infoRow[2] / infoRow[1])
                        : t.notAvailable}
                      .
                    </p>
                    <p className="vm-k">{t.townVotes}</p>
                    <ol className="vm-tops">
                      {[...(infoMix ?? [])]
                        .sort((a, b) => b.votes - a.votes)
                        .map((x) => (
                          <li key={x.name}>
                            <span>
                              <i style={{ background: x.color }} />
                              <bdi lang={x.other ? lang : "en"}>
                                {x.other ? t.other : x.name}
                              </bdi>
                            </span>
                            <span>
                              {num(x.votes)}, {pct(x.share)}
                            </span>
                          </li>
                        ))}
                    </ol>
                  </>
                ) : (
                  <p className="vm-sub">{infoRow ? t.noValid : t.missing}</p>
                )}
              </>
            ) : (
              <p className="vm-sub">{t.choose}</p>
            )}
          </div>

          <div className="vm-nat">
            <p className="vm-k">{t.national}</p>
            {mode !== "single" ? (
              <>
                <MixBar
                  lang={lang}
                  mix={localityMix}
                  label={`${t.localVotes} (${num(localValid)})`}
                />
                <MixBar
                  lang={lang}
                  mix={envelopeMix}
                  label={`${t.envelopes} (${num(election.envelopes.valid)})`}
                />
                <p className="vm-sub">
                  {m(t.envelopeNote, pct(election.envelopes.valid / nat.valid))}
                </p>
              </>
            ) : (
              <>
                <div className="vm-bar">
                  <span className="vm-bl">
                    {t.localVotes} ({num(localValid)})
                  </span>
                  <span className="vm-bt">
                    <span style={{ width: pct(localVotes / localValid) }} />
                  </span>
                  <span className="vm-bv">{pct(localVotes / localValid)}</span>
                </div>
                <div className="vm-bar">
                  <span className="vm-bl">
                    {t.envelopes} ({num(election.envelopes.valid)})
                  </span>
                  <span className="vm-bt">
                    <span
                      style={{
                        width: pct(
                          election.envelopes.votes[listIdx] /
                            election.envelopes.valid,
                        ),
                      }}
                    />
                  </span>
                  <span className="vm-bv">
                    {pct(
                      election.envelopes.votes[listIdx] /
                        election.envelopes.valid,
                    )}
                  </span>
                </div>
                <p className="vm-sub">
                  {m(t.envelopeNote, pct(election.envelopes.valid / nat.valid))}{" "}
                  {m(
                    t.total,
                    list.name,
                    pct(list.votes / nat.valid, 2),
                    list.seats,
                  )}
                </p>
              </>
            )}
          </div>
        </aside>
      </div>

      {electionId === GEO_ID && (
        <details>
          <summary>{t.allRows}</summary>
          <div
            className="vm-tw"
            role="region"
            tabIndex={0}
            aria-label={t.allRows}
          >
            <table>
              <thead>
                <tr>
                  <th>{t.locality}</th>
                  <th>{t.eligible}</th>
                  <th>{t.voted}</th>
                  <th>{t.valid}</th>
                  <th>{list.name}</th>
                </tr>
              </thead>
              <tbody>
                {election.rows.map((r) => (
                  <tr key={r[0]}>
                    <th>{places[r[0]]?.[0] ?? `${t.locality} ${r[0]}`}</th>
                    <td>{num(r[1])}</td>
                    <td>{num(r[2])}</td>
                    <td>{num(r[3])}</td>
                    <td>{num(r[4 + listIdx])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      <p className="fig-note vm-mode-note vm-method">
        {mode === "single"
          ? t.modeSingle
          : mode === "leader"
            ? t.modeLeader
            : t.modeMix}
      </p>
      {selected !== null && places[selected] && (
        <LocalityHistory
          lang={lang}
          code={selected}
          name={places[selected][0]}
          election={electionId}
          list={list.name}
          mode={mode}
          current={geography?.election}
          geographyRevision={geography?.revision}
        />
      )}
      <details className="vm-table">
        <summary>{t.top}</summary>
        <div className="vm-tw" role="region" tabIndex={0} aria-label={t.top}>
          <table>
            <thead>
              <tr>
                <th scope="col">{t.locality}</th>
                <th scope="col">{t.share}</th>
                <th scope="col">{t.votes}</th>
                <th scope="col">{t.valid}</th>
              </tr>
            </thead>
            <tbody>
              {top.map((r) => (
                <tr key={r.code}>
                  <th scope="row">
                    <button type="button" onClick={() => focus(r.code)}>
                      {places[r.code]?.[0] || r.code}
                    </button>
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
        {t.source}: <a href={election.source.results}>{t.nationalSource}</a>.{" "}
        <a href={election.source.csv}>{t.localSource}</a> (
        {mapDate(election.date, lang)}).
      </p>
    </div>
  );
}
