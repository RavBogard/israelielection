import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import parties from "../data/parties.json";

/*
 * The seven data/positions files feed the Compare page and the Builder's "Can they govern
 * together?" panel, which derives agreement mechanically from `stance`. So every list must have
 * a row on every issue, and every stance must be one of the file's own options.
 */
type Row = { party: string; text?: string | null; source?: string | null; url?: string | null; date?: string | null; stance?: string; status?: string; basis?: string; checked?: string };
type File = { issue: string; question?: string; stances?: { id: string; label: string }[]; rows: Row[] };

const dir = join(__dirname, "..", "data", "positions");
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => ({ name: f, data: JSON.parse(readFileSync(join(dir, f), "utf8")) as File }));
const allIds = parties.parties.map((p) => p.id);
const withStances = files.filter((f) => f.data.stances);

describe("position files", () => {
  it("there are seven", () => expect(files).toHaveLength(7));

  for (const { name, data } of withStances) {
    describe(name, () => {
      it("asks one short question and offers three to five short stances", () => {
        expect(data.question!.length, data.question).toBeLessThan(90);
        expect(data.stances!.length).toBeGreaterThanOrEqual(3);
        expect(data.stances!.length).toBeLessThanOrEqual(5);
        for (const s of data.stances!) {
          expect(s.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
          expect(s.label.length, s.label).toBeLessThan(40);
        }
        expect(new Set(data.stances!.map((s) => s.id)).size).toBe(data.stances!.length);
      });

      it("has exactly one row for every list", () => {
        const got = data.rows.map((r) => r.party).sort();
        expect(got).toEqual([...allIds].sort());
      });

      it("gives every row a known stance or a recorded silence", () => {
        const ids = new Set(data.stances!.map((s) => s.id));
        for (const r of data.rows) {
          if (r.stance !== undefined) {
            expect(ids.has(r.stance), `${r.party}: ${r.stance}`).toBe(true);
            expect(r.status, r.party).toBeUndefined();
            expect(r.text, r.party).toBeTruthy();
          } else {
            expect(["declined", "none"], r.party).toContain(r.status);
          }
          if (r.status === "none") expect(r.checked ?? r.date, r.party).toBeTruthy();
          if (r.basis !== undefined) expect(r.basis, r.party).toBe("record");
        }
      });

      it("sources every position and every refusal with an https link", () => {
        for (const r of data.rows) {
          if (r.stance === undefined && r.status === "none" && !r.url) continue;
          const u = new URL(r.url!);
          expect(u.protocol, r.party).toBe("https:");
          expect(u.hostname, r.party).not.toMatch(/wikipedia\.org$/);
          expect(r.date, r.party).toBeTruthy();
        }
      });
    });
  }
});
