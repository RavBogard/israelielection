import { expect, it, vi } from "vitest";
import baseline from "../../data/live-forecast.json";
import type { LiveForecastSnapshot } from "./types";
import { runWorker } from "./worker";
import type { Health, LiveStore } from "./store";
function memory() {
  let snapshot = structuredClone(baseline) as LiveForecastSnapshot;
  let health: Health | null = null, locked = false;
  const deliveries = new Set<string>();
  const store: LiveStore = { read: async()=>snapshot, health:async()=>health, inputs:async()=>({exits:[]}), acquire:async()=>{if(locked)return false;locked=true;return true;},release:async()=>{locked=false;},delivered:async(id)=>deliveries.has(id),recordHealth:async(h)=>{health=h;},publish:async(_t,s,_i,h,id)=>{snapshot=s;health=h;deliveries.add(id);return true;} };
  return store;
}
it("unchanged valid source refreshes acquisition health without replacing model timestamp or appending history; retries are idempotent", async()=>{
  const store=memory(), old=(await store.read())!, now="2026-10-27T20:01:00Z";
  const acquire=vi.fn(async()=>({exits:[],sources:[],revision:old.revision}));
  expect((await runWorker(store,"one",now,acquire)).status).toBe("unchanged");
  expect((await store.read())!.generatedAt).toBe(old.generatedAt);
  expect((await store.read())!.history).toEqual(old.history);
  expect((await store.health())!.lastSuccessfulAcquisitionAt).toBe(now);
  expect((await runWorker(store,"one",now,acquire)).status).toBe("duplicate"); expect(acquire).toHaveBeenCalledTimes(1);
});
it("failed acquisition retains previous snapshot and last successful acquisition; outside election week does no fetch", async()=>{
  const store=memory(), old=await store.read();
  const acquire=vi.fn(async()=>{throw new Error("source down");});
  await expect(runWorker(store,"two","2026-10-27T20:02:00Z",acquire)).rejects.toThrow("last known good");
  expect(await store.read()).toEqual(old); expect((await store.health())!.error).toBeTruthy();
  expect((await runWorker(store,"three","2026-11-04T00:00:00Z",acquire)).status).toBe("outside_window"); expect(acquire).toHaveBeenCalledTimes(1);
});
