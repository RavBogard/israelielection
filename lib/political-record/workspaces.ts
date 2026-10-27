import { makeRecord, makeSource } from "./records";
import {
  currentElection,
  ELECTIONS,
  electionScope,
  validateElectionDefinition,
  type ElectionDefinition,
} from "./registry";
import { capabilityGate, type GateCheck, type Capability } from "./gates";
import { contentHash, type CaptureArchive } from "./captures";
import { recordHash } from "./hash";
import { textOf, articleOf } from "../election-lifecycle/html";
import { fetchPrimary } from "../election-lifecycle/acquisition";
import type {
  PoliticalRecord,
  PoliticalRecordRepository,
  SourceRecord,
} from "./types";
export const WORKSPACE_LOCALES = [
  "en",
  "he",
  "ar",
  "fa",
  "de",
  "fr",
  "zh",
] as const;
export type ElectionAnnouncement = {
  electionId: string;
  termNumber: number;
  electionDay: string;
  quote: string;
  sourceRevisionId: string;
  rehearsal: boolean;
};
export type PlatformElectionDefinition = Omit<
  ElectionDefinition,
  "pollsClose" | "modelArchiveAt"
> & { pollsClose: string | null; modelArchiveAt: string | null };
export type WorkspaceConfiguration = {
  definition: PlatformElectionDefinition;
  namespace: string;
  announcementRevisionId: string;
  archivePrefix: string;
  historicalPrefixes: string[];
  historicalPins: {
    revision: string;
    electionId: string;
    basis?: "workspace" | "seats";
  }[];
  rehearsal: boolean;
};
export type WorkspaceAttestation = {
  electionId: string;
  configurationRevisionId: string;
  checkId: "isolated_namespace" | "core_seven_locales" | "archive_routing";
  state: "pass" | "blocked";
  proofRevisionIds: string[];
  measurement: Record<string, unknown>;
};
export type ElectionWorkspace = {
  id: string;
  termNumber: number;
  announcedDate: string;
  definition: PlatformElectionDefinition | null;
  configurationRevisionId: string | null;
  announcementRevisionIds: string[];
  sourceRefs: SourceRecord[];
  state: "draft" | "blocked" | "active" | "retired";
  blockers: string[];
  capabilities: Record<Capability, boolean>;
  rehearsal: boolean;
};
const POINTER = "platform:active-election-workspace";
export const workspaceNamespace = (id: string) =>
  `${electionScope(id)}${process.env.VERCEL_ENV ?? "development"}:`;
