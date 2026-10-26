import { describe, expect, it } from "vitest";
import {
  campaignContext,
  emptyLedger,
  publicPolitics,
  resolveLifecycle,
  selectSeats,
} from "./resolver";
import { fingerprint } from "./core";
import { mergeEvents, validateEvent, type EventCandidate } from "./events";
import { parseOfficialSeats } from "./official";
import { evaluateSeats } from "./evaluation";
import type {
  PoliticalEvent,
  SharedSeatContext,
  SourceHealth,
  SourceRef,
} from "./types";
const now = "2026-11-05T12:00:00Z",
  publishedAt = "2026-11-04T10:00:00Z";
const source: SourceRef = {
  id: "president:article",
  publisher: "President",
  title: "Assignment",
  url: "https://www.president.gov.il/en/example/",
  authority: "president",
  publishedAt,
  observedAt: now,
  captureHash: "a".repeat(64),
};
const health: SourceHealth = {
  sourceId: source.id,
  authority: "president",
  status: "healthy",
  checkedAt: now,
  lastSuccessfulAt: now,
  reason: null,
};
function event(overrides: Partial<PoliticalEvent> = {}): PoliticalEvent {
  return {
    id: fingerprint(overrides),
    claimKey: "claim",
    revision: fingerprint({ overrides, revision: true }),
    type: "mandate",
    election: "2026-10-27",
    effectiveAt: publishedAt,
    publishedAt,
    observedAt: now,
    partyIds: [],
    person: "Nominee A",
    decision: null,
    mandateKind: "first",
    durationDays: null,
    status: "confirmed",
    sources: [source],
    evidenceQuote:
      "The President assigned Nominee A the first task of forming a government.",
    supersedes: null,
    templateKey: "mandate",
    ...overrides,
  };
}
function official(): SharedSeatContext {
  return {
    ...campaignContext(now),
    revision: "b".repeat(64),
    snapshotRevision: "c".repeat(64),
    basis: "official_seats",
    seatStatus: "official",
    pointMethod: "published_official_allocation",
    evidenceStage: "official",
    publishedAt,
    observedAt: publishedAt,
    sourceRefs: [{ ...source, id: "cec-official", authority: "cec" }],
    sequence: 3,
  };
}
describe("shared seats", () => {
  it("selects an appended official correction immediately even with an older publication time, and keeps it next run", () => {
    const old = official(),
      corrected = {
        ...old,
        revision: "new-correction",
        sequence: 0,
        publishedAt: "2026-11-03T10:00Z",
        observedAt: "2026-11-04T11:00Z",
        correctionOf: old.revision,
      };
    expect(selectSeats([old, corrected], now)).toBe(corrected);
    expect(
      selectSeats([old, { ...corrected, sequence: 4 }], now, old).revision,
    ).toBe("new-correction");
  });
  it("keeps a coherent120-point; never selects early partial count; official seats survive source outage", () => {
    const campaign = campaignContext(now),
      partial = {
        ...campaign,
        basis: "partial_count" as const,
        revision: "early",
      },
      final = official();
    expect(Object.values(campaign.pointSeats).reduce((a, b) => a + b, 0)).toBe(
      120,
    );
    expect(selectSeats([partial], now).basis).toBe("campaign_forecast");
    const ledger = emptyLedger();
    ledger.seatSnapshots.push(final);
    ledger.health = [
      {
        ...health,
        sourceId: "cec-official",
        authority: "cec",
        status: "unavailable",
      },
    ];
    const result = resolveLifecycle(ledger, now);
    expect(result.seatContext.seatStatus).toBe("official");
    expect(result.seatContext.freshness.status).toBe("complete");
    expect(result.seatContext.reasonCodes).toContain("official_retained");
  });
  it("lets a newer named exit replace an older qualified projection and rejects incompatible retained state", () => {
    const base = campaignContext(now),
      old = {
        ...base,
        basis: "live_projection" as const,
        pointMethod: "representative_joint_draw" as const,
        publishedAt: "2026-10-27T21:00Z",
        observedAt: "2026-10-27T21:00Z",
      },
      fresh = {
        ...base,
        basis: "named_exit" as const,
        publishedAt: "2026-10-28T00:00Z",
        observedAt: "2026-10-28T00:00Z",
      };
    expect(selectSeats([old, fresh], now)).toBe(fresh);
    expect(
      selectSeats([], now, { ...official(), election: "2022-11-01" }).basis,
    ).toBe("campaign_forecast");
  });
  it("archives the finished election when the minute worker ends instead of permanent paused/stale state", () => {
    const result = resolveLifecycle(emptyLedger(), now);
    expect(result.archive.electionForecast).toBe("complete");
    expect(result.seatContext.freshness.status).toBe("complete");
  });
});
describe("claims, targets and true event clocks", () => {
  it("withholds claims, derived target decisions and clocks during source outage, preserving independent healthy sources", () => {
    const a = event(),
      b = event({
        id: "healthy",
        type: "consultation",
        sources: [{ ...source, id: "other" }],
        person: null,
      });
    const result = publicPolitics(
      [a, b],
      [
        { ...health, status: "unavailable" },
        { ...health, sourceId: "other" },
      ],
      now,
    );
    expect(result.events.map((e) => e.id)).toEqual(["healthy"]);
    expect(result.clock).toBeNull();
    expect(result.decisions.every((d) => d.decision === "undecided")).toBe(
      true,
    );
  });
  it("never combines support for one nominee with opposition to a different nominee", () => {
    const mandate = event(),
      a = event({
        id: "support-A",
        type: "confidence_commitment",
        partyIds: ["likud"],
        decision: "support",
      }),
      b = event({
        id: "oppose-B",
        type: "confidence_commitment",
        partyIds: ["dem"],
        person: "Nominee B",
        decision: "oppose",
      });
    const result = publicPolitics([mandate, a, b], [health], now);
    expect(result.decisions.find((d) => d.partyId === "likud")!.decision).toBe(
      "support",
    );
    expect(result.decisions.find((d) => d.partyId === "dem")!.decision).toBe(
      "undecided",
    );
    expect(result.proposals).toHaveLength(2);
  });
  it("uses first/second/final explicit stages, sums only granted initial extensions and never invents an extension", () => {
    const first = event();
    expect(publicPolitics([first], [health], now).clock!.deadlineAt).toBe(
      "2026-12-02T10:00:00.000Z",
    );
    const extension = event({
        id: "extension",
        type: "extension",
        extensionMode: "additional",
        durationDays: 5,
        effectiveAt: "2026-11-05T10:00Z",
      }),
      secondExtension = event({
        ...extension,
        id: "extension2",
        durationDays: 4,
        effectiveAt: "2026-11-05T11:00Z",
      });
    expect(
      publicPolitics([first, extension, secondExtension], [health], now).clock!
        .deadlineAt,
    ).toBe("2026-12-11T10:00:00.000Z");
    expect(
      publicPolitics([event({ mandateKind: "final" })], [health], now).clock!
        .deadlineAt,
    ).toBe("2026-11-18T10:00:00.000Z");
    expect(
      publicPolitics(
        [event({ mandateKind: "second" }), extension],
        [health],
        now,
      ).clock,
    ).toBeNull();
    expect(
      publicPolitics([event({ mandateKind: null })], [health], now).clock,
    ).toBeNull();
  });
  it("disputes same-source and differently dated cross-source contradictions; recapture does not reactivate them", () => {
    const a = event({
        id: "a",
        type: "confidence_commitment",
        partyIds: ["likud"],
        decision: "support",
      }),
      b = event({
        id: "b",
        revision: "b",
        type: "confidence_commitment",
        partyIds: ["likud"],
        decision: "oppose",
        effectiveAt: "2026-11-05T10:00Z",
      });
    const merged = mergeEvents([a], [b]);
    expect(merged.every((e) => e.status === "disputed")).toBe(true);
    expect(mergeEvents(merged, [b]).every((e) => e.status === "disputed")).toBe(
      true,
    );
    expect(publicPolitics(merged, [health], now).events).toEqual([]);
    const resolved = event({
      ...b,
      id: "resolved",
      revision: "resolved",
      supersedes: a.id,
      evidenceQuote:
        "We changed our position and instead oppose Nominee A in the confidence vote.",
    });
    const fixed = mergeEvents(merged, [resolved]);
    expect(
      fixed.filter((e) => e.status === "confirmed").map((e) => e.id),
    ).toEqual(["resolved"]);
  });
  it("requires exact source quote, correct authority, target and grounded date; speculative source text is not a fact", () => {
    const candidate: EventCandidate = {
      type: "mandate",
      effectiveAt: publishedAt,
      partyIds: [],
      person: "Nominee A",
      decision: null,
      mandateKind: "first",
      durationDays: null,
      evidenceQuote:
        "The President assigned Nominee A the first task of forming a government.",
      supersedes: null,
    };
    expect(
      validateEvent(candidate, source, candidate.evidenceQuote, now),
    ).not.toBeNull();
    for (const invalid of [
      { decision: "cabinet" },
      { durationDays: 5 },
      { positionScope: "confidence" },
      { voteOutcome: "passed" },
    ]) {
      expect(
        validateEvent(
          { ...candidate, ...invalid } as EventCandidate,
          source,
          candidate.evidenceQuote,
          now,
        ),
      ).toBeNull();
    }

    expect(
      validateEvent(
        candidate,
        { ...source, authority: "party" },
        candidate.evidenceQuote,
        now,
      ),
    ).toBeNull();
    expect(
      validateEvent(candidate, source, "different article", now),
    ).toBeNull();
    expect(
      validateEvent(
        {
          ...candidate,
          evidenceQuote:
            "The President may assign Nominee A the first task of forming a government.",
        },
        source,
        "The President may assign Nominee A the first task of forming a government.",
        now,
      ),
    ).toBeNull();
  });
});
describe("official publication and scoring", () => {
  const html =
    "<h1>בחירות לכנסת ה-26</h1><p>27 באוקטובר 2026</p><h3>תוצאות סופיות רשמיות</h3><table><tr><th>שם הרשימה</th><th>אותיות הרשימה</th><th>מנדטים</th></tr><tr><td>Likud</td><td>מחל</td><td>65</td></tr><tr><td>New list</td><td>חדש</td><td>55</td></tr></table>";
  const options = {
    election: "2026-10-27",
    knesset: 26,
    dateMarkers: ["27 באוקטובר 2026"],
    now,
    url: "https://cdn-votes26.bechirot.gov.il/nationalresults",
    letters: { מחל: "likud" },
  };
  it("requires published final heading, matching election,120 seats and rejects test/future publication environments", () => {
    const result = parseOfficialSeats(html, options);
    expect(result.seatStatus).toBe("official");
    expect(result.parties.some((p) => !p.profiled)).toBe(true);
    for (const changed of [
      html.replace("65", "64"),
      html.replace("ה-26", "ה-25"),
      html.replace("תוצאות סופיות רשמיות", "תוצאות יפורסמו"),
      html + "<p>סביבת בדיקות</p>",
      html + "<p>תוצאות סופיות רשמיות יפורסמו ביום4.11</p>",
    ])
      expect(() => parseOfficialSeats(changed, options)).toThrow();
  });
  it("never uses webpage metadata as a Gazette clock, and accepts only an explicit occurred publication notice", () => {
    const metadata =
      '<script type="application/ld+json">' +
      JSON.stringify({
        "@type": "NewsArticle",
        articleBody: "Official publication table",
        datePublished: publishedAt,
      }) +
      "</script>";
    const parsed = parseOfficialSeats(html + metadata, options);
    expect(parsed.publishedAt).toBe(publishedAt);
    expect(parsed.statutoryPublication).toBeUndefined();
    const ledger = emptyLedger();
    ledger.seatSnapshots.push(parsed);
    expect(resolveLifecycle(ledger, now).politics.clock).toBeNull();
    const gazette = parseOfficialSeats(
      html +
        metadata +
        "<p>Official results published in the Official Gazette 4.11.2026</p>",
      options,
    );
    ledger.seatSnapshots.push(gazette);
    expect(resolveLifecycle(ledger, now).politics.clock?.deadlineAt).toBe(
      "2026-11-11",
    );
    ledger.events.push(event());
    ledger.health = [{ ...health, status: "unavailable" }];
    expect(resolveLifecycle(ledger, now).politics.clock).toBeNull();
    expect(() =>
      parseOfficialSeats(html, { ...options, now: "2026-10-26T10:00Z" }),
    ).toThrow("before_current_election_close");
    expect(selectSeats([parsed], "2026-10-26T10:00Z").basis).toBe(
      "campaign_forecast",
    );
  });
  it("scores registered list universe and threshold calls, reports unexpected elected lists and separate bloc point/list sums", () => {
    const actual = {
      ...official(),
      pointSeats: { likud: 60, dem: 55, new: 5 },
    };
    const score = evaluateSeats({ likud: 65, dem: 55 }, actual, {
      label: "forecast",
      registration: "registered",
      generatedAt: publishedAt,
      predictionRevision: "x",
      thresholdCalls: { likud: true, dem: false },
      blocPoints: { net: 62 },
      majority: { net: 60, oppZionist: 20, neither: 20 },
      partyBlocs: { likud: "net", dem: "opp" },
    });
    expect(score.listMae).toBe(2.5);
    expect(score.thresholdCorrect).toBe(1);
    expect(score.thresholdTotal).toBe(2);
    expect(score.unexpectedElected).toEqual([{ id: "new", seats: 5 }]);
    expect(score.blocs.net.listSum).toBe(65);
    expect(score.blocs.net.point).toBe(62);
    expect(score.majority!.actual).toBe("neither");
  });
});
