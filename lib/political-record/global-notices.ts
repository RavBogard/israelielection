import { cache } from "react";
import { connection } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { configuredPoliticalRecords } from "./postgres";
import { projectPublication } from "./publications";
import { projectPublic } from "./public-projection";
import type { EmailLocale } from "./email";
import type { PoliticalRecord, PoliticalRecordRepository } from "./types";

export type GlobalNotice = {
  recordId: string;
  revisionId: string;
  previousRevisionId: string | null;
  observedAt: string;
  state: "reviewed" | "pending";
  evidenceClasses: string[];
  content: { subject: string; text: string } | null;
  sources: {
    id: string;
    publisher: string;
    title: string;
    url: string;
    publishedAt: string | null;
    observedAt: string;
  }[];
};
export type GlobalNotices = {
  state: "available" | "disabled" | "unavailable";
  complete: boolean;
  notices: GlobalNotice[];
};
/** One row per current global publication identity; raw observations/drafts never become notices. */
export async function loadGlobalNotices(
  repository: PoliticalRecordRepository,
  locale: EmailLocale,
  now: string,
): Promise<GlobalNotices> {
  const page = await repository.latest({
    kind: "publication",
    globalOnly: true,
    limit: 25,
  });
  const notices: GlobalNotice[] = [];
  for (const record of page.records) {
    if (
      record.kind !== "publication" ||
      record.electionId !== null ||
      record.status !== "confirmed"
    )
      continue;
    // This is exactly the API's live source/revision/independent-review/locale gate.
    const projected = projectPublic(
      await projectPublication(repository, record, locale, now, "latest"),
    ) as PoliticalRecord;
    const payload = projected.payload,
      content = payload.content as GlobalNotice["content"],
      ready = payload.currentTextUnavailable === false && !!content;
    notices.push({
      recordId: record.recordId,
      revisionId: record.revisionId,
      previousRevisionId: record.previousRevisionId,
      observedAt: record.observedAt,
      state: ready ? "reviewed" : "pending",
      evidenceClasses: Array.isArray(payload.evidenceClasses)
        ? payload.evidenceClasses.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
      content: ready
        ? { subject: content!.subject, text: content!.text }
        : null,
      sources:
        ready && Array.isArray(payload.sourceRefs)
          ? (payload.sourceRefs as GlobalNotice["sources"])
          : [],
    });
  }
  return { state: "available", complete: !page.truncated, notices };
}
export const getGlobalNotices = cache(
  async (locale: EmailLocale): Promise<GlobalNotices> => {
    if (
      process.env.POLITICAL_RECORD_READ_ENABLED !== "true" ||
      process.env.POLITICAL_RECORD_PUBLIC_READ_ENABLED !== "true"
    )
      return { state: "disabled", complete: false, notices: [] };
    await connection();
    let repository: ReturnType<typeof configuredPoliticalRecords> = null;
    try {
      repository = configuredPoliticalRecords();
      if (!repository)
        return { state: "unavailable", complete: false, notices: [] };
      return await loadGlobalNotices(
        repository,
        locale,
        new Date().toISOString(),
      );
    } catch (error) {
      unstable_rethrow(error);
      return { state: "unavailable", complete: false, notices: [] };
    } finally {
      try {
        await repository?.close();
      } catch (error) {
        unstable_rethrow(error);
      }
    }
  },
);
