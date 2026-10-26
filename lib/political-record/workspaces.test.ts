import { beforeAll, afterAll, afterEach, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { PostgresPoliticalRecords, type SqlPool } from "./postgres";
import {
  captureElectionAnnouncement,
  parseElectionAnnouncement,
  workspaceRegistry,
  activateReadyWorkspace,
} from "./workspaces";
import {
  stageAnnouncedWorkspaces,
  probeWorkspaceReadiness,
} from "./workspace-probes";
import { makeCapture } from "./records";
import { contentHash, type CaptureArchive } from "./captures";
const now = "2026-11-04T12:00:00Z",
  url = "https://www.bechirot.gov.il/home";
let db: PGlite, repo: PostgresPoliticalRecords;
const bodies = new Map<string, Uint8Array>();
const archive: CaptureArchive = {
  put: async (source, body, mediaType) => {
    const hash = contentHash(body);
    bodies.set(hash, body);
    return makeCapture({
      sourceRevisionId: source.revisionId,
      contentSha256: hash,
      storageKey: `private/${hash}`,
      mediaType,
      byteLength: body.byteLength,
      observedAt: source.observedAt,
    });
  },
  read: async (ref) => {
    const body = bodies.get(ref.contentSha256);
    if (!body) throw new Error("capture_missing");
    return body;
  },
};
const routeFetch: typeof fetch = async (input) => {
  const path = new URL(String(input)).pathname,
    parts = path.split("/").filter(Boolean),
    locale = parts[0] === "elections" ? "en" : parts[0],
    id = parts.at(-1);
  return new Response(
    `<main data-election-workspace="${id}" data-workspace-locale="${locale}"></main>`,
  );
};
beforeAll(async () => {
  db = new PGlite();
  for (const name of [
    "001-political-record.sql",
    "003-platform-workspaces.sql",
  ])
    await db.exec(await readFile(`db/${name}`, "utf8"));
  const pool: SqlPool = {
    connect: async () => ({
      query: async (text, values) => {
        if (text.includes("pg_advisory_xact_lock"))
          return { rows: [], rowCount: 1 };
        const result = await db.query<Record<string, unknown>>(text, values);
        return { rows: result.rows, rowCount: result.affectedRows ?? 0 };
      },
      release() {},
    }),
    end: async () => {},
  };
  repo = new PostgresPoliticalRecords(pool);
}, 30000);
afterAll(async () => await db?.close());
afterEach(() => vi.unstubAllEnvs());
it("requires one authoritative non-proposed term/date and rejects tests or conflicting notices", () => {
  expect(
    parseElectionAnnouncement(
      "Elections to the 27th Knesset will take place on 2027-02-02.",
      url,
      now,
    ).electionId,
  ).toBe("il-knesset-27");
  expect(() =>
    parseElectionAnnouncement(
      "Elections to Knesset 27 may take place on 2027-02-02.",
      url,
      now,
    ),
  ).toThrow();
  expect(() =>
    parseElectionAnnouncement(
      "Test environment. Elections to Knesset 27 on 2027-02-02.",
      url,
      now,
    ),
  ).toThrow("test_environment");
  expect(() =>
    parseElectionAnnouncement(
      "Elections to Knesset 27 on 2027-02-02. Elections to Knesset 27 on 2027-03-03.",
      url,
      now,
    ),
  ).toThrow("conflict");
  expect(() =>
    parseElectionAnnouncement(
      "Elections to Knesset 27 on 2027-02-02.",
      "https://untrusted.example/elections",
      now,
    ),
  ).toThrow("not_allowed");
});
it("stages a basic date-only workspace without inventing a closing time or enabling odds", async () => {
  const notice = await captureElectionAnnouncement(
    repo,
    url,
    archive,
    now,
    false,
    async () => "Elections to the 27th Knesset on 2027-02-02.",
  );
  expect(
    (
      await captureElectionAnnouncement(
        repo,
        url,
        archive,
        now,
        false,
        async () => "Elections to the 27th Knesset on 2027-02-02.",
      )
    ).revisionId,
  ).toBe(notice.revisionId);
  expect((await stageAnnouncedWorkspaces(repo, now)).count).toBe(1);
  const registry = await workspaceRegistry(repo, now),
    workspace = registry.workspaces.find((row) => row.id === "il-knesset-27")!;
  expect(workspace.definition?.pollsClose).toBeNull();
  expect(workspace.capabilities.workspace).toBe(false);
  expect(workspace.capabilities.count_informed_odds).toBe(false);
  expect(registry.currentElectionId).toBe("il-knesset-26");
});
it("HTTP200 without exact edition/locale markers cannot satisfy readiness", async () => {
  await probeWorkspaceReadiness(
    repo,
    "il-knesset-27",
    "https://example.org",
    archive,
    now,
    async () => new Response("generic page"),
  );
  expect((await activateReadyWorkspace(repo, now)).status).toBe("blocked");
});
it("private archive outage blocks activation even with good locale routes", async () => {
  await probeWorkspaceReadiness(
    repo,
    "il-knesset-27",
    "https://example.org",
    {
      ...archive,
      read: async () => {
        throw new Error("blob_down");
      },
    },
    now,
    routeFetch,
  );
  expect((await activateReadyWorkspace(repo, now)).status).toBe("blocked");
});
it("actual route/archive/storage proofs activate once, retain immutable pointers and leave global records untouched", async () => {
  await probeWorkspaceReadiness(
    repo,
    "il-knesset-27",
    "https://example.org",
    archive,
    now,
    routeFetch,
  );
  const activated = await activateReadyWorkspace(repo, now);
  expect(activated.status).toBe("activated");
  expect((await activateReadyWorkspace(repo, now)).status).toBe("unchanged");
  const pointer = await repo.getLatest("platform:active-election-workspace");
  expect(pointer?.payload.governmentContinuity).toBe("unchanged");
  const stale = await repo.compareAndAppend(
    { records: [], sources: [], captures: [], outbox: [] },
    { recordId: "platform:active-election-workspace", revisionId: null },
  );
  expect(stale.conflict).toBe(true);
  const registry = await workspaceRegistry(repo, now);
  expect(registry.currentElectionId).toBe("il-knesset-27");
  expect(registry.workspaces[0].capabilities.formation).toBe(false);
});
it("rapid repeat edition preserves the earlier dynamic archive and pins", async () => {
  await captureElectionAnnouncement(
    repo,
    url,
    archive,
    now,
    false,
    async () => "Elections to Knesset 28 on 2027-08-08.",
  );
  await stageAnnouncedWorkspaces(repo, now);
  const config = await repo.getLatest("workspace:il-knesset-28");
  expect(config?.payload.historicalPrefixes).toContain(
    "/elections/il-knesset-27",
  );
  expect(config?.payload.historicalPins).toContainEqual(
    expect.objectContaining({
      electionId: "il-knesset-27",
      basis: "workspace",
    }),
  );
  await probeWorkspaceReadiness(
    repo,
    "il-knesset-28",
    "https://example.org",
    archive,
    now,
    routeFetch,
  );
  expect((await activateReadyWorkspace(repo, now)).status).toBe("activated");
  expect((await workspaceRegistry(repo, now)).currentElectionId).toBe(
    "il-knesset-28",
  );
  expect(await repo.getRevision(config!.revisionId)).toBeTruthy();
});
it("synthetic rehearsal uses a separate pointer and production rejects it", async () => {
  await captureElectionAnnouncement(
    repo,
    "https://www.bechirot.gov.il/rehearsal",
    archive,
    now,
    true,
    async () => "Elections to Knesset 29 on 2028-03-03.",
  );
  await stageAnnouncedWorkspaces(repo, now, true);
  await probeWorkspaceReadiness(
    repo,
    "il-knesset-29",
    "https://example.org",
    archive,
    now,
    routeFetch,
  );
  expect((await activateReadyWorkspace(repo, now, true)).status).toBe(
    "activated",
  );
  expect((await workspaceRegistry(repo, now)).currentElectionId).toBe(
    "il-knesset-28",
  );
  vi.stubEnv("VERCEL_ENV", "production");
  await expect(activateReadyWorkspace(repo, now, true)).rejects.toThrow(
    "rehearsal_forbidden",
  );
});
