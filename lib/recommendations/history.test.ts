import {describe,it,expect} from "vitest";
import {emptyReading,readHistory,recordReading,suggestedReading,RETENTION_MS} from "./history";
const catalog=[{id:"issue:a",topic:"issue"},{id:"issue:b",topic:"issue"},{id:"guide:a",topic:"guide"}],known=catalog.map(c=>c.id),now=10*RETENTION_MS;
describe("explicit local reading consent",()=>{
 it("records nothing without opt-in and never accepts an unknownpublic ID",()=>{expect(recordReading(emptyReading(),known[0],known,now).history).toEqual([]);expect(recordReading({enabled:true,history:[]},"private:opinion",known,now).history).toEqual([]);});
 it("expires history at30days, rejects future timestamps and invalid entries",()=>{const s=readHistory(JSON.stringify({enabled:true,history:[{id:known[0],at:now-RETENTION_MS},{id:known[1],at:now-1},{id:known[2],at:now+1},{id:"unknown",at:now}]}),known,now);expect(s.history).toEqual([{id:known[1],at:now-1}]);});
 it("reset/off erase history and recommendations never change the inputcatalog",()=>{const state=recordReading({enabled:true,history:[]},known[0],known,now),before=JSON.stringify(catalog);expect(suggestedReading(catalog,state,null).map(s=>s.id)).toEqual([known[1]]);expect(suggestedReading(catalog,{enabled:true,history:[]},null)).toEqual([]);expect(suggestedReading(catalog,emptyReading(),null)).toEqual([]);expect(JSON.stringify(catalog)).toBe(before);expect(readHistory('{broken',known,now)).toEqual(emptyReading());});
});
