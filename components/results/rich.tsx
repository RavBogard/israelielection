import Link from "next/link";
import type { ReactNode } from "react";
import { hePath, type Lang } from "@/lib/i18n";

/**
 * Draws a lib/i18n/results.ts string: plain text with links written [text](href). Internal hrefs are written in their
 * English form; the Hebrew edition maps them to its own page when there is one, else links the English page, marked hrefLang.
 */
export function rich(s: string, lang: Lang): ReactNode {
  const parts = s.split(/(\[[^\]]+\]\([^)]+\))/);
  if (parts.length === 1) return s;
  return parts.map((part, i) => {
    const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (!m) return part;
    const [, text, href] = m;
    if (!href.startsWith("/")) return <a key={i} href={href}>{text}</a>;
    if (lang === "en") return <Link key={i} href={href}>{text}</Link>;
    const he = hePath(href);
    return he ? <Link key={i} href={he}>{text}</Link> : <Link key={i} href={href} hrefLang="en">{text}</Link>;
  });
}

/** An internal link's address in the given edition: "/parties/likud" → "/he/parties/likud" in Hebrew. */
export const edHref = (href: string, lang: Lang) => (lang === "he" ? (hePath(href) ?? href) : href);
