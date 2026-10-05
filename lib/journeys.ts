import data from "@/data/journeys.json";
export const journeys = data;
export type JourneyStep = (typeof data.steps)[keyof typeof data.steps];
export function journeyState(route: string | null, step: string | null) {
  const selected = data.routes.find((r) => r.id === route) ?? data.routes[0];
  const index = Number(step ?? "0");
  return { route: selected, index: Number.isInteger(index) && index >= 0 && index < selected.steps.length ? index : 0 };
}
