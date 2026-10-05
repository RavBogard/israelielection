import type { ResultsSnapshot } from "@/lib/results-snapshot";
import { results, type ResultsConfig } from "@/lib/results";
export default function ResultsChanges({ current, previous, config, names }: { current: ResultsSnapshot; previous: ResultsSnapshot | null; config: ResultsConfig; names: Record<string,string> }) {
  if (!previous || previous.hash === current.hash) return <p className="note">No previous distinct saved count is available for comparison.</p>;
  const before = results(previous.count, config); const after = results(current.count, config);
  const signed = (n: number) => `${n > 0 ? "+" : ""}${n.toLocaleString("en-US")}`;
  const letters = [...new Set([...Object.keys(previous.count.votes), ...Object.keys(current.count.votes)])];
  const changes = letters.map((letter) => ({ letter, votes: (current.count.votes[letter] ?? 0) - (previous.count.votes[letter] ?? 0), seats: (after.alloc.seats[letter] ?? 0) - (before.alloc.seats[letter] ?? 0) })).filter((row) => row.votes || row.seats);
  return <section className="rs-changes"><h2 className="sec-h">Changes since the previous saved count</h2><p>Compared with the count captured <time dateTime={previous.capturedAt}>{previous.capturedAt}</time>: {signed(current.count.valid - previous.count.valid)} valid votes. A decrease can reflect a corrected count. These are changes between two saved counts, not an official change log.</p><div className="table-scroll"><table className="data-table"><thead><tr><th>List</th><th className="num">Vote change</th><th className="num">Estimated seat change</th></tr></thead><tbody>{changes.map((row) => <tr key={row.letter}><th scope="row">{names[config.letters[row.letter]] ?? row.letter}</th><td className="num">{signed(row.votes)}</td><td className="num">{signed(row.seats)}</td></tr>)}</tbody></table></div></section>;
}
