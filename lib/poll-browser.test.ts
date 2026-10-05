import { expect, it } from "vitest";
import { pollsData, parties } from "./data";
import { filterPolls, readPollFilter, undatedListNames } from "./poll-browser";
it("filters known publishers/dates/coverage and validates shared filter values", () => {
  const valid = readPollFilter(new URLSearchParams("from=bad&pollster=unknown&party=likud,likud,bogus"), pollsData.polls, parties.map((p) => p.id));
  expect(valid).toEqual({ from: "", to: "", pollster: "", parties: ["likud"] });
  const result = filterPolls(pollsData.polls, { from: "2026-10-01", to: "2026-10-05", pollster: "Maariv", parties: ["likud"] });
  expect(result.length).toBeGreaterThan(0); expect(result.every((p) => p.pollster === "Maariv" && p.published >= "2026-10-01")).toBe(true);
  expect(filterPolls(pollsData.polls, { ...valid, from: "2099-01-01" })).toEqual([]);
});

it("preserves explicitly unrecorded list-figure dates independently of publication metadata",()=>{
 const poll=pollsData.polls.find(p=>p.id==="c14")!;expect(undatedListNames(poll,parties)).toEqual(parties.filter(p=>["otzma","shas","utj","rz","poi"].includes(p.id)).map(p=>p.name));expect(undatedListNames({...poll,results:{likud:poll.results.likud}},parties)).toEqual([]);expect(poll.published).toBeTruthy();expect(poll.results.shas.dateUncertain).toBe(true);
});
