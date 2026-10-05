import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { allCharts, allPositions, COMMUNITIES, GUIDES, ISSUES } from "./articles";
import { parties } from "./data";

/*
 * Machine checks on the reference layer. They encode the plan's proof rules and
 * the rulings in docs/research/RULINGS.md that can be checked mechanically.
 */

const ROOT = process.cwd();
const pages = [
  ...ISSUES.map((slug) => ({ slug, kind: "issue" as const, file: `content/issues/${slug}.mdx` })),
  ...COMMUNITIES.map((slug) => ({ slug, kind: "community" as const, file: `content/communities/${slug}.mdx` })),
  ...GUIDES.map((slug) => ({ slug, kind: "guide" as const, file: `content/guides/${slug}.mdx` })),
  { slug: "american-lens", kind: "essay" as const, file: "content/american-lens.mdx" },
];
const present = pages.filter((p) => existsSync(path.join(ROOT, p.file)));
const charts = allCharts();
const positions = allPositions();
const partyIds = new Set(parties.map((p) => p.id));
const ROUTES = new Set([
  "/", "/parties", "/polls", "/news", "/results", "/teach", "/issues", "/communities", "/american-lens", "/vote-map", "/how-it-works", "/timeline", "/glossary", "/coalition-builder", "/compare", "/government",
  ...parties.map((p) => `/parties/${p.id}`),
  ...ISSUES.map((s) => `/issues/${s}`),
  ...COMMUNITIES.map((s) => `/communities/${s}`),
  ...GUIDES.map((s) => `/how-it-works/${s}`),
]);

const read = (f: string) => readFileSync(path.join(ROOT, f), "utf8");
/** The page's text outside <Quote> blocks: what the site says in its own voice. */
const ownVoice = (src: string) => src.replace(/<Quote[\s\S]*?<\/Quote>/g, "");
/** Words of prose: no meta export, no JSX tags, no link targets. */
const prose = (src: string) =>
  src
    .replace(/^export const meta[\s\S]*?\n};?\n/m, "")
    .replace(/<[A-Z][^>]*\/>/g, "")
    .replace(/<\/?[A-Za-z][^>]*>/g, "")
    .replace(/\]\([^)]*\)/g, "]");
const words = (s: string) => s.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;

const META = /^export const meta = (\{[\s\S]*?\n\});?$/m;

