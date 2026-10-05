import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import remarkGlossary, { GLOSSARY_FORMS, linkText } from "./remark-glossary.mjs";
import { anchorOf, type Glossary } from "./glossary";

const glossary = JSON.parse(readFileSync("data/glossary.json", "utf8")) as Glossary;
const anchors = new Set(glossary.terms.map((t) => anchorOf(t.term)));
const text = (value: string) => ({ type: "text", value });
const para = (...children: object[]) => ({ type: "paragraph", children });

describe("glossary auto-links", () => {
  it("points every form at a term in data/glossary.json", () => {
    for (const [form, anchor] of Object.entries(GLOSSARY_FORMS)) expect(anchors.has(anchor), `${form} → ${anchor}`).toBe(true);
  });

  it("links the first use only, preferring the longer form", () => {
    const used = new Set<string>();
    const out = linkText("The Haredi draft splits Haredi parties; the Haredi draft again.", used)!;
    expect(out.filter((n) => n.type === "link").map((n) => [n.url, n.children![0].value])).toEqual([
      ["/glossary#haredi-draft", "Haredi draft"],
      ["/glossary#haredim", "Haredi"],
    ]);
    expect(out.map((n) => (n.type === "link" ? n.children![0].value : n.value)).join("")).toBe(
      "The Haredi draft splits Haredi parties; the Haredi draft again."
    );
  });

  it("leaves quoted words and parts of longer words alone", () => {
    expect(linkText('He said "the West Bank" twice.', new Set())).toBeNull();
    expect(linkText("Druzeville and anti-Hamas-ish", new Set())).toBeNull();
  });

  it("skips headings, links, <Quote> and terms the page already links by hand", () => {
    const tree = {
      type: "root",
      children: [
        { type: "heading", depth: 2, children: [text("East Jerusalem")] },
        { type: "mdxJsxFlowElement", name: "Quote", children: [para(text("Hamas and Iron Dome"))] },
        para({ type: "link", url: "/glossary#iron-dome", children: [text("the system")] }),
        para(text("East Jerusalem, Hamas, Iron Dome and East Jerusalem.")),
      ],
    };
    remarkGlossary()(tree);
    const last = tree.children[3] as { children: { type: string; url?: string }[] };
    expect(last.children.filter((n) => n.type === "link").map((n) => n.url)).toEqual(["/glossary#east-jerusalem", "/glossary#hamas"]);
    expect(JSON.stringify(tree.children.slice(0, 2))).not.toContain("/glossary#");
  });
});
