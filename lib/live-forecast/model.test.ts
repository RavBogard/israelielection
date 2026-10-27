import { describe, expect, it } from "vitest";
import { summarizeDraws, representativeJointDraw, buildSnapshot, exitLikelihood, modelRevision } from "./model";
import {
  completeSeatParagraph,
  channel13Candidates,
  PARTY_ALIASES,
} from "./direct";
import {
  inputRevision,
  latestPublisherRevisions,
  manualExits,
  selectPublisherInputs,
  validExit,
} from "./sources";
import { verifyQStash } from "./auth";
import { createHash, createHmac } from "node:crypto";
import type { Poll } from "../types";
import captured from "./fixtures/channel13-2022.json";

const poll = (seats = { likud: { seats: 60 }, dem: { seats: 60 } }): Poll => ({
  id: "x",
  pollster: "Channel 13",
  published: "2026-10-27",
  broadcastAt: "2026-10-27T20:00:00Z",
  kind: "exit",
  results: seats,
  combined: [],
  firm: null,
  fieldwork: null,
  via: null,
  url: null,
  n: null,
  margin: null,
  note: null,
});
describe("live joint summaries", () => {
  it("chooses one actual joint parliament instead of incompatible party medians", () => {
    const draws = { a: [70, 60, 10], b: [50, 20, 70], c: [0, 40, 40] },
      point = representativeJointDraw(draws);
    expect(Object.values(point.seats).reduce((a, b) => a + b, 0)).toBe(120);
    expect(point.seats).toEqual(
      Object.fromEntries(
        Object.entries(draws).map(([id, x]) => [id, x[point.drawIndex]]),
      ),
    );
    expect(point).toEqual(representativeJointDraw(draws));
  });
  it("prefers the draw whose bloc totals match the bloc medians", () => {
    const draws = { likud: [40, 41, 39, 42, 40], otzma: [20, 18, 22, 17, 20], dem: [60, 61, 59, 61, 60] };
    const point = representativeJointDraw(draws);
    expect(point.seats.likud + point.seats.otzma).toBe(60);
    expect(point.seats.dem).toBe(60);
  });
  it("classifies unique winners and ties exhaustively without choosing a tie winner", () => {
    const s = summarizeDraws(
      { likud: [60, 61, 59], dem: [60, 59, 61] },
      { net: [60, 61, 59], opp: [60, 59, 61] },
    );
    expect(
      s.largestParty.map((p) => p.probability).reduce((a, b) => a + b, 0),
    ).toBeCloseTo(1);
    expect(s.largestParty.find((p) => p.id === "tie")!.probability).toBeCloseTo(
      1 / 3,
    );
    expect(s.blocMargin.median).toBe(0);
  });
  it("uses yes greater than no with abstention, never a cabinet61 rule", () => {
    const s = summarizeDraws(
      { likud: [55], dem: [58], jl: [7] },
      { net: [55], opp: [58] },
    );
    const a = s.arrangements.find((a) => a.id === "opposition-support")!;
    expect(a.yes.median).toBe(58);
    expect(a.no.median).toBe(55);
    expect(a.margin.median).toBe(3);
    expect(a.probability).toBeGreaterThan(0.5);
    expect(
      s.thresholds.every((t) => !t.sufficientSupport && !t.impact.length),
    ).toBe(true);
  });
  it("rejects malformed seat draws and retains correlated same-run totals", () => {
    expect(() =>
      summarizeDraws({ a: [80], b: [50] }, { net: [80], opp: [50] }),
    ).toThrow("120-seat");
  });
  it("allows overlapping arrangement probabilities rather than normalizing alternatives", () => {
    const s = summarizeDraws(
      { dem: [70], likud: [50] },
      { net: [50], opp: [70] },
    );
    expect(
      s.arrangements
        .filter((a) => a.id.startsWith("opposition"))
        .reduce((n, a) => n + a.probability, 0),
    ).toBeGreaterThan(1);
  });
});
describe("source validation", () => {
  it("rejects an actual captured historical complete-looking121-seat source paragraph", () => {
    const text = captured.elements[0].post_content;
    const values = [...text.matchAll(/ - (\d+)/g)].map((m) => Number(m[1]));
    expect(values.reduce((a, b) => a + b, 0)).toBe(121);
    expect(
      completeSeatParagraph(text, {
        הליכוד: "likud",
        "יש עתיד": "ya",
        "הציונות הדתית": "rz",
        "המחנה הממלכתי": "nu",
        'ש"ס': "shas",
        "יהדות התורה": "utj",
        "ישראל ביתנו": "yb",
        העבודה: "labor",
        'רע"מ': "raam",
        'חד"ש-תע"ל': "hadash",
        מרצ: "meretz",
      }),
    ).toBeNull();
  });
  it("rejects preclose, future, Channel14, old election, incomplete and malformed exits", () => {
    const now = Date.parse("2026-10-27T21:00Z");
    expect(validExit(poll(), now)).toBe(true);
    expect(validExit(poll(), Date.parse("2026-10-27T19:59Z"))).toBe(false);
    expect(
      validExit({ ...poll(), broadcastAt: "2026-10-28T00:00Z" }, now),
    ).toBe(false);
    expect(validExit({ ...poll(), pollster: "Channel 14" }, now)).toBe(false);
    expect(validExit({ ...poll(), published: "2022-11-01" }, now)).toBe(false);
    expect(
      validExit(poll({ likud: { seats: 60 }, dem: { seats: 59 } }), now),
    ).toBe(false);
  });
  it("deduplicates publisher revisions and mirror-only changes", () => {
    const p = poll(),
      later = { ...p, id: "new", broadcastAt: "2026-10-27T21:00Z" };
    expect(latestPublisherRevisions([p, later])).toEqual([later]);
    expect(inputRevision([p])).toBe(inputRevision([later]));
  });
  it("orders mixed UTC/offset timestamps by instant rather than lexical clock time", () => {
    const earlier = {
      ...poll(),
      id: "offset",
      broadcastAt: "2026-10-27T23:00:00+02:00",
    };
    const later = { ...poll(), id: "utc", broadcastAt: "2026-10-27T21:30:00Z" };
    expect(latestPublisherRevisions([earlier, later])).toEqual([later]);
    expect(latestPublisherRevisions([later, earlier])).toEqual([later]);
  });
  it("prefers a currently valid direct estimate to equal or later observed fallback times, and uses fallback on direct failure", () => {
    const direct = {
      ...poll(),
      id: "direct",
      via: "Channel 13 direct structured timeline",
    };
    const fallback = {
      ...poll({ likud: { seats: 59 }, dem: { seats: 61 } }),
      id: "wiki",
      broadcastAt: "2026-10-27T21:00:00Z",
    };
    expect(selectPublisherInputs([fallback], [fallback], [direct])).toEqual([
      direct,
    ]);
    expect(selectPublisherInputs([direct], [fallback], [])).toEqual([fallback]);
    const tied = { ...fallback, broadcastAt: direct.broadcastAt };
    expect(latestPublisherRevisions([tied, direct])).toEqual([direct]);
    expect(latestPublisherRevisions([direct, tied])).toEqual([direct]);
  });
  it("accepts hand-entered exit polls only under the ordinary exit validation", () => {
    const now = "2026-10-27T21:00:00Z";
    expect(manualExits(now).every((p) => p.kind === "exit" && Date.parse(p.broadcastAt!) <= Date.parse(now))).toBe(true);
    expect(manualExits("2026-10-27T19:59:00Z")).toEqual([]);
    const c14 = { ...poll(), id: "c14", pollster: "Channel 14" };
    const early = { ...poll(), id: "early", broadcastAt: "2026-10-27T19:00:00Z" };
    const short = { ...poll({ likud: { seats: 60 }, dem: { seats: 59 } }), id: "short" };
    expect(manualExits(now, [c14, early, short, poll()])).toEqual([poll()]);
  });
  it("rejects negative, fractional, empty and duplicate combined groups even if totals can sum120", () => {
    const base = { ...poll(), results: { likud: { seats: 60 } } };
    const now = Date.parse("2026-10-27T21:00Z");
    expect(
      validExit(
        { ...base, combined: [{ parties: ["dem"], seats: 60, note: "" }] },
        now,
      ),
    ).toBe(true);
    for (const combined of [
      [{ parties: [], seats: 60, note: "" }],
      [
        { parties: ["dem"], seats: 60.5, note: "" },
        { parties: ["shas"], seats: -0.5, note: "" },
      ],
      [{ parties: ["dem", "dem"], seats: 60, note: "" }],
      [
        { parties: ["dem"], seats: -1, note: "" },
        { parties: ["shas"], seats: 61, note: "" },
      ],
    ])
      expect(validExit({ ...base, combined }, now)).toBe(false);
  });
  it("loads Hebrew aliases for all known lists including poi, res and noam", () => {
    for (const id of ["poi", "res", "noam"])
      expect(
        Object.entries(PARTY_ALIASES).some(
          ([alias, party]) => party === id && /[\u0590-\u05ff]/.test(alias),
        ),
      ).toBe(true);
  });
  it("extracts isolated full estimates and rejects duplicate party labels and partial corrections", () => {
    const aliases = { Alpha: "a", Beta: "b", Gamma: "c" };
    expect(
      completeSeatParagraph(
        "<p>Exit: Alpha - 60, Beta - 40, Gamma - 20.</p>",
        aliases,
      ),
    ).toEqual({ a: { seats: 60 }, b: { seats: 40 }, c: { seats: 20 } });
    expect(
      completeSeatParagraph("<p>Alpha - 60, Beta - 40, Beta - 20</p>", aliases),
    ).toBeNull();
    expect(
      completeSeatParagraph(
        "<p>Alpha - 60</p><p>Beta - 40, Gamma - 20</p>",
        aliases,
      ),
    ).toBeNull();
  });
  it("reads the actual Channel13 timeline path and per-entry timestamp, not article metadata", () => {
    const page = {
      props: {
        pageProps: {
          page: {
            Content: {
              Item: {
                timeLines: {
                  "3066": {
                    elements: [
                      {
                        id: "1",
                        post_title: "מדגם",
                        post_content:
                          "<p>Alpha - 60, Beta - 40, Gamma - 20</p>",
                        createdOn: "2026-10-27 22:05:00",
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    };
    const ps = channel13Candidates(
      `<script id="__NEXT_DATA__">${JSON.stringify(page)}</script>`,
      "https://13tv.co.il/item/news/example",
      { Alpha: "a", Beta: "b", Gamma: "c" },
    );
    expect(ps).toHaveLength(1);
    expect(ps[0].broadcastAt).toBe("2026-10-27T22:05:00+02:00");
    for (const createdOn of [
      "2026-10-27T20:05:00Z",
      "2026-10-27 22:05:00+02:00",
    ]) {
      page.props.pageProps.page.Content.Item.timeLines[
        "3066"
      ].elements[0].createdOn = createdOn;
      const [p] = channel13Candidates(
        `<script id="__NEXT_DATA__">${JSON.stringify(page)}</script>`,
        "https://13tv.co.il/item/news/example",
        { Alpha: "a", Beta: "b", Gamma: "c" },
      );
      expect(Date.parse(p.broadcastAt!)).toBe(
        Date.parse("2026-10-27T20:05:00Z"),
      );
    }
  });
});
describe("signed worker authentication", () => {
  const now = Date.parse("2026-10-27T20:00Z"),
    url = "https://example.com/api/live-forecast/worker",
    body = "{}",
    key = "test-signing-key";
  const token = (claims: Record<string, unknown> = {}, signing = key) => {
    const h = Buffer.from(JSON.stringify({ alg: "HS256" })).toString(
        "base64url",
      ),
      p = Buffer.from(
        JSON.stringify({
          iss: "Upstash",
          sub: url,
          nbf: now / 1000 - 1,
          exp: now / 1000 + 60,
          body: createHash("sha256").update(body).digest("base64url"),
          ...claims,
        }),
      ).toString("base64url");
    return `${h}.${p}.${createHmac("sha256", signing).update(`${h}.${p}`).digest("base64url")}`;
  };
  it("accepts rotating keys, verifies raw body and destination, denies expiration and malformed JWT", () => {
    expect(verifyQStash(token(), body, url, ["old", key], now)).toBe(true);
    expect(verifyQStash(token(), "different", url, [key], now)).toBe(false);
    expect(verifyQStash(token(), body, url + "/", [key], now)).toBe(false);
    expect(
      verifyQStash(token({ exp: now / 1000 }), body, url, [key], now),
    ).toBe(false);
    expect(verifyQStash("bad", body, url, [key], now)).toBe(false);
  });
});

it("computes bloc intervals from per-draw sums rather than summing independent party interval endpoints", () => {
  const result = summarizeDraws(
    { likud: [60, 0], shas: [0, 60], yashar: [60, 60] },
    { net: [60, 60], opp: [60, 60] },
  );
  expect(result.blocSeats.find((b) => b.id === "net")?.seats).toEqual({
    lo: 60,
    median: 60,
    hi: 60,
  });
  expect(
    result.partySeats
      .filter((p) => ["likud", "shas"].includes(p.id))
      .reduce((n, p) => n + p.seats.hi, 0),
  ).toBe(120);
});

describe("exit-poll calibration", () => {
  const record = {
    elections: [
      { date: "a", field: 60, result: 62 },
      { date: "b", field: 60, result: 58 },
      { date: "c", field: 60, result: 64 },
      { date: "d", field: 60, result: 60 },
    ],
    partyMeanAbsSeats: 0.8,
    shrinkagePseudoElections: 4,
  };
  it("shrinks the mean exit-poll miss toward zero and carries the record's spread", () => {
    const fit = exitLikelihood(record);
    expect(fit.n).toBe(4);
    expect(fit.meanMiss).toBeCloseTo(1);
    expect(fit.lean).toBeCloseTo(0.5);
    expect(fit.resid).toBeCloseTo(Math.sqrt((1 + 9 + 9 + 1) / 4));
    expect(fit.elections.every((e) => e.shasError === 0)).toBe(true);
    expect(exitLikelihood({ ...record, shrinkagePseudoElections: 0 }).lean).toBeCloseTo(1);
  });
  it("refuses an empty or malformed record instead of silently falling back", () => {
    expect(() => exitLikelihood({ ...record, elections: [] })).toThrow();
    expect(() => exitLikelihood({ ...record, partyMeanAbsSeats: 0 })).toThrow();
  });
  it("the committed record is small, two-sided and fitted from six elections", () => {
    const fit = exitLikelihood();
    expect(fit.n).toBe(6);
    expect(Math.abs(fit.lean)).toBeLessThan(1);
    expect(fit.resid).toBeGreaterThan(1);
    expect(fit.resid).toBeLessThan(3);
    expect(fit.partyMeanAbsSeats).toBeGreaterThan(0.5);
    expect(fit.partyMeanAbsSeats).toBeLessThan(1.2);
  });
  it("exit mode builds a 120-seat joint snapshot with the fitted likelihood and enters it in the revision", () => {
    const exits = [
      poll({ likud: { seats: 25 }, yashar: { seats: 22 }, byachad: { seats: 13 }, jl: { seats: 11 }, dem: { seats: 9 }, yb: { seats: 8 }, shas: { seats: 7 }, raam: { seats: 7 }, otzma: { seats: 6 }, rz: { seats: 6 }, utj: { seats: 6 }, res: { seats: 0 }, poi: { seats: 0 } }),
    ];
    const prior = { version: "v", sha256: "s", generatedAt: "2026-10-25", final: false };
    const snap = buildSnapshot({ prior, revision: modelRevision(exits), now: "2026-10-27T21:30:00Z", exits, runs: 3000 });
    expect(snap.mode).toBe("exit");
    expect(Object.values(snap.representativePoint!.seats).reduce((a, b) => a + b, 0)).toBe(120);
    expect(snap.diagnostics.limitations.some((l) => /fitted to six elections/.test(l))).toBe(true);
    expect(snap.diagnostics.limitations.some((l) => /no fitted/.test(l))).toBe(false);
    expect(snap.blocSeats!.find((b) => b.id === "net")!.seats.median).toBeGreaterThan(45);
    expect(snap.blocSeats!.find((b) => b.id === "net")!.seats.median).toBeLessThan(55);
    expect(modelRevision(exits)).not.toBe(modelRevision([]));
  });
});
