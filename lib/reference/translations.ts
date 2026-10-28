import { numericTokens } from "./numeric.mjs";
import { createHash } from "node:crypto";
import type { Lang } from "@/lib/i18n";
export class ReferenceValidationError extends Error {
  usage?: object[];
  candidate?: Record<string, unknown>;
  constructor(
    code: string,
    readonly diagnostic: Record<string, unknown>,
  ) {
    super(code);
    this.name = "ReferenceValidationError";
  }
}
export type SourceBlock = {
  id: string;
  kind: string;
  text: string;
  names: string[];
  negated: boolean;
  field?: string;
  /** A heading the source gives an explicit id, kept so links like /about#privacy still land. */
  anchor?: string;
  widget?: { name: string; attrs: Record<string, string> };
};
export type SourceDocument = {
  id: string;
  path: string;
  file: string;
  revision: string;
  title: string;
  checked: string;
  links: string[];
  numbers: string[];
  blocks: SourceBlock[];
};
export type TranslationDocument = {
  id: string;
  lang: Exclude<Lang, "en">;
  sourceRevision: string;
  status: "published" | "withdrawn";
  blocks: { id: string; text: string }[];
  publishedAt: string;
  review: {
    sourceRevision: string;
    contentHash: string;
    model: string;
    verdict: "supported" | "rejected";
    blocks: {
      id: string;
      supported: boolean;
      complete: boolean;
      negationPreserved: boolean;
      namesPreserved: boolean;
      reasonCode?: string;
    }[];
  };
};
export const translationContentHash = (
  value: Pick<TranslationDocument, "id" | "lang" | "sourceRevision" | "blocks">,
) =>
  createHash("sha256")
    .update(
      JSON.stringify({
        id: value.id,
        lang: value.lang,
        sourceRevision: value.sourceRevision,
        blocks: value.blocks,
      }),
    )
    .digest("hex");
const numbers = numericTokens;
export const renderedLinks = (text: string) =>
  [
    ...(text.match(/https?:\/\/[^\s)"<>]+/g) ?? []),
    ...[...text.matchAll(/\]\((\/[^\s)]+)\)/g)].map((m) => m[1]),
  ].sort();
const same = (a: string[], b: string[]) =>
  JSON.stringify(a) === JSON.stringify(b);
const negative: Record<Exclude<Lang, "en">, RegExp> = {
  he: /לא|אין|אינ[והםן]|בלי|אלא|(?:^|\s)טרם(?:\s|$)/,
  ar: /لا|ليس|لم|لن|غير|دون/,
  fa: /نیست|نمی|نه|بدون|نبود|هیچ|نخواهد|ندارد/,
  de: /\b(?:nicht|kein\w*|nie|niemals|niemand(?:en|em|es)?|nichts|keineswegs|weder|ohne|unabhängig)\b/i,
  fr: /\b(?:pas|ne|n’|n'|aucun\w*|jamais|ni|sans|non)\b/i,
  zh: /不|无|没有|未|非|并非|不能/,
};
export function validateRenderedTranslation(
  value: TranslationDocument,
  source: SourceDocument,
) {
  if (
    value.id !== source.id ||
    value.sourceRevision !== source.revision ||
    !Number.isFinite(Date.parse(value.publishedAt)) ||
    !negative[value.lang]
  )
    throw Error("invalid_translation");
  if (value.status === "withdrawn") return value;
  if (
    value.status !== "published" ||
    value.blocks?.length !== source.blocks.length
  )
    throw Error("incomplete_source_blocks");
  for (let i = 0; i < source.blocks.length; i++) {
    const expected = source.blocks[i],
      actual = value.blocks[i];
    if (!actual || actual.id !== expected.id || !actual.text.trim())
      throw Error("source_block_mismatch");
    if (expected.kind === "widget") {
      if (actual.text !== expected.text) throw Error("untrusted_widget");
      continue;
    }
    if (
      !same(numbers(expected.text), numbers(actual.text, value.lang)) ||
      !same(renderedLinks(expected.text), renderedLinks(actual.text))
    )
      throw new ReferenceValidationError("rendered_invariants_changed", {
        blockId: expected.id,
        check: "numbers_and_links",
        expectedNumbers: numbers(expected.text),
        actualNumbers: numbers(actual.text, value.lang),
        expectedLinks: renderedLinks(expected.text),
        actualLinks: renderedLinks(actual.text),
      });
    if (/<\/?[A-Za-z][^>]*>/.test(actual.text))
      throw Error("executable_markup_forbidden");
    if (expected.names.some((name) => !actual.text.includes(name)))
      throw new ReferenceValidationError("rendered_name_missing", {
        blockId: expected.id,
        check: "protected_names",
      });
    if (expected.negated && !negative[value.lang].test(actual.text))
      throw new ReferenceValidationError("rendered_negation_missing", {
        blockId: expected.id,
        check: "negation",
      });
  }
  return value;
}
export function validateTranslation(
  value: TranslationDocument,
  source: SourceDocument,
) {
  validateRenderedTranslation(value, source);
  if (value.status === "withdrawn") return value;
  const review = value.review;
  if (
    !review ||
    review.sourceRevision !== source.revision ||
    review.contentHash !== translationContentHash(value) ||
    !review.model ||
    review.verdict !== "supported" ||
    review.blocks.length !== source.blocks.length ||
    review.blocks.some(
      (r, i) =>
        r.id !== source.blocks[i].id ||
        !r.supported ||
        !r.complete ||
        !r.negationPreserved ||
        !r.namesPreserved,
    )
  )
    throw new ReferenceValidationError("semantic_review_required", {
      check: "semantic_support",
      blocks:
        review?.blocks
          .filter(
            (r) =>
              !r.supported ||
              !r.complete ||
              !r.negationPreserved ||
              !r.namesPreserved,
          )
          .map((r) => ({
            id: r.id,
            supported: r.supported,
            complete: r.complete,
            negationPreserved: r.negationPreserved,
            namesPreserved: r.namesPreserved,
            reasonCode: r.reasonCode,
          })) ?? [],
    });
  return value;
}
export function selectTranslation(
  source: SourceDocument,
  lang: Lang,
  translations: readonly TranslationDocument[],
) {
  if (lang === "en") return { state: "original" as const, source };
  const candidate = translations
    .filter((t) => t.id === source.id && t.lang === lang)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0];
  if (!candidate) return { state: "pending" as const, source };
  if (
    candidate.status === "withdrawn" ||
    candidate.sourceRevision !== source.revision
  )
    return { state: "withdrawn" as const, source };
  try {
    return {
      state: "ready" as const,
      source,
      translation: validateTranslation(candidate, source),
    };
  } catch {
    return { state: "pending" as const, source };
  }
}
