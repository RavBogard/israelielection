/** Hydration/history restoration must reach React state before URL synchronization is permitted. */
export function restorationGate() {
  let expected: string | null = null;
  return { restore(key: string) { expected = key; }, shouldWrite(key: string) { if (expected !== null) { if (expected === key) expected = null; return false; } return true; } };
}
export function arrangementKey(poll: string, cabinet: Set<string>, roles: Record<string,string>): string {
  return JSON.stringify([poll, [...cabinet].sort(), Object.entries(roles).sort(([a],[b]) => a.localeCompare(b))]);
}
