import type { Metadata } from "next";
import { Frank_Ruhl_Libre, Rubik } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const frank = Frank_Ruhl_Libre({ variable: "--font-frank", subsets: ["latin"], weight: ["500", "700", "900"] });
const rubik = Rubik({ variable: "--font-rubik", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://israelielection.org"),
  title: { default: "Israel Votes 2026", template: "%s · Israel Votes 2026" },
  description:
    "An English-language reference on Israel's October 27, 2026 election: the parties, the polls, the system, and how a government gets built. Every number dated and sourced.",
};

const NAV = [
  { href: "/parties", label: "Party Map" },
  { href: "/coalition", label: "Coalition Builder" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${frank.variable} ${rubik.variable}`}>
      <body className="min-h-screen flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:bg-surface focus:px-3 focus:py-2">
          Skip to content
        </a>
        <header className="border-b border-line bg-surface">
          <nav className="mx-auto flex max-w-[1840px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-[clamp(16px,2.5vw,40px)]">
            <Link href="/" className="font-display text-xl font-black text-ink no-underline">
              Israel Votes 2026
            </Link>
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[15px]">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="font-medium text-ink-2 hover:text-ink">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        <main id="main" className="flex-1">
          {children}
        </main>
        <footer className="border-t border-line px-4 py-6 text-sm text-ink-2 sm:px-[clamp(16px,2.5vw,40px)]">
          <div className="mx-auto max-w-[1840px]">
            Learning, not advocacy. Every number on this site carries its date and source.
          </div>
        </footer>
      </body>
    </html>
  );
}
