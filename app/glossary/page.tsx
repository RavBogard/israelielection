import type { Metadata } from "next";
import "@/components/article/article.css";
import "@/components/glossary.css";
import glossaryJson from "@/data/glossary.json";
import { communityIndex, guideIndex, issueIndex } from "@/lib/content";
import type { Glossary as GlossaryData } from "@/lib/glossary";
import { longDate } from "@/lib/timeline";
import Glossary from "@/components/Glossary";
import CorrectionLink from "@/components/CorrectionLink";
const data = glossaryJson as GlossaryData;
export const metadata: Metadata = { title: "Glossary", description: "Find the election terms an American reader meets, including Hebrew names and alternate spellings." };
export default async function Page() {
  const labels: Record<string, string> = { "/vote-map": "Vote map", "/results": "Results", "/polls": "Polls", "/parties": "Party Map", "/american-lens": "The American lens", "/timeline": "Timeline" };
  for (const article of [...await guideIndex(), ...await issueIndex(), ...await communityIndex()]) labels[article.href] = article.meta.title;
  return <div className="wrap article-page glossary-page"><header className="page-head"><h1>Glossary</h1><p className="standfirst">{data.terms.length} words an American reader meets in coverage of the election, each with its source. Search by name, Hebrew or alternate spelling.</p><p className="note">Definitions checked {longDate(data.checked)}.</p></header><div className="article-grid solo"><article className="article"><Glossary data={data} labels={labels} /><p className="article-correction"><CorrectionLink /></p></article></div></div>;
}
