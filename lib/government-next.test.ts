import { describe, expect, it } from "vitest";
import { nextSteps, ENVELOPES_EXPECTED_THROUGH } from "./government-next";

const base = (over: Record<string, unknown> = {}, events: unknown[] = [], clock: unknown = null) =>
  ({ seatContext: { seatStatus: "estimated", ...over }, politics: { events, clock } }) as never;

describe("nextSteps", () => {
  it("before official results: the envelope count is next and expected, nothing is done", () => {
    const s = nextSteps(base());
    expect(s.map((x) => x.state)).toEqual(["next", "later", "later", "later"]);
    expect(s[0]).toMatchObject({ id: "envelopes", date: ENVELOPES_EXPECTED_THROUGH, basis: "expected" });
    expect(s[1]).toMatchObject({ id: "results", date: null, basis: "expected" });
  });
  it("once results are published: counting and results are done, the consultation deadline is publication + 7", () => {
    const s = nextSteps(base({ seatStatus: "official", statutoryPublication: { publishedOn: "2026-11-04" } }));
    expect(s.map((x) => x.state)).toEqual(["done", "done", "next", "later"]);
    expect(s[1].date).toBe("2026-11-04");
    expect(s[2].date).toBe("2026-11-11");
  });
  it("a confirmed mandate event marks consultations done and takes the mandate deadline from the clock", () => {
    const s = nextSteps(
      base({ seatStatus: "official", statutoryPublication: { publishedOn: "2026-11-04" } }, [{ type: "mandate", status: "confirmed" }], { kind: "mandate", deadlineAt: "2026-12-09T00:00:00Z" }),
    );
    expect(s.map((x) => x.state)).toEqual(["done", "done", "done", "next"]);
    expect(s[3].date).toBe("2026-12-09");
  });
  it("ignores unconfirmed events", () => {
    const s = nextSteps(base({ seatStatus: "official" }, [{ type: "mandate", status: "reported" }]));
    expect(s[2].state).toBe("next");
  });
});
