import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import captured from "./fixtures/cec25-final.json";
import history from "../../public/vote-map/2022.json";
import { parseOfficialSeats } from "./official";
it("parses an actual captured CEC25 raw HTML response with all40 lists,120 seats and published votes", () => {
  const raw = readFileSync(
    new URL("./fixtures/cec25-final-raw.html", import.meta.url),
    "utf8",
  );
  const result = parseOfficialSeats(raw, {
    election: "2022-11-01",
    knesset: 25,
    dateMarkers: ["1 בנובמבר 2022"],
    now: "2026-10-26T18:00Z",
    url: "https://votes25.bechirot.gov.il/nationalresults",
    letters: { מחל: "likud" },
  });
  expect(result.parties).toHaveLength(40);
  expect(result.pointSeats.likud).toBe(32);
  expect(Object.values(result.pointSeats).reduce((a, b) => a + b, 0)).toBe(120);
  expect(result.officialVotes?.valid).toBeGreaterThan(4_000_000);
});
it("accepts normalized real historical CEC final-table values and rejects that historical publication for the current election", () => {
  const options = {
    election: "2022-11-01",
    knesset: 25,
    dateMarkers: ["1 בנובמבר 2022"],
    now: "2022-11-15T12:00Z",
    url: captured.source,
    letters: Object.fromEntries(
      history.lists.map((p, i) => [p.letters, `historic-${i}`]),
    ),
  };
  const actual = parseOfficialSeats(captured.html, options);
  expect(Object.values(actual.pointSeats).reduce((a, b) => a + b, 0)).toBe(120);
  expect(actual.pointSeats["historic-0"]).toBe(32);
  expect(() =>
    parseOfficialSeats(captured.html, {
      ...options,
      election: "2026-10-27",
      now: "2026-11-05T12:00Z",
      knesset: 26,
      dateMarkers: ["27 באוקטובר 2026"],
    }),
  ).toThrow("wrong_election");
});
