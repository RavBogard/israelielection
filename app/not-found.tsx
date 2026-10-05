import type { Metadata } from "next";
import Link from "next/link";
import { NAV, TEACH } from "@/lib/site";

export const metadata: Metadata = {
  title: "Not found",
};

const WANTED = ["/resources", "/search", "/start", "/polls", "/how-it-works", "/parties"];
const links = [{ href: "/", label: "The home page" }, ...WANTED.flatMap((h) => NAV.filter((n) => n.href === h)), TEACH];

export default function NotFound() {
  return (
    <div className="wrap">
      <header className="page-head">
        <h1>Not here.</h1>
        <p className="standfirst">That page is not on this site. It may have moved, or the address may have a typo.</p>
      </header>
      <ul>
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
