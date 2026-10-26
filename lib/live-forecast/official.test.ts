import { afterEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("../election-lifecycle/count-store", () => ({
  readCountRecord: mock.read,
}));
import { acquireOfficial } from "./official";
afterEach(() => {
  vi.unstubAllGlobals();
  mock.read.mockReset();
});
it("consumes already acquired count health without a second CEC request, preserving the projection gate", async () => {
  const fetch = vi.fn(() => {
    throw new Error("duplicate CEC fetch");
  });
  vi.stubGlobal("fetch", fetch);
  mock.read.mockResolvedValue({
    current: {},
    raw: "סמל ישוב,בזב,מצביעים,פסולים,כשרים,מחל\n1,200,100,2,98,98",
    health: { error: null },
  });
  const source = await acquireOfficial("2026-10-28T06:00Z");
  expect(source.status).toBe("rejected");
  expect(source.note).toContain("odds exclude");
  expect(fetch).not.toHaveBeenCalled();
});
