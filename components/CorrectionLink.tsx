"use client";
import { usePathname } from "next/navigation";
import { correctionHref } from "@/lib/corrections";
import chrome from "@/lib/i18n/chrome";
import { useLang } from "@/lib/i18n/lang";
/**
 * The click captures query/hash selections too; the rendered link already has a useful page address.
 * Both the report form and its generated draft use the selected edition.
 */
export default function CorrectionLink({ page }: { page?: string }) {
  const path = usePathname(),
    lang = useLang();
  return (
    <a
      href={correctionHref(page ?? path, lang)}
      hrefLang={lang}
      onClick={(event) => {
        if (!page)
          event.currentTarget.href = correctionHref(
            window.location.pathname +
              window.location.search +
              window.location.hash,
            lang,
          );
      }}
    >
      {chrome[lang].sources.correction}
    </a>
  );
}
