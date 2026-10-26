import { expect, it } from "vitest";
import { phaseBriefingGuidance } from "./briefing-context";
import { emptyLedger, resolveLifecycle } from "./resolver";
it("frames an unavailable lifecycle honestly and distinguishes withheld claims and political acts", () => {
  expect(phaseBriefingGuidance(null)).toContain("Do not assume");
  const snapshot = resolveLifecycle(emptyLedger(), "2026-11-04T12:00Z"),
    prompt = phaseBriefingGuidance(snapshot);
  expect(prompt).toContain("Talks are not agreement");
  expect(prompt).toContain("withheld");
  expect(prompt).toContain(snapshot.revision);
});
