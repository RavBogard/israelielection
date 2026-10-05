export type Item = { id: string; v: number };
export type Rect<T extends Item = Item> = T & { x: number; y: number; w: number; h: number };

/** Squarified treemap (Bruls et al.), as in Party Map v2. Items should be sorted largest first. */
export function squarify<T extends Item>(items: T[], x: number, y: number, w: number, h: number): Rect<T>[] {
  const out: Rect<T>[] = [];
  const total = items.reduce((a, b) => a + b.v, 0);
  if (!total) return out;
  const scale = (w * h) / total;
  let rest = items.map((i) => ({ ...i, a: i.v * scale }));
  while (rest.length) {
    const short = Math.min(w, h);
    const worst = (r: typeof rest) => {
      const s = r.reduce((a, b) => a + b.a, 0);
      const mx = Math.max(...r.map((z) => z.a));
      const mn = Math.min(...r.map((z) => z.a));
      return Math.max((short * short * mx) / (s * s), (s * s) / (short * short * mn));
    };
    const row = [rest[0]];
    let i = 1;
    while (i < rest.length && worst([...row, rest[i]]) <= worst(row)) row.push(rest[i++]);
    const s = row.reduce((a, b) => a + b.a, 0);
    if (w >= h) {
      const cw = s / h;
      let cy = y;
      for (const { a, ...r } of row) {
        const ch = a / cw;
        out.push({ ...(r as unknown as T), x, y: cy, w: cw, h: ch });
        cy += ch;
      }
      x += cw;
      w -= cw;
    } else {
      const ch = s / w;
      let cx = x;
      for (const { a, ...r } of row) {
        const cw2 = a / ch;
        out.push({ ...(r as unknown as T), x: cx, y, w: cw2, h: ch });
        cx += cw2;
      }
      y += ch;
      h -= ch;
    }
    rest = rest.slice(i);
  }
  return out;
}
