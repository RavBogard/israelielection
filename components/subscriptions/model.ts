export const TOPICS = ["digest", "results", "formation", "policies"] as const;
export type Topic = (typeof TOPICS)[number];
export type SubscriptionMode =
  "signup" | "confirm" | "preferences" | "unsubscribe";
export function privateToken(url: string) {
  const parsed = new URL(url);
  const token =
    new URLSearchParams(parsed.hash.slice(1)).get("token") ??
    parsed.searchParams.get("token");
  return token && /^[A-Za-z0-9_-]{20,512}$/.test(token) ? token : null;
}
export function tokenFreeUrl(url: string) {
  const parsed = new URL(url);
  parsed.searchParams.delete("token");
  parsed.hash = "";
  return parsed.pathname + parsed.search;
}
export function validTopics(value: unknown): Topic[] {
  return Array.isArray(value) ? TOPICS.filter((t) => value.includes(t)) : [];
}
import type { Follows, DeliveryChannels } from "@/lib/political-record/follows";
export const emptyFollows = (): Follows => ({
  parties: [],
  issues: [],
  places: [],
});
export function readDistribution(value: unknown, topics: Topic[]) {
  if (!value || typeof value !== "object") return null;
  const data = value as { follows?: unknown; delivery?: unknown };
  const follows =
    data.follows === undefined ? emptyFollows() : (data.follows as Follows);
  if (
    !follows ||
    !["parties", "issues", "places"].every((key) => {
      const list = follows[key as keyof Follows];
      return (
        Array.isArray(list) &&
        list.length <= 20 &&
        list.every(
          (id) => typeof id === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(id),
        )
      );
    })
  )
    return null;
  const delivery =
    data.delivery === undefined
      ? {
          dailyDigest: topics.includes("digest"),
          majorEvents: topics.some((t) => t !== "digest"),
          corrections: true,
        }
      : (data.delivery as DeliveryChannels);
  if (
    !delivery ||
    ![delivery.dailyDigest, delivery.majorEvents, delivery.corrections].every(
      (v) => typeof v === "boolean",
    )
  )
    return null;
  return { follows, delivery };
}
export function hasSubscriptionSelection(topics: Topic[], follows: Follows) {
  return (
    topics.length > 0 || Object.values(follows).some((ids) => ids.length > 0)
  );
}
