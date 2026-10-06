/** Editorial current-list palette. Historical electoral lists use a separate palette. */
const PARTY_COLORS:Record<string,string>={
  likud:"#245b94",otzma:"#514394",rz:"#7d67b3",noam:"#b29bda",poi:"#597fbd",
  shas:"#147c88",utj:"#65adb5",
  byachad:"#ce542d",yashar:"#ed9859",dem:"#a72f65",yb:"#9e3826",bw:"#db7898",
  res:"#b48727",jl:"#267b44",raam:"#80b667",
};
/** The grey for a list with no editorial colour; a hex (not var(--party-fallback)) because partyInk() reads its luminance and SVG and image cards take it. Keep equal to --party-fallback. */
export const PARTY_FALLBACK="#8c939b";
export const partyColor=(id:string):string=>PARTY_COLORS[id] ?? PARTY_FALLBACK;
/** Choose the higher-contrast black/white text from WCAG relative luminance. */
export function partyInk(id:string):string{const hex=partyColor(id).slice(1);const rgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722>.179 ? "#000000" : "#ffffff";}
export const PARTY_COLOR_FAMILIES = [
  {label:"Netanyahu bloc — Likud",ids:["likud"]},
  {label:"Netanyahu bloc — nationalist / religious right",ids:["otzma","rz","noam"]},
  {label:"Netanyahu bloc — Haredi lists",ids:["shas","utj"]},
  {label:"Netanyahu bloc — People of Israel",ids:["poi"]},
  {label:"Anti-Netanyahu bloc (Jewish-majority parties)",ids:["byachad","yashar","dem","yb","bw"]},
  {label:"Unaligned list",ids:["res"]},
  {label:"Joint List and Ra'am",ids:["jl","raam"]},
];
export const PARTY_COLOR_NOTE="Related shades group the site's current political families; each list has its own color. These editorial groups do not establish a coalition agreement or a party's willingness to govern with another list.";
export function blocColorStrip(bloc:string):string{const ids=({net:["likud","otzma","rz","shas","utj","poi"],opp:["byachad","yashar","dem","yb","bw"],mid:["res"],arab:["jl","raam"]} as Record<string,string[]>)[bloc]??[];return ids.length===1?partyColor(ids[0]):`linear-gradient(90deg, ${ids.map((id,i)=>`${partyColor(id)} ${i/ids.length*100}% ${(i+1)/ids.length*100}%`).join(", ")})`;}
