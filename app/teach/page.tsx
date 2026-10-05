import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "@/components/interactives.css";
import "@/components/teach.css";
import teach from "@/data/teach.json";

export const metadata: Metadata = {
  title: "Teach it",
  description: "Class materials on Israel's 2026 election for educators and rabbinic colleagues: decks, source sheets, discussion guides.",
};

const DATE = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

export default function Page() {
  return (
    <div className="ix th">
      <div className="wrap">
        <header className="page-head">
          <h1>Teach it</h1>
          <p className="standfirst">
            Materials for educators and rabbinic colleagues teaching the 2026 Knesset election: session decks, source sheets, teacher&apos;s guides and
            discussion questions. Every number is dated and sourced.
          </p>
        </header>

        <h2 className="sec-h">Session materials</h2>
        <p className="note">Slide decks with speaker notes, session by session. More sessions will be added as they are taught.</p>
        <ol className="sessions">
          {teach.sessions.map((s) => (
            <li key={s.n} className="session">
              <a href={s.files.find((f) => f.href.endsWith(".pdf"))?.href} aria-label={`Session ${s.n} slides (PDF)`} className="cover">
                <Image src={s.cover} alt={`Cover slide of Session ${s.n}`} width={720} height={405} />
              </a>
              <div>
                <p className="lbl">
                  Session {s.n}, taught {DATE.format(new Date(s.taught))}. {s.slides} slides.
                </p>
                <h3>{s.title}</h3>
                <p className="desc">
                  {s.description} {s.asOf}
                </p>
                <ul className="files">
                  {s.files.map((f) => (
                    <li key={f.href}>
                      <a href={f.href} download className="btn">
                        {f.label}
                      </a>
                      <span>
                        {f.note}, {f.size}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="src">{s.fonts}</p>
              </div>
            </li>
          ))}
        </ol>

        <h2 className="sec-h">Use in class today</h2>
        <p className="note">The interactives work on a projector or on students&apos; phones.</p>
        <ul className="inclass">
          <li>
            <h3>
              <Link href="/">Build a coalition</Link>
            </h3>
            <p>
              Pick a poll, add parties, and see whether they reach 61, and which recorded pledges the coalition would break. Use &ldquo;Copy a link to
              this coalition&rdquo; to hand a scenario to the room.
            </p>
          </li>
          <li>
            <h3>
              <Link href="/parties">The Party Map</Link>
            </h3>
            <p>
              Every list sized by its poll average, grouped by bloc, with who they are, who votes for them, and where they stand on six issues. Each
              party also has its own page to link to.
            </p>
          </li>
          <li>
            <h3>
              <Link href="/issues">Issues and Communities</Link>
            </h3>
            <p>Reference pages on the seven questions that decide the vote and the nine groups of voters, each with charts and a sourced reading list.</p>
          </li>
        </ul>

        <p className="license">
          The teaching materials on this site are licensed under{" "}
          <a href="https://creativecommons.org/licenses/by-nc/4.0/" rel="license">
            Creative Commons Attribution-NonCommercial 4.0
          </a>
          : share and adapt them for non-commercial teaching, with credit to Rabbi Daniel Bogard and a link to israelielection.org.
        </p>
      </div>
    </div>
  );
}
