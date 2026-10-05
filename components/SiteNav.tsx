"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/site";

/** Site navigation; the current section is underlined. */
export default function SiteNav() {
  const path = usePathname();
  const current = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));
  return (
    <nav aria-label="Site">
      <ul className="site-nav">
        {NAV.map((n) => (
          <li key={n.href}>
            <Link href={n.href} aria-current={current(n.href) ? "page" : undefined}>
              {n.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
