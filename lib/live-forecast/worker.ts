import { cadenceMetadata } from "../election-lifecycle/cadence";
import { randomUUID } from "node:crypto";
import frozen from "../../data/live-forecast-prior.json";
import { acquireSources } from "./sources";
import { buildSnapshot, MODEL_VERSION, SCENARIO_VERSION } from "./model";
import type { LiveStore } from "./store";
import type { Poll } from "../types";
export const electionWindow = (now: number) =>
  now >= Date.parse("2026-10-26T00:00:00Z") &&
  now < Date.parse("2026-11-03T00:00:00Z");
export async function runWorker(
  store: LiveStore,
  delivery: string,
  now = new Date().toISOString(),
  acquire = acquireSources,
) {
  if (!electionWindow(Date.parse(now))) return { status: "outside_window" };
  if (await store.delivered(delivery)) return { status: "duplicate" };
  const token = randomUUID();
  if (!(await store.acquire(token))) return { status: "busy" };
  try {
    if (await store.delivered(delivery)) return { status: "duplicate" };
    const stored = await store.read();
    const previous =
      stored?.prior.sha256 === frozen.sha256 &&
      stored.modelVersion === MODEL_VERSION &&
      stored.scenarioVersion === SCENARIO_VERSION
        ? stored
        : null;
    const inputs =
      stored?.prior.sha256 === frozen.sha256
        ? await store.inputs(stored.revision)
        : null;
    const acquired = await acquire(now, inputs?.exits ?? []);
    const nextHealth = {
      lastAttemptAt: now,
      lastSuccessfulAcquisitionAt: now,
      error: null,
    };
    let snapshot;
    if (previous && previous.revision === acquired.revision)
      snapshot = {
        ...previous,
        sources: acquired.sources,
        freshness: {
          status: "current" as const,
          lastSuccessfulAcquisitionAt: now,
          lastAttemptAt: now,
        },
        changeReason: "source_unchanged" as const,
      };
    else {
      const prior = {
        version: frozen.version,
        sha256: frozen.sha256,
        generatedAt: frozen.forecast.generatedAt,
        final: frozen.forecast.final,
      };
      snapshot = buildSnapshot({
        prior,
        revision: acquired.revision,
        now,
        exits: acquired.exits,
        sources: acquired.sources,
      });
      if (!snapshot.diagnostics.stable)
        throw new Error("Simulation stability gate failed");
      const history =
        stored?.prior.sha256 === frozen.sha256 ? stored.history : [];
      const entry = {
        generatedAt: snapshot.generatedAt,
        revision: snapshot.revision,
        mode: snapshot.mode,
        largestParty: snapshot.largestParty,
        blocSeats: snapshot.blocSeats,
        thresholds: snapshot.thresholds.map(({ id, passProbability }) => ({
          id,
          passProbability,
        })),
        arrangements: snapshot.arrangements.map(({ id, probability }) => ({
          id,
          probability,
        })),
      };
      snapshot.history = [...history, entry].slice(-240);
    }
    snapshot.cadence = cadenceMetadata(now, now, now);
    if (
      !(await store.publish(
        token,
        snapshot,
        { exits: acquired.exits as Poll[], sources: acquired.sources },
        nextHealth,
        delivery,
      ))
    )
      throw new Error("Publication lock expired");
    return {
      status:
        previous?.revision === snapshot.revision ? "unchanged" : "published",
      revision: snapshot.revision,
    };
  } catch {
    const health = await store.health();
    await store.recordHealth({
      lastAttemptAt: now,
      lastSuccessfulAcquisitionAt: health?.lastSuccessfulAcquisitionAt ?? null,
      error: "acquisition_or_model_failed",
    });
    throw new Error("Live forecast refresh failed; last known good retained");
  } finally {
    await store.release(token);
  }
}
