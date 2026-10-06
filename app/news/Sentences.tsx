import ChangesSourceLabels from "@/components/ChangesSourceLabels";
import type { Briefing } from "@/lib/briefing";
import { groupBriefing } from "@/lib/news-grouping";

function Sentence({ s }: { s: Briefing["sentences"][number] }) {
  return (
    <p>
      {s.text}{" "}
      {s.sources.map((src, j) => (
        <span key={j}><a className="cite" href={src.url} target="_blank" rel="noopener" title={src.title}>
          {src.outlet}
        </a><ChangesSourceLabels url={src.url} /></span>
      ))}
    </p>
  );
}

/** A briefing's sentences; with `topics`, under topic subheads when there is more than one topic. */
export default function Sentences({ b, topics = false }: { b: Briefing; topics?: boolean }) {
  const groups = topics ? groupBriefing(b.sentences) : [];
  if (groups.length < 2) return <>{b.sentences.map((s, i) => <Sentence key={i} s={s} />)}</>;
  return (
    <>
      {groups.map((g) => (
        <div key={g.topic} className="nw-topic">
          <h3>{g.topic}</h3>
          {g.sentences.map((s, i) => <Sentence key={i} s={s} />)}
        </div>
      ))}
    </>
  );
}
