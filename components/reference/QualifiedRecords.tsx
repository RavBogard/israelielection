import "@/lib/i18n/overlays";
import type { GlobalProjection } from "@/lib/political-record/global-model";
import type {
  QualifiedRow,
  QualifiedSource,
} from "@/lib/political-record/domain";
import type { Lang } from "@/lib/i18n";
import { locale } from "@/lib/i18n";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import { recordText, recordState, recordScope } from "@/lib/i18n/records";
import { parties } from "@/lib/data";
import { partyText } from "@/lib/i18n/overlay-text";
import { recordDate } from "@/lib/reference/record-format";
import "./records.css";

type Global = GlobalProjection & { storageState?: string };
function Sources({
  sources,
  lang,
}: {
  sources: QualifiedSource[];
  lang: Lang;
}) {
  const t = recordText(lang),
    missing = LIFECYCLE[lang].noTime;
  return (
    <ul className="record-sources">
      {sources.map((s) => (
        <li key={s.revisionId}>
          <a href={s.url} dir="auto">
            {s.publisher}: {s.title}
          </a>
          <p>
            {t.published}:{" "}
            {s.publishedAt ? (
              <time dateTime={s.publishedAt}>
                {recordDate(s.publishedAt, lang)}
              </time>
            ) : (
              missing
            )}
            . {t.checked}:{" "}
            <time dateTime={s.observedAt}>
              {recordDate(s.observedAt, lang)}
            </time>
          </p>
        </li>
      ))}
    </ul>
  );
}
function Receipt({ row, lang }: { row: QualifiedRow; lang: Lang }) {
  const t = recordText(lang);
  return (
    <details className="record-receipt">
      <summary>{t.sources}</summary>
      <Sources sources={row.sources} lang={lang} />
      <p>
        {t.revision}: <code>{row.revisionId}</code>
      </p>
      {row.captureState === "missing" && <p>{t.missingCapture}</p>}
    </details>
  );
}
/** These are source-qualified global records, never an election-seat membership inference. */
export default function QualifiedRecords({
  global,
  lang,
  view,
}: {
  global: Global;
  lang: Lang;
  view: "policies" | "parliament" | "government" | "economy";
}) {
  const t = recordText(lang),
    number = (value: number) =>
      new Intl.NumberFormat(locale(lang), { maximumFractionDigits: 4 }).format(
        value,
      ),
    missing = LIFECYCLE[lang].noTime;
  const hasData =
    view === "parliament"
      ? global.parliament.memberships.length + global.parliament.bills.length
      : view === "government"
        ? global.governmentRecords.length + (global.incumbent.record ? 1 : 0)
        : global.indicators.length +
          (view === "policies" ? global.commitments.length : 0);
  const incumbent = global.incumbent.record;
  return (
    <section className="qualified-records" aria-label={t.records}>
      {!global.complete && (
        <p className="record-status" role="note">
          {t.partial}
        </p>
      )}
      {lang !== "en" && hasData > 0 && (
        <p className="record-status">{t.original}</p>
      )}
      {!hasData && <p>{view === "government" ? t.noIncumbent : t.empty}</p>}
      {(view === "policies" || view === "economy") &&
        global.indicators.length > 0 && (
          <section>
            <h2>{t.index}</h2>
            <p>{t.noCause}</p>
            <p>{t.noRelease}</p>
            <div
              className="record-table"
              role="region"
              aria-label={t.records}
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    {[
                      t.period,
                      t.monthly,
                      t.annual,
                      t.index,
                      t.base,
                      t.sources,
                    ].map((h) => (
                      <th scope="col" key={h}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...global.indicators]
                    .sort((a, b) => b.period.localeCompare(a.period))
                    .map((row) => (
                      <tr key={row.revisionId}>
                        <th scope="row">{row.period}</th>
                        <td>{number(row.monthlyPercent)}%</td>
                        <td>{number(row.annualPercent)}%</td>
                        <td>{number(row.indexValue)}</td>
                        <td dir="auto">{row.baseDescription}</td>
                        <td>
                          <Receipt row={row} lang={lang} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      {view === "policies" && global.commitments.length > 0 && (
        <section>
          <h2>{t.commitments}</h2>
          {global.commitments.map((row) => (
            <article className="commitment-record" key={row.revisionId}>
              <h3 dir="auto">{row.title}</h3>
              <p className="record-assessment">
                {recordState(row.assessment.state, lang)}
              </p>
              <p>{t.noCause}</p>
              {row.rubric && (
                <dl className="record-rubric">
                  <div>
                    <dt>{recordScope(lang)[0]}</dt>
                    <dd>
                      <code>{row.rubric.metricId}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>{recordScope(lang)[1]}</dt>
                    <dd>
                      <code>{row.rubric.scopeId}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>{t.rubric}</dt>
                    <dd>{row.rubric.version}</dd>
                  </div>
                  <div>
                    <dt>{t.baseline}</dt>
                    <dd>
                      {number(row.rubric.baseline.value)} {row.rubric.unit}.{" "}
                      {row.rubric.baseline.period}
                    </dd>
                  </div>
                  <div>
                    <dt>{t.target}</dt>
                    <dd>
                      <span>
                        {
                          { gte: "≥", lte: "≤", equal: "=" }[
                            row.rubric.target.comparison
                          ]
                        }{" "}
                      </span>
                      {number(row.rubric.target.value)} {row.rubric.unit}
                    </dd>
                  </div>
                  <div>
                    <dt>{t.tolerance}</dt>
                    <dd>
                      {number(row.rubric.target.tolerance)} {row.rubric.unit}
                    </dd>
                  </div>
                  <div>
                    <dt>{t.deadline}</dt>
                    <dd>
                      <time dateTime={row.rubric.deadlineAt}>
                        {recordDate(row.rubric.deadlineAt, lang)}
                      </time>
                    </dd>
                  </div>
                  <div>
                    <dt>{t.assessmentPeriod}</dt>
                    <dd>{row.rubric.assessmentPeriod}</dd>
                  </div>
                </dl>
              )}
              <h4>{t.chain}</h4>
              <ol className="record-chain">
                {row.chainEvidence.map((link) => (
                  <li key={link.recordRevisionId}>
                    <strong>{recordState(link.stage, lang)}</strong>
                    <p dir="auto">
                      {link.qualified ? (link.title ?? missing) : t.empty}
                    </p>
                    {link.qualified && (
                      <Sources sources={link.sources} lang={lang} />
                    )}
                  </li>
                ))}
              </ol>
              <Receipt row={row} lang={lang} />
              <details>
                <summary>{t.measurements}</summary>
                {row.rubric && (
                  <>
                    <p>
                      {t.methodology}:{" "}
                      <code>{row.rubric.methodologyRevisionId}</code>
                    </p>
                    <p>
                      {t.baseline}:{" "}
                      <code>{row.rubric.baseline.observationRevisionId}</code>
                    </p>
                  </>
                )}
                {row.assessment.measurementRevisionIds.map((id) => (
                  <p key={id}>
                    <code>{id}</code>
                  </p>
                ))}
              </details>
            </article>
          ))}
        </section>
      )}
      {view === "parliament" && global.parliament.memberships.length > 0 && (
        <section>
          <h2>{t.memberships}</h2>
          <div
            className="record-table"
            role="region"
            aria-label={t.records}
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  {[
                    t.term,
                    t.person,
                    t.party,
                    t.role,
                    t.from,
                    t.until,
                    t.sources,
                  ].map((h) => (
                    <th scope="col" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {global.parliament.memberships.map((row) => {
                  const party = parties.find((p) => p.id === row.partyId);
                  return (
                    <tr key={row.revisionId}>
                      <td>{row.termId}</td>
                      <th scope="row" dir="auto">
                        {row.personName}
                      </th>
                      <td>
                        {party ? partyText(party, "name", lang).text : missing}
                      </td>
                      <td>{recordState(row.role, lang)}</td>
                      <td>
                        <time dateTime={row.startedAt}>
                          {recordDate(row.startedAt, lang)}
                        </time>
                      </td>
                      <td>
                        {row.endedAt ? (
                          <time dateTime={row.endedAt}>
                            {recordDate(row.endedAt, lang)}
                          </time>
                        ) : (
                          t.noEnd
                        )}
                      </td>
                      <td>
                        <Receipt row={row} lang={lang} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {view === "parliament" && global.parliament.bills.length > 0 && (
        <section>
          <h2>{t.bills}</h2>
          <div
            className="record-table"
            role="region"
            aria-label={t.records}
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  {[t.term, t.bills, t.stage, t.date, t.sources].map((h) => (
                    <th scope="col" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {global.parliament.bills.map((row) => (
                  <tr key={row.revisionId}>
                    <td>{row.termId}</td>
                    <th scope="row">
                      <a href={row.documentUrl} dir="auto">
                        {row.title}
                      </a>
                    </th>
                    <td>{recordState(row.stage, lang)}</td>
                    <td>
                      <time dateTime={row.occurredAt}>
                        {recordDate(row.occurredAt, lang)}
                      </time>
                    </td>
                    <td>
                      <Receipt row={row} lang={lang} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {view === "government" && (
        <>
          {incumbent && global.incumbent.state === "last_confirmed" && (
            <section>
              <h2>{t.incumbent}</h2>
              <h3 dir="auto">{incumbent.title}</h3>
              <p>
                {recordState(incumbent.state, lang)}. {t.from}:{" "}
                <time dateTime={incumbent.startedAt}>
                  {recordDate(incumbent.startedAt, lang)}
                </time>
              </p>
              <Receipt row={incumbent} lang={lang} />
            </section>
          )}
          {!incumbent && hasData > 0 && <p>{t.noIncumbent}</p>}
          {global.governmentRecords.filter(
            (row) => row.revisionId !== incumbent?.revisionId,
          ).length > 0 && (
            <section>
              <h2>{t.governments}</h2>
              {global.governmentRecords
                .filter((row) => row.revisionId !== incumbent?.revisionId)
                .map((row) => (
                  <article key={row.revisionId}>
                    <h3 dir="auto">{row.title}</h3>
                    <p>
                      {recordState(row.state, lang)}. {t.from}:{" "}
                      <time dateTime={row.startedAt}>
                        {recordDate(row.startedAt, lang)}
                      </time>
                      . {t.until}:{" "}
                      {row.endedAt ? (
                        <time dateTime={row.endedAt}>
                          {recordDate(row.endedAt, lang)}
                        </time>
                      ) : (
                        t.noEnd
                      )}
                    </p>
                    <Receipt row={row} lang={lang} />
                  </article>
                ))}
            </section>
          )}
        </>
      )}
    </section>
  );
}
