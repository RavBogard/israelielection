import Link from "next/link";
import data from "@/data/voting-rights.json";
import { editionPath, type Lang } from "@/lib/i18n";
import { longDate } from "@/lib/format";
import { votingRightsText } from "@/lib/i18n/voting-rights";
import { referenceText } from "@/lib/i18n/reference";
import { translatedTool } from "@/lib/reference/catalog";
import "./VotingRightsGuide.css";

export default function VotingRightsGuide({ lang = "en" }: { lang?: Lang }) {
  const t = votingRightsText(lang),
    ref = referenceText(lang),
    edition = translatedTool("tools:voting-rights", lang, data);
  const kinds: Record<string, string> = {
    yes: t.yes,
    no: t.no,
    status: t.status,
  };
  return (
    <figure className="voting-rights" aria-labelledby="voting-rights-title">
      <figcaption id="voting-rights-title" className="vr-h">
        {t.title}
      </figcaption>
      {lang !== "en" && edition.state !== "ready" && (
        <p className="fig-note">
          {ref.pending}. <Link href="/start?original=en">{ref.original}</Link>
        </p>
      )}
      <p className="fig-key vr-key" aria-hidden="true">
        {Object.entries(kinds).map(([k, label]) => (
          <span key={k}>
            <i className={`vr-k ${k}`} />
            {label}
          </span>
        ))}
      </p>
      <div
        role="region"
        tabIndex={0}
        aria-label={t.title}
        style={{ overflowX: "auto" }}
      >
        <table className="vr-table">
          <thead>
            <tr>
              <th scope="col">{t.heading}</th>
              <th scope="col">
                {t.national}
                <span>{t.nationalNote}</span>
              </th>
              <th scope="col">
                {t.municipal}
                <span>{t.municipalNote}</span>
              </th>
            </tr>
          </thead>
          <tbody lang={edition.contentLang}>
            {edition.data.rows.map((r) => (
              <tr key={r.id}>
                <th scope="row">
                  <b>{r.status}</b>
                  <span className="vr-place">{r.location}</span>
                  <span className="vr-detail">{r.detail}</span>
                </th>
                <td className={`vr-cell ${r.nationalKind}`}>
                  <span className="sr-only">{kinds[r.nationalKind]}: </span>
                  {r.national}
                </td>
                <td className={`vr-cell ${r.municipalKind}`}>
                  <span className="sr-only">{kinds[r.municipalKind]}: </span>
                  {r.municipal}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="fig-src vr-src">
        {t.checked}{" "}
        <time dateTime={data.checked}>{longDate(data.checked, lang)}</time>.{" "}
        <span lang="en">
          <a href={data.nationalSource}>Basic Law: The Knesset, §5</a>;{" "}
          <a href={data.registrySource}>CEC voter-register guidance (2022)</a>;{" "}
          <a href={data.statusSource}>Government status guidance</a>;{" "}
          <a href={data.municipalSource}>Interior Ministry (2025)</a>;{" "}
          <a href={data.contextSource}>IDI</a>.
        </span>{" "}
        {t.age}{" "}
        <Link href={editionPath("/how-it-works/voting", lang)!}>{t.guide}</Link>
        .
      </p>
    </figure>
  );
}
