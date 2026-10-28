import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { BlocId } from "./types";
import { visualOrder } from "./og-rtl";

/**
 * Shared pieces of the share images drawn with next/og (the home card and the coalition card).
 * Satori cannot read CSS variables, so the colours here mirror app/globals.css.
 */
export const BLOC: Record<BlocId, string> = { net: "#233f86", opp: "#d98a1f", mid: "#3fb0a2", arab: "#8d4fae" };
export const PAPER = "#f6f5f1", CELL = "#e4e2db", INK = "#000000", TEXT = "#2a2925", INK2 = "#5f5d57", INK3 = "#8b8880", LINE = "#dedcd5";
export const GRID_ORDER: BlocId[] = ["net", "mid", "opp", "arab"];
export const SIZE = { width: 1200, height: 630 };

const font = (file: string) => readFile(join(process.cwd(), "assets/og", file));
const files = Promise.all([font("FrankRuhlLibre-Regular.ttf"), font("FrankRuhlLibre-Bold.ttf"), font("PublicSans-Medium.ttf"), font("PublicSans-SemiBold.ttf")]);

/** The four faces the cards use, loaded once per server. */
export async function ogFonts() {
  const [frank, frankBold, sans, sansSemi] = await files;
  return [
    { name: "Frank Ruhl Libre", data: frank, weight: 400 as const, style: "normal" as const },
    { name: "Frank Ruhl Libre", data: frankBold, weight: 700 as const, style: "normal" as const },
    { name: "Public Sans", data: sans, weight: 500 as const, style: "normal" as const },
    { name: "Public Sans", data: sansSemi, weight: 600 as const, style: "normal" as const },
  ];
}

/** Grid geometry: cell 36, pitch 42, twelve across, ten down, the heavy rule under row five. */
export const G = { S: 36, P: 42, COLS: 12, ROWS: 10, TOTAL: 120 };
export const GRID_W = G.COLS * G.P - 6, GRID_H = G.ROWS * G.P - 6, RULE_Y = 5 * G.P - 3;

/**
 * The 120 cells as SVG rects: `counts` whole seats per colour in fill order, the rest paper.
 * Returned as an array so the caller can wrap it in its own <svg>.
 */
export function gridCells(fills: { count: number; color: string }[]) {
  const cells: React.ReactNode[] = [];
  let i = 0;
  for (const f of fills) for (let n = 0; n < f.count && i < G.TOTAL; n++, i++) cells.push(<rect key={i} x={(i % G.COLS) * G.P} y={Math.floor(i / G.COLS) * G.P} width={G.S} height={G.S} fill={f.color} />);
  for (; i < G.TOTAL; i++) cells.push(<rect key={i} x={(i % G.COLS) * G.P} y={Math.floor(i / G.COLS) * G.P} width={G.S} height={G.S} fill={CELL} />);
  return cells;
}

/** The grid with its rule and the "61" beside it, positioned by the caller. */
export function Grid({ fills }: { fills: { count: number; color: string }[] }) {
  return (
    <div style={{ display: "flex", position: "relative", width: GRID_W + 44, height: GRID_H }}>
      <svg width={GRID_W + 4} height={GRID_H} viewBox={`0 0 ${GRID_W + 4} ${GRID_H}`}>
        {gridCells(fills)}
        <line x1={0} x2={GRID_W + 4} y1={RULE_Y} y2={RULE_Y} stroke={INK} strokeWidth={3} />
      </svg>
      <div style={{ display: "flex", position: "absolute", left: GRID_W + 14, top: RULE_Y - 14, fontWeight: 700, fontSize: 26, lineHeight: 1, color: INK }}>61</div>
    </div>
  );
}

/** The nameplate for share images (components/Logo.tsx): "Israel Votes" on the notched bloc rule, ישראל בוחרת below, in a slip border. */
export function OgNameplate({ scale = 1 }: { scale?: number }) {
  const k = (n: number) => Math.round(n * scale * 10) / 10, w = k(190);
  return (
    <div style={{ display: "flex", flexDirection: "column", border: `${k(2)}px solid ${INK}`, padding: `${k(9)}px ${k(14)}px ${k(8)}px`, color: INK }}>
      <div style={{ display: "flex", fontFamily: "Frank Ruhl Libre", fontWeight: 700, fontSize: k(30), lineHeight: 1, letterSpacing: "-0.02em" }}>Israel Votes</div>
      <div style={{ display: "flex", width: w, height: k(5), marginTop: k(6), position: "relative" }}>
        <div style={{ display: "flex", width: (15 / 120) * w - 1, background: BLOC.arab }} />
        <div style={{ display: "flex", width: (46 / 120) * w - 1, marginLeft: 2, background: BLOC.opp }} />
        <div style={{ display: "flex", flexGrow: 1, background: BLOC.net }} />
        <div style={{ display: "flex", position: "absolute", left: (61 / 120) * w - 1, top: -k(3), width: 2, height: k(11), background: INK }} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", fontFamily: "Frank Ruhl Libre", fontWeight: 400, fontSize: k(19), lineHeight: 1, marginTop: k(6) }}>{visualOrder("ישראל בוחרת")}</div>
    </div>
  );
}
