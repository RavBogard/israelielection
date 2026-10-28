import { recordHash } from "./hash";
export * from "./elections";
export function revisionId(value: unknown) {
  return recordHash(value);
}
