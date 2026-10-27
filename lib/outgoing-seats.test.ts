import { describe, expect, it } from "vitest";
import { parties } from "./data";
import { outgoingSeats, outgoingSeatsData } from "./outgoing-seats";

describe("data/outgoing-seats.json", () => {
  it("covers every party id, with no extra ids", () => {
    const ids = parties.map((p) => p.id).sort();
    expect(Object.keys(outgoingSeatsData.lists).sort()).toEqual(ids);
  });

  it("gives each figure a source and sums its components", () => {
    for (const [id, l] of Object.entries(outgoingSeatsData.lists)) {
      expect(l.sources.length, id).toBeGreaterThan(0);
      if (l.seats !== null) expect(l.components.reduce((s, c) => s + c.seats, 0), id).toBe(l.seats);
    }
  });

  it("reconciles to 120 seats", () => {
    const lists = Object.values(outgoingSeatsData.lists).reduce((s, l) => s + (l.seats ?? 0), 0);
    const off = outgoingSeatsData.reconciliation.notRunning.reduce((s, c) => s + c.seats, 0);
    expect(lists).toBe(outgoingSeatsData.reconciliation.listSum);
    expect(lists + off).toBe(120);
    expect(outgoingSeatsData.reconciliation.total).toBe(120);
  });

  it("looks up by id", () => {
    expect(outgoingSeats("poi")).toBe(0);
    expect(outgoingSeats("nope")).toBeNull();
  });
});

describe("outgoingBlocSeats", () => {
  it("sums each bloc's lists in the outgoing Knesset to 120", async () => {
    const { outgoingBlocSeats } = await import("./outgoing-seats");
    expect(outgoingBlocSeats).toEqual({ net: 68, opp: 42, mid: 0, arab: 10 });
  });
});
