import { describe, expect, it } from "vitest";
import { averagePoll, blocs, mainPolls, parties } from "./data";
import { citeText, findingSentence, israelDate, noNewLabel, pollSlip, sincePolls } from "./home-since";
import type { Poll } from "./types";

const poll = (id: string, pollster: string, published: string, seats: Record<string, number>, extra: Partial<Poll> = {}): Poll => ({
  id, pollster, firm: null, fieldwork: null, published, via: null, url: null, n: null, margin: null, note: null,
  results: Object.fromEntries(Object.entries(seats).map(([k, v]) => [k, { seats: v }])), combined: [], ...extra,
});
// likud and shas are net, yashar is opp, raam is arab.
const short = (id: string, pollster: string, date = "2026-10-01") => poll(id, pollster, date, { likud: 30, shas: 24, yashar: 52, raam: 14 });
const over = (id: string, pollster: string, date = "2026-10-01") => poll(id, pollster, date, { likud: 40, shas: 24, yashar: 44, raam: 12 });

describe("since yesterday", () => {
  it("reads the Israeli calendar, not UTC", () => {
    expect(israelDate(Date.parse("2026-10-05T22:30:00Z"))).toBe("2026-10-06");
    expect(israelDate(Date.parse("2026-10-05T20:00:00Z"))).toBe("2026-10-05");
  });
  it("takes today's and yesterday's polls, newest first, and falls back to the newest one", () => {
    const ps = [short("a", "A", "2026-10-04"), short("b", "B", "2026-10-05"), short("c", "C", "2026-10-06"), { ...short("x", "Kan 11", "2026-10-06"), kind: "exit" as const }];
    expect(sincePolls(ps, "2026-10-06")).toMatchObject({ fresh: true, polls: [{ id: "c" }, { id: "b" }] });
    const stale = sincePolls(ps, "2026-10-09");
    expect(stale.fresh).toBe(false);
    expect(stale.polls.map((p) => p.id)).toEqual(["c"]);
    expect(noNewLabel(stale.polls[0])).toBe("No new polls since Oct 6");
  });
  it("draws a slip with bloc totals in seat order and marks a bloc at 61 or more", () => {
    const s = pollSlip(over("o", "Channel 14"), parties, blocs);
    expect(s.blocs.map((b) => [b.id, b.seats])).toEqual([["net", 64], ["mid", 0], ["opp", 44], ["arab", 12]]);
    expect(s.majority).toEqual(["net"]);
    expect(pollSlip(short("s", "Maariv"), parties, blocs).majority).toEqual([]);
  });
});

describe("finding sentence", () => {
  it("names the only poll over 61", () => {
    const ps = [...["A", "B", "C", "D", "E", "F"].map((n) => short(n, n)), over("g", "Channel 14")];
    expect(findingSentence(ps, parties, blocs)).toBe("The Netanyahu bloc is short of 61 in 6 of 7 current polls; only Channel 14 has it at 61 or more.");
  });
  it("names several, and handles none and all", () => {
    expect(findingSentence([short("a", "A"), over("b", "Channel 14"), over("c", "i24NEWS")], parties, blocs)).toBe("The Netanyahu bloc is short of 61 in 1 of 3 current polls; Channel 14 and i24NEWS have it at 61 or more.");
    expect(findingSentence([short("a", "A"), short("b", "B")], parties, blocs)).toBe("The Netanyahu bloc is short of 61 in both current polls.");
    expect(findingSentence([over("a", "A")], parties, blocs)).toBe("The Netanyahu bloc has 61 or more in the one current poll.");
    expect(findingSentence([], parties, blocs)).toBeNull();
  });
  it("sets aside a poll whose cross-bloc combined seats could carry the bloc over 61", () => {
    const crossed = poll("x", "Zman", "2026-10-01", { likud: 40, yashar: 50 }, { combined: [{ parties: ["shas", "raam"], seats: 30, note: "" }] });
    expect(findingSentence([short("a", "A"), crossed], parties, blocs)).toBe("The Netanyahu bloc is short of 61 in the one current poll. Zman reports lists from different blocs together and is left out.");
  });
  it("matches the live data's own count", () => {
    const s = findingSentence(mainPolls, parties, blocs)!;
    expect(s).toContain(`current poll`);
    expect(s).toMatch(/^The Netanyahu bloc /);
  });
});

describe("cite", () => {
  it("states the average, its date, the figure and the poll count", () => {
    expect(citeText({ ...averagePoll, published: "2026-10-05" }, 7, "Netanyahu bloc", 54.63)).toBe("Israel Votes 2026 polling average, October 5, 2026: Netanyahu bloc 54.6 of 120 seats (7 polls). israelielection.org/polls");
  });
});
