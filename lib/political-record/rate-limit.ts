import { RedisLiveStore } from "../live-forecast/store";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
/** Trust only Vercel's overwritten deployment header; never caller-provided self-hosted forwarding headers. */
export function privateClientBucket(
  request: Request,
  secret: string,
  now = Date.now(),
) {
  if (secret.length < 32) throw new Error("rate_secret_unconfigured");
  const candidate =
    process.env.VERCEL === "1"
      ? (request.headers.get("x-vercel-forwarded-for") ?? "")
      : "";
  const ip = isIP(candidate) ? candidate : "unknown";
  return createHmac("sha256", secret)
    .update(`rate-client:${Math.floor(now / 86400000)}:${ip}`)
    .digest("hex");
}
export async function requestLimit(
  request: Request,
  bucket: string,
  globalLimit: number,
  clientLimit: number,
  seconds: number,
  secret: string,
) {
  const now = Date.now(),
    client = privateClientBucket(request, secret, now);
  const local = await sharedLimit(
    `${bucket}:client:${client}`,
    clientLimit,
    seconds,
    now,
  );
  return local.allowed ? sharedLimit(bucket, globalLimit, seconds, now) : local;
}
export const platformNamespace = () =>
  `political-platform:v1:${process.env.POLITICAL_PLATFORM_NAMESPACE ?? process.env.VERCEL_ENV ?? "development"}:`;
export async function sharedLimit(
  bucket: string,
  limit: number,
  seconds: number,
  now = Date.now(),
) {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL,
    token =
      process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error("rate_store_unconfigured");
  return redisLimit(
    new RedisLiveStore(url, token),
    bucket,
    limit,
    seconds,
    now,
  );
}
export async function redisLimit(
  redis: Pick<RedisLiveStore, "command">,
  bucket: string,
  limit: number,
  seconds: number,
  now = Date.now(),
) {
  if (
    !/^[a-z0-9:_-]{1,150}$/.test(bucket) ||
    !Number.isSafeInteger(limit) ||
    limit < 1
  )
    throw new Error("rate_bucket_invalid");
  const epoch = Math.floor(now / (seconds * 1000));
  const count = await redis.command<number>(
    "EVAL",
    "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]); end return n",
    1,
    platformNamespace() + "limit:" + bucket + ":" + epoch,
    seconds + 1,
  );
  return {
    allowed: count <= limit,
    retryAfter: Math.max(
      1,
      Math.ceil(((epoch + 1) * seconds * 1000 - now) / 1000),
    ),
    remaining: Math.max(0, limit - count),
  };
}