function officialAnnouncementUrl(value: string) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    !(
      url.hostname === "www.bechirot.gov.il" ||
      url.hostname === "bechirot.gov.il" ||
      /(^|\.)knesset\.gov\.il$/.test(url.hostname) ||
      (url.hostname === "www.gov.il" &&
        /election|central_elections_committee/i.test(url.pathname))
    )
  )
    throw new Error("announcement_source_not_allowed");
  return url;
}
function electionDay(value: string) {
  const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (
    !parts ||
    new Date(value + "T12:00:00Z").toISOString().slice(0, 10) !== value
  )
    throw new Error("announcement_date_invalid");
  return value;
}
/** A single explicit term/date notice is required; historical menus, proposals and conflicting notices do not activate anything. */
export function parseElectionAnnouncement(
  body: string,
  url: string,
  now: string,
  rehearsal = false,
) {
  officialAnnouncementUrl(url);
  const text = textOf(body);
  if (/סביבת בדיקות|test environment|staging environment/i.test(text))
    throw new Error("announcement_test_environment");
  const matches = [
    ...text.matchAll(
      /(?:יום\s+הבחירות\s+לכנסת|הבחירות\s+לכנסת|elections?\s+(?:to|for)\s+(?:the\s+)?knesset)\s*(?:ה[-־]?\s*|[-–:]\s*)?(\d{1,3})((?:[^.!?]|\.(?=\d)){0,180})/gi,
    ),
    ...text.matchAll(
      /elections?\s+(?:to|for)\s+(?:the\s+)?(\d{1,3})(?:st|nd|rd|th)?\s+knesset((?:[^.!?]|\.(?=\d)){0,180})/gi,
    ),
  ];
  const candidates = matches.flatMap((match) => {
    const context = text.slice(
      Math.max(0, (match.index ?? 0) - 100),
      (match.index ?? 0) + match[0].length + 80,
    );
    if (
      /\bnot\b|never|cancel|postpon|reschedul|no longer|according to|report(?:ed|s)|rumou?r|[“”"]|לא\s+(?:יתקיימו|ייערכו|יוחזקו)|בוטל|בוטלו|נדח|דחיית|לפי\s+דיווח|דווח|שמוע/iu.test(
        context,
      )
    )
      return [];
    if (
      !/^יום\s+הבחירות/u.test(match[0]) &&
      !/will\s+(?:be\s+held|take\s+place)|(?:are|is)\s+scheduled|יתקיימו|ייערכו|נקבעו/iu.test(
        match[0],
      )
    )
      return [];

    if (
      /propos|draft|may|might|could|טיוטה|הצעת|ייתכן|עשוי|צפוי/i.test(match[0])
    )
      return [];
    const iso = match[2].match(/\b(20\d{2})-(\d{2})-(\d{2})\b/),
      numeric = match[2].match(/\b(\d{1,2})[./](\d{1,2})[./](20\d{2})\b/);
    if (!iso && !numeric) return [];
    const date = iso
      ? `${iso[1]}-${iso[2]}-${iso[3]}`
      : `${numeric![3]}-${numeric![2].padStart(2, "0")}-${numeric![1].padStart(2, "0")}`;
    try {
      electionDay(date);
    } catch {
      return [];
    }
    if (date < now.slice(0, 10)) return [];
    return [
      { termNumber: Number(match[1]), electionDay: date, quote: match[0] },
    ];
  });
  const unique = new Map(
    candidates.map((candidate) => [
      `${candidate.termNumber}:${candidate.electionDay}`,
      candidate,
    ]),
  );
  if (unique.size !== 1)
    throw new Error(
      unique.size ? "announcement_conflict" : "announcement_unqualified",
    );
  const candidate = [...unique.values()][0];
  if (candidate.termNumber < 1 || candidate.termNumber > 200)
    throw new Error("announcement_term_invalid");
  return {
    ...candidate,
    electionId: `il-knesset-${candidate.termNumber}`,
    rehearsal,
  };
}
export async function captureElectionAnnouncement(
  repository: PoliticalRecordRepository,
  url: string,
  archive: CaptureArchive | null,
  now: string,
  rehearsal = false,
  acquire: (url: string) => Promise<string> = (url) =>
    fetchPrimary(url, [
      "www.bechirot.gov.il",
      "bechirot.gov.il",
      "main.knesset.gov.il",
      "www.knesset.gov.il",
      "knesset.gov.il",
      "www.gov.il",
    ]),
) {
  officialAnnouncementUrl(url);
  if (rehearsal && process.env.VERCEL_ENV === "production")
    throw new Error("rehearsal_forbidden");
  const body = await acquire(url),
    announcement = parseElectionAnnouncement(body, url, now, rehearsal);
  const source = makeSource({
    sourceId: `cec:announcement:${recordHash(url)}`,
    publisher: new URL(url).hostname.includes("knesset")
      ? "Knesset"
      : "Central Elections Committee",
    title: `Election to Knesset ${announcement.termNumber}`,
    captureHash: contentHash(Buffer.from(body)),
    url,
    authority: new URL(url).hostname.includes("knesset") ? "knesset" : "cec",
    observedAt: now,
    publishedAt: articleOf(body, url).publishedAt,
  });
  const identity = `announcement:${announcement.electionId}:${recordHash(url)}`,
    previous = await repository.getLatest(identity);
  if (
    previous &&
    recordHash({ ...previous.payload, sourceRevisionId: null }) ===
      recordHash({ ...announcement, sourceRevisionId: null })
  )
    return previous;
  const capture = archive
    ? await archive.put(source, Buffer.from(body), "text/html")
    : null;
  const record = makeRecord({
    recordId: identity,
    kind: "election_announcement",
    electionId: announcement.electionId,
    effectiveAt: null,
    observedAt: now,
    status: "confirmed",
    evidenceClass: rehearsal ? "model_output" : "primary_confirmed",
    previousRevisionId: previous?.revisionId ?? null,
    payload: { ...announcement, sourceRevisionId: source.revisionId },
    provenance: {
      sourceIds: [source.revisionId],
      captureIds: capture ? [capture.captureId] : [],
      missingCapture: !capture,
      parserVersion: "election-announcement-v1",
    },
  });
  await repository.append({
    records: [record],
    sources: [source],
    captures: capture ? [capture] : [],
    outbox: [],
  });
  return record;
}
export async function configureWorkspace(
  repository: PoliticalRecordRepository,
  configuration: WorkspaceConfiguration,
  now: string,
) {
  const definition = configuration.definition;
  if (definition.pollsClose !== null && definition.modelArchiveAt !== null)
    validateElectionDefinition(definition as ElectionDefinition);
  else if (
    definition.pollsClose !== null ||
    definition.modelArchiveAt !== null ||
    definition.id !== `il-knesset-${definition.termNumber}` ||
    definition.termNumber < 1 ||
    definition.jurisdiction !== "IL" ||
    definition.chamber !== "knesset" ||
    definition.seats !== 120 ||
    definition.timeZone !== "Asia/Jerusalem" ||
    !definition.sourceConfigVersion
  )
    throw new Error("workspace_definition_invalid");
  electionDay(definition.electionDay);
  const announcement = await repository.getRevision(
    configuration.announcementRevisionId,
  );
  if (
    announcement?.kind !== "election_announcement" ||
    announcement.status !== "confirmed" ||
    announcement.electionId !== configuration.definition.id ||
    announcement.payload.electionDay !== configuration.definition.electionDay ||
    configuration.namespace !==
      workspaceNamespace(configuration.definition.id) ||
    configuration.archivePrefix !==
      `/elections/${configuration.definition.id}` ||
    !configuration.historicalPrefixes.every((prefix) =>
      /^\/elections\/il-knesset-\d+$/.test(prefix),
    )
  )
    throw new Error("workspace_configuration_invalid");
  if (configuration.rehearsal !== announcement.payload.rehearsal)
    throw new Error("workspace_rehearsal_scope_mismatch");
  const previous = await repository.getLatest(
    `workspace:${configuration.definition.id}`,
  );
  if (previous && recordHash(previous.payload) === recordHash(configuration))
    return previous;
  const record = makeRecord({
    recordId: `workspace:${configuration.definition.id}`,
    kind: "election_workspace",
    electionId: configuration.definition.id,
    effectiveAt: null,
    observedAt: now,
    status: "confirmed",
    evidenceClass: "model_output",
    previousRevisionId: previous?.revisionId ?? null,
    payload: configuration,
    provenance: {
      sourceIds: announcement.provenance.sourceIds,
      captureIds: announcement.provenance.captureIds,
      parserVersion: "election-workspace-v1",
    },
  });
  await repository.append({
    records: [record],
    sources: [],
    captures: [],
    outbox: [],
  });
  return record;
}
function proofValid(
  attestation: PoliticalRecord,
  configuration: PoliticalRecord,
  proofs: PoliticalRecord[],
  now: string,
) {
  const p = attestation.payload as unknown as WorkspaceAttestation;
  if (
    attestation.kind !== "capability_attestation" ||
    attestation.status !== "confirmed" ||
    p.state !== "pass" ||
    p.configurationRevisionId !== configuration.revisionId ||
    Date.parse(attestation.observedAt) > Date.parse(now) ||
    Date.parse(now) - Date.parse(attestation.observedAt) > 7 * 86400000 ||
    !p.proofRevisionIds.length
  )
    return false;
  const refs = p.proofRevisionIds.map((id) =>
    proofs.find((record) => record.revisionId === id),
  );
  if (
    refs.some(
      (record) =>
        !record ||
        record.status !== "confirmed" ||
        record.electionId !== configuration.electionId ||
        record.provenance.parserVersion !== "workspace-readiness-probe-v1" ||
        record.payload.checkId !== p.checkId ||
        record.payload.configurationRevisionId !== configuration.revisionId ||
        recordHash(record.payload.measurement) !== recordHash(p.measurement),
    )
  )
    return false;
  if (p.checkId === "core_seven_locales")
    return (
      Array.isArray(p.measurement.locales) &&
      WORKSPACE_LOCALES.every((locale) =>
        (p.measurement.locales as unknown[]).includes(locale),
      )
    );
  if (p.checkId === "isolated_namespace")
    return (
      p.measurement.namespace ===
        (configuration.payload as unknown as WorkspaceConfiguration)
          .namespace && p.measurement.roundTrip === true
    );
  return (
    p.checkId === "archive_routing" &&
    p.measurement.historicalPins === true &&
    p.measurement.routesVerified === true &&
    p.measurement.privateArchive === true
  );
}
export async function workspaceRegistry(
  repository: PoliticalRecordRepository,
  now: string,
  rehearsal = false,
) {
  const first = await repository.latest({ limit: 1 });
  const kinds = [
    "election_announcement",
    "election_workspace",
    "capability_attestation",
  ] as const;
  const windows = await Promise.all(
    kinds.map((kind) =>
      repository.latest({ kind, limit: 200, asOfCursor: first.asOfCursor }),
    ),
  );
  const records = windows.flatMap((window) => window.records),
    sources = await repository.getSources([
      ...new Set(records.flatMap((record) => record.provenance.sourceIds)),
    ]);
  const pointer = await repository.getLatest(
    rehearsal ? `${POINTER}:rehearsal` : POINTER,
  );
  const activeId =
    typeof pointer?.payload.electionId === "string"
      ? pointer.payload.electionId
      : currentElection().id;
  const ids = [
    ...new Set(
      records
        .filter(
          (record) =>
            record.kind === "election_announcement" &&
            record.status === "confirmed",
        )
        .map((record) => record.electionId!),
    ),
  ];
  const workspaces: ElectionWorkspace[] = [];
  for (const id of ids) {
    const announcements = records.filter(
      (record) =>
        record.kind === "election_announcement" &&
        record.electionId === id &&
        record.status === "confirmed" &&
        record.payload.rehearsal === rehearsal &&
        record.provenance.parserVersion === "election-announcement-v1",
    );
    if (!announcements.length) continue;
    const dates = new Set(
      announcements.map((record) => String(record.payload.electionDay)),
    );
    const configuration = records.find(
      (record) =>
        record.kind === "election_workspace" &&
        record.electionId === id &&
        record.status === "confirmed" &&
        record.payload.rehearsal === rehearsal,
    );
    const p = configuration?.payload as unknown as
      WorkspaceConfiguration | undefined;
    const refs = sources.filter((source) =>
      announcements.some((record) =>
        record.provenance.sourceIds.includes(source.revisionId),
      ),
    );
    let sourceValid =
      refs.length > 0 &&
      announcements.every(
        (record) =>
          record.payload.electionId === id &&
          id === `il-knesset-${record.payload.termNumber}` &&
          typeof record.payload.quote === "string" &&
          record.payload.quote.length > 10 &&
          record.provenance.sourceIds.includes(
            String(record.payload.sourceRevisionId),
          ) &&
          (rehearsal
            ? record.evidenceClass === "model_output"
            : record.evidenceClass === "primary_confirmed"),
      );
    for (const source of refs) {
      try {
        officialAnnouncementUrl(source.url);
        if (!["cec", "knesset"].includes(source.authority)) sourceValid = false;
      } catch {
        sourceValid = false;
      }
    }
    const checks: GateCheck[] = [
      {
        id: "election_identity",
        state: sourceValid ? "pass" : "blocked",
        evidenceRefs: announcements.map((record) => record.revisionId),
      },
      {
        id: "confirmed_date",
        state: dates.size === 1 && sourceValid ? "pass" : "blocked",
        evidenceRefs: announcements.map((record) => record.revisionId),
      },
      {
        id: "qualified_source_configuration",
        state:
          p &&
          sourceValid &&
          announcements.some(
            (record) => record.revisionId === p.announcementRevisionId,
          ) &&
          p.definition.electionDay === [...dates][0]
            ? "pass"
            : "blocked",
        evidenceRefs: configuration ? [configuration.revisionId] : [],
      },
    ];
    if (configuration) {
      const attestations = records.filter(
        (record) =>
          record.kind === "capability_attestation" && record.electionId === id,
      );
      for (const attestation of attestations) {
        const body = attestation.payload as unknown as WorkspaceAttestation;
        const proofs = (
          await Promise.all(
            body.proofRevisionIds?.map((proof) =>
              repository.getRevision(proof),
            ) ?? [],
          )
        ).filter((record): record is PoliticalRecord => !!record);
        checks.push({
          id: body.checkId,
          state: proofValid(attestation, configuration, proofs, now)
            ? "pass"
            : "blocked",
          evidenceRefs: [attestation.revisionId],
        });
      }
    }
    const gate = capabilityGate("workspace", checks),
      capabilities = Object.fromEntries(
        [
          "workspace",
          "exit_forecast",
          "official_seats",
          "formation",
          "count_informed_odds",
          "durable_shadow",
          "public_api",
          "subscriptions",
        ].map((capability) => [
          capability,
          capability === "workspace" && gate.ready,
        ]),
      ) as ElectionWorkspace["capabilities"];
    if (windows.some((window) => window.truncated)) {
      gate.blockers.push("registry_window_incomplete");
      capabilities.workspace = false;
    }
    workspaces.push({
      id,
      termNumber: Number(announcements[0].payload.termNumber),
      announcedDate: [...dates].sort().at(-1)!,
      definition: p?.definition ?? null,
      configurationRevisionId: configuration?.revisionId ?? null,
      announcementRevisionIds: announcements.map((record) => record.revisionId),
      sourceRefs: refs,
      state: gate.blockers.length
        ? p
          ? "blocked"
          : "draft"
        : id === activeId
          ? "active"
          : "retired",
      blockers: gate.blockers,
      capabilities,
      rehearsal,
    });
  }
  return {
    currentElectionId: activeId,
    baseline: ELECTIONS,
    workspaces,
    asOfCursor: first.asOfCursor,
    pointerRevisionId: pointer?.revisionId ?? null,
    complete: !windows.some((window) => window.truncated),
  };
}
export async function activateReadyWorkspace(
  repository: PoliticalRecordRepository,
  now: string,
  rehearsal = false,
) {
  if (rehearsal && process.env.VERCEL_ENV === "production")
    throw new Error("rehearsal_forbidden");
  const registry = await workspaceRegistry(repository, now, rehearsal);
  const currentTerm =
    registry.workspaces.find(
      (workspace) => workspace.id === registry.currentElectionId,
    )?.termNumber ?? currentElection().termNumber;
  const next = registry.workspaces
    .filter(
      (workspace) =>
        workspace.capabilities.workspace && workspace.termNumber >= currentTerm,
    )
    .sort((a, b) => b.termNumber - a.termNumber)[0];
  if (!next)
    return {
      status: "blocked",
      blockers: registry.workspaces.flatMap((workspace) => workspace.blockers),
    };
  if (next.id === registry.currentElectionId)
    return { status: "unchanged", electionId: next.id };
  const recordId = rehearsal ? `${POINTER}:rehearsal` : POINTER;
  const pointer = makeRecord({
    recordId,
    kind: "election_activation",
    electionId: null,
    effectiveAt: now,
    observedAt: now,
    status: "confirmed",
    evidenceClass: "model_output",
    previousRevisionId: registry.pointerRevisionId,
    payload: {
      electionId: next.id,
      previousElectionId: registry.currentElectionId,
      configurationRevisionId: next.configurationRevisionId,
      rehearsal,
      capabilities: next.capabilities,
      governmentContinuity: "unchanged",
    },
    provenance: {
      sourceIds: next.sourceRefs.map((source) => source.revisionId),
      captureIds: [],
      parserVersion: "workspace-activation-v1",
    },
  });
  const saved = await repository.compareAndAppend(
    { records: [pointer], sources: [], captures: [], outbox: [] },
    { recordId, revisionId: registry.pointerRevisionId },
  );
  return {
    status: saved.conflict ? "retry" : "activated",
    electionId: next.id,
    revisionId: pointer.revisionId,
  };
}
