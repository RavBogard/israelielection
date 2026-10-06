import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";
import { buildExport } from "@/lib/export-data";
import "@/components/export.css";
export const dynamic = "force-dynamic";
export async function generateMetadata({params}:{params:Promise<{kind:string}>}) { const {kind}=await params; const title=({issue:"Issue comparison",coalition:"Coalition arrangement",locality:"Locality voting history"} as Record<string,string>)[kind] ?? "Sourced view"; return {title:`${title} — print and export`,robots:{index:false,follow:true}}; }
export default async function Page({params,searchParams}:{params:Promise<{kind:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const {kind}=await params; const values=await searchParams; const q=new URLSearchParams(); for(const [key,value]of Object.entries(values))if(typeof value==="string")q.set(key,value);
  const model=await buildExport(kind,q); if(!model)notFound();
  return <article className={`wrap sourced-export export-${kind}`}><nav className="export-controls"><Link href={model.view}>Return to this view</Link><PrintButton /><a href={`/api/export?kind=${kind}&${q}`}>Download CSV with sources</a></nav><p className="kicker">Israel Votes 2026 · sourced export</p><h1>{model.title}</h1><p>Data as of {model.asOf}. <a href={`https://www.israelielection.org${model.view}`}>Open the selected view</a>.</p>{model.assumptions.map((text,i)=><p className="export-assumption" key={i}>{text}</p>)}<div className="export-table"><table><thead><tr>{model.headers.map((h)=><th key={h}>{h}</th>)}</tr></thead><tbody>{model.rows.map((row,i)=><tr key={i}>{row.map((value,j)=><td key={j} data-label={model.headers[j]}>{value===null?"Not available":typeof value==="string"&&/^https?:\/\//.test(value)?<a href={value}>{value}</a>:value}</td>)}</tr>)}</tbody></table></div><h2>Sources and attribution</h2><ul>{model.sources.map((s,i)=><li key={i}><a href={s.url}>{s.label}</a> · {s.url}</li>)}</ul><p>Israel Votes 2026 · israelielection.org. Original text is available under CC BY-NC 4.0 for non-commercial use with credit to Rabbi Daniel Bogard and a link to israelielection.org; third-party source material retains its own rights.</p></article>;
}
