import type { Lang } from "@/lib/i18n";
import profileText from "@/lib/i18n/profile";
import type { VoterBase } from "./model";

/** Who voted for the list in 2022, one stacked bar in tints of the party's colour, then the share of each group it won. The Hebrew page passes `base` with its labels already in Hebrew. */
export default function VoterBaseBar({ base, color, lang = "en" }: { base: VoterBase; color: string; lang?: Lang }) {
  const P = profileText[lang].voters;
  const total = base.groups.reduce((s, g) => s + g.pct, 0);
  // Fixed light endpoint, so the small segments stay visible on the dark paper too.
  const tints = [100, 68, 42, 22];
  const tint = (i: number) => `color-mix(in oklab, ${color} ${tints[Math.min(i, tints.length - 1)]}%, var(--tint-base))`;
  return (
    <>
      <div className="pp-stack" role="img" aria-label={P.aria(base.listName, base.groups)}>
        {base.groups.map((g, i) => (
          <span key={g.label} style={{ width: `${(g.pct / Math.max(total, 100)) * 100}%`, background: tint(i) }} />
        ))}
      </div>
      <ul className="fig-key pp-stack-key">
        {base.groups.map((g, i) => (
          <li key={g.label}>
            <i style={{ background: tint(i) }} />
            <b>{g.pct}%</b> {g.label}
          </li>
        ))}
      </ul>
      {base.won.length > 0 && (
        <ul className="pp-won">
          {base.won.map((w) => (
            <li key={w.label}>
              <span className="l">{P.won(w.pct, w.label)}</span>
              <span className="bar"><i style={{ width: `${w.pct}%`, background: color }} /></span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
