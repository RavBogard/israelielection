import {describe,it,expect} from "vitest";
import {parties} from "./data";
import {partyColor,partyInk,PARTY_COLOR_FAMILIES} from "./party-colors";
describe("current-list palette",()=>{it("covers every list distinctly and supplies readable contrast text",()=>{expect(new Set(parties.map(p=>partyColor(p.id))).size).toBe(parties.length);expect(new Set(PARTY_COLOR_FAMILIES.flatMap(f=>f.ids))).toEqual(new Set(parties.map(p=>p.id)));for(const p of parties){const rgb=partyColor(p.id).slice(1).match(/../g)!.map(x=>parseInt(x,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);const lum=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;const contrast=partyInk(p.id)==="#ffffff" ? 1.05/(lum+.05) : (lum+.05)/.05;expect(contrast).toBeGreaterThanOrEqual(4.5);}});});
