import type {NavGroup,NavItem} from "./site";
export const canonicalNavPath=(href:string)=>href.split(/[?#]/)[0] || "/";
/** Only a page link is current; section links do not all become current on /teach. */
export const currentNavPage=(href:string,path:string)=>!href.includes("#")&&!href.includes("?")&&href===path;
export const withinNavPage=(href:string,path:string)=>{const base=canonicalNavPath(href);return path===base||(base!=="/"&&path.startsWith(`${base}/`));};
export const activeNavGroup=(groups:readonly NavGroup[],path:string)=>groups.find(g=>g.items.some(n=>withinNavPage(n.href,path)))?.id??null;
export const canonicalNavPaths=(hrefs:readonly string[])=>[...new Set(hrefs.map(canonicalNavPath))];
/** Election-night pages join the menus once polls close, or when the reader is already on one. */
export const visibleNavItems=(items:readonly NavItem[],closed:boolean,path:string)=>items.filter(n=>closed||!n.afterClose||withinNavPage(n.href,path));
