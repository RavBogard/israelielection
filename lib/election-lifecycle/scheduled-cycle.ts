import { CADENCE_START, REGULAR_START, cycleAt } from "./cadence";
/** QStash body is static: bind its original message creation slot, never a delayed delivery's wall clock. */
export async function scheduledCycle(
  messageId: string | null,
  window: "night" | "regular",
  now = new Date().toISOString(),
) {
  if (!messageId || !/^[-A-Za-z0-9_]{1,128}$/.test(messageId))
    throw new Error("schedule_message_id_required");
  const token = process.env.QSTASH_TOKEN,
    destination = process.env.ELECTION_LIFECYCLE_WORKER_URL,
    base = new URL(process.env.QSTASH_URL ?? "https://qstash.upstash.io")
      .origin;
  if (!token || !destination || !new URL(base).hostname.endsWith(".upstash.io"))
    throw new Error("schedule_metadata_unconfigured");
  const response = await fetch(`${base}/v2/messages/${messageId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("schedule_metadata_unavailable");
  const metadata = await response.json(),
    expected = `lifecycle-${process.env.VERCEL_ENV ?? "development"}-${window}-2026`;
  if (
    metadata.messageId !== messageId ||
    metadata.scheduleId !== expected ||
    metadata.url !== destination ||
    !Number.isSafeInteger(metadata.createdAt) ||
    metadata.createdAt <= 0 ||
    metadata.createdAt > Date.parse(now)
  )
    throw new Error("schedule_metadata_mismatch");
  const active =
    window === "night"
      ? metadata.createdAt >= CADENCE_START &&
        metadata.createdAt < REGULAR_START
      : metadata.createdAt >= REGULAR_START;
  const at = active ? cycleAt(metadata.createdAt) : null;
  return {
    cycleAt: at === null ? null : new Date(at).toISOString(),
    scheduleId: expected,
    createdAt: metadata.createdAt,
  };
}
