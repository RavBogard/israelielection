import type { ReactNode } from "react";
import type { Lang } from "@/lib/i18n";
import chrome from "@/lib/i18n/chrome";
import CorrectionLink from "./CorrectionLink";
import SourcesCorrection from "./SourcesCorrection";

/**
 * The sources of a page, folded at its end. `children` are the <li> items. Open by default on
 * pages about one thing (a party, an article), closed where the list is long and shared.
 * `lang` sets the box's own words (the Hebrew pages pass "he").
 */
export default function SourcesBox({ children, count, open = false, lang = "en" }: { children: ReactNode; count?: number; open?: boolean; lang?: Lang }) {
  const t = chrome[lang].sources;
  return (
    <details className="sources" open={open || undefined}>
      <summary>
        {t.title}
        {count !== undefined && <span className="n">{count}</span>}
        <span className="hint">
          <span className="c">{t.show}</span>
          <span className="o">{t.hide}</span>
        </span>
      </summary>
      <ol>{children}</ol>
      <p className="fig-src">{lang === "he" ? <SourcesCorrection label={t.correction} /> : <CorrectionLink />}</p>
    </details>
  );
}
