import {describe,it,expect} from "vitest";
import {parties} from "./data";
import {partyColor,partyInk,PARTY_COLOR_FAMILIES} from "./party-colors";
describe("current-list palette",()=>{it("covers every list distinctly and supplies readable contrast text",()=>{expect(new Set(parties.map(p=>partyColor(p.id))).size).toBe(parties.length);expect(new Set(PARTY_COLOR_FAMILIES.flatMap(f=>f.ids))).toEqual(new Set(parties.map(p=>p.id)));for(const p of parties){const rgb=partyColor(p.id).slice(1).match(/../g)!.map(x=>parseInt(x,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);const lum=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;const contrast=partyInk(p.id)==="#ffffff" ? 1.05/(lum+.05) : (lum+.05)/.05;expect(contrast).toBeGreaterThanOrEqual(4.5);}});});
import {readFileSync} from "node:fs";
import {contrast,DARK_PAPER,LIGHT_PAPER,partyStroke,strokeVars} from "./party-colors";
describe("party strokes",()=>{
  it("meet 3:1 on light and dark paper for every list",()=>{for(const p of parties){expect(contrast(partyStroke(p.id),LIGHT_PAPER)).toBeGreaterThanOrEqual(3);expect(contrast(partyStroke(p.id),"#ffffff")).toBeGreaterThanOrEqual(3);if(contrast(partyColor(p.id),LIGHT_PAPER)>=3)expect(partyStroke(p.id)).toBe(partyColor(p.id));expect(contrast(partyStroke(p.id,"dark"),DARK_PAPER)).toBeGreaterThanOrEqual(3);expect(contrast(partyStroke(p.id,"dark"),"#121210")).toBeGreaterThanOrEqual(3);expect(strokeVars(p.id)).toEqual({"--ps":partyStroke(p.id),"--ps-dark":partyStroke(p.id,"dark")});}});
  it("only lightens the lists that need it",()=>{for(const p of parties)if(contrast(partyColor(p.id),DARK_PAPER)>=3)expect(partyStroke(p.id,"dark")).toBe(partyColor(p.id));expect(partyStroke("likud","dark")).not.toBe(partyColor("likud"));});
  it("matches the dark paper token",()=>{const css=readFileSync("app/globals.css","utf8");expect(css).toContain(`--sheet: ${DARK_PAPER}`);});
});
