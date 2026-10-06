import { describe, expect, it } from "vitest";
import { glance, readings } from "@/components/profile/model";
import { averagePoll, blocs, parties } from "./data";
import { HOME_MOSAIC_ORDER, HOME_RACE_ORDER, homeRaceModel } from "./home-race";
import { blocSeats, blocText, listSeats } from "./list-seats";
import { navFacts } from "./nav-facts";
import { BLOC_ORDER, BLOC_SEAT_ORDER, seatFigure, seatText } from "./polls";

describe("one number per fact", () => {
  const race = homeRaceModel(averagePoll, parties, blocs);
  it("gives every list the same seat figure on the home race, Party Map, profile and Compare", () => {
    for (const p of parties) {
      const s = listSeats(p.id), r = averagePoll.results[p.id];
      const member = race.rows.flatMap((row) => row.members).find((m) => m.id === p.id)!;
      const g = glance(p, readings(p));
      // Party Map and Compare read averagePoll.results[id].seats; the home race reads the same poll.
      expect(member.seats ?? 0).toBe(r?.seats ?? 0);
      expect(s.seats).toBe(r && !r.belowThreshold ? r.seats : 0);
      expect(g.avg ?? 0).toBe(s.seats);
      expect(g.below).toBe(s.below);
      expect(s.text).toBe(seatText(averagePoll, p.id));
      if (s.text && !s.below) expect(s.text).toBe(seatFigure(member.seats!));
      if (s.below) expect(s.text).toBe("below");
    }
  });
  it("adds the blocs the same way in the home race, the profile, the menus and the resources", () => {
    for (const row of race.rows) {
      expect(blocSeats(row.id)).toBe(row.seats);
      expect(blocText(row.id)).toBe(seatFigure(row.seats));
      for (const p of parties.filter((q) => q.bloc === row.id)) expect(Math.round(glance(p, readings(p)).blocSeats * 10) / 10).toBe(row.seats);
    }
    expect(navFacts({ netSeats: race.rows.find((r) => r.id === "net")!.seats, localities: 0, elections: [] }).parties).toBe(`Netanyahu bloc ${blocText("net")} of 120, polling average`);
  });
  it("prints averages to one decimal and below-threshold lists as below, never 0", () => {
    expect(seatFigure(21)).toBe("21.0");
    expect(seatFigure(54.64)).toBe("54.6");
    expect(seatText({ ...averagePoll, results: { x: { seats: 0, belowThreshold: true } } }, "x")).toBe("below");
    expect(seatText({ ...averagePoll, id: "poll", results: { x: { seats: 22 } } }, "x")).toBe("22");
  });
  it("keeps one bloc order for lists and one for 120-seat drawings", () => {
    expect(HOME_RACE_ORDER).toBe(BLOC_ORDER);
    expect(HOME_MOSAIC_ORDER).toBe(BLOC_SEAT_ORDER);
    expect(blocs.map((b) => b.id)).toEqual([...BLOC_ORDER]);
    expect([...BLOC_SEAT_ORDER].sort()).toEqual([...BLOC_ORDER].sort());
  });
});
