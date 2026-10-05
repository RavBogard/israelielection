import { describe, it, expect } from "vitest";
import configJson from "../data/results.json";
import { makeSnapshot, validCount, validSnapshot, rotateSnapshot, savedSnapshots } from "./results-snapshot";
import { captureAllowed } from "./results-capture";
import { parseExpc, countedTurnout, type ResultsConfig } from "./results";
import { readFileSync } from "node:fs";
const config = configJson as ResultsConfig;
const now = Date.parse("2026-10-28T01:00:00Z"); const time = new Date(now).toISOString();
const count = { eligible: 200, voted: 100, valid: 98, invalid: 2, localities: 1, votes: { a: 60, b: 38 } };
const snapshot = makeSnapshot(count, config, time, null);
describe("durable count validation and rotation", () => {
  it("does not invent source update time and rejects pre-close/wrong-election/tampered snapshots", () => {
    expect(validSnapshot(snapshot, config, now)).toBe(true); expect(snapshot.sourceUpdatedAt).toBeNull();
    expect(validSnapshot(snapshot, config, Date.parse(config.pollsClose) - 1)).toBe(false);
    expect(validSnapshot({ ...snapshot, election: "2022" }, config, now)).toBe(false);
    expect(validSnapshot({ ...snapshot, count: { ...count, valid: 99 } }, config, now)).toBe(false);
    expect(savedSnapshots({ current: { ...snapshot, hash: "bad" }, previous: snapshot }, config, now)).toEqual([snapshot]);
  });
  it("accepts corrected lower counts but refuses fallback, fixture and unchanged fetch-time commits", () => {
    const lower = makeSnapshot({ ...count, voted: 99, valid: 97, votes: { a: 59, b: 38 } }, config, time, null);
    const store = { current: snapshot, previous: null };
    expect(rotateSnapshot(store, { state: "fresh", snapshot: lower }, config, now)?.previous).toEqual(snapshot);
    expect(rotateSnapshot(store, { state: "stale", snapshot: lower }, config, now)).toBeNull();
    expect(rotateSnapshot(store, { state: "fresh", fixture: true, snapshot: lower }, config, now)).toBeNull();
    expect(rotateSnapshot(store, { state: "fresh", snapshot: { ...snapshot, capturedAt: time } }, config, now)).toBeNull();
  });
  it("validates partial envelopes/accounting without an invented percent-complete", () => {
    expect(validCount(count)).toBe(true); expect(validCount({ ...count, votes: { a: 60, b: 39 } })).toBe(false);
    const c = parseExpc(readFileSync("lib/fixtures/cec-2022-expc.csv", "utf8"));
    expect(c.envelopes?.present).toBe(true); expect(c.envelopes!.valid).toBe(458714);
    expect(countedTurnout(c)).toBeLessThan(c.voted / c.eligible);
    expect(validCount(c)).toBe(true);
    expect(() => parseExpc("סמל ישוב,בזב,מצביעים,פסולים,כשרים,a\n1,100,9,0,9")).toThrow();
    expect(() => parseExpc("סמל ישוב,בזב,מצביעים,פסולים,כשרים,a\n1,100,9,0,9,junk")).toThrow();
  });
  it("bounds automatic captures and permits manual later, never before close", () => {
    const start = Date.parse(config.pollsClose);
    expect(captureAllowed(config.pollsClose, start - 1, true)).toBe(false);
    expect(captureAllowed(config.pollsClose, start + 7 * 86400_000, false)).toBe(true);
    expect(captureAllowed(config.pollsClose, start + 8 * 86400_000, false)).toBe(false);
    expect(captureAllowed(config.pollsClose, start + 8 * 86400_000, true)).toBe(true);
  });
});
