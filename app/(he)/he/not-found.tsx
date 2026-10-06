import type { Metadata } from "next";
import Link from "next/link";
import PageHead from "@/components/PageHead";

// A missing page under /he, in the Hebrew chrome. The English one is app/(en)/not-found.tsx.
export const metadata: Metadata = { title: "העמוד לא נמצא" };

const LINKS = [
  { href: "/he", label: "לעמוד הראשי" },
  { href: "/he/polls", label: "סקרים" },
  { href: "/he/coalition-builder", label: "מרכיבים קואליציה" },
  { href: "/he/compare", label: "השוואת עמדות" },
  { href: "/search", label: "חיפוש (באנגלית)", en: true },
];

export default function NotFound() {
  return (
    <div className="wrap">
      <PageHead title="אין כאן עמוד." standfirst="העמוד הזה לא קיים באתר. אולי הוא עבר, ואולי נפלה טעות בכתובת." />
      <ul>
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link href={l.href} hrefLang={l.en ? "en" : undefined}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
