import { describe, expect, it } from "vitest";
import { workerDestinations } from "./auth";

describe("workerDestinations", () => {
  it("adds only the same path on the new domain while the configured address names the old one", () => {
    expect(workerDestinations("https://www.israelielection.org/api/live-forecast/worker")).toEqual([
      "https://www.israelielection.org/api/live-forecast/worker",
      "https://www.israelvotes.org/api/live-forecast/worker",
    ]);
  });
  it("leaves any other configured address alone", () => {
    expect(workerDestinations("https://www.israelvotes.org/api/x")).toEqual(["https://www.israelvotes.org/api/x"]);
    expect(workerDestinations("https://israelielection-git-x.vercel.app/api/x")).toEqual(["https://israelielection-git-x.vercel.app/api/x"]);
    expect(workerDestinations("https://israelielection.org.evil.test/api/x")).toEqual(["https://israelielection.org.evil.test/api/x"]);
    expect(workerDestinations(undefined)).toEqual([]);
  });
});
