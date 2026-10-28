import { describe, expect, it } from "vitest";
import { heroHeadline } from "./og-headline";

const parties = [
  { id: "likud", label: "Likud", profiled: true, bloc: "net" },
  { id: "yashar", label: "Yashar", profiled: true, bloc: "opp" },
  { id: "jl", label: "Joint List", profiled: true, bloc: "arab" },
];
const ctx = (net: number, opp: number) => ({ pointSeats: { likud: net, yashar: opp, jl: 120 - net - opp }, parties });

describe("share card headline", () => {
  it("says no bloc has 61 while that is true, in both editions", () => {
    expect(heroHeadline(ctx(53, 49), "en").join(" ")).toBe("No bloc has 61 seats.");
    expect(heroHeadline(ctx(53, 49), "he").join(" ")).toContain("61");
  });
  it("names the bloc once one reaches 61, and never counts the Arab lists as a leader", () => {
    expect(heroHeadline(ctx(62, 40), "en")[1]).toBe("62 seats.");
    expect(heroHeadline({ pointSeats: { jl: 100 }, parties }, "en").join(" ")).toBe("No bloc has 61 seats.");
  });
});
