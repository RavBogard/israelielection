import { notFound } from "next/navigation";
import Link from "next/link";
import { buildExport } from "@/lib/export-data";
import { EXPORTS } from "@/lib/i18n/exports";
import { isRtl, type Lang } from "@/lib/i18n";
import PrintButton from "@/components/PrintButton";
import "@/components/export.css";
export default async function ExportPage({
  lang,
  params,
  searchParams,
}: {
  lang: Lang;
  params: Promise<{ kind: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { kind } = await params,
    values = await searchParams,
    q = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (typeof value === "string") q.set(key, value);
  q.set("lang", lang);
  const model = await buildExport(kind, q);
  if (!model) notFound();
  const t = EXPORTS[lang];
  return (
    <article
      lang={lang}
      dir={isRtl(lang) ? "rtl" : "ltr"}
      className={`wrap sourced-export export-${kind}`}
    >
      <nav className="export-controls">
        <Link href={model.view}>{t.back}</Link>
        <PrintButton label={t.print} />
        <a href={`/api/export?kind=${kind}&${q}`}>{t.download}</a>
      </nav>
      <h1>{model.title}</h1>
      <p>
        {t.asOf} {model.asOf}.{" "}
        <a href={`https://www.israelvotes.org${model.view}`}>{t.open}</a>.
      </p>
      {model.originalEvidence && <p role="note">{t.original}</p>}
      {model.assumptions.map((text, i) => (
        <p className="export-assumption" lang={lang} key={i}>
          {text}
        </p>
      ))}
      <div className="export-table">
        <table>
          <thead>
            <tr>
              {model.headers.map((h) => (
                <th scope="col" key={h}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {model.rows.map((row, i) => (
              <tr key={i}>
                {row.map((value, j) => (
                  <td key={j} data-label={model.headers[j]}>
                    {value === null ? (
                      t.unknown
                    ) : typeof value === "string" &&
                      /^https?:\/\//.test(value) ? (
                      <a href={value}>{value}</a>
                    ) : (
                      value
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>{t.sources}</h2>
      <ul>
        {model.sources.map((s, i) => (
          <li key={i}>
            <a href={s.url}>{s.label}</a>: {s.url}
          </li>
        ))}
      </ul>
      <p>{t.credit}</p>
    </article>
  );
}
