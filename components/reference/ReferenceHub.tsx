import GovernmentLive from "../government/GovernmentLive";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { editionPath, locale, type Lang } from "@/lib/i18n";
import { referenceText, assertionText } from "@/lib/i18n/reference";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import { FORMATION } from "@/lib/i18n/formation-live";
import {
  referenceDocuments,
  translatedReference,
  readingTitles,
} from "@/lib/reference/catalog";
import {
  referenceReadModel,
  editionEvidence,
} from "@/lib/reference/read-model";
import CurrentParliament from "../seat-context/CurrentParliament";
import SeatBasis from "../seat-context/SeatBasis";
import { forecastPresentation } from "../live-forecast/LiveForecast";
import SuggestedReading from "./SuggestedReading";
import ReferenceDocument from "./ReferenceDocument";
import QualifiedRecords from "./QualifiedRecords";
import ChangesPage from "../pages/ChangesPage";
import ArchiveEditionView from "./ArchiveEditionView";
import ExportLinks from "../ExportLinks";
import CountLog from "../pages/CountLog";
import { ARCHIVE_EDITION_IDS, archiveEdition, canonicalEditionId } from "@/lib/archive-editions";
import { PLATFORM_COPY } from "@/lib/i18n/platform-copy";
import { getGlobalNotices } from "@/lib/political-record/global-notices";
import "../article/article.css";
import "./reference.css";
const archiveElections = () => ARCHIVE_EDITION_IDS.map((id) => archiveEdition(id)).filter((e): e is NonNullable<typeof e> => !!e);
export const longDay = (iso: string, lang: Lang) => new Intl.DateTimeFormat(locale(lang), { dateStyle: "long", timeZone: "Asia/Jerusalem" }).format(new Date(`${iso}T12:00:00Z`));
export type ReferenceKind =
  | "elections"
  | "edition"
  | "parliament"
  | "policies"
  | "policy"
  | "changes"
  | "reference";
