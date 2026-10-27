import { inWithoutVariant, isExit, latestExits } from "./polls";
import { EXIT_CHANNELS } from "./results-phase";
import type { Poll, PollsConfig } from "./types";

/**
 * Election night: each broadcaster's newest exit poll, split into the channels the forecast reads (`main`, in the
 * channels' order) and the pollsters `config.withoutVariant` names (Channel 14, i24NEWS), which are always shown apart
 * and never enter the forecast or the averages. `updated` holds the broadcasters with more than one version aired, so
 * the page can say "updated" rather than "aired". `polls` is every poll (all versions); only exit rows are read.
 */
export function splitExits(polls: Poll[], config: Pick<PollsConfig, "withoutVariant">): { main: Poll[]; apart: Poll[]; updated: Set<string> } {
  const rank = (p: Poll) => (EXIT_CHANNELS.includes(p.pollster) ? EXIT_CHANNELS.indexOf(p.pollster) : EXIT_CHANNELS.length);
  const latest = latestExits(polls).sort((a, b) => rank(a) - rank(b) || a.pollster.localeCompare(b.pollster));
  const count = new Map<string, number>();
  for (const p of polls.filter(isExit)) count.set(p.pollster, (count.get(p.pollster) ?? 0) + 1);
  const apart = (p: Poll) => inWithoutVariant(p, config as PollsConfig);
  return { main: latest.filter((p) => !apart(p)), apart: latest.filter(apart), updated: new Set([...count].filter(([, n]) => n > 1).map(([k]) => k)) };
}
