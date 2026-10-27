import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { makeCapture } from "./records";
import type { PrivateCaptureRef, SourceRecord } from "./types";
export interface CaptureArchive {
  put(
    source: SourceRecord,
    body: Uint8Array,
    mediaType: string,
  ): Promise<PrivateCaptureRef>;
  read(ref: PrivateCaptureRef): Promise<Uint8Array>;
  /** Authenticated content-addressed lookup; never exposed by public routes. */
  readHash?(hash: string): Promise<Uint8Array>;
}
export const contentHash = (body: Uint8Array) =>
  createHash("sha256").update(body).digest("hex");
/** Explicit local rehearsal archive. Production needs a reviewed private object-storage adapter. */
export class LocalCaptureArchive implements CaptureArchive {
  private root: string;
  constructor(directory: string) {
    if (
      process.env.NODE_ENV === "production" ||
      process.env.VERCEL_ENV === "production"
    )
      throw new Error("local_archive_not_production");
    this.root = path.resolve(directory);
  }
  private filename(key: string) {
    if (!/^private\/[a-f0-9]{64}$/.test(key))
      throw new Error("capture_key_invalid");
    const target = path.resolve(this.root, key);
    if (!target.startsWith(this.root + path.sep))
      throw new Error("capture_key_invalid");
    return target;
  }
  async put(source: SourceRecord, body: Uint8Array, mediaType: string) {
    if (!body.length) throw new Error("capture_empty");
    const hash = contentHash(body),
      key = `private/${hash}`,
      target = this.filename(key);
    if (source.captureHash !== hash)
      throw new Error("source_capture_hash_mismatch");
    await mkdir(path.dirname(target), { recursive: true });
    try {
      await writeFile(target, body, { flag: "wx", mode: 0o600 });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    const stored = await readFile(target);
    if (contentHash(stored) !== hash)
      throw new Error("capture_content_conflict");
    return makeCapture({
      contentSha256: hash,
      sourceRevisionId: source.revisionId,
      storageKey: key,
      mediaType,
      byteLength: body.length,
      observedAt: source.observedAt,
    });
  }
  async read(ref: PrivateCaptureRef) {
    const body = await readFile(this.filename(ref.storageKey));
    if (
      body.length !== ref.byteLength ||
      contentHash(body) !== ref.contentSha256
    )
      throw new Error("capture_content_conflict");
    return body;
  }
  async readHash(hash: string) {
    const body = await readFile(this.filename(`private/${hash}`));
    if (contentHash(body) !== hash) throw new Error("capture_content_conflict");
    return body;
  }
}
