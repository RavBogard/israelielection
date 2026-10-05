import Link from "next/link";

/**
 * The mark: a paper ballot slip (the petek every Israeli voter drops into the envelope) going
 * into the slot of the ballot box. The two printed bars stand for the list's letters and its
 * name, with no letters shown, so no list is favoured. Ink is `currentColor`; the slip is the
 * surface colour, so it reads in light and dark.
 */
export function Mark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden={title ? undefined : true} role={title ? "img" : undefined} focusable="false">
      {title && <title>{title}</title>}
      <defs>
        <clipPath id="slip-clip">
          <rect x="0" y="0" width="32" height="26" />
        </clipPath>
      </defs>
      <g clipPath="url(#slip-clip)" transform="rotate(-7 16 15)">
        <rect x="9.5" y="3.5" width="13" height="25" fill="var(--surface, #fff)" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <rect x="12.5" y="8" width="7" height="3.4" fill="currentColor" />
        <rect x="12.5" y="14.2" width="7" height="1.4" fill="currentColor" />
        <rect x="12.5" y="17.4" width="4.6" height="1.4" fill="currentColor" />
      </g>
      <rect x="4" y="25.6" width="24" height="2.8" rx="1" fill="currentColor" />
    </svg>
  );
}

/** Mark + wordmark, linking home. */
export default function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`brand${className ? ` ${className}` : ""}`} aria-label="Israel Votes 2026, home">
      <Mark className="mark" />
      <span className="word">
        Israel Votes<em>2026</em>
      </span>
    </Link>
  );
}
