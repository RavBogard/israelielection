/**
 * The Knesset plenum as a half-circle of seats for the post-count home hero (Daniel, 2026-10-28, option C).
 * Seats run left to right across the hall; blocs are seated as in the plenum, the Netanyahu bloc on the right.
 */
export type ChamberSeat = { x: number; y: number; r: number };
export type ChamberParty = { id: string; bloc: string; seats: number };
export type PlacedSeat = ChamberSeat & { party: string; bloc: string; shade: number };

/** Left to right across the hall. Lists outside these blocs sit between the opposition and the Netanyahu bloc. */
export const HALL_ORDER = ["arab", "opp", "mid", "other", "net"] as const;

/** `total` seats on `rows` concentric arcs, each arc's share proportional to its radius, sorted left to right. */
export function chamberLayout(total = 120, rows = 7, inner = 120, outer = 296, cx = 310, cy = 318): ChamberSeat[] {
  const radii = Array.from({ length: rows }, (_, i) => inner + (i * (outer - inner)) / (rows - 1));
  const sum = radii.reduce((a, r) => a + r, 0);
  const counts = radii.map((r) => Math.round((total * r) / sum));
  counts[rows - 1] += total - counts.reduce((a, c) => a + c, 0);
  const dot = ((outer - inner) / (rows - 1)) * 0.4;
  const seats: (ChamberSeat & { a: number; ring: number })[] = [];
  radii.forEach((ring, i) => {
    for (let k = 0; k < counts[i]; k++) {
      const a = Math.PI * (1 - (k + 0.5) / counts[i]);
      seats.push({ x: cx + ring * Math.cos(a), y: cy - ring * Math.sin(a), r: dot, a, ring });
    }
  });
  // Left to right by angle; inner rows first where angles tie, so each bloc fills a wedge.
  seats.sort((p, q) => q.a - p.a || p.ring - q.ring);
  return seats.map(({ x, y, r }) => ({ x, y, r }));
}

/**
 * Lists to seats: blocs in hall order, each bloc's lists largest first from its outer edge (the Netanyahu bloc's
 * largest list at the far right). `shade` is the list's step on its bloc's ramp, as a percentage of the bloc colour:
 * the largest list 100, the smallest 48 (Daniel, 2026-10-28), so lists stay apart and the bloc still reads as one.
 */
export const shadeOf = (rank: number, count: number) => (count > 1 ? Math.round(100 - (rank * 52) / (count - 1)) : 100);

export function seatParties(layout: ChamberSeat[], parties: ChamberParty[]): PlacedSeat[] {
  const rank = (b: string) => { const i = HALL_ORDER.indexOf(b as (typeof HALL_ORDER)[number]); return i < 0 ? HALL_ORDER.indexOf("other") : i; };
  const order: { party: string; bloc: string; shade: number }[] = [];
  const blocIds = [...new Set(parties.filter((p) => p.seats > 0).map((p) => p.bloc))].sort((a, b) => rank(a) - rank(b));
  for (const bloc of blocIds) {
    const lists = parties.filter((p) => p.bloc === bloc && p.seats > 0).sort((a, b) => b.seats - a.seats || a.id.localeCompare(b.id));
    // Blocs right of centre run their largest list outward (rightmost); the rest run it outward on the left.
    const seq = rank(bloc) >= HALL_ORDER.indexOf("net") ? [...lists].reverse() : lists;
    seq.forEach((p) => { const shade = shadeOf(lists.indexOf(p), lists.length); for (let k = 0; k < p.seats; k++) order.push({ party: p.id, bloc, shade }); });
  }
  return layout.slice(0, order.length).map((s, i) => ({ ...s, ...order[i] }));
}
