import { describe, expect, it } from "vitest";
import { compile } from "@mdx-js/mdx";
import remarkHeadings, { headingSlug } from "./remark-headings.mjs";

describe("article contents", () => {
  it("compiles a contents list and unique heading targets, retaining inline text", async () => {
    const result = String(await compile("## A *shared* question\n\nText.\n\n### A shared question\n\n## מי מצביע", { remarkPlugins: [remarkHeadings] }));
    expect(result).toContain('"a-shared-question"');
    expect(result).toContain('"a-shared-question-2"');
    expect(result).toContain('"#a-shared-question-2"');
    expect(result).toContain('"On this page"');
    expect(headingSlug("מי מצביע")).toBe("מי-מצביע");
  });
  it("preserves existing JSX IDs so existing Privacy links still work", async () => {
    const result = String(await compile('## Overview\n\n<h2 id="privacy">Privacy</h2>', { remarkPlugins: [remarkHeadings] }));
    expect(result).toContain('"#privacy"');
    expect(result).toContain('id: "privacy"');
  });
});
