import { RedisLiveStore } from "../live-forecast/store";
import type {
  ElectionLifecycleSnapshot,
  GeographySnapshot,
  LifecycleLedger,
  SharedSeatContext,
} from "./types";
export interface LifecycleStore {
  load(): Promise<LifecycleLedger | null>;
  pinned(
    revision: string,
  ): Promise<ElectionLifecycleSnapshot | SharedSeatContext | null>;
  lock(token: string): Promise<boolean>;
  unlock(token: string): Promise<void>;
  delivered(id: string): Promise<boolean>;
  publish(
    token: string,
    ledger: LifecycleLedger,
    delivery: string,
    now: string,
  ): Promise<boolean>;
  geography(revision?: string): Promise<GeographySnapshot | null>;
}
export const namespace = () =>
  `election-lifecycle:2026:v1:${process.env.ELECTION_LIFECYCLE_NAMESPACE ?? process.env.VERCEL_ENV ?? "development"}:`;
export class RedisLifecycleStore implements LifecycleStore {
  private redis: RedisLiveStore;
  private prefix = namespace();
  constructor(url: string, token: string) {
    this.redis = new RedisLiveStore(url, token);
  }
  async load() {
    const s = await this.redis.command<string | null>(
      "GET",
      this.prefix + "ledger",
    );
    return s ? (JSON.parse(s) as LifecycleLedger) : null;
  }
  async pinned(revision: string) {
    if (!/^[a-f0-9]{64}$/.test(revision)) return null;
    const s = await this.redis.command<string | null>(
      "GET",
      this.prefix + "snapshot:" + revision,
    );
    return s
      ? (JSON.parse(s) as ElectionLifecycleSnapshot | SharedSeatContext)
      : null;
  }
  async geography(revision?: string) {
    const s = await this.redis.command<string | null>(
      "GET",
      this.prefix + (revision ? "geography:" + revision : "geography-current"),
    );
    return s ? (JSON.parse(s) as GeographySnapshot) : null;
  }
  async lock(token: string) {
    return (
      (await this.redis.command(
        "SET",
        this.prefix + "lock",
        token,
        "NX",
        "EX",
        120,
      )) === "OK"
    );
  }
  async unlock(token: string) {
    await this.redis.command(
      "EVAL",
      "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0",
      1,
      this.prefix + "lock",
      token,
    );
  }
  async delivered(id: string) {
    return !!(await this.redis.command(
      "EXISTS",
      this.prefix + "delivery:" + id,
    ));
  }
  async publish(
    token: string,
    ledger: LifecycleLedger,
    delivery: string,
    now: string,
  ) {
    if (!ledger.current) throw new Error("Missing publication");
    const sequence = await this.redis.command<number>(
      "INCR",
      this.prefix + "sequence",
    );
    ledger.current.sequence = sequence;
    ledger.current.updatedAt = now;
    const writes: { key: string; value: string }[] = [];
    for (const s of ledger.seatSnapshots) {
      if (s.sequence === 0) {
        s.sequence = sequence;
        s.updatedAt = now;
      }
      writes.push({
        key: this.prefix + "snapshot:" + s.revision,
        value: JSON.stringify(s),
      });
    }
    const selected = ledger.seatSnapshots.find(
      (s) => s.revision === ledger.current!.seatContext.revision,
    );
    if (selected) {
      ledger.current.seatContext.sequence = selected.sequence;
      ledger.current.seatContext.updatedAt = selected.updatedAt;
    }
    for (const c of ledger.captures) {
      if (c.importAudit)
        writes.push({
          key:
            this.prefix +
            "import-audit:" +
            c.source.captureHash +
            ":" +
            delivery,
          value: JSON.stringify(c.importAudit),
        });
      writes.push({
        key: this.prefix + "capture:" + c.source.captureHash,
        value: JSON.stringify(c),
      });
    }
    writes.push({
      key: this.prefix + "snapshot:" + ledger.current.revision,
      value: JSON.stringify(ledger.current),
    });
    if (ledger.geography)
      writes.push({
        key: this.prefix + "geography:" + ledger.geography.revision,
        value: JSON.stringify(ledger.geography),
      });
    const stored = { ...ledger, captures: [] };
    const script =
      "if redis.call('GET',KEYS[1])~=ARGV[1] then return 0 end for _,w in ipairs(cjson.decode(ARGV[3])) do redis.call('SET',w.key,w.value,'NX') end redis.call('SET',KEYS[2],ARGV[2]); if ARGV[4]~='' then redis.call('SET',KEYS[4],ARGV[4]) end redis.call('SET',KEYS[3],'1','EX',604800); return 1";
    return (
      (await this.redis.command(
        "EVAL",
        script,
        4,
        this.prefix + "lock",
        this.prefix + "ledger",
        this.prefix + "delivery:" + delivery,
        this.prefix + "geography-current",
        token,
        JSON.stringify(stored),
        JSON.stringify(writes),
        ledger.geography ? JSON.stringify(ledger.geography) : "",
      )) === 1
    );
  }
}
export function lifecycleStore(): LifecycleStore | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL,
    token =
      process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token ? new RedisLifecycleStore(url, token) : null;
}
