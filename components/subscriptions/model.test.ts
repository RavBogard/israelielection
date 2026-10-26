import { describe, it, expect } from "vitest";
import {
  privateToken,
  tokenFreeUrl,
  validTopics,
  readDistribution,
  hasSubscriptionSelection,
  emptyFollows,
} from "./model";
import { followsText } from "@/lib/i18n/follows";
import { subscriptionText } from "@/lib/i18n/subscriptions";
import { LANGS } from "@/lib/i18n";
describe("private subscription controls", () => {
  it("preserves follows-only choices and explicit delivery settings", () => {
    const saved = {
      follows: { parties: ["likud"], issues: ["courts"], places: ["3000"] },
      delivery: { dailyDigest: false, majorEvents: true, corrections: false },
    };
    expect(readDistribution(saved, [])).toEqual(saved);
    expect(hasSubscriptionSelection([], saved.follows)).toBe(true);
    expect(hasSubscriptionSelection([], emptyFollows())).toBe(false);
  });
  it("restores legacy delivery semantics without silently opting into new major-event mail", () => {
    expect(readDistribution({}, ["digest"])?.delivery).toEqual({
      dailyDigest: true,
      majorEvents: false,
      corrections: true,
    });
    expect(readDistribution({}, ["formation"])?.delivery).toEqual({
      dailyDigest: false,
      majorEvents: true,
      corrections: true,
    });
    expect(
      readDistribution({ delivery: { dailyDigest: "yes" } }, []),
    ).toBeNull();
    expect(readDistribution(null, [])).toBeNull();
  });
  it("includes explicit choice, original-name and outage copy for all seven editions", () => {
    for (const lang of LANGS)
      for (const value of Object.values(followsText(lang)))
        expect(value.length).toBeGreaterThan(0);
  });
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
