import Link from "next/link";
import { editionPath, type Lang } from "@/lib/i18n";
import { EXIT_LINE } from "@/lib/i18n/exit-line";
import { pollsterText } from "@/lib/i18n/overlay-text";
import { exitPolls, parties, pollsData } from "@/lib/data";
import { exitBlocLine, rangeText } from "@/lib/exit-line";

/**
 * The masthead's exit-poll line, on every page once a broadcaster's exit poll is entered: each bloc's range
 * across Channel 12, Channel 13 and Kan 11, as colour-coded groups (no separators between them) linking home.
 */
export default function ExitBlocLine({ lang = "en" }: { lang?: Lang }) {
  const line = exitBlocLine(exitPolls, parties, pollsData.config.withoutVariant.pollsters);
  if (!line) return null;
  const t = EXIT_LINE[lang];
  const names = line.sources.map((s) => `${pollsterText(s.pollster, lang).text} ${s.seats.net}/${s.seats.opp + s.seats.mid}/${s.seats.arab}`).join("; ");
  return (
    <div className="exit-line">
      <Link href={editionPath("/", lang) ?? "/"} className="row" aria-label={`${t.label}: ${t.aria}`} title={names}>
        <span className="el-lead">{t.label}</span>
        <ul>
          {line.ranges.map((r) => (
            <li key={r.bloc}>
              <span className="sw" style={{ background: `var(--b-${r.bloc})` }} aria-hidden="true" />
              {t[r.bloc]} <b><bdi dir="ltr">{rangeText(r)}</bdi></b>
            </li>
          ))}
        </ul>
      </Link>
    </div>
  );
}
