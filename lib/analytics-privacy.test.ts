import { describe, it, expect } from "vitest";
import {
  installAnalyticsPrivacyGuard,
  privateAnalyticsReferrer,
} from "./analytics-privacy";
function browser(initial: string) {
  const location = { href: initial },
    listeners = new Map<string, () => void>(),
    sent: string[] = [];
  const target = {
    location,
    history: {
      pushState: (
        _data: unknown,
        _unused: string,
        url?: string | URL | null,
      ) => {
        if (url) location.href = new URL(url, location.href).href;
      },
      replaceState: (
        _data: unknown,
        _unused: string,
        url?: string | URL | null,
      ) => {
        if (url) location.href = new URL(url, location.href).href;
      },
    },
    addEventListener: (name: string, listener: () => void) =>
      listeners.set(name, listener),
    removeEventListener: (name: string) => listeners.delete(name),
  };
  const record = () => {
    if (!(target as unknown as Record<string, unknown>)["ga-disable-test"])
      sent.push(location.href);
  };
  return {
    target: target as unknown as Window,
    location,
    listeners,
    sent,
    record,
  };
}
describe("analytics privacy across SPA navigation", () => {
  it("blocks new documents reached from sensitive same-origin referrers", () => {
    const b = browser("https://example.test/polls");
    Object.defineProperty(b.target, "document", {
      value: { referrer: "https://example.test/he/match?a=private" },
    });
    installAnalyticsPrivacyGuard(b.target, "test");
    b.record();
    expect(b.sent).toEqual([]);
    expect(
      privateAnalyticsReferrer(
        "https://other.test/match?a=x",
        "https://example.test",
      ),
    ).toBe(false);
    expect(privateAnalyticsReferrer("not a URL", "https://example.test")).toBe(
      false,
    );
  });
  it("disables an already initialized tag before either history method exposes answers, then stays disabled on exit", () => {
    for (const method of ["pushState", "replaceState"] as const) {
      const b = browser("https://example.test/polls");
      installAnalyticsPrivacyGuard(b.target, "test");
      // Enhanced measurement can wrap history after our guard is installed.
      const inner = b.target.history[method];
      b.target.history[method] = function (...args) {
        inner.apply(b.target.history, args);
        b.record();
      };
      b.record();
      b.target.history[method](null, "", "/he/match?a=private-answers");
      b.target.history[method](null, "", "/compare");
      expect(b.sent).toEqual(["https://example.test/polls"]);
    }
  });
  it("latches direct loads, query updates, bearer URLs and back/forward navigation", () => {
    for (const path of [
      "/match?a=private",
      "/corrections?url=private-context",
      "/fa/match",
      "/subscriptions/confirm?token=private",
    ]) {
      const b = browser("https://example.test" + path);
      installAnalyticsPrivacyGuard(b.target, "test");
      b.record();
      expect(b.sent).toEqual([]);
    }
    const b = browser("https://example.test/results");
    installAnalyticsPrivacyGuard(b.target, "test");
    b.location.href = "https://example.test/ar/match?a=private";
    b.listeners.get("popstate")!();
    b.record();
    expect(b.sent).toEqual([]);
  });
});
