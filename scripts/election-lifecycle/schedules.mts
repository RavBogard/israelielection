/** Dry-run by default. Release owner runs --apply only after preview and production verification. */
const destination = process.env.ELECTION_LIFECYCLE_WORKER_URL;
if (!destination || new URL(destination).protocol !== "https:")
  throw new Error("Set the exact HTTPS worker URL for this environment.");
const environment = process.env.VERCEL_ENV ?? "development",
  base = new URL(process.env.QSTASH_URL ?? "https://qstash.upstash.io").origin;
if (!new URL(base).hostname.endsWith(".upstash.io"))
  throw new Error("Unrecognized QStash host");
const schedules = [
  {
    mode: "election",
    id: `lifecycle-${environment}-election-2026`,
    cron: "* * * * *",
    note: "Worker self-bounds to October26-November2UTC; pause this schedule November3.",
  },
  {
    mode: "formation",
    id: `lifecycle-${environment}-formation-2026`,
    cron: process.env.ELECTION_FORMATION_CRON ?? "*/15 * * * *",
    note: "Independent15-minute authoritative acquisition continues after November3, including CEC official publication.",
  },
  {
    mode: "briefing",
    id: `lifecycle-${environment}-briefing-2026`,
    cron: "0 6 * * *",
    note: "Daily structured briefing, UTC; current public reads reapply redaction.",
  },
];
const apply = process.argv.includes("--apply"),
  pause = process.argv.includes("--pause");
for (const s of schedules) {
  if (!apply) {
    console.log(
      JSON.stringify({
        ...s,
        destination,
        action: pause ? "pause" : "upsert",
        apply: false,
      }),
    );
    continue;
  }
  if (!process.env.QSTASH_TOKEN)
    throw new Error("QSTASH_TOKEN required only for schedule management");
  const url = pause
    ? `${base}/v2/schedules/${s.id}/pause`
    : `${base}/v2/schedules/${destination}`;
  const response = await fetch(url, {
    method: pause ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
      "Content-Type": "application/json",
      ...(!pause
        ? {
            "Upstash-Cron": s.cron,
            "Upstash-Schedule-Id": s.id,
            "Upstash-Retries": "3",
          }
        : {}),
    },
    ...(!pause ? { body: JSON.stringify({ mode: s.mode }) } : {}),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw new Error(`Schedule ${s.id}: HTTP ${response.status}`);
  console.log(
    JSON.stringify({ id: s.id, status: pause ? "paused" : "upserted" }),
  );
}
