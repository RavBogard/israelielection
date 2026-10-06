"use client";

import { usePathname } from "next/navigation";
import { otherEdition } from "@/lib/i18n";
import { useLang } from "@/lib/i18n/lang";
import chrome from "@/lib/i18n/chrome";

/**
 * A link to the same page in the other edition, when it has one; nothing otherwise.
 * A plain <a>: the editions have separate root layouts, so crossing is a full page load anyway.
 */
export default function LangSwitch({ className }: { className?: string }) {
  const path = usePathname() ?? "/";
  const lang = useLang();
  const other = otherEdition(path);
  if (!other || other.lang === lang) return null;
  const label = chrome[lang].switchTo[other.lang];
  return (
    <a className={`lang-switch${className ? ` ${className}` : ""}`} href={other.href} hrefLang={other.lang} lang={other.lang} dir={other.lang === "he" ? "rtl" : "ltr"} title={chrome[lang].switchLabel}>
      {label}
    </a>
  );
}
