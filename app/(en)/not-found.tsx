import type { Metadata } from "next";
import Link from "next/link";
import { NAV } from "@/lib/site";
import PageHead from "@/components/PageHead";

export const metadata: Metadata = {
  title: "Not found",
};

const WANTED = ["/resources", "/search", "/start", "/polls", "/how-it-works", "/parties"];
const links = [{ href: "/", label: "The home page" }, ...WANTED.flatMap((h) => NAV.filter((n) => n.href === h))];

export default function NotFound() {
  return (
    <div className="wrap">
      <PageHead title="Not here." standfirst="That page is not on this site. It may have moved, or the address may have a typo." />
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
