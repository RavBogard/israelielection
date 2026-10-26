import {createHash} from "node:crypto";
/** Git checkouts and deployment archives must identify the same source text. */
export const canonicalSource=value=>String(value).replace(/\r\n?/g,"\n");
export const sourceRevision=value=>createHash("sha256").update(canonicalSource(value),"utf8").digest("hex");
