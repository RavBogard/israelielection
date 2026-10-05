import results from "@/data/results.json";

/** Party id → the Hebrew letters printed on its ballot slip, from the committee's list in data/results.json. */
export const lettersOf: Record<string, string> = Object.fromEntries(
  Object.entries(results.letters as Record<string, string>).map(([letters, id]) => [id, letters])
);
