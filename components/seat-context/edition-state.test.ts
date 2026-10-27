import { describe, it, expect } from "vitest";
import {
  authoritativeEdition,
  blocksCurrentContext,
  canonicalSeatEdition,
  initialContextWins,
  compatibleInitialEdition,
} from "./edition-state";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
describe("open client edition changes", () => {
  it("clears obsolete26current seats on authoritative27switch, not registry/source failure", () => {
    const old = { election: "2026-10-27" } as SharedSeatContext;
    expect(
      blocksCurrentContext(
        old,
        authoritativeEdition({
          currentElectionId: "il-knesset-27",
          workspaceState: "available",
        }),
      ),
    ).toBe(true);
    expect(
      authoritativeEdition({
        currentElectionId: "il-knesset-27",
        workspaceState: "unavailable",
      }),
    ).toBeNull();
    expect(blocksCurrentContext(old, null)).toBe(false);
  });
  it("accepts legacy26ID compatibility but no arbitrary dates", () => {
    expect(canonicalSeatEdition("2026-10-27")).toBe("il-knesset-26");
    expect(
      blocksCurrentContext(
        { election: "il-knesset-27" } as SharedSeatContext,
        "il-knesset-27",
      ),
    ).toBe(false);
    expect(
      authoritativeEdition({
        currentElectionId: "unknown",
        workspaceState: "available",
      }),
    ).toBeNull();
  });
});

it("never lets an old26SSR sequence100 outrank active27sequence1 or an authoritative switch", () => {
  const old = { election: "2026-10-27", sequence: 100 } as SharedSeatContext,
    next = { election: "il-knesset-27", sequence: 1 } as SharedSeatContext;
  expect(initialContextWins(old, next)).toBe(false);
  expect(compatibleInitialEdition(old, "il-knesset-27")).toBe(false);
  expect(compatibleInitialEdition(next, "il-knesset-27")).toBe(true);
  expect(initialContextWins({ ...next, sequence: 2 }, next)).toBe(true);
});
