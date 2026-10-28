import { editionPath, type Lang } from "@/lib/i18n";
/** The credit line every embed ends with: site, date line, licence. */
export default function EmbedFooter({
  dateLine,
  lang = "en",
}: {
  dateLine: string;
  lang?: Lang;
}) {
  return (
    <p className="embed-foot">
      Israel Votes,{" "}
      <a
        href={`https://www.israelielection.org${editionPath("/", lang) ?? "/"}?utm_source=embed`}
        target="_blank"
        rel="noopener"
      >
        israelielection.org
      </a>
      . {dateLine}. CC BY-NC 4.0.
    </p>
  );
}
