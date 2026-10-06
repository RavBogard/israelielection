"use client";
import { usePathname } from "next/navigation";
import { correctionHref } from "@/lib/corrections";
import chrome from "@/lib/i18n/chrome";
import { useLang } from "@/lib/i18n/lang";
/**
 * The click captures query/hash selections too; the rendered link already has a useful page address.
 * In the edition's own words; the corrections page is English, so the Hebrew link says so and carries hrefLang.
 */
export default function CorrectionLink({ page }: { page?: string }) {
  const path = usePathname(), lang = useLang();
  return <a href={correctionHref(page ?? path)} hrefLang={lang === "he" ? "en" : undefined} onClick={(event) => { if (!page) event.currentTarget.href = correctionHref(window.location.href); }}>{chrome[lang].sources.correction}</a>;
}
