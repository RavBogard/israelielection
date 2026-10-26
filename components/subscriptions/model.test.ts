import { describe, it, expect } from "vitest";
import { privateToken, tokenFreeUrl, validTopics } from "./model";
import { subscriptionText } from "@/lib/i18n/subscriptions";
import { LANGS } from "@/lib/i18n";
describe("private subscription controls", () => {
  it("accepts fragment tokens and backward-compatible query links, then removes both", () => {
    const token = "private_test_token_1234567890";
    expect(
      privateToken(`https://example.test/subscriptions/confirm#token=${token}`),
    ).toBe(token);
    expect(
      privateToken(`https://example.test/subscriptions/confirm?token=${token}`),
    ).toBe(token);
    expect(
      tokenFreeUrl(
        `https://example.test/subscriptions/confirm?token=${token}&x=1#token=${token}`,
      ),
    ).toBe("/subscriptions/confirm?x=1");
    expect(
      privateToken("https://example.test/subscriptions/confirm?token=invalid"),
    ).toBeNull();
  });
  it("never accepts arbitrary alert topics", () => {
    expect(validTopics(["digest", "private-entity", "results"])).toEqual([
      "digest",
      "results",
    ]);
    expect(validTopics(null)).toEqual([]);
  });
  it("provides consent, unavailable and explicit confirmation wording in every edition", () => {
    for (const lang of LANGS) {
      const copy = subscriptionText(lang);
      expect(copy.consent.length).toBeGreaterThan(10);
      expect(copy.confirmAction).toBeTruthy();
      expect(copy.unavailable).toBeTruthy();
      expect(copy.privateLink).toBeTruthy();
    }
  });
});
