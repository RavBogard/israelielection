import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SeatGrid from "./SeatGrid";

const segments = [{ id: "net", seats: 2, color: "red", label: "Netanyahu bloc" }];
const xs = (html: string, cls: string) => [...html.matchAll(new RegExp(`<rect class="${cls}" x="(\\d+)" y="(\\d+)"`, "g"))].map((m) => [+m[1], +m[2]]);

describe("the seat grid", () => {
  it("fills from the top left by default", () => {
    const html = renderToStaticMarkup(createElement(SeatGrid, { segments, labelRule: true }));
    expect(xs(html, "c")).toEqual([[1, 1], [13, 1]]);
    expect(html).toContain('<text class="rl" x="149"');
    expect(html).toContain('aria-label="Netanyahu bloc 2; 61 of 120 is a majority"');
  });
  it("fills from the top right in rtl, with 61 left of the rule", () => {
    const html = renderToStaticMarkup(createElement(SeatGrid, { segments, labelRule: true, rtl: true, lang: "he" }));
    // 20 units of label room on the left, then twelve cells; the first seat is the top-right cell.
    expect(xs(html, "c")).toEqual([[153, 1], [141, 1]]);
    expect(xs(html, "e")[0]).toEqual([129, 1]);
    expect(html).toMatch(/<line class="rule" x1="17" x2="164"/);
    expect(html).toMatch(/<text class="rl" x="15" y="62.4" dominant-baseline="middle" text-anchor="end" direction="ltr">61<\/text>/);
    expect(html).toContain("רוב: 61 מתוך 120");
  });
  it("mirrors without the label too", () => {
    const html = renderToStaticMarkup(createElement(SeatGrid, { segments, rtl: true }));
    expect(xs(html, "c")[0]).toEqual([133, 1]);
  });
});
