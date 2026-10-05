import type {Metadata} from "next";
import Link from "next/link";
import {NAV_GROUPS,NAV_UTILITIES} from "@/lib/site";
import packets from "@/data/teaching-packets.json";
import "./resources.css";
export const metadata:Metadata={title:"All resources",description:"Every section, election tool, guide and teaching resource on Israel Votes 2026, organized by what you want to do."};
export default function Page(){return <div className="wrap resource-directory"><header className="page-head"><h1>All resources</h1><p className="standfirst">Find a tool, follow the election, understand the context or plan a class.</p></header>
 <ul className="resource-utilities">{NAV_UTILITIES.filter(n=>n.href!=="/resources").map(n=><li key={n.href}><Link href={n.href}>{n.label}</Link><p>{n.description}</p></li>)}</ul>
 <div className="resource-groups">{NAV_GROUPS.map(g=><section key={g.id} aria-labelledby={`resources-${g.id}`}><h2 id={`resources-${g.id}`} className="sec-h">{g.label}</h2><ul className="resource-links">{g.items.map(n=><li key={n.href}><Link href={n.href}>{n.label}</Link><p>{n.description}</p></li>)}</ul>
 {g.id==="teach"&&<div className="resource-packets"><h3>Choose a discussion packet</h3>{packets.packets.map(p=><div key={p.id}><h4>{p.title}</h4><p>{p.minutes} minutes. {p.audience}</p><p><Link href={`/teach/packets/${p.id}/learner`}>Learner sheet</Link> · <Link href={`/teach/packets/${p.id}/facilitator`}>Facilitator notes</Link></p></div>)}<p className="src">Accessible HTML, printable pages and PDF downloads are available with each packet.</p></div>}
 </section>)}</div></div>;}
