import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { toolDocuments, generationDocuments, translatedTool } from "./catalog";
import { sourceRevision } from "./source.mjs";
import { applyToolCopy, appliedToolEdition } from "./tool-copy";
import journeys from "@/data/journeys.json";

describe("trusted interactive copy", () => {
  it("registers three actual source revisions without translating control data", () => {
    expect(toolDocuments).toHaveLength(3);
    expect(generationDocuments).toHaveLength(46);
    for (const source of toolDocuments) {
      expect(source.revision).toBe(sourceRevision(readFileSync(source.file)));
      expect(
        source.blocks.every(
          (b) => b.field && !/\.(?:id|href|answer|minutes|row)$/.test(b.field),
        ),
      ).toBe(true);
    }
  });
  it("changes only trusted text while preserving correct answers, route IDs and links", () => {
    const source = toolDocuments.find((d) => d.id === "tools:journeys")!;
    const copy = applyToolCopy(
      journeys,
      source,
      source.blocks.map((b) => ({ id: b.id, text: "Translated: " + b.text })),
    );
    expect(copy!.steps.voters.title).toMatch(/^Translated:/);
    expect(copy!.steps.voters.answer).toBe(journeys.steps.voters.answer);
    expect(copy!.steps.voters.href).toBe(journeys.steps.voters.href);
    expect(copy!.routes[0].steps).toEqual(journeys.routes[0].steps);
    expect(journeys.steps.voters.title).not.toMatch(/^Translated:/);
  });
  it("rejects malformed paths/IDs and explicitly retains original pending copy", () => {
    const source = toolDocuments[0];
    expect(applyToolCopy({}, source, [])).toBeNull();
    const edition = translatedTool("tools:journeys", "he", journeys);
    expect(edition.state).toBe("pending");
    expect(edition.contentLang).toBe("en");
    expect(edition.data).toBe(journeys);
  });
  it("refuses different supplied content despite a valid registered source revision", () => {
    const source = toolDocuments.find((d) => d.id === "tools:journeys")!;
    const stale = structuredClone(journeys);
    stale.steps.voters.title = "Different source copy";
    const selected = appliedToolEdition(
      stale,
      source,
      source.blocks.map((b) => ({ id: b.id, text: "Translated: " + b.text })),
      "he",
    );
    expect(selected).toEqual({
      data: stale,
      state: "pending",
      contentLang: "en",
    });
  });
});
