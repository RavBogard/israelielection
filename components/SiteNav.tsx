"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { NAV_GROUPS, TEACH } from "@/lib/site";

/**
 * The menu: three groups by what the reader is doing, and Teach it apart. On wide screens the
 * groups sit in the masthead's second row; on phones a Menu button opens a sheet. `extra` is
 * the countdown, shown in the sheet on phones (the masthead shows it on wide screens).
 */
export default function SiteNav({ extra }: { extra?: ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const current = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));

  // Close on navigation and on Escape; keep the page still while the sheet is open.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the route changed under an open sheet
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <nav className="menu" aria-label="Site">
      <button type="button" className="menu-btn" aria-expanded={open} aria-controls="menu-sheet" onClick={() => setOpen((o) => !o)}>
        {open ? "Close" : "Menu"}
      </button>
      <div id="menu-sheet" className={`menu-sheet${open ? " open" : ""}`}>
        {NAV_GROUPS.map((g) => (
          <div className="grp" key={g.label}>
            <span className="glbl">{g.label}</span>
            <ul>
              {g.items.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} aria-current={current(n.href) ? "page" : undefined}>
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="grp teach">
          <ul>
            <li>
              <Link href={TEACH.href} aria-current={current(TEACH.href) ? "page" : undefined}>
                {TEACH.label}
              </Link>
            </li>
          </ul>
        </div>
        {extra && <div className="sheet-extra">{extra}</div>}
      </div>
    </nav>
  );
}
