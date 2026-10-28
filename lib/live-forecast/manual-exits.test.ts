import { describe, expect, it } from "vitest";
import bundled from "../../data/polls.json";
import frozen from "../../data/live-forecast-prior.json";
import type { PollsFile } from "../types";
import { manualExits } from "./sources";

// Election night 2026-10-28: three hand-entered updates dated the 28th were silently dropped by validExit.
describe("hand-entered exit polls", () => {
  it("every one from a modelled pollster reaches the model", () => {
    const set = new Set(frozen.inputs.pollFile.config.withoutVariant.pollsters);
    const entered = (bundled as PollsFile).polls.filter((p) => p.kind === "exit" && !set.has(p.pollster)).map((p) => p.id);
    const accepted = manualExits("2026-11-01T00:00:00Z").map((p) => p.id);
    expect(accepted).toEqual(expect.arrayContaining(entered));
  });
});
