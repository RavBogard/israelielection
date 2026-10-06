import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { onShade, shade } from "./model";

/*
 * The stance ramp's numerals stay readable: every shade shade() can draw, with the numeral onShade()
 * picks for it (white on the dark half, black on the light half), meets WCAG 4.5:1. The endpoints are
 * fixed, so this holds in both themes; the ink-2 cells of unordered options take the theme's paper.
 */

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
const token = (name: string, from = css) => from.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"))![1];
const dark = css.slice(css.indexOf(':root[data-theme="dark"]'));

type RGB = [number, number, number];
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as RGB;
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
function toLab(rgb: RGB): RGB {
  const [r, g, b] = rgb.map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function toRgb([L, a, b]: RGB): RGB {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const out = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  // Clipped and rounded to 8 bits, as the browser paints it.
  return out.map((c) => Math.round(Math.min(1, Math.max(0, gam(c))) * 255) / 255) as RGB;
}
const lum = (rgb: RGB) => { const [r, g, b] = rgb.map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a: RGB, b: RGB) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

/** The colour shade() names: color-mix(in oklab, start p%, end). */
function paint(position: number): RGB {
  const p = Number(shade(position).match(/(\d+(?:\.\d+)?)%/)![1]) / 100;
  const a = toLab(hex(token("ramp-start"))), b = toLab(hex(token("ramp-end")));
  return toRgb(a.map((v, i) => v * p + b[i] * (1 - p)) as RGB);
}
const NUMERAL: Record<string, RGB> = { light: [1, 1, 1], dark: [0, 0, 0] };

describe("stance ramp", () => {
  it("uses graphite endpoints, not a bloc colour", () => {
    expect(token("ramp-start").toLowerCase()).not.toBe(token("b-net").toLowerCase());
    const [L0, a0, b0] = toLab(hex(token("ramp-start")));
    expect(Math.hypot(a0, b0)).toBeLessThan(0.02);
    expect(L0).toBeLessThan(0.4);
  });

  it("gives every step's numeral at least 4.5:1, white and black, in both themes", () => {
    for (let i = 0; i <= 1000; i++) {
      const pos = i / 1000;
      const on = onShade(pos);
      expect(on === "light" || on === "dark").toBe(true);
      const c = contrast(paint(pos), NUMERAL[on]);
      expect(c, `position ${pos}, ${on} numeral`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("gives the paper numeral on ink-2 (unordered options) 4.5:1 in light and dark", () => {
    expect(shade(null)).toBe("var(--ink-2)");
    expect(onShade(null)).toBe("ink");
    expect(contrast(hex(token("ink-2")), hex(token("bg")))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(hex(token("ink-2", dark)), hex(token("bg", dark)))).toBeGreaterThanOrEqual(4.5);
  });

  it("edges the dark end on dark paper with a line that reads at 3:1", () => {
    expect(css).toMatch(/:root\[data-theme="dark"\] \{ --ramp-edge: var\(--ink-3\); \}/);
    expect(contrast(hex(token("ink-3", dark)), hex(token("bg", dark)))).toBeGreaterThanOrEqual(3);
  });
});
