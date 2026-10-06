import type {Metadata} from "next";
import Link from "next/link";
import {NAV_GROUPS,NAV_UTILITIES} from "@/lib/site";
import "./resources.css";
import PageHead from "@/components/PageHead";
export const metadata:Metadata={title:"All resources",description:"Every section, election tool and guide on Israel Votes 2026, organized by what you want to do."};
export default function Page(){return <div className="wrap resource-directory"><PageHead title="All resources" standfirst="Find a tool, follow the election, or understand the context." />
 <ul className="resource-utilities">{NAV_UTILITIES.filter(n=>n.href!=="/resources").map(n=><li key={n.href}><Link href={n.href}>{n.label}</Link><p>{n.description}</p></li>)}</ul>
 <div className="resource-groups">{NAV_GROUPS.map(g=><section key={g.id} aria-labelledby={`resources-${g.id}`}><h2 id={`resources-${g.id}`} className="sec-h">{g.label}</h2><ul className="resource-links">{g.items.map(n=><li key={n.href}><Link href={n.href}>{n.label}</Link><p>{n.description}</p></li>)}</ul>
 
 </section>)}</div></div>;}
