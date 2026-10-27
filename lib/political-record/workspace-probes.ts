import { randomUUID } from "node:crypto";
import { makeRecord } from "./records";
import { recordHash } from "./hash";
import { currentElection, ELECTIONS } from "./registry";
import {
  WORKSPACE_LOCALES,
  workspaceNamespace,
  configureWorkspace,
  workspaceRegistry,
  type WorkspaceConfiguration,
  type WorkspaceAttestation,
} from "./workspaces";
import { campaignContext } from "../election-lifecycle/resolver";
import { lifecycleStore } from "../election-lifecycle/store";
import type { PoliticalRecord, PoliticalRecordRepository } from "./types";
import type { CaptureArchive } from "./captures";
export async function stageAnnouncedWorkspaces(
  repository: PoliticalRecordRepository,
  now: string,
  rehearsal = false,
) {
  const registry = await workspaceRegistry(repository, now, rehearsal);
  const baseline = campaignContext(now);
  let count = 0;
  for (const workspace of registry.workspaces) {
    if (
      workspace.termNumber <= currentElection().termNumber ||
      workspace.blockers.includes("confirmed_date")
    )
      continue;
    const announcement = await repository.getRevision(
      workspace.announcementRevisionIds[0],
    );
    if (!announcement) continue;
    const existing = await repository.getLatest(`workspace:${workspace.id}`);
    if (existing?.payload.announcementRevisionId === announcement.revisionId)
      continue;
    const historicalPrefixes = [
      ...new Set([
        ...ELECTIONS.filter(
          (election) => election.termNumber < workspace.termNumber,
        ).map((election) => `/elections/${election.id}`),
        ...registry.workspaces
          .filter((other) => other.termNumber < workspace.termNumber)
          .map((other) => `/elections/${other.id}`),
      ]),
    ];
    const configuration: WorkspaceConfiguration = {
      definition: {
        id: workspace.id,
        jurisdiction: "IL",
        chamber: "knesset",
        termNumber: workspace.termNumber,
        electionDay: workspace.announcedDate,
        timeZone: "Asia/Jerusalem",
        pollsClose: null,
        modelArchiveAt: null,
        seats: 120,
        sourceConfigVersion: "announcement-only-v1",
      },
      namespace: workspaceNamespace(workspace.id),
      announcementRevisionId: announcement.revisionId,
      archivePrefix: `/elections/${workspace.id}`,
      historicalPrefixes,
      historicalPins: [
        {
          revision: baseline.revision,
          electionId: currentElection().id,
          basis: "seats",
        },
        ...registry.workspaces
          .filter(
            (other) =>
              other.termNumber < workspace.termNumber &&
              other.configurationRevisionId,
          )
          .map((other) => ({
            revision: other.configurationRevisionId!,
            electionId: other.id,
            basis: "workspace" as const,
          })),
      ],
      rehearsal,
    };
    await configureWorkspace(repository, configuration, now);
    count++;
  }
  return { status: "staged", count };
}
export async function saveWorkspaceAttestation(
  repository: PoliticalRecordRepository,
  configuration: PoliticalRecord,
  checkId: WorkspaceAttestation["checkId"],
  measurement: Record<string, unknown>,
  passed: boolean,
  now: string,
) {
  const proofPrevious = await repository.getLatest(
    `workspace-probe:${configuration.electionId}:${checkId}`,
  );
  const proof = makeRecord({
    recordId: `workspace-probe:${configuration.electionId}:${checkId}`,
    kind: "capability_attestation",
    electionId: configuration.electionId,
    effectiveAt: null,
    observedAt: now,
    status: passed ? "confirmed" : "unknown",
    evidenceClass: "model_output",
    previousRevisionId: proofPrevious?.revisionId ?? null,
    payload: {
      checkId,
      configurationRevisionId: configuration.revisionId,
      measurement,
    },
    provenance: {
      sourceIds: [],
      captureIds: [],
      parserVersion: "workspace-readiness-probe-v1",
    },
  });
  const previous = await repository.getLatest(
    `workspace-attestation:${configuration.electionId}:${checkId}`,
  );
  const attestation = makeRecord({
    recordId: `workspace-attestation:${configuration.electionId}:${checkId}`,
    kind: "capability_attestation",
    electionId: configuration.electionId,
    effectiveAt: null,
    observedAt: now,
    status: "confirmed",
    evidenceClass: "model_output",
    previousRevisionId: previous?.revisionId ?? null,
    payload: {
      electionId: configuration.electionId,
      configurationRevisionId: configuration.revisionId,
      checkId,
      state: passed ? "pass" : "blocked",
      proofRevisionIds: [proof.revisionId],
      measurement,
    },
    provenance: {
      sourceIds: [],
      captureIds: [],
      parserVersion: "workspace-attestation-v1",
    },
  });
  await repository.append({
    records: [proof, attestation],
    sources: [],
    captures: [],
    outbox: [],
  });
  return attestation;
}
function siteOrigin(value: string) {
  const origin = new URL(value);
  if (
    origin.protocol !== "https:" ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash
  )
    throw new Error("workspace_site_origin_invalid");
  return origin.origin;
}
export async function probeWorkspaceReadiness(
  repository: PoliticalRecordRepository,
  id: string,
  origin: string,
  archive: CaptureArchive | null,
  now: string,
  fetcher: typeof fetch = fetch,
  pinRead?: (revision: string) => Promise<{ election: string } | null>,
) {
  const configuration = await repository.getLatest(`workspace:${id}`);
  if (!configuration || configuration.kind !== "election_workspace")
    return { status: "unconfigured" };
  const config = configuration.payload as unknown as WorkspaceConfiguration;
  if (config.rehearsal && process.env.VERCEL_ENV === "production")
    throw new Error("rehearsal_forbidden");
  const base = siteOrigin(origin),
    attestations = [];
  const nonce = randomUUID(),
    probe = makeRecord({
      recordId: `workspace-storage:${id}:${nonce}`,
      kind: "source_health",
      electionId: id,
      effectiveAt: null,
      observedAt: now,
      status: "confirmed",
      evidenceClass: "model_output",
      previousRevisionId: null,
      payload: { namespace: config.namespace, nonce },
      provenance: {
        sourceIds: [],
        captureIds: [],
        parserVersion: "workspace-storage-probe-v1",
      },
    });
  await repository.append({
    records: [probe],
    sources: [],
    captures: [],
    outbox: [],
  });
  const roundTrip =
    recordHash((await repository.getRevision(probe.revisionId))?.payload) ===
    recordHash(probe.payload);
  attestations.push(
    await saveWorkspaceAttestation(
      repository,
      configuration,
      "isolated_namespace",
      { namespace: config.namespace, roundTrip },
      roundTrip && config.namespace === workspaceNamespace(id),
      now,
    ),
  );
  const readRoute = async (
    path: string,
    electionId: string,
    locale: string,
  ) => {
    try {
      const response = await fetcher(base + path, {
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
        headers: {
          ...(process.env.VERCEL_ENV === "preview" &&
          process.env.ELECTION_PREVIEW_PROTECTION_BYPASS
            ? {
                "x-vercel-protection-bypass":
                  process.env.ELECTION_PREVIEW_PROTECTION_BYPASS,
              }
            : {}),
        },
      });
      if (!response.ok) return false;
      const body = await response.text();
      return (
        body.includes(`data-election-workspace="${electionId}"`) &&
        body.includes(`data-workspace-locale="${locale}"`)
      );
    } catch {
      return false;
    }
  };
  const locales = (
    await Promise.all(
      WORKSPACE_LOCALES.map(async (locale) =>
        (await readRoute(
          `${locale === "en" ? "" : "/" + locale}/elections/${id}`,
          id,
          locale,
        ))
          ? locale
          : null,
      ),
    )
  ).filter(
    (locale): locale is (typeof WORKSPACE_LOCALES)[number] => locale !== null,
  );
  attestations.push(
    await saveWorkspaceAttestation(
      repository,
      configuration,
      "core_seven_locales",
      { locales },
      locales.length === 7,
      now,
    ),
  );
  let routesVerified =
    config.historicalPrefixes.length > 0 &&
    config.historicalPrefixes.includes(`/elections/${currentElection().id}`);
  if (config.historicalPrefixes.length > 50) routesVerified = false;
  const archivedRoutes = await Promise.all(
    config.historicalPrefixes
      .slice(0, 50)
      .map((prefix) => readRoute(prefix, prefix.split("/").at(-1)!, "en")),
  );
  if (archivedRoutes.some((value) => !value)) routesVerified = false;
  let historicalPins = config.historicalPins.length > 0;
  for (const pin of config.historicalPins) {
    if (pin.basis === "workspace") {
      const archived = await repository.getRevision(pin.revision);
      if (
        archived?.kind !== "election_workspace" ||
        archived.electionId !== pin.electionId ||
        archived.status !== "confirmed"
      )
        historicalPins = false;
      continue;
    }
    const known = ELECTIONS.find((election) => election.id === pin.electionId),
      baseline = campaignContext(now);
    const stored = pinRead
      ? await pinRead(pin.revision)
      : pin.revision === baseline.revision
        ? baseline
        : await lifecycleStore()?.pinned(pin.revision);
    const seat =
      stored && "seatContext" in stored ? stored.seatContext : stored;
    if (
      !known ||
      !seat ||
      typeof seat !== "object" ||
      !("election" in seat) ||
      seat.election !== known.electionDay
    )
      historicalPins = false;
  }
  const announcement = await repository.getRevision(
    config.announcementRevisionId,
  );
  const captureIds = announcement?.provenance.captureIds ?? [];
  // Existing primary source capture must have a private durable receipt before automatic activation.
  let privateArchive =
    !!archive &&
    captureIds.length > 0 &&
    !announcement?.provenance.missingCapture;
  if (privateArchive && archive) {
    for (const id of captureIds) {
      try {
        const ref = await repository.getCapture(id);
        if (
          !ref ||
          !announcement?.provenance.sourceIds.includes(ref.sourceRevisionId)
        )
          privateArchive = false;
        else await archive.read(ref);
      } catch {
        privateArchive = false;
      }
    }
  }
  attestations.push(
    await saveWorkspaceAttestation(
      repository,
      configuration,
      "archive_routing",
      { historicalPins, routesVerified, privateArchive },
      historicalPins && routesVerified && privateArchive,
      now,
    ),
  );
  return {
    status: "checked",
    checks: attestations.map((attestation) => ({
      checkId: attestation.payload.checkId,
      state: attestation.payload.state,
    })),
  };
}
