import { expect, it } from "vitest";
import { arrangementKey, restorationGate } from "./builder-state";
import { restoreRoles, writeRoles } from "./coalition-arrangement";
it("never erases a shared arrangement during initial/StrictMode hydration and restores browser history", () => {
  const ids = ["yashar", "byachad", "dem", "yb", "bw", "raam", "jl"];
  const original = new URLSearchParams("with=yashar,byachad,dem,yb,bw&support=raam&abstain=jl&poll=avg");
  const restored = restoreRoles(original, ids); const key = arrangementKey("avg", restored.cabinet, restored.overrides);
  const gate = restorationGate();
  for (let replay = 0; replay < 2; replay++) { gate.restore(key); expect(gate.shouldWrite(arrangementKey("avg", new Set(), {}))).toBe(false); }
  expect(gate.shouldWrite(key)).toBe(false); expect(gate.shouldWrite(key)).toBe(true);
  expect(writeRoles(new URLSearchParams(), restored.cabinet, restored.overrides, ids).get("support")).toBe("raam");
  gate.restore(key); expect(gate.shouldWrite(arrangementKey("different", new Set(), {}))).toBe(false); expect(gate.shouldWrite(key)).toBe(false);
});
