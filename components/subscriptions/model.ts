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
