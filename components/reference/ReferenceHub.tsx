import Link from "next/link";
import {notFound} from "next/navigation";
import {editionPath,locale,type Lang} from "@/lib/i18n";
import {referenceText} from "@/lib/i18n/reference";
import {LIFECYCLE} from "@/lib/i18n/election-lifecycle";
import {FORMATION} from "@/lib/i18n/formation-live";
import {referenceDocuments,translatedReference} from "@/lib/reference/catalog";
import {referenceReadModel,editionEvidence} from "@/lib/reference/read-model";
import CurrentParliament from "../seat-context/CurrentParliament";
import SeatBasis from "../seat-context/SeatBasis";
import {forecastPresentation} from "../live-forecast/LiveForecast";
import SuggestedReading from "./SuggestedReading";
import ReferenceDocument from "./ReferenceDocument";
import "../article/article.css";
export type ReferenceKind="elections"|"edition"|"parliament"|"policies"|"policy"|"changes"|"reference";
export const policyTitles:Record<Lang,string[]>={en:["Haredi draft","Courts","War and hostages","West Bank","Religion and state","Economy","Palestinian state"],he:["גיוס חרדים","בתי המשפט","המלחמה והחטופים","הגדה המערבית","דת ומדינה","כלכלה","מדינה פלסטינית"],ar:["تجنيد الحريديم","المحاكم","الحرب والرهائن","الضفة الغربية","الدين والدولة","الاقتصاد","الدولة الفلسطينية"],fa:["سربازی حریدی‌ها","دادگاه‌ها","جنگ و گروگان‌ها","کرانه باختری","دین و دولت","اقتصاد","کشور فلسطینی"],de:["Wehrpflicht der Haredim","Gerichte","Krieg und Geiseln","Westjordanland","Religion und Staat","Wirtschaft","Palästinensischer Staat"],fr:["Conscription des Haredim","Tribunaux","Guerre et otages","Cisjordanie","Religion et État","Économie","État palestinien"],zh:["哈雷迪征兵","法院","战争与人质","约旦河西岸","宗教与国家","经济","巴勒斯坦国"]};
const policyIds=["haredi-draft","courts","war-hostages","west-bank","religion-state","economy","palestinian-state"];
export default async function ReferenceHub({kind,lang,id}:{kind:ReferenceKind;lang:Lang;id?:string}){
 const t=referenceText(lang),href=(p:string)=>editionPath(p,lang)!,model=await referenceReadModel(),snapshot=model.lifecycle;
 if(kind==="policy"){if(!id||!policyIds.includes(id))notFound();return <ReferenceDocument path={`/issues/${id}`} lang={lang} title={policyTitles[lang][policyIds.indexOf(id)]} introduction={<><p>{t.policyNote}</p><p>{t.noMilestones}</p><Link href={href("/policies")}>{t.allPolicies}</Link></>}/>}
 const edition=kind==="edition"?editionEvidence(model.elections,id??"",snapshot):null;if(edition?.state==="unknown")notFound();
 const context=(edition?edition.lifecycle:snapshot)?.seatContext??null;
 const title=kind==="edition"?`${t.elections}: ${t.term} ${edition?.election?.termNumber}`:t[kind];
 return <div className="wrap article-page"><header className="page-head"><h1>{title}</h1><nav aria-label={t.reference}><Link href={href("/elections")}>{t.elections}</Link>{", "}<Link href={href("/parliament")}>{t.parliament}</Link>{", "}<Link href={href("/government")}>{FORMATION[lang].title}</Link>{", "}<Link href={href("/policies")}>{t.policies}</Link>{", "}<Link href={href("/changes")}>{t.changes}</Link></nav></header>
 {(kind==="elections"||kind==="edition")&&<><p>{t.editionNote}</p>{kind==="elections"?<ul>{model.elections.map(e=><li key={e.id}><Link href={href(`/elections/${e.id}`)}>{t.term} {e.termNumber}</Link>. {new Intl.DateTimeFormat(locale(lang),{dateStyle:"long",timeZone:e.timeZone}).format(new Date(e.electionDay+"T12:00:00Z"))}</li>)}</ul>:<><p>{t.electionDate}: {edition?.election?.electionDay}</p><SeatBasis context={context} lang={lang}/>{context&&<CurrentParliament initial={context} lang={lang} showScenarios={false} {...forecastPresentation(lang)}/>}<p><Link href={href("/results")}>{t.current}</Link>{", "}<Link href={href("/forecast")}>{LIFECYCLE[lang].archive}</Link></p></>}</>}
 {kind==="parliament"&&<><p>{t.allocationNote}</p><p>{t.noMembership}</p>{context?<CurrentParliament initial={context} heading={t.electionAllocation} lang={lang} showScenarios={false} {...forecastPresentation(lang)}/>:<SeatBasis context={null} lang={lang}/>}</>}
 {kind==="policies"&&<><p>{t.policyNote}</p><ul>{policyIds.map((slug,i)=><li key={slug}><Link href={href(`/policies/${slug}`)}>{policyTitles[lang][i]}</Link></li>)}</ul></>}
 {kind==="reference"&&<ul>{referenceDocuments.filter(d=>!id||d.path.startsWith(id)).map(d=>{const selected=translatedReference(d.path,lang),ready=selected?.state==="ready";return <li key={d.id}><Link href={href(d.path)}>{ready?selected.translation.blocks[0].text:<span lang="en" dir="ltr">{d.title}</span>}</Link>{lang!=="en"&&!ready&&<>. {t.sourceTitle}. {selected?.state==="withdrawn"?t.withdrawn:t.pending}</>}</li>})}</ul>}
 {kind==="changes"&&<><p>{t.evidence}</p>{snapshot?.politics.events.length?<ol>{snapshot.politics.events.map(e=><li key={e.id}><h2>{FORMATION[lang][e.templateKey]}</h2><p>{t.confirmed}. <time dateTime={e.effectiveAt}>{new Intl.DateTimeFormat(locale(lang),{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Jerusalem"}).format(new Date(e.effectiveAt))}</time></p>{e.supersedes&&<p>{t.historical}</p>}<details><summary>{t.evidence}</summary><blockquote dir="auto">{e.evidenceQuote}</blockquote>{e.sources.map(s=><p key={s.id}><a href={s.url}>{s.publisher}: {s.title}</a></p>)}</details></li>)}</ol>:<p>{t.noEvents}</p>}<ul>{snapshot?.alternatives.map(a=><li key={a.revision}><Link href={`${href("/coalition-builder")}?poll=current&context=${encodeURIComponent(a.revision)}`}>{LIFECYCLE[lang][a.basis]}</Link>. <time dateTime={a.publishedAt??undefined}>{a.publishedAt??LIFECYCLE[lang].noTime}</time></li>)}</ul></>}
 <SuggestedReading lang={lang}/></div>;
}
