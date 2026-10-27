import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import type { BallotList } from "@/lib/ballot";
import type { NavGroup } from "@/lib/site";
import { editionPath,enPath,type Lang } from "@/lib/i18n";
import {referenceText} from "@/lib/i18n/reference";
import { readiness } from "@/lib/i18n/election-readiness";

export type ReadinessPhase = "campaign" | "exit" | "counting" | "official";
export function readinessPhase(context: SharedSeatContext | null, closed = false): ReadinessPhase {
  return context?.seatStatus === "official" ? "official" : context?.evidenceStage === "counting" ? "counting" : context?.evidenceStage === "exit" || closed ? "exit" : "campaign";
}
/** Match identity, never names or guessed ideology. Unmatched rows remain explicitly unknown. */
export function ballotSeat(context: SharedSeatContext | null, list: Pick<BallotList, "id" | "profile">): number | null {
  if (!context) return null;
  for (const id of [list.profile, list.id]) if (id && Object.hasOwn(context.pointSeats, id)) return context.pointSeats[id];
  return null;
}

export function phaseNavGroups(groups: readonly NavGroup[], phase: ReadinessPhase, lang: Lang): readonly NavGroup[] {
  if (phase === "campaign") return groups;
  const words = readiness(lang), order = phase === "official" ? ["/government", "/results"] : ["/results", "/government"];
  const rank = (href: string) => { const i = order.findIndex(p => href.endsWith(p)); return i < 0 ? 2 : i; };
  return groups.map(g => g.id !== "polls" ? g : { ...g, label: phase === "official" ? words.governmentResults : words.resultsNews, items: g.items.map(n=>n.href.endsWith("/results")?{...n,description:words.resultsNext}:n.href.endsWith("/government")?{...n,description:words.governmentNext}:n).sort((a, b) => rank(a.href) - rank(b.href)) });
}

export function referenceNavGroups(groups:readonly NavGroup[],lang:Lang):readonly NavGroup[]{
 const t=referenceText(lang),items=(["elections","parliament","policies","changes","reference"] as const).map(id=>({href:editionPath("/"+id,lang)!,label:t[id],description:id==="elections"?t.editionNote:id==="parliament"?t.allocationNote:id==="policies"?t.policyNote:t.evidence}));
 return groups.map(g=>{const existing=g.items.map(n=>{const path=enPath(n.href),local=editionPath(path,lang);return n.hrefLang==="en"&&local?{...n,href:local,hrefLang:undefined}:n});return {...g,items:g.id==="how"?[...existing,...items.filter(n=>!existing.some(e=>e.href===n.href))]:existing}});
}
