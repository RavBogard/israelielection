export const ELECTION_DAY = "2026-10-27";

export function daysUntil(iso: string) {
  return Math.ceil((Date.parse(`${iso}T00:00:00+02:00`) - Date.now()) / 86_400_000);
}

/** One line in the masthead: how far away Election Day is. */
export default function Countdown({ className }: { className?: string }) {
  const d = daysUntil(ELECTION_DAY);
  const text =
    d > 1 ? (
      <>
        <b>{d} days</b> to Election Day, Tuesday, October 27
      </>
    ) : d === 1 ? (
      <>
        <b>Election Day is tomorrow</b>, Tuesday, October 27
      </>
    ) : d === 0 ? (
      <>
        <b>Election Day.</b> Polls close at 10 pm Israel time
      </>
    ) : (
      <>Israel voted on October 27, 2026</>
    );
  return <p className={`countdown${className ? ` ${className}` : ""}`}>{text}</p>;
}
