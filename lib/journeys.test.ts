import { expect, it } from "vitest";
import { journeys, journeyState } from "./journeys";
it("validates shared route state and every question has an explanatory answer", () => {
  expect(journeyState("parties", "3").index).toBe(3);
  expect(journeyState("discussion", "0").route.id).toBe("five");
  expect(journeyState("missing", "100").route.id).toBe("five");
  expect(journeyState("five", "NaN").index).toBe(0);
  for (const route of journeys.routes) for (const key of route.steps) {
    const step = journeys.steps[key as keyof typeof journeys.steps];
    expect(step.options[step.answer]).toBeTruthy();
    expect(step.explanation.length).toBeGreaterThan(40);
    expect(step.href.startsWith("/")).toBe(true);
  }
});
