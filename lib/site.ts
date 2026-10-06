export type NavItem = { href: string; label: string; description: string };
export type NavGroup = { id: string; label: string; preview: string; items: readonly NavItem[] };

/** One visitor-facing catalog for header, footer, directory, search and sitemap. */
export const NAV_GROUPS: readonly NavGroup[] = [
 {id:"parties",label:"Parties & coalitions",preview:"Party Map · compare · build",items:[
  {href:"/parties",label:"Party Map",description:"Meet the parties, their leaders, voters and recorded positions."},
  {href:"/compare",label:"Compare party positions",description:"Compare recorded positions on major issues, with sources and evidence gaps."},
  {href:"/coalition-builder",label:"Coalition Builder",description:"Try a governing arrangement using a chosen poll and recorded commitments."},
  {href:"/party-history",label:"Party family tree",description:"Trace origins, splits, mergers and alliances over time."},
  {href:"/ballot",label:"Submitted ballot lists",description:"See all published submitted lists, including minor lists and publication status."},
 ]},
 {id:"updates",label:"Polls & updates",preview:"Polls · news · results",items:[
  {href:"/polls",label:"Polls",description:"Browse polls, compare party trends and examine averaging assumptions."},
  {href:"/news",label:"News and briefings",description:"Read dated election briefings with links to the original reporting."},
  {href:"/results",label:"Results",description:"Follow the official count when available, including its source and freshness."},
  {href:"/government",label:"Government and formation",description:"Track formation of the next government and inspect the outgoing cabinet."},
  {href:"/changes",label:"What changed",description:"Find sourced material developments, affected pages and saved bookmarks."},
 ]},
 {id:"explained",label:"Election explained",preview:"Guides · vote map · terms",items:[
  {href:"/how-it-works",label:"How elections work",description:"Understand the ballot, voting eligibility, seats and government formation."},
  {href:"/issues",label:"Issues",description:"Explore the policy questions shaping the election."},
  {href:"/communities",label:"Voter communities",description:"Read about communities, their histories and political concerns."},
  {href:"/vote-map",label:"Historical vote map",description:"Explore locality vote shares and turnout in the five elections of 2019–2022."},
  {href:"/timeline",label:"Political timeline",description:"Follow elections, prime ministers and key events from 1977 to 2026."},
  {href:"/glossary",label:"Glossary",description:"Look up election vocabulary, Hebrew terms and pronunciations."},
  {href:"/american-lens",label:"The American lens",description:"See where American political categories help or misread Israeli politics."},
 ]},
 {id:"about",label:"About & contact",preview:"Method · media · corrections",items:[
  {href:"/about",label:"About and method",description:"Read about the project, sourcing, automation, responsibility and privacy."},
  {href:"/corrections",label:"Media inquiries and corrections",description:"Contact Rabbi Daniel Bogard for media questions or draft an account-free correction."},
 ]},
];
export const NAV_UTILITIES: readonly NavItem[] = [
 {href:"/start",label:"Start here",description:"Choose a short guided route through the election."},
 {href:"/resources",label:"All resources",description:"Browse every section and tool in one directory."},
 {href:"/search",label:"Search",description:"Find parties, leaders, issues, guides and unfamiliar terms by name or alias."},
];
/** Canonical page entries only: section anchors must not leak into XML or search. */
export const NAV: readonly NavItem[] = [...NAV_GROUPS.flatMap(g=>g.items.filter(n=>!n.href.includes("#"))),...NAV_UTILITIES];

/** The site's one-paragraph description, used in metadata and the footer. */
export const DESCRIPTION =
  "An English-language reference on Israel's October 27, 2026 election: the parties, the polls, the system, and how a government gets built. Every number dated and sourced.";
