"use client";

import { usePathname } from "next/navigation";
import { LANGS, editionPath, isRtl, type Lang } from "@/lib/i18n";
import { LANG_COOKIE, LANG_COOKIE_MAX_AGE } from "@/lib/i18n/default-lang";
import { useLang } from "@/lib/i18n/lang";
import chrome from "@/lib/i18n/chrome";

const NAME: Record<Lang, string> = { en: "English", he: "עברית", ar: "العربية", fa: "فارسی", de: "Deutsch", fr: "Français", zh: "中文（简体）" };
function remember(lang: Lang) {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=${LANG_COOKIE_MAX_AGE}; samesite=lax`;
}
function target(path: string, lang: Lang) {
  return editionPath(path, lang) ?? `/${lang}`;
}

/** Native keyboard and screen-reader support, with room for all editions on phones. */
export default function LangSwitch() {
  const path = usePathname() ?? "/", lang = useLang();
  return (
    <div className="lang-toggle">
      <select aria-label={chrome[lang].langGroup} value={lang} onChange={event => {
        const to = event.target.value as Lang;
        remember(to);
        const same = editionPath(path, to);
        window.location.assign(same ? `${same}${location.search}${location.hash}` : target(path, to));
      }}>
        {LANGS.map(l => <option key={l} value={l} lang={l} dir={isRtl(l) ? "rtl" : "ltr"}>{NAME[l]}</option>)}
      </select>
    </div>
  );
}

/** Each edition is discoverable from every footer, including English-only guides. */
export function LangLink() {
  const path = usePathname() ?? "/", lang = useLang();
  return <span className="language-links">{LANGS.filter(l => l !== lang).map(l => (
    <a key={l} className="lang-switch" href={target(path, l)} hrefLang={l} lang={l} dir={isRtl(l) ? "rtl" : "ltr"} onClick={event => {
      remember(l);
      if (editionPath(path, l)) event.currentTarget.href = `${event.currentTarget.pathname}${location.search}${location.hash}`;
    }}>{NAME[l]}</a>
  ))}</span>;
}
