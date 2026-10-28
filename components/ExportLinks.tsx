import Link from "next/link";
import { editionPath, type Lang } from "@/lib/i18n";
import { EXPORTS } from "@/lib/i18n/exports";

/** Links to the CSV downloads of the results, polls and forecast; each opens the table with its sources and a download button. */
export default function ExportLinks({ lang, kinds = ["results", "polls", "forecast"] }: { lang: Lang; kinds?: ("results" | "polls" | "forecast")[] }) {
  const t = EXPORTS[lang];
  return (
    <p className="export-links" data-testid="export-links">
      {t.download}:{" "}
      {kinds.map((kind, i) => (
        <span key={kind}>
          {i > 0 && ", "}
          <Link href={editionPath(`/export/${kind}`, lang) ?? `/export/${kind}`}>{t[kind]}</Link>
        </span>
      ))}
    </p>
  );
}
