import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import Countdown from "./Countdown";

const at = (iso: string, lang?: "en" | "he") => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
  return renderToString(createElement(Countdown, lang ? { lang } : {}));
};
afterEach(() => vi.useRealTimers());

describe("the masthead countdown", () => {
  it("keeps the English line", () => {
    expect(at("2026-10-06T09:00:00+03:00")).toBe('<p class="countdown"><b>21<!-- --> days</b> to Election Day, Tuesday, October 27</p>');
    expect(at("2026-10-26T09:00:00+02:00")).toContain("<b>Election Day is tomorrow</b>");
  });
  it("counts in Hebrew, with the dual for two days", () => {
    expect(at("2026-10-06T09:00:00+03:00", "he")).toBe('<p class="countdown"><b>21<!-- --> ימים</b> לבחירות, יום שלישי, 27 באוקטובר</p>');
    expect(at("2026-10-25T09:00:00+02:00", "he")).toContain("<b>יומיים</b> לבחירות");
    expect(at("2026-10-26T09:00:00+02:00", "he")).toContain("<b>הבחירות מחר</b>, יום שלישי, 27 באוקטובר");
    expect(at("2026-10-27T09:00:00+02:00", "he")).toContain("<b>יום הבחירות.</b> הקלפיות נסגרות ב-22:00");
    expect(at("2026-10-29T09:00:00+02:00", "he")).toMatch(/הבחירות התקיימו ב-27 באוקטובר\. <a hrefLang="en" href="\/government">הרכבת הממשלה \(באנגלית\)<\/a>/);
  });
});
