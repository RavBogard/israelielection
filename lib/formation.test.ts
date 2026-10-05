import { describe, expect, it } from "vitest";
import data from "../data/formation.json";
import {
  RESULTS_TO_DISSOLUTION,
  addDays,
  isIsoDate,
  lastTuesdayBefore,
  milestoneDates,
  scheduleFrom,
  withDates,
  type Formation,
  type Milestone,
  type Source,
} from "./formation";

// The JSON must satisfy the type at compile time (tsc) ...
const formation: Formation = data as Formation;

const STATUSES = new Set(["upcoming", "done", "skipped", "extended"]);
const MILESTONE_KEYS = new Set(["id", "title", "rule", "earliest", "latest", "actual", "status", "who", "note", "source"]);

function checkSource(s: Source, where: string) {
  expect(Object.keys(s).sort(), where).toEqual(["date", "name", "url"]);
  expect(typeof s.name === "string" && s.name.length > 0, where).toBe(true);
  expect(typeof s.date, where).toBe("string");
  const url = new URL(s.url);
  expect(url.protocol, where).toBe("https:");
  expect(url.hostname, where).not.toMatch(/wikipedia\.org$/);
}

function texts(f: Formation): [string, string][] {
  const out: [string, string][] = [
    ["title", f.title],
    ["standfirst", f.standfirst],
  ];
  for (const m of f.milestones) {
    out.push([`${m.id}.title`, m.title], [`${m.id}.rule`, m.rule]);
    if (m.note) out.push([`${m.id}.note`, m.note]);
    if (m.who) out.push([`${m.id}.who`, m.who]);
  }
  return out;
}

function allDates(f: Formation): string[] {
  return [f.electionDay, ...f.milestones.flatMap(milestoneDates)];
}

describe("data/formation.json", () => {
  it("matches the Formation shape at run time", () => {
    expect(Object.keys(data).sort()).toEqual(["checked", "electionDay", "milestones", "rulesSource", "standfirst", "title"]);
    expect(isIsoDate(formation.checked)).toBe(true);
    expect(formation.electionDay).toBe("2026-10-27");
    checkSource(formation.rulesSource, "rulesSource");
    expect(formation.milestones.length).toBeGreaterThan(0);
    const ids = new Set<string>();
    for (const m of formation.milestones as Milestone[]) {
      for (const k of Object.keys(m)) expect(MILESTONE_KEYS.has(k), `${m.id}.${k}`).toBe(true);
      expect(m.id).toMatch(/^[a-z0-9-]+$/);
      expect(ids.has(m.id), m.id).toBe(false);
      ids.add(m.id);
      expect(m.title.length, m.id).toBeGreaterThan(0);
      expect(m.rule.length, m.id).toBeGreaterThan(0);
      expect(STATUSES.has(m.status), m.id).toBe(true);
      checkSource(m.source, m.id);
    }
  });

  it("has a milestone for every step the schedule computes", () => {
    const ids = formation.milestones.map((m) => m.id);
    for (const key of Object.keys(scheduleFrom("2026-11-04"))) expect(ids, key).toContain(key);
  });

  it("uses ISO dates in non-decreasing order", () => {
    const dates = allDates(formation);
    for (const d of dates) expect(isIsoDate(d), d).toBe(true);
    for (let i = 1; i < dates.length; i++) expect(dates[i] >= dates[i - 1], `${dates[i - 1]} -> ${dates[i]}`).toBe(true);
  });

  it("keeps dates in order once the results date is known", () => {
    const f = structuredClone(formation);
    f.milestones.find((m) => m.id === "results")!.actual = "2026-11-04";
    const dates = allDates(withDates(f));
    for (const d of dates) expect(isIsoDate(d), d).toBe(true);
    for (let i = 1; i < dates.length; i++) expect(dates[i] >= dates[i - 1], `${dates[i - 1]} -> ${dates[i]}`).toBe(true);
  });

  it("has no first-person voice", () => {
    for (const [where, t] of texts(formation)) {
      expect(t, where).not.toMatch(/\b(I|We|Our|Us)\b/);
      expect(t, where).not.toMatch(/\b(we|our|ours|us|me|my)\b/);
    }
  });

  it("keeps titles to 60 characters", () => {
    expect(formation.title.length).toBeLessThanOrEqual(60);
    for (const m of formation.milestones) expect(m.title.length, m.id).toBeLessThanOrEqual(60);
  });

  it("states the same maximum as the law's periods", () => {
    expect(RESULTS_TO_DISSOLUTION).toBe(117);
    expect(formation.standfirst).toContain(`${RESULTS_TO_DISSOLUTION} days`);
  });
});

describe("lib/formation", () => {
  it("adds calendar days across month ends", () => {
    expect(addDays("2026-11-28", 7)).toBe("2026-12-05");
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
  });

  it("finds the last Tuesday before a day count", () => {
    // Day 90 from 2026-10-07 is Tuesday 2027-01-05, which is still inside the period.
    expect(lastTuesdayBefore("2026-10-07", 90)).toBe("2027-01-05");
    // Day 90 from 2026-10-08 is Wednesday 2027-01-06, so the day before.
    expect(lastTuesdayBefore("2026-10-08", 90)).toBe("2027-01-05");
    expect(new Date("2027-01-05T00:00:00Z").getUTCDay()).toBe(2);
  });

  it("computes the longest path from the published results", () => {
    const s = scheduleFrom("2026-11-04");
    expect(s["first-tasked"]).toBe("2026-11-11");
    expect(s["first-extension"]).toBe(addDays("2026-11-04", 49));
    expect(s["third-period"]).toBe(addDays("2026-11-04", 117));
    expect(s.government).toBe(addDays("2026-11-04", 124));
  });

  it("rejects malformed dates", () => {
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2026-10-27")).toBe(true);
  });
});
