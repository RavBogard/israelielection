import type { NewsItem } from "./news";

/** Documented campaign tags only. Content IDs, language, pagination and fragments survive. */
const TRACKING = new Set(["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id", "gclid"]);
export function canonicalNewsUrl(raw: string): string {
  try {
    const u = new URL(raw);
    if (!/^https?:$/.test(u.protocol)) return raw;
    for (const key of [...u.searchParams.keys()]) if (TRACKING.has(key)) u.searchParams.delete(key);
    return u.toString();
  } catch { return raw; }
}
const exactTitle = (title: string) => title.normalize("NFKC").replace(/\s+/g," ").trim();
const titleCanGroup = (title: string) => title.length >= 40 && title.split(" ").length >= 6;
export type NewsGroup = { item: NewsItem; sources: NewsItem[]; basis: "single" | "same-url" | "same-title" | "url-and-title" };

/** Similar subjects do not imply syndication. Exact titles are grouped within 36 hours only. */
export function groupNews(items: NewsItem[]): NewsGroup[] {
  const sorted = [...items].sort((a,b)=>b.published.localeCompare(a.published));
  const parents = sorted.map((_,i)=>i);
  const kinds = new Map<number,Set<string>>();
  const find = (i: number): number => parents[i] === i ? i : (parents[i]=find(parents[i]));
  const join = (a: number,b: number,kind: string) => { const x=find(a),y=find(b); if(x!==y) parents[y]=x; const s=kinds.get(x) ?? new Set<string>(); for(const k of kinds.get(y) ?? [])s.add(k);s.add(kind);kinds.set(x,s); };
  const urls = new Map<string,number>();
  const titles = new Map<string,number[]>();
  sorted.forEach((it,i)=>{
    const url=canonicalNewsUrl(it.url), title=exactTitle(it.title);
    const earlier=urls.get(url); if(earlier!==undefined)join(earlier,i,"url"); else urls.set(url,i);
    if(titleCanGroup(title)) {
      const prior=titles.get(title) ?? [];
      const anchor=prior.find(j=>Math.abs(Date.parse(sorted[j].published)-Date.parse(it.published)) <= 36*3_600_000);
      if(anchor!==undefined)join(anchor,i,"title");
      else prior.push(i);
      titles.set(title,prior);
    }
  });
  const grouped = new Map<number,NewsItem[]>();
  sorted.forEach((it,i)=>{const root=find(i),list=grouped.get(root) ?? [];list.push(it);grouped.set(root,list);});
  return [...grouped.entries()].map(([root,sources])=>{
    const used=kinds.get(root) ?? new Set<string>();
    return {item:sources[0],sources,basis:sources.length===1 ? "single" : used.size>1 ? "url-and-title" : used.has("url") ? "same-url" : "same-title"} as NewsGroup;
  }).sort((a,b)=>b.item.published.localeCompare(a.item.published));
}
