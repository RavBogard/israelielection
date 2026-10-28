import type {ReactNode} from "react";
import Link from "next/link";
import {notFound} from "next/navigation";
import {editionPath,type Lang} from "@/lib/i18n";
import {referenceText} from "@/lib/i18n/reference";
import {translatedReference,readingTitles} from "@/lib/reference/catalog";
import {loadCommunity,loadGuide,loadIssue} from "@/lib/content";
import type {CommunitySlug,GuideSlug,IssueSlug} from "@/lib/articles";
import ArticleShell from "../article/ArticleShell";
import CommunityCount from "../communities/CommunityCount";
import TranslatedBody from "./TranslatedBody";
import SuggestedReading from "./SuggestedReading";
import "../article/article.css";
import "./reference.css";

export default async function ReferenceDocument({path,lang,title,introduction}:{path:string;lang:Lang;title?:string;introduction?:ReactNode}) {
 const selected=translatedReference(path,lang),t=referenceText(lang);if(!selected)notFound();
 if(selected.state==="original"){
  const slug=path.split("/").at(-1)!;
  const mod=path.startsWith("/issues/")?await loadIssue(slug as IssueSlug):path.startsWith("/communities/")?await loadCommunity(slug as CommunitySlug):path.startsWith("/how-it-works/")?await loadGuide(slug as GuideSlug):path==="/about"?await import("@/content/about.mdx"):await import("@/content/american-lens.mdx");
  return <><ArticleShell meta={mod.meta} Body={mod.default} section={{href:"/reference",title:t.reference}} current={path} foreword={introduction} after={path.startsWith("/communities/")?<CommunityCount slug={path.split("/").at(-1)!} lang={lang}/>:undefined}/></>;
 }
 return <div className="wrap article-page reference-page"><nav><Link href={editionPath("/reference",lang)!}>{t.reference}</Link></nav>{title&&selected.state!=="ready"&&<h1>{title}</h1>}{introduction}{selected.state==="ready"?<><TranslatedBody source={selected.source} translation={selected.translation} lang={lang} title={title}/>{path.startsWith("/communities/")&&<CommunityCount slug={path.split("/").at(-1)!} lang={lang}/>}</>:<>{!title&&<h1>{t.reference}</h1>}<h2>{selected.state==="withdrawn"?t.withdrawn:t.pending}</h2><p>{selected.state==="withdrawn"?t.withdrawnNote:t.pendingNote}</p></>}<p>{t.sourceTitle}: <a href={selected.source.path+"?original=en"} hrefLang="en" lang="en" dir="ltr">{selected.source.title}</a></p><p><a href={selected.source.path+"?original=en"} hrefLang="en">{t.original}</a></p><details><summary>{t.revision}</summary><code>{selected.source.revision}</code></details><SuggestedReading lang={lang} titles={readingTitles(lang)}/></div>;
}
