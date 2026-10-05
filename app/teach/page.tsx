import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import teach from "@/data/teach.json";

export const metadata: Metadata = {
  title: "Teach it",
  description: "Class materials on Israel's 2026 election for educators and rabbinic colleagues: decks, source sheets, discussion guides.",
};

const DATE = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

export default function Page() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-8 sm:py-14">
      <h1 className="font-display text-[clamp(38px,5vw,60px)] font-bold leading-[1.02] tracking-[-0.015em] text-balance">Teach it</h1>
      <p className="mt-4 max-w-[62ch] font-serif text-lg text-ink-2">
        Materials for educators and rabbinic colleagues teaching the 2026 Knesset election: session decks, source sheets, teacher&apos;s
        guides and discussion questions. Every number is dated and sourced.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className="rounded-[4px] border border-line-2 bg-surface p-6 shadow-[0_1px_0_var(--paper-shadow)] md:col-span-2">
          <h2 className="font-display text-3xl font-bold">Session materials</h2>
          <p className="mt-2 text-ink-2">Slide decks with speaker notes, session by session. More sessions will be added as they are taught.</p>
          <ol className="mt-6 flex flex-col gap-8">
            {teach.sessions.map((s) => (
              <li key={s.n} className="grid gap-5 border-t border-line pt-6 sm:grid-cols-[minmax(0,280px)_1fr]">
                <a href={s.files.find((f) => f.href.endsWith(".pdf"))?.href} aria-label={`Session ${s.n} slides (PDF)`}>
                  <Image src={s.cover} alt={`Cover slide of Session ${s.n}`} width={720} height={405} className="h-auto w-full border border-line-2" />
                </a>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
                    Session {s.n} · taught {DATE.format(new Date(s.taught))} · {s.slides} slides
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-bold">{s.title}</h3>
                  <p className="mt-2 max-w-[62ch] font-serif text-ink-2">{s.description} {s.asOf}</p>
                  <ul className="mt-4 flex flex-col gap-2">
                    {s.files.map((f) => (
                      <li key={f.href}>
                        <a href={f.href} download className="text-lg font-semibold text-accent underline-offset-4 hover:underline">
                          {f.label} ↓
                        </a>
                        <span className="text-[15px] text-ink-3">
                          {" "}
                          {f.note} · {f.size}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 max-w-[62ch] text-[14px] text-ink-3">{s.fonts}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded-[4px] border border-line-2 bg-surface p-6 shadow-[0_1px_0_var(--paper-shadow)] md:col-span-2">
          <h2 className="font-display text-3xl font-bold">Use in class today</h2>
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
