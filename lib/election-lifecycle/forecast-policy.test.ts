import { expect, it } from "vitest";
import { campaignWritePolicy } from "../../scripts/forecast/write-policy.mjs";
const pollsClose = "2026-10-27T20:00:00Z",
  now = Date.parse(pollsClose) + 1;
it("freezes campaign writes after close without retroactively certifying a provisional run", () => {
  expect(campaignWritePolicy({ now, pollsClose }).allowed).toBe(false);
  expect(campaignWritePolicy({ now, pollsClose, final: true }).reason).toBe(
    "cannot_register_after_close",
  );
  expect(
    campaignWritePolicy({
      now,
      pollsClose,
      final: true,
      historicalOverride: true,
    }).allowed,
  ).toBe(false);
  expect(
    campaignWritePolicy({ now, pollsClose, historicalOverride: true }).allowed,
  ).toBe(true);
  expect(
    campaignWritePolicy({ now, pollsClose, sensitivity: true }),
  ).toMatchObject({ allowed: true, readOnly: true });
  expect(
    campaignWritePolicy({ now: now - 2, pollsClose, final: true }).allowed,
  ).toBe(true);
});
