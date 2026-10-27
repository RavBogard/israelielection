import { describe, it, expect } from "vitest";
import { generatedBlocks } from "./generated-blocks";
const blocks = [
  { id: "a", kind: "text", text: "source", names: [], negated: false },
];
describe("model block shape", () => {
  it("rejects missing, duplicate, unknown and nontext blocks before alignment", () => {
    for (const value of [
      undefined,
      [],
      [{ id: "missing", text: "x" }],
      [{ id: "a", text: null }],
      [{ id: "a", text: "" }],
    ])
      expect(() => generatedBlocks(blocks, value)).toThrow(
        "generated_block_mismatch",
      );
  });
  it("only returns a known source identity", () => {
    expect(
      generatedBlocks(blocks, [{ id: "a", text: "translated" }]).get("a")?.text,
    ).toBe("translated");
  });
});
