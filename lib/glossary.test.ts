import { expect, it } from "vitest";
import data from "@/data/glossary.json";
import aliases from "@/data/glossary-aliases.json";
import { anchorOf, filterTerms, type Glossary } from "./glossary";
it("filters names and aliases while retaining canonical anchors", () => {
  const terms = (data as Glossary).terms;
  expect(filterTerms(terms, "ultra Orthodox", aliases)[0].term).toBe("Haredim");
  expect(filterTerms(terms, "כנסת", aliases)[0].term).toBe("Knesset");
  expect(filterTerms(terms, "doesnotexist", aliases)).toHaveLength(0);
  expect(filterTerms(terms, "", aliases)).toHaveLength(terms.length);
  expect(anchorOf(filterTerms(terms, "3.25", aliases)[0].term)).toBe("electoral-threshold");
});
