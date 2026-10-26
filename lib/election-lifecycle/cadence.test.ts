import { expect, it } from "vitest";
import {
  CADENCE_START,
  REGULAR_START,
  cycleAt,
  nextCycleAfter,
  cadenceMetadata,
  cadenceFresh,
} from "./cadence";
it("has exactly40 intensive slots,07:45lastnight and08:00firstslow Israel time", () => {
  const slots = [];
  for (let at = CADENCE_START; at < REGULAR_START; at = nextCycleAfter(at))
    slots.push(at);
  expect(slots).toHaveLength(40);
  expect(new Date(slots.at(-1)!).toISOString()).toBe(
    "2026-10-28T05:45:00.000Z",
  );
  expect(cycleAt(CADENCE_START - 1)).toBeNull();
  expect(cycleAt(REGULAR_START)).toBe(REGULAR_START);
  expect(nextCycleAfter(REGULAR_START)).toBe(Date.parse("2026-10-28T09:00Z"));
});
it("anchors stale grace to due slot, never rolls expiry forward on read/manualsuccess; failures are immediate", () => {
  const last = "2026-10-28T06:01Z";
  expect(cadenceFresh("2026-10-28T08:59Z", last)).toBe(true);
  const late = cadenceMetadata("2026-10-28T09:06Z", last);
  expect(late.status).toBe("overdue");
  expect(late.dueAt).toBe("2026-10-28T09:00:00.000Z");
  expect(late.expiresAt).toBe("2026-10-28T09:05:00.000Z");
  expect(cadenceFresh("2026-10-28T06:02Z", last, null, true)).toBe(false);
  expect(cadenceMetadata("2026-10-27T19:00Z", null).status).toBe("waiting");
});
