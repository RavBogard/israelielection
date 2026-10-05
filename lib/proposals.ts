/**
 * Party-text updates: the daily job reads the day's headlines and proposes changes to a
 * party's leader, status, surplus agreement or coalition pledges. Grounded proposals merge
 * automatically (Daniel, 2026-10-05: "hands off as possible"); a leader or status change
 * reported by only one outlet goes to a PR instead.
 */
import { terms } from "./briefing";
import type { NewsItem } from "./news";
import type { PartiesFile, Party } from "./types";

export const FIELDS = ["leader", "status", "surplusPartner", "addPledge"] as const;
export type Field = (typeof FIELDS)[number];

export type ProposalDraft = { proposals: { party: string; field: Field; text: string; sources: number[]; why: string }[] };

export type Proposal = {
  party: string;
  field: Field;
  text: string;
  why: string;
  /** Short citation in the register's style: "Times of Israel, Oct 5, 2026". */
  source: string;
  items: Pick<NewsItem, "outlet" | "title" | "url" | "published">[];
};

export const PROPOSAL_SCHEMA = {
  type: "object",
  properties: {
    proposals: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        properties: {
          party: { type: "string", description: "Party id from the register." },
          field: { type: "string", enum: [...FIELDS] },
          text: { type: "string", description: "The new value, in the register's style. Plain text, no markdown." },
          sources: { type: "array", minItems: 1, maxItems: 3, items: { type: "integer" } },
          why: { type: "string", description: "One sentence: what the headline reports." },
        },
        required: ["party", "field", "text", "sources", "why"],
      },
    },
  },
  required: ["proposals"],
} as const;

function current(p: Party, field: Field): string {
  if (field === "leader") return p.leader;
  if (field === "status") return p.status ?? "(none)";
  if (field === "surplusPartner") return p.surplusPartner ? `${p.surplusPartner.text} (${p.surplusPartner.source})` : "(none)";
  return (p.pledges ?? []).map((x) => `“${x.text}” (${x.source})`).join(" | ") || "(none)";
}

export function proposalPrompt(items: NewsItem[], parties: Party[], date: string): string {
  const register = parties
    .map((p) => `- ${p.id} (${p.name}): leader: ${p.leader} | status: ${current(p, "status")} | surplusPartner: ${current(p, "surplusPartner")} | pledges: ${current(p, "addPledge")}`)
    .join("\n");
  const list = items
    .map((it, i) => `[${i + 1}] ${it.outlet}, ${it.published.slice(0, 10)} | ${it.title}${it.summary ? ` | ${it.summary}` : ""}`)
    .join("\n");
  return `You maintain the party register of israelielection.org, a neutral English reference on Israel's October 27, 2026 Knesset election. Today is ${date}.

Below is the register, then the last day's headlines, numbered. Propose a change ONLY when a headline reports a concrete new fact that makes a register entry out of date:
- leader: the list's leader changed.
- status: the list withdrew, merged into another list, was disqualified or reinstated, or similar. Short, dated, e.g. "Withdrew Oct 20; endorsed Yashar!".
- surplusPartner: a surplus-vote agreement was signed, cancelled or newly reported. Dated, e.g. "Religious Zionism (signed Oct 6)."
- addPledge: the party or its leader newly and explicitly ruled a partner in or out of a coalition, or set a condition for joining one. Quote their words if the headline does.

Rules: most days nothing qualifies; return an empty list then. Never restate what the register already says. Never infer, predict or summarize opinion. Each proposal cites 1–3 headline numbers that state the fact. Use the party ids exactly as given.

Register:
${register}

Headlines:
${list}`;
}

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const cite = (it: NewsItem) => {
  const [y, m, d] = it.published.slice(0, 10).split("-").map(Number);
  return `${it.outlet}, ${MON[m - 1]} ${d}, ${y}`;
};
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
/** Words that name a party in a headline: its name, short name, and leader surnames. */
const namesOf = (p: Party) =>
  [p.name, p.short, ...p.leader.split(/[,(]/)[0].split(/\s+/).slice(-1)].map(norm).filter((n) => n.length > 2);

/** Ground a draft: valid party and field, real citations that name the party and share words with the text. */
export function checkProposals(draft: ProposalDraft, items: NewsItem[], parties: Party[]): { kept: Proposal[]; dropped: { text: string; reason: string }[] } {
  const kept: Proposal[] = [];
  const dropped: { text: string; reason: string }[] = [];
  for (const d of draft.proposals ?? []) {
    const text = String(d.text ?? "").replace(/\s+/g, " ").trim();
    const p = parties.find((x) => x.id === d.party);
    if (!p) { dropped.push({ text, reason: `unknown party ${d.party}` }); continue; }
    if (!FIELDS.includes(d.field)) { dropped.push({ text, reason: `unknown field ${d.field}` }); continue; }
    if (!text || /https?:\/\/|[[\]*#<>]/.test(text)) { dropped.push({ text, reason: "empty, markup or link" }); continue; }
    if (text.length > (d.field === "addPledge" ? 400 : 160)) { dropped.push({ text, reason: "too long" }); continue; }
    if (norm(current(p, d.field)).includes(norm(text))) { dropped.push({ text, reason: "already in the register" }); continue; }
    const cited = [...new Set(d.sources ?? [])].filter((n) => Number.isInteger(n) && n >= 1 && n <= items.length).map((n) => items[n - 1]);
    if (!cited.length) { dropped.push({ text, reason: "cites no valid headline" }); continue; }
    const blob = norm(cited.map((c) => `${c.title} ${c.summary}`).join(" "));
    if (!namesOf(p).some((n) => blob.includes(n))) { dropped.push({ text, reason: `cited headlines don't name ${p.name}` }); continue; }
    const have = terms(blob);
    // Short values ("UTJ (signed Oct 12).") carry few words; a pledge must share at least two.
    if ([...terms(text)].filter((w) => have.has(w)).length < (d.field === "addPledge" ? 2 : 1)) { dropped.push({ text, reason: "shares too little with its cited headlines" }); continue; }
    kept.push({
      party: p.id,
      field: d.field,
      text,
      why: String(d.why ?? "").trim(),
      source: [...new Set(cited.map(cite))].join("; "),
      items: cited.map(({ outlet, title, url, published }) => ({ outlet, title, url, published })),
    });
  }
  return { kept, dropped };
}

/** Write proposals into a copy of the register (for the PR's diff). */
export function applyProposals(file: PartiesFile, proposals: Proposal[], date: string): PartiesFile {
  const next: PartiesFile = structuredClone(file);
  next.updated = date;
  for (const pr of proposals) {
    const p = next.parties.find((x) => x.id === pr.party)!;
    if (pr.field === "leader") p.leader = pr.text;
    else if (pr.field === "status") p.status = pr.text;
    else if (pr.field === "surplusPartner") {
      p.surplusPartner = { text: pr.text, source: pr.source };
      p.surplusLine = `Surplus: ${pr.text.replace(/\.$/, "")}`;
    } else p.pledges = [...(p.pledges ?? []), { text: pr.text, source: pr.source }];
  }
  return next;
}

/** Stable key so the job doesn't re-propose what an open PR already carries. */
export const proposalKey = (p: Pick<Proposal, "party" | "field" | "text">) => `${p.party}|${p.field}|${norm(p.text).slice(0, 80)}`;

/** Leader and status changes are the highest-impact edits: they auto-merge only on two outlets. */
export function needsReview(p: Proposal): boolean {
  return (p.field === "leader" || p.field === "status") && new Set(p.items.map((i) => i.outlet)).size < 2;
}
