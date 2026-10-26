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
    mode: "cycle",
    window: "night",
    id: `lifecycle-${environment}-night-2026`,
    cron: "*/15 * * * *",
    note: "Self-gates to2026-10-27T20Z through2026-10-28T05:45Z. Pause after that one-night window.",
  },
  {
    mode: "cycle",
    window: "regular",
    id: `lifecycle-${environment}-regular-2026`,
    cron: "0 */3 * * *",
    note: "Self-gates until2026-10-28T06Z, then every3hoursUTC; official/formation continue afterNov3.",
  },
  {
    mode: "briefing",
    id: `lifecycle-${environment}-briefing-2026`,
    cron: "0 6 * * *",
    note: "Daily stored-state briefing only; no upstream acquisition.",
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
      ...(process.env.VERCEL_ENV === "preview" &&
      process.env.ELECTION_PREVIEW_PROTECTION_BYPASS
        ? {
            "Upstash-Forward-x-vercel-protection-bypass":
              process.env.ELECTION_PREVIEW_PROTECTION_BYPASS,
          }
        : {}),
      ...(!pause
        ? {
            "Upstash-Cron": s.cron,
            "Upstash-Schedule-Id": s.id,
            "Upstash-Retries": "3",
          }
        : {}),
    },
    ...(!pause
      ? {
          body: JSON.stringify({
            mode: s.mode,
            ...("window" in s ? { window: s.window } : {}),
          }),
        }
      : {}),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw new Error(`Schedule ${s.id}: HTTP ${response.status}`);
  console.log(
    JSON.stringify({ id: s.id, status: pause ? "paused" : "upserted" }),
  );
}

// The one-night schedule pauses itself after its40slots; continuation/briefing IDs are never targeted.
const pauseAt = Date.parse("2026-10-28T06:00:00Z");
if (!apply)
  console.log(
    JSON.stringify({
      action: "delayed_night_pause",
      notBefore: new Date(pauseAt).toISOString(),
      body: { mode: "pause_night" },
      destination,
    }),
  );
else if (!pause) {
  const response = await fetch(`${base}/v2/publish/${destination}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
      "Content-Type": "application/json",
      ...(process.env.VERCEL_ENV === "preview" &&
      process.env.ELECTION_PREVIEW_PROTECTION_BYPASS
        ? {
            "Upstash-Forward-x-vercel-protection-bypass":
              process.env.ELECTION_PREVIEW_PROTECTION_BYPASS,
          }
        : {}),
      "Upstash-Not-Before": String(
        Math.max(Math.floor(Date.now() / 1000), pauseAt / 1000),
      ),
      "Upstash-Retries": "3",
    },
    body: JSON.stringify({ mode: "pause_night" }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Unable to schedule bounded-night pause");
  const receipt = await response.json();
  console.log(
    JSON.stringify({
      action: "delayed_night_pause",
      messageId: receipt.messageId,
      notBefore: new Date(pauseAt).toISOString(),
    }),
  );
}
