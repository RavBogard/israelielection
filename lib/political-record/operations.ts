import { collectParliament } from "./parliament";
import { configuredPoliticalRecords } from "./postgres";
import { configuredCaptureArchive } from "./blob";
import { collectCbs } from "./cbs";
import { shadowLifecycle } from "./shadow";
import type { LifecycleLedger } from "../election-lifecycle/types";
/** Bounded shadow mirror; a failed mirror never changes the authoritative Redis publication. */
export async function mirrorPublishedLifecycle(ledger: LifecycleLedger) {
  if (process.env.POLITICAL_RECORD_SHADOW_ENABLED !== "true")
    return { status: "disabled" };
  let repository: ReturnType<typeof configuredPoliticalRecords> = null;
  try {
    repository = configuredPoliticalRecords();
    const archive = configuredCaptureArchive();
    if (!repository || !archive) return { status: "unconfigured" };
    const events = ledger.events.slice(-20),
      seatSnapshots = ledger.seatSnapshots.slice(-1);
    const refs = [
      ...events.flatMap((e) => e.sources),
      ...seatSnapshots.flatMap((s) => s.sourceRefs),
    ];
    let bytes = 0;
    const captures = ledger.captures
      .filter((c) =>
        refs.some(
          (r) =>
            r.id === c.source.id &&
            r.captureHash === c.source.captureHash &&
            r.observedAt === c.source.observedAt,
        ),
      )
      .filter((c) => {
        bytes += Buffer.byteLength(c.body);
        return bytes <= 2000000;
      })
      .slice(-10);
    const result = await shadowLifecycle(
      repository,
      { ...ledger, events, seatSnapshots, captures },
      archive,
    );
    return {
      status: result.ready ? "compared" : "mismatch",
      compared: result.compared,
    };
  } catch {
    return { status: "unavailable" };
  } finally {
    try {
      await repository?.close();
    } catch {
      /* Mirror cleanup cannot fail a live publication. */
    }
  }
}
export async function collectPlatformSources() {
  if (process.env.POLITICAL_PLATFORM_COLLECT_ENABLED !== "true")
    return { status: "disabled" };
  let repository: ReturnType<typeof configuredPoliticalRecords> = null;
  try {
    repository = configuredPoliticalRecords();
    if (!repository) return { status: "unconfigured" };
    return await collectCbs(repository, configuredCaptureArchive());
  } catch {
    return { status: "source_unavailable", sourceId: "cbs:price:120010" };
  } finally {
    try {
      await repository?.close();
    } catch {
      /* Preserve the acquisition result; diagnostics never include connection secrets. */
    }
  }
}

/** One qualified contract/page per delivery; cursor progress commits with its records. */
export async function collectConfiguredParliament() {
  if (process.env.POLITICAL_PARLIAMENT_COLLECT_ENABLED !== "true")
    return { status: "disabled" };
  let repository: ReturnType<typeof configuredPoliticalRecords> = null;
  try {
    repository = configuredPoliticalRecords();
    const id = process.env.POLITICAL_PARLIAMENT_CONTRACT_ID;
    if (
      !repository ||
      !id ||
      !/^source-contract:[a-zA-Z0-9:_-]{1,150}$/.test(id)
    )
      return { status: "unconfigured" };
    return await collectParliament(
      repository,
      id,
      configuredCaptureArchive(),
      new Date().toISOString(),
    );
  } catch {
    return { status: "source_unqualified" };
  } finally {
    try {
      await repository?.close();
    } catch {
      /* Preserve committed page result. */
    }
  }
}
