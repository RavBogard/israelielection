import type { Briefing } from "@/lib/briefing";
import { groupBriefing } from "@/lib/news-grouping";
import { AccessLabels } from "./access";

function Sentence({ s }: { s: Briefing["sentences"][number] }) {
  return (
    <p>
      {s.text}{" "}
      {s.sources.map((src, j) => (
        <span key={j}><a className="cite" href={src.url} target="_blank" rel="noopener" title={src.title}>
          {src.outlet}
        </a><AccessLabels url={src.url} /></span>
      ))}
    </p>
  );
}

/** A briefing's sentences; with `topics`, under topic subheads (at `level`, h3 by default) when there is more than one topic. */
export default function Sentences({ b, topics = false, level = 3 }: { b: Briefing; topics?: boolean; level?: 2 | 3 }) {
  const H = level === 2 ? "h2" : "h3";
  const groups = topics ? groupBriefing(b.sentences) : [];
  if (groups.length < 2) return <>{b.sentences.map((s, i) => <Sentence key={i} s={s} />)}</>;
  return (
    <>
      {groups.map((g) => (
        <div key={g.topic} className="nw-topic">
          <H>{g.topic}</H>
          {g.sentences.map((s, i) => <Sentence key={i} s={s} />)}
        </div>
      ))}
    </>
  );
}
