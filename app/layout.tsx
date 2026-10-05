import type { Metadata } from "next";
import { Frank_Ruhl_Libre, Source_Sans_3, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import Banner from "@/components/Banner";
import Logo from "@/components/Logo";
import SiteNav from "@/components/SiteNav";
import { DESCRIPTION, NAV } from "@/lib/site";
import "./globals.css";

// Frank Ruhl Libre is the Latin companion of Frank-Rühl, the face Hebrew newspapers have been
// set in since 1910: headlines and the big seat numbers. Source Serif carries the prose;
// Source Sans, its sibling, carries labels, tables and controls.
const frank = Frank_Ruhl_Libre({ variable: "--font-frank", subsets: ["latin"], weight: ["500", "700", "900"] });
const serif = Source_Serif_4({ variable: "--font-serif", subsets: ["latin"], weight: ["400", "600"], style: ["normal", "italic"] });
const sans = Source_Sans_3({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.israelielection.org"),
  title: { default: "Israel Votes 2026", template: "%s · Israel Votes 2026" },
  description: DESCRIPTION,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${frank.variable} ${serif.variable} ${sans.variable}`}>
      <body className="min-h-screen flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:bg-surface focus:px-3 focus:py-2">
          Skip to content
        </a>
        <header className="site-head">
          <div className="row">
            <Logo />
            <SiteNav />
          </div>
        </header>
        <Banner />
        <main id="main" className="flex-1">
          {children}
        </main>
        <footer className="site-foot">
          <div className="row">
            <div>
              <Logo />
              <div className="cred">
                <p>{DESCRIPTION}</p>
                <p>
                  A project of <a href="https://danielbogard.com">Rabbi Daniel Bogard</a>.
                </p>
                <p>
                  Teaching materials:{" "}
                  <a href="https://creativecommons.org/licenses/by-nc/4.0/" rel="license">
                    CC BY-NC 4.0
                  </a>
                </p>
              </div>
            </div>
            <div className="cols">
              <div>
                <p className="eyebrow">Understand it</p>
                <ul>
                  {NAV.filter((n) => n.href !== "/teach").map((n) => (
                    <li key={n.href}>
                      <Link href={n.href}>{n.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="eyebrow">Teach it</p>
                <ul>
                  <li>
                    <Link href="/teach">Class materials</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
