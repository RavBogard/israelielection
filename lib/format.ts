const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026-10-02" → "Oct 2" */
export function shortDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

/** "2026-10-02" → "Oct 2, 2026" */
export function mediumDate(iso: string): string {
  return `${shortDate(iso)}, ${iso.slice(0, 4)}`;
}

/** "2026-10-02" → "October 2, 2026" */
export function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${LONG[m - 1]} ${d}, ${y}`;
}

/** Rounds to at most two decimals, dropping trailing zeros. */
export function fmt(x: number): string {
  return (Math.round(x * 100) / 100).toString();
}
