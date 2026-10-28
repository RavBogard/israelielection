"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./interactives.css";
import "./map.css";
import { useSeatContext } from "./seat-context/SeatContextProvider";
import SeatBasis from "./seat-context/SeatBasis";
import ListStatusChip from "./list-status/ListStatusChip";
import { useListShares } from "./list-status/ListSharesProvider";
import { POST_COUNT } from "@/lib/i18n/post-count";
import { shareOf } from "@/lib/list-status";
import { lettersOf } from "@/lib/letters";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import { unmappedLists } from "@/lib/seat-context";
import {
  partyColor,
  partyInk,
  blocColorStrip,
  PARTY_COLOR_FAMILIES,
} from "@/lib/party-colors";
import {
  readPartyMapSelection,
  partyMapSelectionHref,
} from "@/lib/party-map-state";
import PageHead from "./PageHead";
import ProfileDetail from "./ProfileDetail";
import PartyPreview from "./coalition/PartyPreview";
import { averagePoll, blocs, mainPolls, parties } from "@/lib/data";
import { useLang } from "@/lib/i18n/lang";
import { editionPath, isRtl, type Lang } from "@/lib/i18n";
import { partyText, blocText } from "@/lib/i18n/overlay-text";
import { partyDirectoryText } from "@/lib/i18n/party-directory";
import { average, BLOC_ORDER, seatFigure } from "@/lib/polls";
import { squarify } from "@/lib/treemap";
import type { BlocId, Party } from "@/lib/types";

const averaged = parties
  .map((p) => ({ p, a: average(p.id, mainPolls) }))
  .filter((x): x is { p: Party; a: NonNullable<typeof x.a> } => x.a !== null);
/** Seats on the map: the average scaled to 120 (see averageAsPoll), as in the Coalition Builder. */
const seatsOf = (id: string) => averagePoll.results[id]?.seats ?? 0;
const avgOf = new Map(averaged.map(({ p }) => [p.id, seatsOf(p.id)]));

const GAP = 6,
  LBL = 22,
  LINE = 16;
/** Shorter names, longest first, for a bloc whose block is too narrow for its full label. */
const BLOC_SHORT: Record<BlocId, string[]> = {
  net: ["Netanyahu"],
  opp: ["Anti-Netanyahu bloc", "Anti-Netanyahu"],
  mid: ["Between"],
  arab: ["Joint List, Ra'am"],
};
/** Text width in px, measured on a canvas in the page's own face; a rough 7.4px a character before the font is known. */
let ctx2d: CanvasRenderingContext2D | null = null;
function measure(t: string, px: number, family: string) {
  if (!ctx2d && typeof document !== "undefined")
    ctx2d = document.createElement("canvas").getContext("2d");
  if (!ctx2d || !family) return t.length * px * 0.57;
  ctx2d.font = `600 ${px}px ${family}`;
  return ctx2d.measureText(t).width;
}
/** Lines a phrase takes when wrapped at `room`, or Infinity if one word alone is too wide. */
function lines(t: string, room: number, px: number, family: string) {
  let n = 1,
    cur = "";
  for (const w of t.split(" ")) {
    if (measure(w, px, family) > room) return Infinity;
    const next = cur ? `${cur} ${w}` : w;
    if (measure(next, px, family) > room) {
      n++;
      cur = w;
    } else cur = next;
  }
  return n;
}
/**
 * Every bloc keeps a name: the longest that fits beside its total on one line; failing that, a name over the total on two
 * or three lines when the block is tall enough to spare them; failing that, the shortest name, cut with an ellipsis.
 */
function blocName(
  id: BlocId,
  label: string,
  total: string,
  room: number,
  height: number,
  family: string,
  lang: Lang,
) {
  const names = [label, ...(lang === "en" ? BLOC_SHORT[id] : [])];
  const one = names.find((t) => measure(`${t} ${total}`, 13, family) <= room);
  if (one) return { name: one, extra: 0 };
  for (const t of names) {
    const n = lines(t, room, 13, family);
    if (n <= 2 && height - LBL - n * LINE >= 90) return { name: t, extra: n };
  }
  return { name: names.at(-1)!, extra: 0 };
}

function useSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0, family: "" });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      setSize({
        w: el.clientWidth,
        h: el.clientHeight,
        family: getComputedStyle(el).fontFamily,
      }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/** The method notes, folded under the map: bloc totals, how the average is made, what is left off, the colour key. */
function About({
  lang,
  totals,
}: {
  lang: Lang;
  totals: Record<BlocId, number>;
}) {
  const t = partyDirectoryText(lang);
  return (
    <details className="pm-about">
      <summary>{t.about}</summary>
      <table className="btable">
        <tbody>
          {BLOC_ORDER.map((id) => {
            const b = blocs.find((b) => b.id === id)!;
            return (
              <tr key={id}>
                <th scope="row">
                  <span
                    className="sw"
                    style={{
                      background: blocColorStrip(id),
                      marginInlineEnd: 8,
                    }}
                  />
                  {blocText(b, lang).text}
                </th>
                <td>{seatFigure(totals[id])}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p>{t.method}</p>
      <p>{t.profileNote}</p>
      <p>{t.colorsNote}</p>
      <details className="party-color-key">
        <summary>{t.colors}</summary>
        <ul>
          {PARTY_COLOR_FAMILIES.map((family, i) => (
            <li key={i}>
              {lang === "en" && <b>{family.label}</b>}
              <div>
                {family.ids.map((id) => {
                  const p = parties.find((p) => p.id === id);
                  return p ? (
                    <span key={id}>
                      <span
                        className="sw"
                        style={{ background: partyColor(id) }}
                      />
                      {partyText(p, "name", lang).text}
                    </span>
                  ) : null;
                })}
              </div>
            </li>
          ))}
        </ul>
      </details>
    </details>
  );
}

export default function PartyMap() {
  const lang = useLang(),
    t = partyDirectoryText(lang),
    rtl = isRtl(lang),
    L = LIFECYCLE[lang];
  const named = (p: Party, field = "name") => partyText(p, field, lang);
  const { context, refreshFailed } = useSeatContext();
  const shares = useListShares();
  const PC = POST_COUNT[lang];
  const official = context?.seatStatus === "official";
  const seatsOf = (id: string) =>
    context
      ? (context.pointSeats[id] ?? 0)
      : (averagePoll.results[id]?.seats ?? 0);
  const averaged = parties
    .map((p) => ({ p, a: average(p.id, mainPolls) }))
    .filter((x) => (context ? seatsOf(x.p.id) > 0 : x.a !== null));
  const blocSum = (b: BlocId) =>
    averaged
      .filter(({ p }) => p.bloc === b)
      .reduce((n, { p }) => n + seatsOf(p.id), 0);
  const offMap = parties.filter((p) => seatsOf(p.id) === 0);
  const [current, setCurrent] = useState<string | null>(null);
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(
    null,
  );
  const mapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const { w: W, h: H, family } = useSize(mapRef);

  useEffect(() => {
    const restore = () =>
      setCurrent(
        readPartyMapSelection(
          new URLSearchParams(window.location.search),
          window.location.hash,
          parties.map((p) => p.id),
        ),
      );
    restore();
    window.addEventListener("popstate", restore);
    window.addEventListener("hashchange", restore);
    return () => {
      window.removeEventListener("popstate", restore);
      window.removeEventListener("hashchange", restore);
    };
  }, []);

  const select = (id: string) => {
    const next = current === id ? null : id;
    setCurrent(next);
    history.pushState(
      history.state,
      "",
      editionPath(
        partyMapSelectionHref(
          new URLSearchParams(window.location.search),
          window.location.hash,
          next,
          parties.map((p) => p.id),
        ),
        lang,
      )!,
    );
  };

  /** Closing the profile hands focus back to the cell or chip that opened it. */
  const close = () => {
    const id = current;
    if (!id) return;
    select(id);
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>(`.pm [data-party="${id}"]`)?.focus(),
    );
  };

  useLayoutEffect(() => {
    panelRef.current?.scrollTo?.(0, 0);
    if (current && window.innerWidth <= 1100) {
      const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() =>
        panelRef.current?.scrollIntoView({
          behavior: smooth ? "smooth" : "auto",
          block: "start",
        }),
      );
    }
  }, [current]);

  // Keep the tooltip inside the viewport.
  useLayoutEffect(() => {
    const el = tipRef.current;
    if (!el || !tip) return;
    const r = el.getBoundingClientRect();
    el.style.left = `${Math.max(8, Math.min(tip.x + 14, window.innerWidth - r.width - 8))}px`;
    el.style.top = `${tip.y + 16}px`;
  }, [tip]);

  const cells: React.ReactNode[] = [];
  const unclassified = context
    ? unmappedLists(context, parties).reduce((n, p) => n + p.seats, 0)
    : 0;
  if (W && H) {
    const knownHeight = (H * (120 - unclassified)) / 120;
    if (unclassified)
      cells.push(
        <div
          key="unclassified"
          role="note"
          title={`${L.unknown}: ${unclassified}`}
          style={{
            position: "absolute",
            left: 0,
            top: knownHeight,
            width: W,
            height: H - knownHeight,
            background: "var(--ink-3)",
          }}
        >
          <span className="sr-only">
            {L.unknown}: {unclassified}
          </span>
        </div>,
      );
    // Squarify lays out largest first; ties keep the site's bloc order.
    const blocItems = BLOC_ORDER.map((b) => ({ id: b, v: blocSum(b) })).sort(
      (a, b) => b.v - a.v,
    );
    for (const br of squarify(blocItems, 0, 0, W, knownHeight)) {
      const bx = br.x + GAP / 2,
        by = br.y + GAP / 2,
        bw = br.w - GAP,
        bh = br.h - GAP;
      const label = blocText(
        blocs.find((b) => b.id === br.id)!,
        lang,
      ).text;
      const total = seatFigure(br.v);
      const { name, extra } = blocName(
        br.id as BlocId,
        label,
        total,
        bw - 4,
        bh,
        family,
        lang,
      );
      const lbl = LBL + extra * LINE;
      cells.push(
        <div
          key={`b-${br.id}`}
          className={`blocname${extra ? " stack" : ""}`}
          style={{
            left: rtl ? W - bx - bw + 2 : bx + 2,
            top: by,
            width: bw - 4,
            height: lbl - 2,
          }}
          title={`${label} ${total}`}
        >
          {name !== label && <span className="sr-only">{label} </span>}
          <span className="bn" aria-hidden={name !== label || undefined}>
            {name}
          </span>{" "}
          <span className="bt">{total}</span>
        </div>,
      );
      const ps = averaged
        .filter(({ p }) => p.bloc === br.id)
        .map(({ p }) => ({ id: p.id, v: seatsOf(p.id) }))
        .sort((a, b) => b.v - a.v);
      for (const r of squarify(ps, bx, by + lbl, bw, bh - lbl)) {
        const p = parties.find((q) => q.id === r.id)!;
        const cw = r.w - 3,
          ch = r.h - 3;
        let cls = "cell";
        if (cw < 110 || ch < 70) cls += " tiny";
        if (cw < 80) cls += " xs";
        if (ch < 120 || cw < 130) cls += " nold";
        if (cw < 230) cls += " nosm";
        const nmPx =
          cls.includes("tiny") || cls.includes("xs")
            ? 12
            : Math.min(
                19,
                Math.max(
                  13,
                  (typeof window === "undefined" ? 1440 : window.innerWidth) *
                    0.0115,
                ),
              );
        const room = cw - (cls.includes("tiny") ? 14 : 24);
        const fitsFlat = (t: string) => measure(t, nmPx, family) <= room - 32;
        const fitsStack = (t: string) =>
          lines(t, room, nmPx, family) <= (ch >= 90 ? 3 : ch >= 70 ? 2 : 1);
        // The full name where it fits, else the short one; a short cell sets name and number on one line unless only
        // stacking them leaves room for a name at all.
        const full = named(p).text,
          short = named(p, "short").text;
        let flat = ch < 52,
          shown = full;
        if (flat && !fitsFlat(full)) {
          if (fitsFlat(short)) shown = short;
          else if (ch >= 44 && fitsStack(short)) {
            flat = false;
            shown = fitsStack(full) ? full : short;
          }
        } else if (!flat && !fitsStack(full) && fitsStack(short)) shown = short;
        if (flat) cls += " flat";
        cells.push(
          <button
            key={p.id}
            type="button"
            className={cls}
            aria-pressed={current === p.id}
            data-party={p.id}
            aria-label={`${full}, ${seatFigure(r.v)} ${t.seats}`}
            onClick={() => select(p.id)}
            onPointerMove={(e) => {
              if (e.pointerType !== "mouse") return setTip(null);
              setTip({
                text: `${full}: ${seatFigure(r.v)} ${t.seats}. ${context ? L[context.basis] : ""}`,
                x: e.clientX,
                y: e.clientY,
              });
            }}
            style={{
              left: rtl ? W - r.x - r.w + 1.5 : r.x + 1.5,
              top: r.y + 1.5,
              width: cw,
              height: ch,
              ["--fill" as string]: partyColor(p.id),
              ["--fill-ink" as string]: partyInk(p.id),
            }}
          >
            <span
              className="nm"
              lang={shown === short ? named(p, "short").lang : named(p).lang}
              dir="auto"
            >
              {shown}
            </span>
            <span className="ld" lang={named(p, "leader").lang} dir="auto">
              {named(p, "leader").text.split(" (")[0]}
            </span>
            <span className="av">
              {seatFigure(r.v)}
              <small>{t.seats}</small>
            </span>
          </button>,
        );
      }
    }
  }

  const party = parties.find((p) => p.id === current);

  if (!context && refreshFailed)
    return <SeatBasis context={null} lang={lang} />;
  return (
    <div
      className="pm"
      onKeyDown={(e) => {
        if (e.key === "Escape" && current) {
          e.preventDefault();
          close();
        }
      }}
    >
      <SeatBasis context={context} lang={lang} share />
      {context && unmappedLists(context, parties).length > 0 && (
        <p>
          {L.unknown}:{" "}
          {unmappedLists(context, parties)
            .map((p) => `${p.label} ${p.seats}`)
            .join("; ")}
        </p>
      )}
      <PageHead title={t.map} standfirst={t.mapIntro} />

      <div className={`layout${party ? " open" : ""}`}>
        <div className="mapcol">
          {context && <h2 className="offmap-head">{official ? PC.groupInOfficial : PC.groupIn}</h2>}
          <div
            className={`map${party ? " has-sel" : ""}`}
            ref={mapRef}
            role="group"
            aria-label={t.mapGroup}
            onPointerLeave={() => setTip(null)}
          >
            {cells}
          </div>
          {context && <h2 className="offmap-head">{official ? PC.groupBelowOfficial : PC.groupBelow}</h2>}
          <div className="offmap">
            {offMap.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`chip${avgOf.has(p.id) ? "" : " na"}`}
                aria-pressed={current === p.id}
                data-party={p.id}
                onClick={() => select(p.id)}
              >
                <span
                  className="sw"
                  style={
                    avgOf.has(p.id)
                      ? { background: partyColor(p.id) }
                      : undefined
                  }
                />
                <b lang={named(p).lang} dir="auto">
                  {named(p).text}
                </b>
                <em>
                  {context
                    ? <ListStatusChip seats={0} seatStatus={context.seatStatus} pct={shareOf({ party: p.id, letters: lettersOf[p.id] }, shares, context)} lang={lang} />
                    : named(p, "status").text}
                </em>
              </button>
            ))}
          </div>
          <About
            lang={lang}
            totals={
              Object.fromEntries(
                BLOC_ORDER.map((id) => [id, blocSum(id)]),
              ) as Record<BlocId, number>
            }
          />
        </div>
        {party && (
          <aside
            className="panel"
            ref={panelRef}
            aria-label={`${named(party).text}: ${t.profile}`}
          >
            <button type="button" className="party-close" onClick={close}>
              {t.close}
            </button>
            {lang === "en" ? (
              <ProfileDetail party={party} />
            ) : (
              <PartyPreview party={party} lang={lang} context={context} />
            )}
          </aside>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {party ? `${t.showing}: ${named(party).text}` : ""}
      </p>
      {tip && (
        <div className="tip" ref={tipRef}>
          {tip.text}
        </div>
      )}
    </div>
  );
}
