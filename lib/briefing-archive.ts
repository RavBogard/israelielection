import { configuredCaptureArchive } from "./political-record/blob";
import { contentHash } from "./political-record/captures";
import { makeSource } from "./political-record/records";
import type {
  CapturedArticle,
  AtomicClaim,
  ClaimReview,
} from "./briefing-verified";
export type BriefingTranslationEvidence = {
  locale: import("./political-record/email").EmailLocale;
  model: string;
  sentences: { id: string; text: string; sourceHash: string }[];
  review: {
    id: string;
    supported: boolean;
    complete: boolean;
    attributionPreserved: boolean;
  }[];
};
export type BriefingEvidenceBundle = {
  date: string;
  model: string;
  articles: CapturedArticle[];
  claims: AtomicClaim[];
  review: ClaimReview[];
  translations?: BriefingTranslationEvidence[];
  draftClaims?: AtomicClaim[];
  reviewedClaims?: AtomicClaim[];
  discarded?: {
    claimId: string;
    code: string;
    diagnostic: Record<string, unknown>;
  }[];
};
export async function archiveBriefingEvidence(
  bundle: BriefingEvidenceBundle,
  dryRun: boolean,
) {
  if (dryRun)
    return { state: "in_memory_only" as const, privateStored: false as const };
  const archive = configuredCaptureArchive();
  if (!archive) throw Error("private_capture_unconfigured");
  const bytes = new TextEncoder().encode(JSON.stringify(bundle)),
    hash = contentHash(bytes),
    now = new Date().toISOString();
  const source = makeSource({
    sourceId: "briefing-evidence:" + bundle.date,
    publisher: "israelielection.org",
    title: "Private briefing verification bundle",
    captureHash: hash,
    url: "https://www.israelielection.org/news/" + bundle.date,
    authority: "briefing_evidence",
    observedAt: now,
    publishedAt: null,
  });
  const ref = await archive.put(source, bytes, "application/json");
  const roundtrip = await archive.read(ref);
  if (contentHash(roundtrip) !== hash)
    throw Error("private_capture_verification_failed");
  return {
    state: "archived" as const,
    captureHash: hash,
    privateStored: true as const,
  };
}
