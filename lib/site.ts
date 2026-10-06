/** `short` is the masthead label; `aliases` are former labels search should still find; `afterClose` items join the menus once polls close. */
export type NavItem = { href: string; label: string; description: string; short?: string; aliases?: readonly string[]; afterClose?: true };
export type NavGroup = { id: string; label: string; items: readonly NavItem[] };

/** One visitor-facing catalog for header, footer, directory, search and sitemap. */
export const NAV_GROUPS: readonly NavGroup[] = [
 {id:"polls",label:"Polls and news",items:[
  {href:"/polls",label:"Polls",description:"Every seat poll of the campaign and the current average."},
  {href:"/news",label:"News and briefings",short:"News",description:"Dated daily briefings, linked to the original reporting."},
  {href:"/changes",label:"Changes log",aliases:["What changed"],description:"Sourced material changes and the pages they affect."},
  {href:"/results",label:"Results",afterClose:true,description:"The official count on election night, with its source and time."},
  {href:"/government",label:"Forming a government",aliases:["Government and formation"],afterClose:true,description:"Formation of the next government and the outgoing cabinet."},
 ]},
 {id:"parties",label:"Parties",items:[
  {href:"/parties",label:"Party Map",description:"Every list sized by its polling average, with a sourced profile."},
  {href:"/compare",label:"Compare positions",aliases:["Compare party positions"],description:"Recorded positions on major issues, side by side, with sources."},
  {href:"/coalition-builder",label:"Coalition Builder",description:"Pick lists from any poll and try to reach 61 seats."},
  {href:"/party-history",label:"Party family tree",description:"Origins, splits, mergers and alliances over time."},
  {href:"/ballot",label:"Every ballot list",aliases:["Submitted ballot lists"],description:"All submitted lists, minor ones included, with their status."},
 ]},
 {id:"places",label:"Voters and places",items:[
  {href:"/vote-map",label:"Vote map",aliases:["Historical vote map"],description:"How each locality voted in the five elections of 2019 to 2022."},
  {href:"/communities",label:"Communities",aliases:["Voter communities"],description:"Voter communities, their histories and political concerns."},
  {href:"/issues",label:"Issues",description:"The policy questions shaping the election."},
 ]},
 {id:"how",label:"How it works",items:[
  {href:"/how-it-works",label:"Guides",aliases:["How elections work"],description:"The ballot, who can vote, seats and forming a government."},
  {href:"/timeline",label:"Timeline",aliases:["Political timeline"],description:"Elections, prime ministers and key events from 1977 to 2026."},
  {href:"/glossary",label:"Glossary",description:"Election vocabulary, Hebrew terms and pronunciations."},
  {href:"/american-lens",label:"American lens",aliases:["The American lens"],description:"Where American political categories help or misread Israel."},
 ]},
];
export const NAV_UTILITIES: readonly NavItem[] = [
 {href:"/start",label:"Start here",description:"A short guided route through the election."},
 {href:"/search",label:"Search",description:"Find parties, leaders, issues and terms by name or alias."},
 {href:"/resources",label:"All resources",description:"Every section and tool on one page, with a picture of each."},
 {href:"/about",label:"About and method",short:"About",description:"The project, its sourcing, automation and privacy."},
 {href:"/corrections",label:"Media inquiries and corrections",short:"Media and corrections",description:"Contact Rabbi Daniel Bogard, or draft an account-free correction."},
];
/** Canonical page entries only: section anchors must not leak into XML or search. */
export const NAV: readonly NavItem[] = [...NAV_GROUPS.flatMap(g=>g.items.filter(n=>!n.href.includes("#"))),...NAV_UTILITIES];
/** The main tools, one tap away in the masthead. */
export const NAV_TOOLS: readonly NavItem[] = ["/polls","/parties","/coalition-builder","/vote-map","/news"].map(h=>NAV.find(n=>n.href===h)!);
export const navLabel=(n:NavItem)=>n.short??n.label;

/** The site's one-paragraph description, used in metadata and the footer. */
export const DESCRIPTION =
  "An English-language reference on Israel's October 27, 2026 election: the parties, the polls, the system, and how a government gets built. Every number dated and sourced.";
