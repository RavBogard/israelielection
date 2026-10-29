import { verifyQStash, workerDestinations } from "@/lib/live-forecast/auth";
import { configuredStore } from "@/lib/live-forecast/store";
import { runWorker } from "@/lib/live-forecast/worker";
import { liveForecastEnabled } from "@/lib/live-forecast/server";
import { createHash } from "node:crypto";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const body = await request.text();
  const keys = [process.env.QSTASH_CURRENT_SIGNING_KEY, process.env.QSTASH_NEXT_SIGNING_KEY].filter((s): s is string => !!s);
  const destinations = workerDestinations(process.env.LIVE_FORECAST_WORKER_URL);
  if (!destinations.some((d) => verifyQStash(request.headers.get("upstash-signature"), body, d, keys))) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!liveForecastEnabled()) return Response.json({ status: "disabled" });
  const store = configuredStore(); if (!store) return Response.json({ error: "durable_store_unconfigured" }, { status: 503 });
  // The JWT hash is stable for retries of the signed delivery, while no unsigned id affects authorization.
  const delivery = createHash("sha256").update(request.headers.get("upstash-signature")!).digest("hex");
  try { const result = await runWorker(store, delivery); return Response.json(result, { status: result.status === "busy" ? 503 : 200 }); }
  catch { return Response.json({ error: "refresh_failed" }, { status: 503 }); }
}
