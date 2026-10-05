import { describe, expect, it } from "vitest";
import { changes, changeFilters, parseChangeReader, recordChangeVisit, toggleChangeBookmark, filterChanges } from "./changes";
const empty=parseChangeReader("");
describe("material-change log",()=>{
  it("requires source provenance, before/after and tool links without inventing human approval",()=>{
    expect(new Set(changes.map(e=>e.id)).size).toBe(changes.length);
    for(const e of changes){expect(e.before).toBeTruthy();expect(e.after).toBeTruthy();expect(e.why).toBeTruthy();expect(e.sources.length).toBeGreaterThan(0);expect(e.review.human).toBeNull();expect(e.review.method).toContain("automated");for(const t of e.tools)expect(t.href).toMatch(/^\//);for(const id of e.supersedes)expect(changes.some(x=>x.id===id)).toBe(true);}
  });
  it("filters effective dates separately from when old developments were logged",()=>{
    expect(filterChanges(changes,changeFilters(new URLSearchParams("from=2026-10-05&to=2026-10-05")),empty)).toHaveLength(3);
    expect(filterChanges(changes,changeFilters(new URLSearchParams("basis=logged&from=2026-10-05&to=2026-10-05")),empty)).toHaveLength(6);
    const announcement=filterChanges(changes,changeFilters(new URLSearchParams("topic=Lists")),empty)[0];
    expect(announcement.date).toBe("2026-04-26");
    expect(announcement.sources.find(s=>s.url==="https://en.idi.org.il/articles/64068")?.date).toBe("2026-04-29");
  });
  it("keeps the prior visit while advancing the cursor and compares logging time",()=>{
    const state=recordChangeVisit({...empty,lastVisit:"2026-10-05T19:00:00Z"},"2026-10-05T20:00:00Z");
    expect(state.previousVisit).toBe("2026-10-05T19:00:00Z");
    expect(filterChanges(changes,changeFilters(new URLSearchParams("since=last")),state)).toHaveLength(6);
    expect(filterChanges(changes,changeFilters(new URLSearchParams("since=last")),recordChangeVisit(state,"2026-10-06T20:00:00Z"))).toEqual([]);
  });
  it("saves/removes bookmarks without changing visit timestamps and survives corrupt storage",()=>{
    const saved=toggleChangeBookmark(empty,changes[0].id);
    expect(saved.lastVisit).toBeNull();expect(filterChanges(changes,changeFilters(new URLSearchParams("saved=1")),saved)).toHaveLength(1);
    expect(toggleChangeBookmark(saved,changes[0].id).bookmarks).toEqual([]);expect(parseChangeReader("oops")).toEqual(empty);
    expect(parseChangeReader('{"bookmarks":["x","x",7],"lastVisit":"bad"}')).toEqual({...empty,bookmarks:["x"]});
  });
  it("does not convert invalid dates or unknown topics into accidental cutoffs",()=>{
    const f=changeFilters(new URLSearchParams("topic=Unknown&from=2026-02-31&to=nonsense"));expect(f.topic).toBe("all");expect(f.from).toBe("");expect(f.to).toBe("");
  });
});
