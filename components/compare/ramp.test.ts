import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { onShade, shade, UNORDERED_EDGE } from "./model";
import { CATEGORY_TINTS, luminance, RAMP_STOPS, rampColor } from "./ramp";

/*
 * The stance scale stays readable: every colour shade() can draw, with the numeral onShade() picks for it, meets WCAG
 * 4.5:1. The stops are fixed, so this holds in both themes; unordered options are light tints with an ink outline and
 * an ink numeral.
 */

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
const token = (name: string, from = css) => from.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"))![1];
const dark = css.slice(css.indexOf(':root[data-theme="dark"]'));
const contrast = (a: string, b: string) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const NUMERAL: Record<string, string> = { light: "#ffffff", dark: "#000000" };
const BLOCS = ["b-net", "b-opp", "b-mid", "b-arab"].map((b) => token(b, css));
const hexDist = (a: string, b: string) => Math.hypot(...[1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16)));

describe("stance scale", () => {
  it("runs through its fixed stops, with the CSS tokens kept equal", () => {
    expect(rampColor(0)).toBe(RAMP_STOPS[0]);
    expect(rampColor(1)).toBe(RAMP_STOPS[RAMP_STOPS.length - 1]);
    expect(token("ramp-a")).toBe(RAMP_STOPS[0]);
    expect(token("ramp-mid")).toBe(rampColor(0.5));
  });

  it("stays off the four bloc colours", () => {
    for (let i = 0; i <= 20; i++) for (const b of BLOCS) expect(hexDist(rampColor(i / 20), b), `position ${i / 20} vs ${b}`).toBeGreaterThan(40);
  });

  it("gives every step's numeral at least 4.5:1", () => {
    for (let i = 0; i <= 1000; i++) {
      const pos = i / 1000;
      const on = onShade(pos);
      expect(on === "light" || on === "dark").toBe(true);
      expect(contrast(rampColor(pos), NUMERAL[on]), `position ${pos}, ${on} numeral`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("separates neighbouring answers on a six-option issue", () => {
    const steps = [0, 1, 2, 3, 4, 5].map((i) => rampColor(i / 5));
    for (let i = 1; i < steps.length; i++) expect(hexDist(steps[i - 1], steps[i])).toBeGreaterThan(45);
  });

  it("draws unordered options as light category tints with an ink outline and an ink numeral, never a scale step", () => {
    expect(shade(null, 1)).toBe(CATEGORY_TINTS[0]);
    expect(shade(null, 2)).toBe(CATEGORY_TINTS[1]);
    for (const t of CATEGORY_TINTS) {
      expect(contrast(t, token("ink"))).toBeGreaterThanOrEqual(4.5);
      for (let i = 0; i <= 20; i++) expect(hexDist(t, rampColor(i / 20))).toBeGreaterThan(20);
    }
    expect(UNORDERED_EDGE).toContain("var(--ink)");
    expect(onShade(null)).toBe("ink");
    // The tints are fixed and light, so their numeral is pinned to black rather than the theme's ink (white in dark mode).
    const cmp = readFileSync(new URL("../compare.css", import.meta.url), "utf8");
    expect(cmp).toMatch(/\.on-ink[^{]*\{[^}]*color: #000;/);
  });

  it("edges dark fills on dark paper with a line that reads at 3:1", () => {
    expect(css).toMatch(/:root\[data-theme="dark"\] \{ --ramp-edge: var\(--ink-3\); \}/);
    expect(contrast(token("ink-3", dark), token("bg", dark))).toBeGreaterThanOrEqual(3);
  });
});
