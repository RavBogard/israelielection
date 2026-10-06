import data from "@/data/journeys.json";
/** Teaching resources were dropped (2026-10-06), so the route that ended there is left out. */
export const journeys = { ...data, routes: data.routes.filter((r) => r.next !== "/teach") };
export type JourneyStep = (typeof data.steps)[keyof typeof data.steps];
export function journeyState(route: string | null, step: string | null) {
  const selected = journeys.routes.find((r) => r.id === route) ?? journeys.routes[0];
  const index = Number(step ?? "0");
  return { route: selected, index: Number.isInteger(index) && index >= 0 && index < selected.steps.length ? index : 0 };
}
