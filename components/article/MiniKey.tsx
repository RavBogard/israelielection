"use client";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

export type MiniKeyItem = { n: number; label: string; seats: string; color: string; ink: string };

/**
 * A bar whose narrow segments hide their numbers (sb-fit), with a one-line key under it naming each
 * hidden one. Which are hidden depends on the bar's width, so it is read from the rendered labels.
 * `items` follow the bar's segments in order.
 */
export default function MiniKey({ items, children }: { items: MiniKeyItem[]; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState<number[]>([]);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const bs = [...el.querySelectorAll<HTMLElement>(".sb-seg > b")];
      const next = bs.flatMap((b, i) => (getComputedStyle(b).visibility === "hidden" ? [i] : []));
      setHidden((h) => (h.join() === next.join() ? h : next));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const shown = hidden.map((i) => items[i]).filter(Boolean);
  return (
    <>
      <div ref={ref}>{children}</div>
      {shown.length > 0 && (
        <p className="ps-mini-key">
          {shown.map((it) => (
            <span key={it.n}>
              <span className="k" style={{ background: it.color, color: it.ink }} aria-hidden>{it.n}</span>
              {it.label}, {it.seats}
            </span>
          ))}
        </p>
      )}
    </>
  );
}
