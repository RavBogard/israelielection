import { parties } from "./data";
import { partyText } from "./i18n/overlays";
import type { Lang } from "./i18n";
import { resolveSeatSelection } from "./seat-selection";
/** Cards preserve the complete selected role hypothesis and the immutable seat revision. */
export async function builderCardSelection(
  q: Record<string, string | string[] | undefined>,
  lang: Lang,
) {
  const params = new URLSearchParams();
  for (const key of ["with", "poll", "context", "support", "abstain"])
    if (typeof q[key] === "string") params.set(key, q[key]);
  const selected = await resolveSeatSelection(params),
    context = selected?.context;
  const ids = (params.get("with") ?? "")
    .split(",")
    .filter(
      (id) =>
        parties.some((p) => p.id === id) ||
        (!!context && id in context.pointSeats),
    );
  const names = ids.map((id) => {
    const party = parties.find((p) => p.id === id);
    return party
      ? partyText(party, "name", lang).text
      : (context?.parties.find((p) => p.id === id)?.label ?? id);
  });
  params.set("with", ids.join(","));
  if (context) {
    params.set("context", context.revision);
    params.set("poll", "current");
  }
  return { ids: selected ? ids : [], names, card: `/api/card?${params}` };
}
