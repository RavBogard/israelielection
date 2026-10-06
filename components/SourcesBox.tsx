import type { ReactNode } from "react";
import CorrectionLink from "./CorrectionLink";

/**
 * The sources of a page, folded at its end. `children` are the <li> items. Open by default on
 * pages about one thing (a party, an article), closed where the list is long and shared.
 */
export default function SourcesBox({ children, count, open = false }: { children: ReactNode; count?: number; open?: boolean }) {
  return (
    <details className="sources" open={open || undefined}>
      <summary>
        Sources
        {count !== undefined && <span className="n">{count}</span>}
        <span className="hint">
          <span className="c">Show</span>
          <span className="o">Hide</span>
        </span>
      </summary>
      <ol>{children}</ol>
      <p className="fig-src"><CorrectionLink /></p>
    </details>
  );
}
