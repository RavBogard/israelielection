import { describe, expect, it } from "vitest";
import { canonicalNewsUrl, groupNews } from "./news-grouping";
import type { NewsItem } from "./news";
const item=(url:string,title="Election committee publishes all candidate ballot letters",published="2026-10-04T12:00:00Z",outlet="A"):NewsItem=>({url,title,published,outlet,summary:""});
describe("conservative headline grouping",()=>{
  it("strips documented tracking only, keeping content queries and fragments",()=>{
    expect(canonicalNewsUrl("https://example.org/news?id=2&utm_source=mail&lang=he#gaza")).toBe("https://example.org/news?id=2&lang=he#gaza");
    expect(canonicalNewsUrl("https://example.org/news?source=archive&ref=2&utm_custom=x")).toContain("source=archive&ref=2&utm_custom=x");
  });
  it("groups canonical URL copies while retaining original sources",()=>{
    const a=item("https://x.org/a?utm_source=mail"),b=item("https://x.org/a","Different updated headline","2026-10-04T13:00:00Z","B");
    const groups=groupNews([a,b]); expect(groups).toHaveLength(1);expect(groups[0].sources).toHaveLength(2);expect(groups[0].item).toBe(b);expect(groups[0].sources.map(s=>s.url)).toContain(a.url);
  });
  it("groups exact long syndicated titles but does not merge similar reporting",()=>{
    const a=item("https://a.org/a"),b=item("https://b.org/b",a.title,a.published,"B"),c=item("https://c.org/c","Court approves candidate lists after committee rejects appeal");
    const groups=groupNews([a,b,c]);expect(groups).toHaveLength(2);expect(groups.find(g=>g.sources.length===2)?.basis).toBe("same-title");
    expect(groups.flatMap(g=>g.sources)).toHaveLength(3);
  });
  it("preserves recurring generic headlines and titles beyond the narrow date window",()=>{
    expect(groupNews([item("https://a.org/a","Live updates"),item("https://b.org/b","Live updates")])).toHaveLength(2);
    expect(groupNews([item("https://a.org/a"),item("https://b.org/b",undefined,"2026-10-01T12:00:00Z")])).toHaveLength(2);
  });
  it("does not throw away meaningful query identities or use fuzzy titles",()=>{
    expect(groupNews([item("https://x.org/a?id=1","First article"),item("https://x.org/a?id=2","Second article")])).toHaveLength(2);
    expect(groupNews([item("https://a.org/a"),item("https://b.org/b","Election committee publishes candidate ballot letters")])).toHaveLength(2);
  });
  it("does not chain recurring titles across successive date windows",()=>{
    const title="Election committee publishes all candidate ballot letters";
    const groups=groupNews([item("https://a.org/a",title,"2026-10-04T12:00:00Z"),item("https://b.org/b",title,"2026-10-03T01:00:00Z"),item("https://c.org/c",title,"2026-10-01T14:00:00Z")]);
    expect(groups).toHaveLength(2);expect(groups.flatMap(g=>g.sources)).toHaveLength(3);
  });
});
