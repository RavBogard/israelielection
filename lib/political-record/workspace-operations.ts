import { configuredPoliticalRecords } from "./postgres";
import { configuredCaptureArchive } from "./blob";
import {
  captureElectionAnnouncement,
  activateReadyWorkspace,
  workspaceRegistry,
} from "./workspaces";
import {
  stageAnnouncedWorkspaces,
  probeWorkspaceReadiness,
} from "./workspace-probes";
import { fetchPrimary } from "../election-lifecycle/acquisition";
import { linksOf } from "../election-lifecycle/html";
import type { PoliticalRecordRepository } from "./types";
import type { CaptureArchive } from "./captures";
const INDEX = "https://www.bechirot.gov.il/home";
const HOSTS = ["www.bechirot.gov.il", "bechirot.gov.il", "www.gov.il"];
/** Fixed primary index discovery, bounded to two linked notices. No caller-supplied acquisition URL. */
export async function discoverElectionAnnouncements(
  repository: PoliticalRecordRepository,
  archive: CaptureArchive | null,
  now: string,
  acquire: (url: string) => Promise<string> = (url) => fetchPrimary(url, HOSTS),
) {
  const html = await acquire(INDEX);
  const urls = [
    INDEX,
    ...linksOf(html, INDEX)
      .filter(
        (link) =>
          /הבחירות לכנסת|election.*knesset/i.test(link.title) &&
          HOSTS.includes(new URL(link.url).hostname),
      )
      .map((link) => link.url),
  ]
    .filter((url, index, all) => all.indexOf(url) === index)
    .slice(0, 3);
  const results = [];
  for (const url of urls) {
    try {
      const record = await captureElectionAnnouncement(
        repository,
        url,
        archive,
        now,
        false,
        async (value) => (value === INDEX ? html : acquire(value)),
      );
      results.push({ status: "qualified", electionId: record.electionId });
    } catch {
      results.push({ status: "unqualified" });
    }
  }
  return results;
}
export async function runWorkspaceCycle(
  repository: PoliticalRecordRepository,
  archive: CaptureArchive | null,
  origin: string,
  now: string,
  options: { discover: boolean; activate: boolean; rehearsal?: boolean },
) {
  const rehearsal = options.rehearsal === true;
  if (rehearsal && process.env.VERCEL_ENV === "production")
    throw new Error("rehearsal_forbidden");
  let discovery: unknown = { status: "disabled" };
  if (options.discover) {
    if (rehearsal) throw new Error("rehearsal_live_discovery_forbidden");
    try {
      discovery = await discoverElectionAnnouncements(repository, archive, now);
    } catch {
      discovery = { status: "source_unavailable" };
    }
  }
  await stageAnnouncedWorkspaces(repository, now, rehearsal);
  const registry = await workspaceRegistry(repository, now, rehearsal);
  const candidate = registry.workspaces
    .filter(
      (workspace) =>
        workspace.configurationRevisionId &&
        workspace.id !== registry.currentElectionId,
    )
    .sort((a, b) => b.termNumber - a.termNumber)[0];
  const readiness = candidate
    ? await probeWorkspaceReadiness(
        repository,
        candidate.id,
        origin,
        archive,
        now,
      )
    : { status: "no_candidate" };
  const activation = options.activate
    ? await activateReadyWorkspace(repository, now, rehearsal)
    : { status: "disabled" };
  return { status: "checked", discovery, readiness, activation };
}
export async function runConfiguredWorkspaceCycle() {
  if (process.env.POLITICAL_ELECTION_REGISTRY_ENABLED !== "true")
    return { status: "disabled" };
  let repository: ReturnType<typeof configuredPoliticalRecords> = null;
  try {
    repository = configuredPoliticalRecords();
    if (!repository || !process.env.POLITICAL_WORKSPACE_SITE_ORIGIN)
      return { status: "unconfigured" };
    return await runWorkspaceCycle(
      repository,
      configuredCaptureArchive(),
      process.env.POLITICAL_WORKSPACE_SITE_ORIGIN,
      new Date().toISOString(),
      {
        discover: process.env.POLITICAL_ELECTION_DISCOVERY_ENABLED === "true",
        activate: process.env.POLITICAL_ELECTION_ACTIVATION_ENABLED === "true",
      },
    );
  } catch {
    return { status: "unavailable" };
  } finally {
    try {
      await repository?.close();
    } catch {
      /* Cleanup does not change the committed activation. */
    }
  }
}
