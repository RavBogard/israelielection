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

/** The footer's support button: it opens a popup (the native popover, no script) with the ways to give. Renders nothing while the list is empty. */
export function FootSupport({ lang = "en" }: { lang?: Lang }) {
  if (!SUPPORT_METHODS.length) return null;
  const t = SUPPORT[lang];
  return (
    <div className="foot-support">
      <button type="button" className="support-open" popoverTarget="support-pop" data-testid="support-open">{t.link}</button>
      <div id="support-pop" className="support-pop" popover="auto" role="dialog" aria-labelledby="support-pop-h">
        <div className="support-pop-head">
          <h2 id="support-pop-h">{t.link}</h2>
          <button type="button" className="support-close" popoverTarget="support-pop" popoverTargetAction="hide" aria-label={t.close}>×</button>
        </div>
        <Methods />
        <p>{t.note}</p>
      </div>
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
