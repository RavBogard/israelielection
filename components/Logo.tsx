import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import chrome from "@/lib/i18n/chrome";

/**
 * The mark: 120 seats as a grid of 12 by 10, the first 61 filled. The shape of a majority,
 * which is what every page on the site is about. The filled seats are drawn as one solid
 * shape so the mark stays crisp at favicon size; the other 59 are faint cells behind it.
 * Drawn in currentColor, so it reads in light and dark and on any bloc colour.
 */
export function Mark({ className, title, rtl = false }: { className?: string; title?: string; /** Fill from the top right (the Hebrew edition's reading order). */ rtl?: boolean }) {
  const cells = [];
  for (let i = 61; i < 120; i++) {
    const x = (i % 12) * 12 + 1, y = Math.floor(i / 12) * 12 + 1;
    cells.push(<rect key={i} x={x} y={y} width={10} height={10} fill="currentColor" opacity={0.18} />);
  }
  return (
    <svg viewBox="0 0 144 120" className={className} aria-hidden={title ? undefined : true} role={title ? "img" : undefined} focusable="false">
      {title && <title>{title}</title>}
      {rtl ? (
        <g transform="matrix(-1 0 0 1 144 0)">
          {cells}
          <path d="M1 1h142v58H11v12H1z" fill="currentColor" />
        </g>
      ) : (
        <>
          {cells}
          <path d="M1 1h142v58H11v12H1z" fill="currentColor" />
        </>
      )}
    </svg>
  );
}

/** Mark + wordmark, linking home. The Hebrew wordmark is פתק 2026, its mark filling from the right. */
export default function Logo({ className, lang = "en" }: { className?: string; lang?: Lang }) {
  if (lang === "he")
    return (
      <Link href="/he" className={`brand${className ? ` ${className}` : ""}`} aria-label={chrome.he.homeLabel}>
        <Mark className="mark" rtl />
        <span className="word">
          פתק <span className="yr">2026</span>
        </span>
      </Link>
    );
  return (
    <Link href="/" className={`brand${className ? ` ${className}` : ""}`} aria-label="Israel Votes 2026, home">
      <Mark className="mark" />
      <span className="word">
        Israel Votes <span className="yr">2026</span>
      </span>
    </Link>
  );
}
