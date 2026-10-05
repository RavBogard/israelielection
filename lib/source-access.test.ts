import { describe, expect, it } from "vitest";
import { sourceAccess, sourceAccessLabels } from "./source-access";
describe("source access labels",()=>{
  it("leaves unknown and deceptive hostnames unlabeled",()=>{
    expect(sourceAccess("https://unknown.org/he/article")).toEqual({});expect(sourceAccess("https://haaretz.com.example.org/ty-article/.premium/a")).toEqual({});expect(sourceAccess("javascript:alert(1)")).toEqual({});
  });
  it("labels explicit government language paths without guessing PDF language",()=>{
    expect(sourceAccessLabels("https://www.gov.il/he/pages/candidates-lists-26")).toEqual(["Hebrew"]);expect(sourceAccessLabels("https://www.gov.il/en/pages/time--table-26")).toEqual(["English"]);expect(sourceAccessLabels("https://www.gov.il/BlobFolder/file.pdf")).toEqual([]);
  });
  it("flags verified premium patterns rather than every article from a subscription publisher",()=>{
    expect(sourceAccessLabels("https://www.haaretz.com/israel-news/2026/ty-article/.premium/story/id")).toEqual(["English","Subscription may be required"]);
    expect(sourceAccess("https://www.haaretz.com/israel-news/2026/ty-article/story/id").access).toBeUndefined();
    expect(sourceAccess("https://www.jpost.com/israel-election-2026/article-910555").access).toBeUndefined();
  });
});
