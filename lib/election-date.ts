export const ELECTION_DAY = "2026-10-27";
export function daysUntil(iso: string) {
  return Math.ceil(
    (Date.parse(`${iso}T00:00:00+02:00`) - Date.now()) / 86400000,
  );
}
