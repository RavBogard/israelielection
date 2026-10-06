import { sourceAccess, sourceAccessLabels } from "@/lib/source-access";

const PAYWALL = "Subscription may be required";

/** A source's language note after its link. The subscription note is said once, under the list (see `paywalledOutlets`). */
export function AccessLabels({ url }: { url: string }) {
  const labels = sourceAccessLabels(url).filter((l) => l !== "English" && l !== PAYWALL);
  return labels.length ? <small className="source-access"> ({labels.join(", ")})</small> : null;
}

/** The outlets, in first-seen order, with at least one link on a known subscription pattern. */
export function paywalledOutlets(links: { url: string; outlet: string }[]): string[] {
  return [...new Set(links.filter((l) => sourceAccess(l.url).access).map((l) => l.outlet))];
}
