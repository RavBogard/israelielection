"use client";
import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import chrome from "@/lib/i18n/chrome";

/**
 * The bloc rule: the three blocs in fixed proportions (15, 46 and 59 of 120, not any election's result) with a
 * notch at the 61st seat. Drawn in the bloc tokens, so it follows light and dark.
 */
function Rule({ className }: { className?: string }) {
  return (
    <span className={className ?? "np-rule"} aria-hidden="true">
      <i style={{ background: "var(--b-arab)" }} />
      <i style={{ background: "var(--b-opp)" }} />
      <i className="np-notch" />
      <i style={{ background: "var(--b-net)" }} />
    </span>
  );
}

/**
 * The icon (Daniel, 2026-10-28, icon C): 61, the number the site turns on, standing on the notched bloc rule inside
 * a ballot-slip border. Used where the full nameplate does not fit; the favicon and app icons are drawn from it.
 */
export function Mark({ className, title }: { className?: string; title?: string; rtl?: boolean }) {
  const x0 = 7, u = 26 / 120;
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden={title ? undefined : true} role={title ? "img" : undefined} focusable="false">
      {title && <title>{title}</title>}
      <rect x="3.5" y="3.5" width="33" height="33" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <text x="20" y="27.5" textAnchor="middle" fontFamily="var(--display)" fontWeight="900" fontSize="23" fill="currentColor">61</text>
      <rect x={x0} y="29" width={15 * u - 0.5} height="3.6" style={{ fill: "var(--b-arab)" }} />
      <rect x={x0 + 15 * u + 0.5} y="29" width={46 * u - 1} height="3.6" style={{ fill: "var(--b-opp)" }} />
      <rect x={x0 + 61 * u + 0.5} y="29" width={59 * u - 0.5} height="3.6" style={{ fill: "var(--b-net)" }} />
      <rect x={x0 + 61 * u - 0.75} y="29" width="1.5" height="6.6" fill="currentColor" />
    </svg>
  );
}

/**
 * The nameplate (Daniel, 2026-10-28, option 7): "Israel Votes" standing on the bloc rule, ישראל בוחרת hanging from
 * its right end, inside a ballot-slip border. The same mark in every edition; edition names stay in titles and text.
 */
export default function Logo({ className, lang = "en" }: { className?: string; lang?: Lang }) {
  return (
    <Link
      href={lang === "en" ? "/" : `/${lang}`}
      className={`brand${className ? ` ${className}` : ""}`}
      aria-label={lang === "en" ? "Israel Votes, home" : chrome[lang].homeLabel}
    >
      <span className="nameplate" dir="ltr">
        <span className="np-en" lang="en">Israel Votes</span>
        <Rule />
        <span className="np-he" lang="he" dir="rtl">ישראל בוחרת</span>
      </span>
    </Link>
  );
}
