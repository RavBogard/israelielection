import Link from "next/link";
import { editionPath, type Lang } from "@/lib/i18n";
import { editionCopy } from "@/lib/i18n/edition";
import { referenceText } from "@/lib/i18n/reference";
import { FORMATION } from "@/lib/i18n/formation-live";
export default function PendingEditionHome({
  lang,
  id,
}: {
  lang: Lang;
  id: string | null;
}) {
  const t = editionCopy(lang),
    r = referenceText(lang),
    href = (path: string) => editionPath(path, lang)!;
  return (
    <div className="home">
      <div className="wrap">
        <section className="hero" aria-labelledby="edition-h">
          <div className="text">
            <h1 id="edition-h">{id ? t.waiting : t.unavailable}</h1>
            <p className="standfirst">
              {id ? t.waitingNote : t.unavailableNote}
            </p>
          </div>
          <div className="pending-seat-frame" role="img" aria-label={t.frame}>
            {Array.from({ length: 120 }, (_, i) => (
              <span key={i} aria-hidden="true" />
            ))}
          </div>
          <div className="race-selectors">
            <p>{t.frame}</p>
            {id && (
              <p>
                <Link href={href("/elections/" + id)}>{t.current}</Link>
              </p>
            )}
            <p>
              <Link href={href("/elections")}>{t.previous}</Link>
            </p>
          </div>
        </section>
        <section className="tools" aria-labelledby="reference-tools-h">
          <h2 id="reference-tools-h">{r.reference}</h2>
          <ul>
            {[
              ["/government", FORMATION[lang].title],
              ["/parliament", r.parliament],
              ["/policies", r.policies],
              ["/changes", r.changes],
            ].map(([path, label]) => (
              <li key={path}>
                <Link href={href(path)}>
                  <span className="t">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
