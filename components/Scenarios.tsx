import Link from "next/link";
import { averagePoll, mainPolls, parties } from "@/lib/data";
import { builderHref, clears, readClears, readNumbers, scenarioNumbers, type ScenariosFile } from "@/lib/scenarios";
import data from "@/data/teach-scenarios.json";

/* Coalition scenarios for class: each opens the Builder with its line-up loaded. The seat line is computed from the polls. */
const { scenarios } = data as ScenariosFile;
const nameOf = (id: string) => parties.find((p) => p.id === id)!.name;

export default function Scenarios() {
  return (
    <ol className="scenarios">
      {scenarios.map((s) => (
        <li key={s.id} id={`scenario-${s.id}`} className="scenario">
          <h3>{s.title}</h3>
          {s.show === "threshold" ? (
            <ul className="lineup">
              {s.with.map((id) => (
                <li key={id}>
                  {nameOf(id)}: {readClears(clears(id, mainPolls), mainPolls.length)}
                </li>
              ))}
            </ul>
          ) : (
            <>
              <p className="lineup">{s.with.map(nameOf).join(", ")}</p>
              <p className="seats">{readNumbers(scenarioNumbers(s.with, parties, averagePoll, mainPolls))}</p>
            </>
          )}
          <p className="lead">{s.lead}</p>
          <p className="do">
            <Link href={builderHref(s.with)}>Open in the Coalition Builder</Link>. {s.notice}
          </p>
          <p className="q">
            <span className="lbl">For discussion</span> {s.question}
          </p>
          <p className="src">
            Sources:{" "}
            {s.sources.map((x, i) => (
              <span key={x.url}>
                {i > 0 && "; "}
                <a href={x.url}>
                  {x.name}, {x.date}
                </a>
              </span>
            ))}
            .
          </p>
        </li>
      ))}
    </ol>
  );
}
