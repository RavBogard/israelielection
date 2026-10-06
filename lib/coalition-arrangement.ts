import { tally, warningsWithSupport, type Warning } from "./coalition";
import type { Party, PledgeRule, Poll } from "./types";
import { AVERAGE_ID } from "./polls";

export type SupportRole = "cabinet" | "support" | "opposition" | "abstain";
export type RoleOverrides = Record<string, "support" | "abstain">;

export const ROLE_LABELS: Record<SupportRole, string> = {
  cabinet: "Cabinet coalition", support: "Outside support", opposition: "Opposition", abstain: "Hypothetical abstention",
};
export const roleOf = (id: string, cabinet: Set<string>, overrides: RoleOverrides): SupportRole => cabinet.has(id) ? "cabinet" : overrides[id] ?? "opposition";

/** Legacy `with=` always means cabinet membership. Other roles never silently replace it. */
export function restoreRoles(q: URLSearchParams, validIds: string[]): { cabinet: Set<string>; overrides: RoleOverrides } {
  const valid = new Set(validIds);
  const ids = (key: string) => (q.get(key) ?? "").split(",").filter((id) => valid.has(id));
  const cabinet = new Set(ids("with"));
  const overrides: RoleOverrides = {};
  for (const id of ids("support")) if (!cabinet.has(id)) overrides[id] = "support";
  for (const id of ids("abstain")) if (!cabinet.has(id) && !overrides[id]) overrides[id] = "abstain";
  return { cabinet, overrides };
}

export function writeRoles(q: URLSearchParams, cabinet: Set<string>, overrides: RoleOverrides, order: string[]): URLSearchParams {
  const next = new URLSearchParams(q);
  for (const [key, role] of [["with", "cabinet"], ["support", "support"], ["abstain", "abstain"]] as const) {
    const ids = order.filter((id) => roleOf(id, cabinet, overrides) === role);
    if (ids.length) next.set(key, ids.join(",")); else next.delete(key);
  }
  return next;
}

/** Initial investiture only. Combined poll groups crossing roles cannot be split without evidence. */
export function arrangement(cabinet: Set<string>, overrides: RoleOverrides, parties: Party[], poll: Poll) {
  const sets = Object.fromEntries(Object.keys(ROLE_LABELS).map((role) => [role, new Set(parties.filter((p) => roleOf(p.id, cabinet, overrides) === role).map((p) => p.id))])) as Record<SupportRole, Set<string>>;
  const totals = Object.fromEntries(Object.entries(sets).map(([role, ids]) => [role, tally(ids, parties, poll)])) as Record<SupportRole, ReturnType<typeof tally>>;
  const yes = Math.round((totals.cabinet.total + totals.support.total) * 10) / 10;
  const no = totals.opposition.total;
  const abstain = totals.abstain.total;
  const crossed = poll.combined.some((g) => new Set(g.parties.map((id) => roleOf(id, cabinet, overrides))).size > 1);
  const notReported = parties.filter((p) => (cabinet.has(p.id) || overrides[p.id]) && !poll.results[p.id] && !poll.combined.some((g) => g.parties.includes(p.id)));
  const represented = Math.round((yes + no + abstain) * 10) / 10;
  const approximate = [yes, no, abstain].some((n) => !Number.isInteger(n)) || poll.id === AVERAGE_ID;
  const complete = !crossed && !notReported.length && represented === 120 && !Object.values(totals).some((t) => t.partial);
  const outcome = totals.cabinet.total <= 0 ? "empty" : !complete ? "incomplete" : yes > no ? "passes" : "fails";
  return { yes, no, abstain, represented, approximate, complete, outcome, crossed, notReported, cabinet: totals.cabinet.total };
}

/** Only a recorded refusal to support (a rule marked `support`) is extended to outside support; cabinet refusals stay cabinet refusals. */
export function arrangementWarnings(cabinet: Set<string>, overrides: RoleOverrides, parties: Party[], rules: PledgeRule[]): Warning[] {
  return warningsWithSupport(cabinet, new Set(Object.keys(overrides).filter((id) => overrides[id] === "support")), parties, rules);
}

/** A counterfactual vote, not a prediction that any party will withdraw its backing. */
export function initialVoteDependence(cabinet: Set<string>, overrides: RoleOverrides, parties: Party[], poll: Poll): string[] {
  if (arrangement(cabinet, overrides, parties, poll).outcome !== "passes") return [];
  return parties.filter((p) => roleOf(p.id, cabinet, overrides) === "cabinet" || roleOf(p.id, cabinet, overrides) === "support").filter((p) => {
    const remaining = new Set(cabinet);
    remaining.delete(p.id);
    const otherRoles = { ...overrides };
    delete otherRoles[p.id];
    return arrangement(remaining, otherRoles, parties, poll).outcome !== "passes";
  }).map((p) => p.id);
}
