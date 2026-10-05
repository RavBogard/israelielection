import Link from "next/link";
import type { ReactNode } from "react";
import { parties } from "@/lib/data";
import type { Source } from "@/lib/formation";
import { mediumDate } from "@/lib/format";
import { outgoingGovernment, outgoingHref } from "@/lib/outgoing-government";

const GLOSSARY = "/glossary#transitional-government";

function Src({ s }: { s: Source }) {
  return (
    <>
      <a href={s.url}>{s.name}</a>
      {s.date && <>, {mediumDate(s.date)}</>}
    </>
  );
}

/** The status sentence with its "transitional government" phrase linked to the glossary. */
function linked(text: string): ReactNode {
  const i = text.toLowerCase().indexOf("transitional government");
  if (i < 0) return text;
  const phrase = text.slice(i, i + "transitional government".length);
  return (
    <>
      {text.slice(0, i)}
      <Link href={GLOSSARY}>{phrase}</Link>
      {text.slice(i + phrase.length)}
    </>
  );
}

/** Who governs until a new government is sworn in: the outgoing coalition and the dated changes to it, the seat count after each in the number column. */
export default function OutgoingGovernmentSection() {
  const g = outgoingGovernment;
  return (
    <section className="gov-outgoing" aria-labelledby="outgoing-h">
      <h2 id="outgoing-h">Who governs until a new government is sworn in</h2>
      <p className="lead">
        {linked(g.status.text)}{" "}
        <span className="src">
          {g.status.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && "; "}
              <Src s={s} />
            </span>
          ))}
          .
        </span>
      </p>
      <ol className="gov-steps outgoing">
        {g.events.map((e, i) => (
          <li key={`${e.date}-${i}`} className="step done">
            <div className={`num${e.seatsAfter === null ? " soft" : ""}`}>{e.seatsAfter ?? e.seatsText ?? ""}</div>
            <div className="body">
              <p className="when">
                <time dateTime={e.date}>{mediumDate(e.date)}</time>
              </p>
              <p className="rule">{e.text}</p>
              <p className="src">
                <Src s={e.source} />
              </p>
            </div>
          </li>
        ))}
      </ol>
      <p className="seats-note">The number beside each step is the coalition&apos;s seats after it. {g.seatsNote}</p>
      <p className="gov-more">
        The {g.seats2022} seats of {mediumDate(g.events[0].date)} were held by {g.with.map((id) => parties.find((p) => p.id === id)?.name ?? id).join(", ")}, as those parties run now.{" "}
        <Link href={outgoingHref()}>See what they poll at today in the Coalition Builder</Link>. {g.noam.text}{" "}
        <span className="src">
          <Src s={g.noam.source} />.
        </span>
      </p>
    </section>
  );
}
