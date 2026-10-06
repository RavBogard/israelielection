/**
 * The stance scale's colours (Daniel, 2026-10-06: the graphite ramp was "hard to decode" and "ugly and monotonous").
 * An issue's options run from one end of its debate to the other, so the scale diverges: pomegranate at the first
 * option, through coral and sand, to sage and forest at the last. Five fixed stops, mixed in OKLab, so a shade means
 * one thing in light, dark and print. The hues stay off the four bloc colours and off red-against-blue, so the scale
 * reads as an answer's place in its issue's order, never as a bloc or an American party.
 *
 * Options that are priorities rather than a scale take a light category tint each (with an ink outline on the page),
 * never a step of the scale.
 */
export const RAMP_STOPS = ["#8a1c3c", "#e2694f", "#f4cf7e", "#79ad7a", "#1f5537"] as const;
export const CATEGORY_TINTS = ["#c9d3ef", "#e3cdeb", "#cbe5e2", "#eed3df", "#dcdcc4", "#d6e1f2"] as const;

type V3 = [number, number, number];
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const fromHex = (h: string): V3 => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as V3;
const toHex = (rgb: V3) => `#${rgb.map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("")}`;

function toLab(rgb: V3): V3 {
  const [r, g, b] = rgb.map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function toRgb([L, a, b]: V3): V3 {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const out = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return out.map((c) => Math.round(Math.min(1, Math.max(0, gam(c))) * 255) / 255) as V3;
}
const LABS = RAMP_STOPS.map((h) => toLab(fromHex(h)));

/** The scale's colour at a position from 0 (first option) to 1 (last), as a hex string. */
export function rampColor(position: number): string {
  const p = Math.min(1, Math.max(0, position));
  const k = LABS.length - 1;
  const i = Math.min(k - 1, Math.floor(p * k));
  const t = p * k - i;
  return toHex(toRgb(LABS[i].map((v, j) => v * (1 - t) + LABS[i + 1][j] * t) as V3));
}

/** WCAG relative luminance of a hex colour. */
export function luminance(h: string): number {
  const [r, g, b] = fromHex(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** True when white text reads better than black on this hex fill (the two meet near luminance 0.179). */
export const whiteOn = (h: string) => 1.05 / (luminance(h) + 0.05) >= (luminance(h) + 0.05) / 0.05;
