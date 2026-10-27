import { afterEach, expect, it, vi } from "vitest";
import { makeRecord } from "./records";
import type { PoliticalRecordRepository } from "./types";
const mocks = vi.hoisted(() => ({
  project: vi.fn(),
  repository: vi.fn(),
  connection: vi.fn(),
}));
vi.mock("./publications", () => ({ projectPublication: mocks.project }));
vi.mock("./postgres", () => ({ configuredPoliticalRecords: mocks.repository }));
vi.mock("next/server", () => ({ connection: mocks.connection }));
vi.mock("next/navigation", () => ({
  unstable_rethrow: (error: unknown) => {
    if ((error as { framework?: boolean }).framework) throw error;
  },
}));
import { getGlobalNotices, loadGlobalNotices } from "./global-notices";
const record = makeRecord({
  recordId: "notice:indicator:cbs:120010:2026-09",
  kind: "publication",
  electionId: null,
  effectiveAt: null,
  observedAt: "2026-10-27T00:47:36.758Z",
  status: "confirmed",
  evidenceClass: "primary_confirmed",
  previousRevisionId: null,
  payload: {},
  provenance: { sourceIds: [], captureIds: [] },
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
it("uses the same API locale gate and emits only reviewed public content, one global publication per identity", async () => {
  const latest = vi
    .fn()
    .mockResolvedValue({
      records: [
        record,
        { ...record, status: "withdrawn" },
        { ...record, kind: "indicator_observation" },
      ],
      truncated: false,
    });
  const repo = { latest } as unknown as PoliticalRecordRepository;
  mocks.project.mockResolvedValue({
    ...record,
    payload: {
      currentTextUnavailable: false,
      locale: "fr",
      evidenceClasses: ["primary_confirmed"],
      content: {
        subject: "Indice",
        text: "105,3; -0,5 %; 1,6 %",
        privateRaw: "secret",
      },
      candidate: "failed draft",
      sourceRefs: [
        {
          id: "cbs",
          publisher: "CBS",
          title: "CPI",
          url: "https://api.cbs.gov.il/",
          observedAt: record.observedAt,
          publishedAt: null,
          storageKey: "private/secret",
        },
      ],
    },
  });
  const result = await loadGlobalNotices(repo, "fr", record.observedAt);
  expect(latest).toHaveBeenCalledWith({
    kind: "publication",
    globalOnly: true,
    limit: 25,
  });
  expect(mocks.project).toHaveBeenCalledExactlyOnceWith(
    repo,
    record,
    "fr",
    record.observedAt,
    "latest",
  );
  expect(result.notices).toHaveLength(1);
  expect(result.notices[0]).toMatchObject({
    state: "reviewed",
    content: { subject: "Indice", text: "105,3; -0,5 %; 1,6 %" },
    observedAt: record.observedAt,
  });
  expect(JSON.stringify(result)).not.toMatch(
    /secret|failed draft|storageKey|candidate|privateRaw/,
  );
});
it("pending locale never copies English or rejected text and remains explicit", async () => {
  const repo = {
    latest: vi.fn().mockResolvedValue({ records: [record], truncated: true }),
  } as unknown as PoliticalRecordRepository;
  mocks.project.mockResolvedValue({
    ...record,
    payload: {
      currentTextUnavailable: true,
      content: { subject: "English fallback", text: "failed candidate" },
    },
  });
  const result = await loadGlobalNotices(repo, "fr", record.observedAt);
  expect(result.complete).toBe(false);
  expect(result.notices[0]).toMatchObject({
    state: "pending",
    content: null,
    sources: [],
  });
  expect(JSON.stringify(result)).not.toMatch(
    /English fallback|failed candidate/,
  );
});
it("disabled reads acquire nothing; store failure is unavailable while framework errors propagate", async () => {
  expect((await getGlobalNotices("en")).state).toBe("disabled");
  expect(mocks.repository).not.toHaveBeenCalled();
  vi.stubEnv("POLITICAL_RECORD_READ_ENABLED", "true");
  vi.stubEnv("POLITICAL_RECORD_PUBLIC_READ_ENABLED", "true");
  mocks.repository.mockReturnValue({
    latest: vi.fn().mockRejectedValue(Error("store unavailable")),
    close: vi.fn().mockRejectedValue(Error("cleanup unavailable")),
  });
  expect((await getGlobalNotices("en")).state).toBe("unavailable");
  const framework = Object.assign(Error("dynamic bailout"), {
    framework: true,
  });
  mocks.connection.mockRejectedValueOnce(framework);
  await expect(getGlobalNotices("en")).rejects.toBe(framework);
});
