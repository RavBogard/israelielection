/** Only a known edition/date supplies a year; a future term number is not a year. */
export function electionChromeYear(
  path: string | null,
  election: string | null,
  unavailable: boolean,
): string | null {
  const edition = /\/(?:elections)\/(il-knesset-\d+)(?:\/|$)/.exec(
    path ?? "",
  )?.[1];
  if (edition) return edition === "il-knesset-26" ? "2026" : null;
  if (election === "il-knesset-26") return "2026";
  if (election && /^\d{4}-\d{2}-\d{2}$/.test(election))
    return election.slice(0, 4);
  return unavailable || election ? null : "2026";
}
