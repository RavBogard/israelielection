import type { Lang } from "@/lib/i18n";
import { SUPPORT, SUPPORT_URL } from "@/lib/i18n/support";

/** The footer's support line: the link, then who is paid and how. Renders nothing while SUPPORT_URL is empty. */
export function FootSupport({ lang = "en" }: { lang?: Lang }) {
  if (!SUPPORT_URL) return null;
  const t = SUPPORT[lang];
  return (
    <p className="foot-support">
      <a href={SUPPORT_URL} target="_blank" rel="noopener" data-testid="support-link">{t.link}</a> {t.note}
    </p>
  );
}

/** The /about section: the same link with the funding policy. */
export function AboutSupport({ lang = "en" }: { lang?: Lang }) {
  if (!SUPPORT_URL) return null;
  const t = SUPPORT[lang];
  return (
    <section className="about-support" id="support" aria-labelledby="support-h">
      <h2 id="support-h">{t.heading}</h2>
      <p>{t.note} {t.policy}</p>
      <p><a className="support-btn" href={SUPPORT_URL} target="_blank" rel="noopener">{t.link}</a></p>
    </section>
  );
}
