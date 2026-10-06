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

/** Words that make a headline election news on their own. */
export const ELECTION_TERMS = ["Knesset", "election", "elections", "electoral", "poll", "polls", "polling", "coalition", "ballot", "ballots", "threshold", "vote", "votes", "voter", "voters", "voting", "campaign", "candidate", "candidates"];
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/-/g, "[-\\s]");
const bounded = (alts: string[], flags: string) => new RegExp(`(?<![\\p{L}\\p{N}])(?:${alts.map(esc).join("|")})(?![\\p{L}\\p{N}])`, flags);
const plain = (s: string) => s.normalize("NFKC").replace(/[’‘]/g, "'");
export type ElectionVocabulary = { names: RegExp; terms: RegExp };

/** Party names (each part of a joint list) and leaders' surnames from the party file, case-sensitive; election terms in any case. */
export function electionVocabulary(parties: { name: string; short?: string; leader?: string | null }[]): ElectionVocabulary {
  const names = new Set<string>();
  for (const p of parties) {
    for (const n of [p.name, p.short ?? ""].flatMap((n) => plain(n).split(/[–—]/))) { const t = n.replace(/^The\s+/, "").replace(/[!?]+$/, "").trim(); if (t.length > 2) names.add(t); }
    for (const person of plain(p.leader ?? "").replace(/\bno\.\s*\d+/g, "").split(/,|\(|\)|\bwith\b/)) { const s = person.trim().split(/\s+/).at(-1); if (s && s.length > 2) names.add(s); }
  }
  return { names: bounded([...names].sort((a, b) => b.length - a.length), "u"), terms: bounded(ELECTION_TERMS, "iu") };
}
/** True when the text names a party, a leader or an election term. */
export const namesElection = (text: string, v: ElectionVocabulary) => v.names.test(plain(text)) || v.terms.test(plain(text));

/** Headline groups split by their title: election news first, the rest for an "Other Israel news" fold. Order is kept. */
export function splitHeadlines(groups: NewsGroup[], v: ElectionVocabulary): { election: NewsGroup[]; other: NewsGroup[] } {
  const election: NewsGroup[] = [], other: NewsGroup[] = [];
  for (const g of groups) (namesElection(g.item.title, v) ? election : other).push(g);
  return { election, other };
}

/** Briefing topics, tried in order; a sentence falls under the first that matches its text. */
export const BRIEFING_TOPICS: { topic: string; test: RegExp }[] = [
  { topic: "Courts and the election committee", test: /\b(courts?|judges?|justice|petitions?|appeals?|disqualif\w*|election committee|attorney general)\b/i },
  { topic: "Polls", test: /\b(polls?|polling|surveys?)\b/i },
  { topic: "Parties and candidates", test: /\b(campaigns?|candidates?|candidacy|slates?|lists?|merger|merged?|alliance|primary|primaries|coalition|endorse\w*|debate)\b/i },
];
export const OTHER_TOPIC = "Beyond the campaign";

/** Briefing sentences under topic subheads: topics in the order they first appear, sentences in their original order. */
export function groupBriefing<S extends { text: string }>(sentences: S[]): { topic: string; sentences: S[] }[] {
  const out: { topic: string; sentences: S[] }[] = [];
  for (const s of sentences) {
    const topic = BRIEFING_TOPICS.find((t) => t.test.test(s.text))?.topic ?? OTHER_TOPIC;
    const g = out.find((x) => x.topic === topic);
    if (g) g.sentences.push(s); else out.push({ topic, sentences: [s] });
  }
  return out;
}
