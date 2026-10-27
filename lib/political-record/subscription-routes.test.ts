import { afterEach, expect, it, vi } from "vitest";
import { Webhook } from "svix";
const mocks = vi.hoisted(() => ({ service: vi.fn(), limit: vi.fn() }));
vi.mock("./subscriptions", () => ({ configuredSubscriptions: mocks.service }));
vi.mock("./rate-limit", () => ({
  sharedLimit: mocks.limit,
  requestLimit: mocks.limit,
}));
import { subscriptionRoute } from "./subscription-routes";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
it("verifies the actual raw Svix payload before accessing recipient state", async () => {
  vi.stubEnv("SUBSCRIPTIONS_ENABLED", "true");
  const secret = "whsec_" + Buffer.alloc(32, 7).toString("base64");
  vi.stubEnv("RESEND_WEBHOOK_SECRET", secret);
  mocks.limit.mockResolvedValue({ allowed: true });
  const body = JSON.stringify({
      type: "email.bounced",
      data: { email_id: "public-fixture-provider-id" },
    }),
    timestamp = new Date(),
    id = "msg_fixture";
  const signature = new Webhook(secret).sign(id, timestamp, body);
  const request = (raw: string) =>
    new Request("https://example.org/api/subscriptions/webhook", {
      method: "POST",
      body: raw,
      headers: {
        "svix-id": id,
        "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
        "svix-signature": signature,
      },
    });
  expect((await subscriptionRoute(request(body + " "), "webhook")).status).toBe(
    401,
  );
  expect(mocks.service).not.toHaveBeenCalled();
  const webhook = vi.fn().mockResolvedValue({ status: "accepted" });
  mocks.service.mockReturnValue({ webhook, close: vi.fn() });
  expect((await subscriptionRoute(request(body), "webhook")).status).toBe(200);
  expect(webhook).toHaveBeenCalledWith(
    id,
    "email.bounced",
    "public-fixture-provider-id",
  );
});
it("leaves unconfigured capabilities off and never changes consent on a read", async () => {
  const request = new Request("https://example.org/api/subscriptions", {
    method: "POST",
    body: "{}",
  });
  expect((await subscriptionRoute(request)).status).toBe(404);
  expect(mocks.service).not.toHaveBeenCalled();
  vi.stubEnv("SUBSCRIPTIONS_ENABLED", "true");
  vi.stubEnv("SUBSCRIPTION_TOKEN_SECRET", "test-secret".repeat(4));
  mocks.limit.mockResolvedValue({ allowed: true });
  mocks.service.mockReturnValue(null);
  const response = await subscriptionRoute(
    new Request("https://example.org/api/subscriptions", {
      method: "POST",
      body: "{}",
    }),
  );
  expect(response.status).toBe(503);
});
