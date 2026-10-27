import type { SourceDocument } from "./translations";
import type { Lang } from "@/lib/i18n";

export function appliedToolEdition<T>(
  original: T,
  source: SourceDocument,
  blocks: readonly { id: string; text: string }[],
  lang: Lang,
) {
  const data = applyToolCopy(original, source, blocks);
  return data === null
    ? { data: original, state: "pending" as const, contentLang: "en" as const }
    : { data, state: "ready" as const, contentLang: lang };
}

/** Only registered string fields may change. IDs, answers, routes and data stay intact. */
export function applyToolCopy<T>(
  original: T,
  source: SourceDocument,
  translated: readonly { id: string; text: string }[],
): T | null {
  if (translated.length !== source.blocks.length) return null;
  const copy = structuredClone(original);
  for (let i = 0; i < source.blocks.length; i++) {
    const block = source.blocks[i],
      next = translated[i];
    if (next.id !== block.id || !next.text.trim() || !block.field) return null;
    const path = block.field.split(".");
    let node: unknown = copy;
    for (const key of path.slice(0, -1)) {
      if (!node || typeof node !== "object" || !Object.hasOwn(node, key))
        return null;
      node = (node as Record<string, unknown>)[key];
    }
    const key = path.at(-1)!;
    if (
      !node ||
      typeof node !== "object" ||
      !Object.hasOwn(node, key) ||
      (node as Record<string, unknown>)[key] !== block.text
    )
      return null;
    (node as Record<string, unknown>)[key] = next.text;
  }
  return copy;
}
