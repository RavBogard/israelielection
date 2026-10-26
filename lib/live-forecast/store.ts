import type { Poll } from "../types";
import type { LiveForecastSnapshot } from "./types";
export type Health = { lastAttemptAt: string; lastSuccessfulAcquisitionAt: string | null; error: string | null };
export interface LiveStore {
  read(): Promise<LiveForecastSnapshot | null>;
  health(): Promise<Health | null>;
  inputs(revision: string): Promise<{exits: Poll[]} | null>;
  acquire(token: string): Promise<boolean>;
  release(token: string): Promise<void>;
  publish(token: string, snapshot: LiveForecastSnapshot, inputs: unknown, health: Health, delivery: string): Promise<boolean>;
  recordHealth(health: Health): Promise<void>;
  delivered(id: string): Promise<boolean>;
}
export const storePrefix = (environment = process.env.VERCEL_ENV ?? "development") => `live-forecast:2026:v1:${process.env.LIVE_FORECAST_NAMESPACE ?? environment}:`;
const PREFIX = storePrefix();
/** All publication writes and the delivery receipt commit in one lock-checked Redis Lua transaction. */
export class RedisLiveStore implements LiveStore {
  constructor(private url: string, private token: string) {}
  async command<T>(...command: (string | number)[]): Promise<T> {
    const r = await fetch(this.url, { method: "POST", headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" }, body: JSON.stringify(command), cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error("Durable store unavailable");
    const j = await r.json(); if (j.error) throw new Error("Durable store command failed"); return j.result as T;
  }
  async read() { const s = await this.command<string | null>("GET", PREFIX + "current"); return s ? JSON.parse(s) as LiveForecastSnapshot : null; }
  async inputs(revision: string) { const s = await this.command<string | null>("GET", PREFIX + "input:" + revision); return s ? JSON.parse(s) as {exits: Poll[]} : null; }
  async health() { const s = await this.command<string | null>("GET", PREFIX + "health"); return s ? JSON.parse(s) as Health : null; }
  async acquire(token: string) { return await this.command<string | null>("SET", PREFIX + "lock", token, "NX", "EX", 90) === "OK"; }
  async release(token: string) { await this.command("EVAL", "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0", 1, PREFIX + "lock", token); }
  async delivered(id: string) { return !!await this.command("EXISTS", PREFIX + "delivery:" + id); }
  async recordHealth(h: Health) { await this.command("SET", PREFIX + "health", JSON.stringify(h)); }
  async publish(token: string, snapshot: LiveForecastSnapshot, inputs: unknown, health: Health, delivery: string) {
    const script = "if redis.call('GET',KEYS[1])~=ARGV[1] then return 0 end redis.call('SET',KEYS[2],ARGV[2]); redis.call('SET',KEYS[3],ARGV[3],'NX'); redis.call('SET',KEYS[4],ARGV[4]); if ARGV[5]=='changed' then redis.call('LPUSH',KEYS[5],ARGV[2]); redis.call('LTRIM',KEYS[5],0,1439); end redis.call('SET',KEYS[6],'1','EX',604800); return 1";
    return await this.command<number>("EVAL", script, 6, PREFIX + "lock", PREFIX + "current", PREFIX + "input:" + snapshot.revision, PREFIX + "health", PREFIX + "history", PREFIX + "delivery:" + delivery, token, JSON.stringify(snapshot), JSON.stringify(inputs), JSON.stringify(health), snapshot.changeReason === "source_unchanged" ? "unchanged" : "changed") === 1;
  }
}
export function configuredStore(): LiveStore | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL, token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token ? new RedisLiveStore(url, token) : null;
}
