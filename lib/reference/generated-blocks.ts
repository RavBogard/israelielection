import { ReferenceValidationError, type SourceBlock } from "./translations";
export function generatedBlocks(source: SourceBlock[], value: unknown) {
  if (!Array.isArray(value) || value.length !== source.length)
    throw new ReferenceValidationError("generated_block_mismatch", {
      check: "block_count",
      expected: source.length,
      actual: Array.isArray(value) ? value.length : null,
    });
  const map = new Map<string, { id: string; text: string }>();
  for (const block of value) {
    if (
      !block ||
      typeof block.id !== "string" ||
      typeof block.text !== "string" ||
      !block.text.trim() ||
      map.has(block.id) ||
      !source.some((s) => s.id === block.id)
    )
      throw new ReferenceValidationError("generated_block_mismatch", {
        check: "block_shape_or_identity",
        blockId: typeof block?.id === "string" ? block.id.slice(0, 80) : null,
      });
    map.set(block.id, block);
  }
  return map;
}
