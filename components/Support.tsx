import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { SUPPORT, SUPPORT_METHODS } from "@/lib/i18n/support";

/** Each way to give: a link where the service has one, the handle where readers type it in (PayPal by email). */
function Methods() {
  return (
    <ul className="support-methods">
      {SUPPORT_METHODS.map((m) => (
        <li key={m.name}>
          {m.url ? <a href={m.url} target="_blank" rel="noopener" data-testid="support-link">{m.name}</a> : <b>{m.name}</b>}
          {m.handle && <> <span className="support-handle" dir="ltr">{m.handle}</span></>}
        </li>
      ))}
    </ul>
  );
}

/** The footer's support line: the methods, then who is paid and how. Renders nothing while the list is empty. */
export function FootSupport({ lang = "en" }: { lang?: Lang }) {
  if (!SUPPORT_METHODS.length) return null;
  const t = SUPPORT[lang];
  return (
    <div className="foot-support">
      <p className="support-h"><Link href="/about#support" hrefLang={lang === "en" ? undefined : "en"}>{t.link}</Link></p>
      <Methods />
      <p>{t.note}</p>
    </div>
  );
}

/** The /about section: the same methods with the funding policy. */
export function AboutSupport({ lang = "en" }: { lang?: Lang }) {
  if (!SUPPORT_METHODS.length) return null;
  const t = SUPPORT[lang];
  return (
    <section className="about-support" id="support" aria-labelledby="support-h">
      <h2 id="support-h">{t.link}</h2>
      <Methods />
      <p>{t.note} {t.policy}</p>
    </section>
  );
}
