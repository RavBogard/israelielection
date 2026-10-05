import {describe,it,expect} from "vitest";
import {existsSync,readdirSync,readFileSync} from "node:fs";
import {join} from "node:path";
import {NAV,NAV_GROUPS,NAV_UTILITIES} from "./site";
import {activeNavGroup,canonicalNavPaths,currentNavPage,withinNavPage} from "./navigation";
describe("visitor navigation catalog",()=>{
 it("covers each actual first-level public page once with meaningful labels/descriptions",()=>{
  const pages=readdirSync("app",{withFileTypes:true}).filter(d=>d.isDirectory()&&existsSync(join("app",d.name,"page.tsx"))).map(d=>`/${d.name}`);
  expect(new Set(NAV.map(n=>n.href))).toEqual(new Set(pages));expect(NAV).toHaveLength(pages.length);
  expect(NAV_GROUPS.map(g=>g.label)).toEqual(["Parties & coalitions","Polls & updates","Election explained","Teaching resources","About & contact"]);
  expect(NAV_UTILITIES.map(n=>n.href)).toEqual(["/start","/resources","/search"]);
  for(const n of NAV){expect(n.label.length).toBeGreaterThan(2);expect(n.description.length).toBeGreaterThan(20);}
 });
 it("teaching section destinations reference actual HTML IDs while XML paths remain canonical",()=>{
  const all=NAV_GROUPS.flatMap(g=>g.items);expect(new Set(all.map(n=>n.href)).size).toBe(all.length);
  for(const n of all.filter(n=>n.href.includes("#"))){const [path,fragment]=n.href.split("#");expect(readFileSync(join("app",path,"page.tsx"),"utf8")).toContain(`id="${fragment}"`);}
  expect(canonicalNavPaths(["/","/teach#packets","/teach","/teach?role=learner","/news/2026-10-05"])).toEqual(["/","/teach","/news/2026-10-05"]);
 });
 it("marks only exact page links current and locates nested pages in the right section without prefix collisions",()=>{
  expect(currentNavPage("/teach","/teach")).toBe(true);expect(currentNavPage("/teach#packets","/teach")).toBe(false);expect(currentNavPage("/parties","/parties/likud")).toBe(false);
  expect(withinNavPage("/parties","/parties/likud")).toBe(true);expect(withinNavPage("/news","/newsletter")).toBe(false);
  expect(activeNavGroup(NAV_GROUPS,"/parties/likud")).toBe("parties");expect(activeNavGroup(NAV_GROUPS,"/how-it-works/forming-a-government")).toBe("explained");expect(activeNavGroup(NAV_GROUPS,"/government")).toBe("updates");expect(activeNavGroup(NAV_GROUPS,"/teach/packets/system/learner")).toBe("teach");expect(activeNavGroup(NAV_GROUPS,"/resources")).toBeNull();
 });
});