describe("reference pages", () => {
  it("has at least one page written", () => {
    expect(present.length).toBeGreaterThan(0);
  });

  for (const p of present) {
    describe(p.file, () => {
      const src = read(p.file);
      const voice = ownVoice(src);

      it("exports meta as JSON with title, dek and a checked date", () => {
        const m = src.match(META);
        expect(m, "export const meta = { ... } with JSON inside").toBeTruthy();
        const meta = JSON.parse(m![1]);
        expect(typeof meta.title).toBe("string");
        expect(meta.dek.length).toBeGreaterThan(40);
        expect(meta.dek.length).toBeLessThan(220);
        expect(meta.checked).toMatch(/^2026-\d\d-\d\d$/);
      });

      it("uses only charts and party tables that exist, named for this page", () => {
        for (const [, id] of src.matchAll(/<Chart id="([^"]+)"/g)) {
          expect(id.startsWith(`${p.slug}.`), `${id} should start with ${p.slug}.`).toBe(true);
          expect(charts[id], `chart ${id}`).toBeDefined();
        }
        for (const [, issue] of src.matchAll(/<Positions issue="([^"]+)"/g)) expect(positions[issue], `positions ${issue}`).toBeDefined();
      });

      it("has the sections the plan sets", () => {
        const h2 = [...src.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
        if (p.kind === "issue") {
          expect(h2.length).toBeGreaterThanOrEqual(4);
          expect(h2.at(-1)).toBe("Misreadings"); // ruling 31
          expect(src).toMatch(/<Positions issue="/);
          expect((src.match(/<Chart id="/g) ?? []).length).toBeGreaterThanOrEqual(2);
        } else {
          expect(h2.length).toBeGreaterThanOrEqual(3);
        }
      });

      it("is the planned length", () => {
        const n = words(prose(src));
        if (p.kind === "issue") {
          expect(n).toBeGreaterThanOrEqual(800);
          expect(n).toBeLessThanOrEqual(1650); // 800–1,200 in the plan, plus citation link text, quotes and notes; raised for the Part 3 review additions
        } else {
          expect(n).toBeGreaterThanOrEqual(500);
          expect(n).toBeLessThanOrEqual(1700);
        }
      });

      it("publishes nothing unverified or unfinished (ruling 26)", () => {
        expect(src).not.toMatch(/\(unverified\)|unverified|\bTODO\b|\bTK\b|\bXX\b|\[citation/i);
      });

      it("follows the terminology rulings in its own voice", () => {
        expect(voice).not.toMatch(/Judea and Samaria/); // 2
        expect(voice).not.toMatch(/support (a |the )?two[- ]state/i); // 20
        expect(voice).not.toMatch(/draft[- ]dodg/i); // 14
        expect(voice).not.toMatch(/regime coup|judicial reform\b/i); // 38
        expect(voice).not.toMatch(/war aliyah|Second Israel/i); // 72, 80
        expect((voice.match(/ultra-Orthodox/g) ?? []).length).toBeLessThanOrEqual(1); // 1
        // House spellings (32)
        expect(voice).not.toMatch(/Lieberman|B'nei Brak|Bene Beraq|Modiin Illit|Modi'in Ilit|Beitar Ilit|Maale Adumim|Ma'aleh Adumim|Kiryat Malakhi|Bet Shemesh|Shfaram|Shefa'amr|Daliat|Beit Jan\b|Kiryat Arbah/);
      });

      it("links only to https sources and to pages that exist", () => {
        for (const [, href] of src.matchAll(/\]\(([^)\s]+)\)/g)) {
          if (href.startsWith("/")) expect(ROUTES.has(href.split("#")[0]), `internal link ${href}`).toBe(true);
          else expect(href, "external link").toMatch(/^https:\/\//);
        }
        for (const [, href] of src.matchAll(/url="([^"]+)"/g)) expect(href).toMatch(/^https:\/\//);
      });

      it("cites primary or reputable sources, not Wikipedia (except the 2026 polling table)", () => {
        const wiki = [...src.matchAll(/https:\/\/en\.wikipedia\.org\/wiki\/([^)\s"]+)/g)].map((m) => m[1]);
        expect(wiki.filter((w) => !w.startsWith("Opinion_polling_for_the_2026_Israeli_legislative_election"))).toEqual([]);
      });

      it("does not write in Daniel's voice", () => {
        expect(voice).not.toMatch(/\b(I|I'm|I've|my|me)\b(?![-.])/);
      });
    });
  }
});

describe("chart data", () => {
  for (const [id, c] of Object.entries(charts)) {
    it(id, () => {
      expect(c.title.length).toBeGreaterThan(5);
      expect(["bars", "table"]).toContain(c.kind);
      expect(c.source.length).toBeGreaterThan(1);
      expect(c.url).toMatch(/^https:\/\//);
      expect(c.date.length).toBeGreaterThan(3);
      expect(c.rows.length).toBeGreaterThan(0);
      expect(new Set(c.rows.map((r) => r.label)).size, "row labels unique").toBe(c.rows.length);
      for (const r of c.rows) {
        if (c.kind === "bars") expect(typeof r.value, `${r.label} value`).toBe("number");
        else expect(r.cells?.length, `${r.label} cells`).toBe(c.columns!.length - 1);
        if (r.url) expect(r.url).toMatch(/^https:\/\//);
      }
      if (c.unit === "%" && c.kind === "bars") for (const r of c.rows) expect(r.value!).toBeLessThanOrEqual(c.max ?? 100);
      expect(JSON.stringify(c)).not.toMatch(/unverified/i);
      expect(JSON.stringify(c)).not.toMatch(/wikipedia\.org\/wiki\/(?!Opinion_polling_for_the_2026)/);
    });
  }
});

describe("party positions", () => {
  for (const [issue, p] of Object.entries(positions)) {
    it(issue, () => {
      expect(ISSUES as readonly string[]).toContain(issue);
      expect(p.rows.length).toBeGreaterThan(0);
      expect(new Set(p.rows.map((r) => r.party)).size).toBe(p.rows.length);
      for (const r of p.rows) {
        expect(partyIds.has(r.party), `party id ${r.party}`).toBe(true);
        expect(r.text.length).toBeGreaterThan(10);
        expect(r.url).toMatch(/^https:\/\//);
        expect(r.date.length).toBeGreaterThan(3);
        expect(r.source.length).toBeGreaterThan(1);
      }
      expect(JSON.stringify(p)).not.toMatch(/unverified/i);
    });
  }
});
