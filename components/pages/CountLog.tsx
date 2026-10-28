import { locale, type Lang } from "@/lib/i18n";
import { EXIT_LINE } from "@/lib/i18n/exit-line";
import { PLATFORM_COPY } from "@/lib/i18n/platform-copy";
import { countLogRows } from "@/lib/count-log";

/** The public count log on /changes: each stored committee file with its time and share counted, and the projection's bloc seats after it. */
export default async function CountLog({ lang }: { lang: Lang }) {
  const t = PLATFORM_COPY[lang],
    b = EXIT_LINE[lang],
    loc = locale(lang),
    rows = await countLogRows(),
    time = new Intl.DateTimeFormat(loc, { timeZone: "Asia/Jerusalem", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return (
    <section aria-labelledby="count-log-h" data-testid="count-log">
      <h2 id="count-log-h">{t.countLog}</h2>
      <p>{t.countLogNote}</p>
      {rows.length === 0 ? (
        <p>{t.countLogEmpty}</p>
      ) : (
        <div className="export-table">
          <table>
            <thead>
              <tr>
                <th scope="col">{t.colFile}</th>
                <th scope="col">{t.colCounted}</th>
                <th scope="col">{b.net}</th>
                <th scope="col">{b.opp}</th>
                <th scope="col">{b.arab}</th>
                <th scope="col">{b.mid}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.fileAt}>
                  <th scope="row"><time dateTime={r.fileAt}>{time.format(new Date(r.fileAt))}</time></th>
                  <td>{r.counted === null ? "—" : `${(r.counted * 100).toLocaleString(loc, { maximumFractionDigits: 0 })}%`}</td>
                  <td>{r.blocs.net}</td>
                  <td>{r.blocs.opp}</td>
                  <td>{r.blocs.arab}</td>
                  <td>{r.blocs.mid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
