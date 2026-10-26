import { afterEach, expect, it, vi } from "vitest";
import { scheduledCycle } from "./scheduled-cycle";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("binds originaltrigger slot and verifies exact schedule/destination, rejecting unavailable/mismatched metadata", async () => {
  vi.stubEnv("VERCEL_ENV", "preview");
  vi.stubEnv("QSTASH_TOKEN", "test");
  vi.stubEnv(
    "ELECTION_LIFECYCLE_WORKER_URL",
    "https://example.org/api/election-lifecycle/worker",
  );
  const metadata = {
    messageId: "message1",
    url: process.env.ELECTION_LIFECYCLE_WORKER_URL,
    scheduleId: "lifecycle-preview-night-2026",
    createdAt: Date.parse("2026-10-28T05:45:01Z"),
  };
  const fetch = vi.fn(async () => new Response(JSON.stringify(metadata)));
  vi.stubGlobal("fetch", fetch);
  expect(
    (await scheduledCycle("message1", "night", "2026-10-28T06:10Z")).cycleAt,
  ).toBe("2026-10-28T05:45:00.000Z");
  metadata.url = "https://unverified.example/";
  await expect(
    scheduledCycle("message1", "night", "2026-10-28T06:10Z"),
  ).rejects.toThrow("schedule_metadata_mismatch");
  await expect(scheduledCycle(null, "regular")).rejects.toThrow(
    "schedule_message_id_required",
  );
});
