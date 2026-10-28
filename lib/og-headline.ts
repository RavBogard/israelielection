import { blocs } from "@/lib/data";
import { CHAMBER } from "@/lib/i18n/chamber";
import { blocText } from "@/lib/i18n/overlays";
import { blocOfList } from "@/lib/outgoing-seats";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";

const MAJORITY = 61;

/**
 * The share card's two-line headline, the home hero's own sentence (components/ChamberHero.tsx): "No bloc has 61 seats."
 * while that is true, else the bloc that has 61 or more. The last two words (the number and its unit) stay together on the second line.
 */
export function heroHeadline(context: Pick<SharedSeatContext, "pointSeats" | "parties">, lang: "en" | "he"): [string, string] {
  const named = new Map(context.parties.map((p) => [p.id, p])),
    seats: Record<string, number> = {};
  for (const [id, n] of Object.entries(context.pointSeats)) {
    const bloc = named.get(id)?.bloc ?? blocOfList[id] ?? "other";
    seats[bloc] = (seats[bloc] ?? 0) + n;
  }
  const leader = (["opp", "mid", "net"] as const).find((id) => (seats[id] ?? 0) >= MAJORITY);
  const t = CHAMBER[lang],
    block = blocs.find((b) => b.id === leader),
    text = leader && block ? t.hasMajority(blocText(block, lang).text, String(seats[leader])) : t.noMajority(String(MAJORITY)),
    words = text.split(" ");
  return words.length < 3 ? [text, ""] : [words.slice(0, -2).join(" "), words.slice(-2).join(" ")];
}