export const policyTitles: Record<Lang, string[]> = {
  en: [
    "Haredi draft",
    "Courts",
    "War and hostages",
    "West Bank",
    "Religion and state",
    "Economy",
    "Palestinian state",
  ],
  he: [
    "גיוס חרדים",
    "בתי המשפט",
    "המלחמה והחטופים",
    "הגדה המערבית",
    "דת ומדינה",
    "כלכלה",
    "מדינה פלסטינית",
  ],
  ar: [
    "تجنيد الحريديم",
    "المحاكم",
    "الحرب والرهائن",
    "الضفة الغربية",
    "الدين والدولة",
    "الاقتصاد",
    "الدولة الفلسطينية",
  ],
  fa: [
    "سربازی حریدی‌ها",
    "دادگاه‌ها",
    "جنگ و گروگان‌ها",
    "کرانه باختری",
    "دین و دولت",
    "اقتصاد",
    "کشور فلسطینی",
  ],
  de: [
    "Wehrpflicht der Haredim",
    "Gerichte",
    "Krieg und Geiseln",
    "Westjordanland",
    "Religion und Staat",
    "Wirtschaft",
    "Palästinensischer Staat",
  ],
  fr: [
    "Conscription des Haredim",
    "Tribunaux",
    "Guerre et otages",
    "Cisjordanie",
    "Religion et État",
    "Économie",
    "État palestinien",
  ],
  zh: [
    "哈雷迪征兵",
    "法院",
    "战争与人质",
    "约旦河西岸",
    "宗教与国家",
    "经济",
    "巴勒斯坦国",
  ],
};
const policyIds = [
  "haredi-draft",
  "courts",
  "war-hostages",
  "west-bank",
  "religion-state",
  "economy",
  "palestinian-state",
];
export default async function ReferenceHub({
  kind,
  lang,
  id,
}: {
  kind: ReferenceKind;
  lang: Lang;
  id?: string;
}) {
  const t = referenceText(lang),
    href = (p: string) => editionPath(p, lang)!,
    model = await referenceReadModel(),
    snapshot = model.lifecycle;
  if (kind === "policy") {
    if (!id || !policyIds.includes(id)) notFound();
    return (
      <ReferenceDocument
        path={`/issues/${id}`}
        lang={lang}
        title={policyTitles[lang][policyIds.indexOf(id)]}
        introduction={
          <>
            <p>{t.policyNote}</p>
            {id === "economy" ? (
              <QualifiedRecords
                global={model.global}
                lang={lang}
                view="economy"
              />
            ) : (
              <p>{t.noMilestones}</p>
            )}
            <Link href={href("/policies")}>{t.allPolicies}</Link>
          </>
        }
      />
    );
  }
  // /elections/2026, /elections/26 and /elections/2022 are public aliases of the canonical id.
  const canonical = kind === "edition" && id ? canonicalEditionId(id) : null;
  if (canonical && canonical !== id) permanentRedirect(href(`/elections/${canonical}`));
  const archive = kind === "edition" && id ? archiveEdition(id) : null;
  const edition =
    kind === "edition" && !archive
      ? editionEvidence(model.elections, id ?? "", snapshot)
      : null;
  if (kind === "edition" && !archive && edition?.state === "unknown") notFound();
  const context = (edition ? edition.lifecycle : snapshot)?.seatContext ?? null;
  // Once the seats are official the edition page is a frozen record: it names the certification, not "Current".
  const frozen = kind === "edition" && !archive && context?.seatStatus === "official";
  const certifiedOn = context?.statutoryPublication?.publishedOn ?? (context?.publishedAt ?? context?.observedAt ?? "").slice(0, 10);
  const title =
    kind === "edition"
      ? `${t.elections}: ${t.term} ${archive?.termNumber ?? edition?.election?.termNumber}`
      : t[kind];
  return (
    <div
      className="wrap article-page reference-page"
      data-election-workspace={
        kind === "edition" ? (archive?.id ?? edition?.election?.id) : undefined
      }
      data-workspace-locale={kind === "edition" ? lang : undefined}
    >
      <header className="page-head">
        <h1>{title}</h1>
        <nav aria-label={t.reference}>
          <Link href={href("/elections")}>{t.elections}</Link>
          {", "}
          <Link href={href("/parliament")}>{t.parliament}</Link>
          {", "}
          <Link href={href("/government")}>{FORMATION[lang].title}</Link>
          {", "}
          <Link href={href("/policies")}>{t.policies}</Link>
          {", "}
          <Link href={href("/changes")}>{t.changes}</Link>
        </nav>
      </header>
      {(kind === "elections" || kind === "edition") && (
        <>
          <p>{t.editionNote}</p>
          {kind === "elections" ? (
            <ul>
              {[...model.elections.map((e) => ({ id: e.id, termNumber: e.termNumber, electionDay: e.electionDay })), ...archiveElections()].sort((a, b) => b.termNumber - a.termNumber).map((e) => (
                <li key={e.id}>
                  <Link href={href(`/elections/${e.id}`)}>
                    {t.term} {e.termNumber}
                  </Link>
                  .{" "}
                  {new Intl.DateTimeFormat(locale(lang), {
                    dateStyle: "long",
                    timeZone: "Asia/Jerusalem",
                  }).format(new Date(e.electionDay + "T12:00:00Z"))}
                </li>
              ))}
            </ul>
          ) : archive ? (
            <ArchiveEditionView edition={archive} lang={lang} />
          ) : (
            <>
              <p>
                {t.electionDate}:{" "}
                <time dateTime={edition?.election?.electionDay}>
                  {longDay(edition?.election?.electionDay ?? "", lang)}
                </time>
              </p>
              {frozen ? (
                <p data-testid="edition-frozen" data-seat-revision={context!.revision}>
                  <strong>{PLATFORM_COPY[lang].finalCertified(longDay(certifiedOn, lang))}</strong>
                  {". "}
                  {PLATFORM_COPY[lang].revision}: <code>{context!.revision}</code>
                </p>
              ) : (
                <SeatBasis context={context} lang={lang} />
              )}
              {context && (
                <CurrentParliament
                  initial={context}
                  lang={lang}
                  frozen={frozen}
                  {...forecastPresentation(lang)}
                />
              )}
              <p>
                {!frozen && (
                  <>
                    <Link href={href("/results")}>{t.current}</Link>
                    {", "}
                  </>
                )}
                <Link href={href("/forecast")}>{LIFECYCLE[lang].archive}</Link>
              </p>
              <ExportLinks lang={lang} kinds={["results", "polls", "forecast"]} />
            </>
          )}
        </>
      )}
      {kind === "parliament" && (
        <>
          <p>{t.allocationNote}</p>
          {!model.global.parliament.memberships.length && (
            <p>{t.noMembership}</p>
          )}
          <QualifiedRecords
            global={model.global}
            lang={lang}
            view="parliament"
          />
          {context ? (
            <CurrentParliament
              initial={context}
              heading={t.electionAllocation}
              lang={lang}
              {...forecastPresentation(lang)}
            />
          ) : (
            <SeatBasis context={null} lang={lang} />
          )}
        </>
      )}
      {kind === "policies" && (
        <>
          <p>{t.policyNote}</p>
          <QualifiedRecords global={model.global} lang={lang} view="policies" />
          <ul>
            {policyIds.map((slug, i) => (
              <li key={slug}>
                <Link href={href(`/policies/${slug}`)}>
                  {policyTitles[lang][i]}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      {kind === "reference" && (
        <ul>
          {referenceDocuments
            .filter((d) => !id || d.path.startsWith(id))
            .map((d) => {
              const selected = translatedReference(d.path, lang),
                ready = selected?.state === "ready";
              return (
                <li key={d.id}>
                  <Link href={href(d.path)}>
                    {ready ? (
                      selected.translation.blocks[0].text
                    ) : (
                      <span lang="en" dir="ltr">
                        {d.title}
                      </span>
                    )}
                  </Link>
                  {lang !== "en" && !ready && (
                    <>
                      . {t.sourceTitle}.{" "}
                      {selected?.state === "withdrawn"
                        ? t.withdrawn
                        : t.pending}
                    </>
                  )}
                </li>
              );
            })}
        </ul>
      )}
      {kind === "changes" && (
        <>
          <ChangesPage lang={lang} notices={await getGlobalNotices(lang)} />
          <CountLog lang={lang} />
          <p>{t.evidence}</p>
          {snapshot ? (
            <GovernmentLive
              initial={snapshot}
              lang={lang}
              view="chronology"
              hideSeats
              {...forecastPresentation(lang)}
            />
          ) : (
            <p>{t.noEvents}</p>
          )}
          {model.recordHistory.length > 0 && (
            <section>
              <h2>{t.evidence}</h2>
              <ul>
                {model.recordHistory.map((r) => (
                  <li key={r.revisionId} id={`revision-${r.revisionId}`}>
                    <p>
                      {assertionText(r.status, lang)}: <code>{r.recordId}</code>
                    </p>
                    <time dateTime={r.observedAt}>{r.observedAt}</time>
                    <details>
                      <summary>{t.revision}</summary>
                      <code>{r.revisionId}</code>
                      {r.previousRevisionId && (
                        <p>
                          <code>{r.previousRevisionId}</code>
                        </p>
                      )}
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <ul>
            {snapshot?.alternatives.map((a) => (
              <li key={a.revision}>
                <Link
                  href={`${href("/coalition-builder")}?poll=current&context=${encodeURIComponent(a.revision)}`}
                >
                  {LIFECYCLE[lang][a.basis]}
                </Link>
                .{" "}
                <time dateTime={a.publishedAt ?? undefined}>
                  {a.publishedAt ?? LIFECYCLE[lang].noTime}
                </time>
              </li>
            ))}
          </ul>
        </>
      )}
      <SuggestedReading lang={lang} titles={readingTitles(lang)} />
    </div>
  );
}
