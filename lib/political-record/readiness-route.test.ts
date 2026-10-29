import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ verified: vi.fn(), load: vi.fn() }));
vi.mock("../live-forecast/auth", () => ({ verifyQStash: mocks.verified, workerDestinations: (u?: string) => (u ? [u] : []) }));
vi.mock("../election-lifecycle/store", () => ({
  lifecycleStore: () => ({ load: mocks.load }),
}));
import { POST } from "../../app/api/election-lifecycle/worker/route";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
it("keeps readiness private and does no acquisition on a signed stored-state diagnostic", async () => {
  vi.stubEnv("ELECTION_LIFECYCLE_ENABLED", "true");
  vi.stubEnv(
    "ELECTION_LIFECYCLE_WORKER_URL",
    "https://example.org/api/election-lifecycle/worker",
  );
  const network = vi.fn();
  vi.stubGlobal("fetch", network);
  mocks.verified.mockReturnValue(false);
  const request = () =>
    new Request("https://example.org/api/election-lifecycle/worker", {
      method: "POST",
      body: JSON.stringify({ mode: "readiness" }),
    });
  expect((await POST(request())).status).toBe(401);
  expect(mocks.load).not.toHaveBeenCalled();
  mocks.verified.mockReturnValue(true);
  mocks.load.mockResolvedValue(null);
  const response = await POST(request()),
    body = await response.json();
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(body.countModel).toBe("validation_gated");
  expect(body.revalidationCapability.ready).toBe(false);
  expect(
    body.partyCoverage.some(
      (party: { state: string }) => party.state === "unconfigured",
    ),
  ).toBe(true);
  expect(network).not.toHaveBeenCalled();
  expect(JSON.stringify(body)).not.toMatch(
    /evidenceQuote|captureHash|QSTASH|TOKEN/,
  );
});
