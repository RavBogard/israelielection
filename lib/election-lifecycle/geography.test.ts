import { expect, it, vi } from "vitest";
import { parseGeography, acquireGeography } from "./geography";
import { campaignContext } from "./resolver";
const csv =
  "סמל ישוב,בזב,מצביעים,פסולים,כשרים,מחל,חדש\n1,150,90,0,90,80,10\n9999,0,10,0,10,2,8";
it("retains unknown lists and separates envelopes; only reconciliation to published official votes qualifies complete geography", () => {
  const now = "2026-11-04T20:00Z",
    partial = parseGeography(csv, now, null);
  expect(partial.rows).toHaveLength(1);
  expect(partial.envelopes.valid).toBe(10);
  expect(partial.complete).toBe(false);
  expect(partial.coverage).toBe("unknown");
  const unknown = partial.lists.find((p) => p.letters === "חדש")!.id,
    official = {
      ...campaignContext(now),
      seatStatus: "official" as const,
      basis: "official_seats" as const,
      officialVotes: { valid: 100, byParty: { likud: 82, [unknown]: 18 } },
    };
  const complete = parseGeography(csv, now, official);
  expect(complete.complete).toBe(true);
  expect(complete.totals.valid).toBe(100);
  expect(complete.totals.eligible).toBe(150);
  expect(
    parseGeography(csv.replace("80,10", "79,11"), now, official).complete,
  ).toBe(false);
  expect(() => parseGeography(csv, "2026-10-27T19:59Z", null)).toThrow(
    "preclose",
  );
  expect(() =>
    parseGeography(csv.replace("80,10", "81,10"), now, null),
  ).toThrow();
});

it("reuses the cycle's complete CSV for geography without another official-source fetch", async () => {
  const fetch = vi.fn(() => {
    throw new Error("duplicate source fetch");
  });
  vi.stubGlobal("fetch", fetch);
  try {
    const result = await acquireGeography("2026-10-28T06:00Z", null, csv);
    expect(result?.snapshot.rows).toHaveLength(1);
    expect(fetch).not.toHaveBeenCalled();
  } finally {
    vi.unstubAllGlobals();
  }
});
