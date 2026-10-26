import fs from "node:fs";
import {
  averageAsPoll,
  currentPolls,
  withoutVariantPolls,
} from "../../lib/polls";
import type { Poll } from "../../lib/types";
import { fingerprint, POLLS_CLOSE } from "../../lib/election-lifecycle/core";
const path = "data/election-lifecycle-campaign.json";
if (fs.existsSync(path))
  throw new Error(
    "Frozen campaign record already exists; create an explicitly versioned replacement before close.",
  );
if (Date.now() >= Date.parse(POLLS_CLOSE))
  throw new Error("Cannot create a new campaign registration after close.");
const read = (p: string) => JSON.parse(fs.readFileSync(p, "utf8"));
const parties = read("data/parties.json"),
  pollFile = read("data/polls.json"),
  forecast = read("data/forecast.json"),
  v2 = read("data/forecast-v2.json");
const field = currentPolls(
  (pollFile.polls as Poll[]).filter(
    (p) =>
      p.kind !== "exit" && Date.parse(p.published) < Date.parse(POLLS_CLOSE),
  ),
  pollFile.config,
);
const averages = [
  ["average", field],
  ["average_without_checks", withoutVariantPolls(field, pollFile.config)],
] as const;
const out = {
  version: 1,
  capturedAt: new Date().toISOString(),
  note: "Immutable saved pre-close campaign records; final:false predictions remain provisional, not retrospectively registered.",
  partyBlocs: Object.fromEntries(
    parties.parties.map((p: { id: string; bloc: string }) => [p.id, p.bloc]),
  ),
  forecast,
  v2,
  averages: averages.map(([label, polls]) => {
    const poll = averageAsPoll(
      polls,
      parties.parties.map((p: { id: string }) => p.id),
    );
    return { label, poll, sourceHash: fingerprint(polls) };
  }),
};
fs.writeFileSync(path, JSON.stringify(out, null, 2) + "\n");
console.log("Frozen campaign comparators; original forecast bytes unchanged.");
