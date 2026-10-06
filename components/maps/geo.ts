import { pathOf, project, type Places } from "@/lib/votemap";
import areas from "@/public/maps/west-bank-areas.json";
import context from "@/public/vote-map/context.json";
import placesJson from "@/public/vote-map/places.json";

/*
 * Shared frame for the article locator maps: one projection (the vote map's), a frame in projected
 * units, and positions as percentages so labels are HTML at real pixel sizes over a scaling SVG.
 */

export type LngLat = [number, number];
export type Frame = { x: number; y: number; w: number; h: number };
export const places = placesJson as unknown as Places;

export function frameOf(west: number, south: number, east: number, north: number): Frame {
  const [x0, y0] = project([west, north]);
  const [x1, y1] = project([east, south]);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
export const viewBox = (f: Frame) => `${f.x} ${f.y} ${f.w} ${f.h}`;
/** Where a point falls in the frame, for an absolutely placed HTML label. */
export function at(f: Frame, p: LngLat) {
  const [x, y] = project(p);
  return { left: `${(((x - f.x) / f.w) * 100).toFixed(2)}%`, top: `${(((y - f.y) / f.h) * 100).toFixed(2)}%` };
}
export const xy = (p: LngLat) => project(p);
/** An open line (no closing segment). */
export function lineOf(pts: LngLat[]) {
  return "M" + pts.map((p) => project(p).map((n) => +n.toFixed(4)).join(",")).join("L");
}
export const ringsPath = (rings: number[][][]) => pathOf(rings as [number, number][][]);
/** A locality's [lng, lat] from the vote map's places file, or null when it has no coordinates. */
export function placeOf(code: number): LngLat | null {
  const p = places[code];
  return p && p[1] ? [p[2], p[1]] : null;
}

export type AreaKey = "A" | "B" | "C" | "EJ" | "NML";
export const wbAreas = areas as unknown as { source: { name: string; url: string; file: string; licence: string }; greenLineSource: { name: string; url: string }; areas: Record<AreaKey, number[][][]>; greenLine: LngLat[] };
export const wbOutline = (context as unknown as { westBank: number[][][] }).westBank;
export const OUTLINE_SOURCE = (context as unknown as { source: { name: string; url: string } }).source;
