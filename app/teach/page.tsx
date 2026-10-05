import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Teach it",
  description: "Class materials on Israel's 2026 election for educators and rabbinic colleagues: decks, source sheets, discussion guides.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-8 sm:py-14">
      <h1 className="font-display text-[clamp(38px,5vw,60px)] font-black leading-[1.02] text-balance">Teach it</h1>
      <p className="mt-4 max-w-[62ch] text-lg text-ink-2">
        Materials for educators and rabbinic colleagues teaching the 2026 Knesset election: session decks, source sheets, teacher&apos;s
        guides and discussion questions. Learning, not advocacy: every number is dated and sourced.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-display text-3xl font-black">Use in class today</h2>
          <p className="mt-2 text-ink-2">The interactives work on a projector or on students&apos; phones.</p>
          <ul className="mt-5 flex flex-col gap-4">
            <li>
              <Link href="/" className="text-lg font-semibold text-accent underline-offset-4 hover:underline">
                Build a Coalition →
              </Link>
              <p className="text-[15px] text-ink-2">
                Pick a poll, add parties, and see whether they reach 61, and which recorded pledges the coalition would break. Use
                &ldquo;Copy link to this coalition&rdquo; to hand a scenario to the room.
              </p>
            </li>
            <li>
              <Link href="/parties" className="text-lg font-semibold text-accent underline-offset-4 hover:underline">
                The Party Map →
              </Link>
              <p className="text-[15px] text-ink-2">
                Every list sized by its poll average, grouped by bloc, with who they are, who votes for them, and where they stand on six
                issues. Each party also has its own page to link to.
              </p>
            </li>
          </ul>
        </section>
        <section className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-display text-3xl font-black">Session materials</h2>
          <p className="mt-2 text-ink-2">Decks, source sheets, teacher&apos;s guides and discussion questions, session by session.</p>
          <p className="mt-5 text-[15px] text-ink-3">In preparation.</p>
        </section>
      </div>

      <p className="mt-10 max-w-[70ch] text-[15px] text-ink-2">
        The teaching materials on this site are licensed under{" "}
        <a href="https://creativecommons.org/licenses/by-nc/4.0/" rel="license" className="font-semibold text-accent underline-offset-4 hover:underline">
          Creative Commons Attribution-NonCommercial 4.0
        </a>
        : share and adapt them for non-commercial teaching, with credit to Rabbi Daniel Bogard and a link to israelielection.org.
      </p>
    </div>
  );
}
