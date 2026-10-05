import { partiesData, pollsData } from "@/lib/data";
import { mediumDate } from "@/lib/format";
import { pollLabel } from "@/lib/polls";

/** Poll source lines, generated from data/polls.json. */
export function PollSources() {
  return (
    <>
      {pollsData.polls.map((p) => (
        <li key={p.id}>
          <b>{pollLabel(p)}</b> poll{p.fieldwork ? `, fieldwork ${p.fieldwork}` : ""}, published {mediumDate(p.published)}
          {p.n ? ` (n=${p.n.toLocaleString("en-US")}${p.margin ? `, margin ${p.margin}` : ""})` : ""}
          {p.via ? `, via ${p.via}` : ""}
          {p.url && (
            <>
              :{" "}
              <a href={p.url} target="_blank" rel="noopener">
                {p.url.replace(/^https?:\/\/(www\.)?/, "")}
              </a>
            </>
          )}
          .{p.note ? ` ${p.note}` : ""}
        </li>
      ))}
    </>
  );
}

/** Profile provenance lines shared by every page that shows party profiles. */
export function ProfileSources() {
  return (
    <>
      <li>
        <b>Party profiles</b> (history, voters, positions, list names, pledges, surplus partners, quotes): research registers compiled{" "}
        {mediumDate(partiesData.updated)}, from the sources named next to each item (Israel Democracy Institute, Times of Israel,
        Jerusalem Post, Ynet, JTA, INN, Al Jazeera, Maariv and others). Quotes are translated from Hebrew where needed and were seen
        through summaries; their wording has not yet been checked against the originals.
      </li>
      <li>
        <b>Leader bios:</b> {partiesData.bioSource}
      </li>
    </>
  );
}
