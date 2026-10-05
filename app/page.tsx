import Link from "next/link";
import { dataUpdated, mainPolls } from "@/lib/data";
import { mediumDate } from "@/lib/format";

const ELECTION = "2026-10-27";

function daysUntil(iso: string) {
  const ms = Date.parse(`${iso}T00:00:00+02:00`) - Date.now();
  return Math.ceil(ms / 86_400_000);
}

export const revalidate = 3600;

export default function Home() {
  const days = daysUntil(ELECTION);
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-8 sm:py-14">
      <p className="text-sm font-semibold uppercase tracking-[.08em] text-ink-2">
        Election Day: Tuesday, October 27, 2026{days > 0 ? ` · ${days} day${days === 1 ? "" : "s"} away` : ""}
      </p>
      <h1 className="mt-3 font-display text-[clamp(38px,5vw,64px)] font-black leading-[1.02] text-balance">
        Israel votes. Here is how to follow it.
      </h1>
      <p className="mt-4 max-w-[62ch] text-lg text-ink-2">
        An English-language reference on the 2026 Knesset election for American readers and for the rabbis and educators who teach it.
        Learning, not advocacy: every number is dated and sourced.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-display text-3xl font-black">Understand it</h2>
          <p className="mt-2 text-ink-2">The parties, the polls, and the arithmetic of a 61-seat majority.</p>
          <ul className="mt-5 flex flex-col gap-4">
            <li>
              <Link href="/parties" className="text-lg font-semibold text-accent underline-offset-4 hover:underline">
                The Party Map →
              </Link>
              <p className="text-[15px] text-ink-2">
                Every list sized by its poll average, grouped by bloc, with who they are, who votes for them, and where they stand on six
                issues.
              </p>
            </li>
            <li>
              <Link href="/coalition" className="text-lg font-semibold text-accent underline-offset-4 hover:underline">
                Build a Coalition →
              </Link>
              <p className="text-[15px] text-ink-2">
                Pick a poll, add parties, and see whether they reach 61, and which recorded pledges your coalition would break.
              </p>
            </li>
          </ul>
        </section>
        <section className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-display text-3xl font-black">Teach it</h2>
          <p className="mt-2 text-ink-2">Class materials for educators and rabbinic colleagues: decks, source sheets, discussion guides.</p>
          <p className="mt-5 text-[15px] text-ink-3">In preparation. The interactives on the left can be used in a class today.</p>
        </section>
      </div>

      <p className="mt-10 text-sm text-ink-3">
        Poll data last updated {mediumDate(dataUpdated)}, from {mainPolls.length} polls ({mainPolls.map((p) => p.pollster).join(", ")}).
      </p>
    </div>
  );
}
