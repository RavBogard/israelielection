"use client";

import type { MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { enPath, hePath, HE_PREFIX, type Lang } from "@/lib/i18n";
import { LANG_COOKIE, LANG_COOKIE_MAX_AGE } from "@/lib/i18n/default-lang";
import { useLang } from "@/lib/i18n/lang";
import chrome from "@/lib/i18n/chrome";

/** Where each edition's cell leads from this page: the same page in that edition, or the Hebrew home when the page is English only. */
function targets(path: string, lang: Lang): Record<Lang, { href: string; same: boolean }> {
  const he = hePath(path);
  return {
    en: { href: lang === "en" ? path : enPath(path), same: true },
    he: { href: lang === "he" ? path : (he ?? HE_PREFIX), same: he !== null },
  };
}

/**
 * Remembers the reader's choice, so proxy.ts stops sending them to the edition their country or browser suggests,
 * and carries the page's query and fragment (a Coalition Builder line-up, a poll) across. A plain <a>: the editions
 * have separate root layouts, so crossing is a full page load anyway.
 */
function choose(to: Lang, same: boolean) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    document.cookie = `${LANG_COOKIE}=${to}; path=/; max-age=${LANG_COOKIE_MAX_AGE}; samesite=lax`;
    if (same) e.currentTarget.href = `${e.currentTarget.pathname}${location.search}${location.hash}`;
  };
}

const NAME: Record<Lang, { short: string; full: string; dir: "ltr" | "rtl" }> = {
  en: { short: "EN", full: "English", dir: "ltr" },
  he: { short: "עב", full: "עברית", dir: "rtl" },
};

/**
 * The language toggle in the masthead, beside the menus (on phones, beside the Menu button): two cells, EN and עב,
 * the current edition filled. Each edition's own name in its own script, so a reader finds theirs without reading the other.
 */
export default function LangSwitch() {
  const path = usePathname() ?? "/";
  const lang = useLang();
  const t = chrome[lang];
  const to = targets(path, lang);
  return (
    <div className="lang-toggle" role="group" aria-label={t.langGroup}>
      {(["en", "he"] as const).map((l) =>
        l === lang ? (
          <span key={l} className="lt-cell" aria-current="true" lang={l} dir={NAME[l].dir}>
            <abbr title={NAME[l].full}>{NAME[l].short}</abbr>
          </span>
        ) : (
          <a
            key={l}
            className="lt-cell"
            href={to[l].href}
            hrefLang={l}
            lang={l}
            dir={NAME[l].dir}
            aria-label={NAME[l].full}
            title={to[l].same ? `${NAME[l].full}: ${t.switchLabel}` : t.noHebrew}
            onClick={choose(l, to[l].same)}
          >
            {NAME[l].short}
          </a>
        ),
      )}
    </div>
  );
}

/** The footer's plain-text link to the same page in the other edition; sets the same remembered choice. */
export function LangLink() {
  const path = usePathname() ?? "/";
  const lang = useLang();
  const other: Lang = lang === "en" ? "he" : "en";
  const to = targets(path, lang)[other];
  return (
    <a className="lang-switch" href={to.href} hrefLang={other} lang={other} dir={NAME[other].dir} title={chrome[lang].switchLabel} onClick={choose(other, to.same)}>
      {chrome[lang].switchTo[other]}
    </a>
  );
}
