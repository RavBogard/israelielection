import { createHash, createHmac, timingSafeEqual } from "node:crypto";
/** QStash HS256, exact destination, issuer, validity window and raw-body hash. Both rotation keys accepted. */
export function verifyQStash(signature: string | null, body: string, url: string, keys: string[], now = Date.now()): boolean {
  try {
    if (!signature || !keys.length) return false;
    const parts = signature.split("."); if (parts.length !== 3) return false;
    const [head, payload, sig] = parts;
    const h = JSON.parse(Buffer.from(head, "base64url").toString()), p = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (h.alg !== "HS256" || p.iss !== "Upstash" || p.sub !== url || !Number.isFinite(p.exp) || !Number.isFinite(p.nbf) || p.exp * 1000 <= now || p.nbf * 1000 > now) return false;
    if (typeof p.body !== "string" || p.body.replace(/=+$/, "") !== createHash("sha256").update(body).digest("base64url")) return false;
    const received = Buffer.from(sig, "base64url");
    return keys.some((key) => { const expected = createHmac("sha256", key).update(`${head}.${payload}`).digest(); return received.length === expected.length && timingSafeEqual(received, expected); });
  } catch { return false; }
}
